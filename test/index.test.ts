import type { Project } from '@yarnpkg/core';
import { execute } from '@yarnpkg/shell';
import plugin from '../sources/index';

jest.mock('@yarnpkg/shell', () => ({
  execute: jest.fn()
}));
const mockExecute = execute as jest.MockedFunction<typeof execute>;

describe('yarn-plugin-dedupe', () => {
  let mockProject: Project;
  let originalEnv: NodeJS.ProcessEnv;
  let originalArgv: string[];

  beforeEach(() => {
    // Save original environment and argv
    originalEnv = { ...process.env };
    originalArgv = [...process.argv];

    // Create a mock project with configuration
    mockProject = {
      configuration: {
        get: jest.fn()
      }
    } as any;

    // Clear mock calls
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment and argv
    process.env = originalEnv;
    process.argv = originalArgv;
  });

  describe('plugin configuration', () => {
    it('should have correct configuration schema', () => {
      const config = plugin.configuration as any;
      expect(config.dedupePluginMode.type).toBe('string');
      expect(config.dedupePluginMode.default).toBe('always');
      expect(config.dedupePluginMode.choices).toEqual(['always', 'dependabot-only', 'never']);
    });
  });

  describe('afterAllInstalled hook', () => {
    it('should throw error for invalid dedupePluginMode', async () => {
      (mockProject.configuration.get as jest.Mock).mockReturnValue('invalid-mode');

      await expect(plugin.hooks.afterAllInstalled(mockProject)).rejects.toThrow(
        'Invalid dedupePluginMode: invalid-mode. Must be one of: always, dependabot-only, never'
      );
    });

    it('should not dedupe when mode is "never"', async () => {
      (mockProject.configuration.get as jest.Mock).mockReturnValue('never');

      await plugin.hooks.afterAllInstalled(mockProject);

      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should dedupe when mode is "always"', async () => {
      (mockProject.configuration.get as jest.Mock).mockReturnValue('always');
      mockExecute
        .mockResolvedValueOnce(1) // dedupe --check returns truthy (duplicates found)
        .mockResolvedValueOnce(0); // dedupe command succeeds

      await plugin.hooks.afterAllInstalled(mockProject);

      expect(mockExecute).toHaveBeenCalledTimes(2);
      expect(mockExecute).toHaveBeenNthCalledWith(1, 'yarn dedupe --check');
      expect(mockExecute).toHaveBeenNthCalledWith(2, 'yarn dedupe');
    });

    it('should not run actual dedupe if check returns false (no duplicates)', async () => {
      (mockProject.configuration.get as jest.Mock).mockReturnValue('always');
      mockExecute.mockResolvedValueOnce(0); // dedupe --check returns falsy (no duplicates)

      await plugin.hooks.afterAllInstalled(mockProject);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      expect(mockExecute).toHaveBeenCalledWith('yarn dedupe --check');
    });

    it('should dedupe when mode is "dependabot-only" and DEPENDABOT env var is true', async () => {
      (mockProject.configuration.get as jest.Mock).mockReturnValue('dependabot-only');
      process.env.DEPENDABOT = 'true';
      mockExecute
        .mockResolvedValueOnce(1) // dedupe --check returns truthy
        .mockResolvedValueOnce(0); // dedupe command succeeds

      await plugin.hooks.afterAllInstalled(mockProject);

      expect(mockExecute).toHaveBeenCalledTimes(2);
      expect(mockExecute).toHaveBeenNthCalledWith(1, 'yarn dedupe --check');
      expect(mockExecute).toHaveBeenNthCalledWith(2, 'yarn dedupe');
    });

    it('should not dedupe when mode is "dependabot-only" and DEPENDABOT env var is not true', async () => {
      (mockProject.configuration.get as jest.Mock).mockReturnValue('dependabot-only');
      process.env.DEPENDABOT = 'false';

      await plugin.hooks.afterAllInstalled(mockProject);

      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should not dedupe when mode is "dependabot-only" and DEPENDABOT env var is undefined', async () => {
      (mockProject.configuration.get as jest.Mock).mockReturnValue('dependabot-only');
      delete process.env.DEPENDABOT;

      await plugin.hooks.afterAllInstalled(mockProject);

      expect(mockExecute).not.toHaveBeenCalled();
    });
  });

  describe('dedupe function infinite loop prevention', () => {
    it('should not run dedupe if IS_YARN_PLUGIN_DEDUPE_ACTIVE is set', async () => {
      (mockProject.configuration.get as jest.Mock).mockReturnValue('always');
      process.env.IS_YARN_PLUGIN_DEDUPE_ACTIVE = 'true';

      await plugin.hooks.afterAllInstalled(mockProject);

      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should not run dedupe if argv includes "dedupe"', async () => {
      (mockProject.configuration.get as jest.Mock).mockReturnValue('always');
      process.argv.push('dedupe');

      await plugin.hooks.afterAllInstalled(mockProject);

      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should set IS_YARN_PLUGIN_DEDUPE_ACTIVE environment variable when running dedupe', async () => {
      (mockProject.configuration.get as jest.Mock).mockReturnValue('always');
      mockExecute
        .mockResolvedValueOnce(1) // dedupe --check returns truthy
        .mockResolvedValueOnce(0); // dedupe command succeeds

      await plugin.hooks.afterAllInstalled(mockProject);

      expect(process.env.IS_YARN_PLUGIN_DEDUPE_ACTIVE).toBe('true');
    });
  });

  describe('edge cases', () => {
    it('should handle execute rejection gracefully', async () => {
      (mockProject.configuration.get as jest.Mock).mockReturnValue('always');
      mockExecute.mockRejectedValueOnce(new Error('Command failed'));

      await expect(plugin.hooks.afterAllInstalled(mockProject)).rejects.toThrow('Command failed');
    });

    it('should handle non-string dedupePluginMode', async () => {
      (mockProject.configuration.get as jest.Mock).mockReturnValue(123);

      await expect(plugin.hooks.afterAllInstalled(mockProject)).rejects.toThrow(
        'Invalid dedupePluginMode: 123. Must be one of: always, dependabot-only, never'
      );
    });

    it('should handle null dedupePluginMode', async () => {
      (mockProject.configuration.get as jest.Mock).mockReturnValue(null);

      await expect(plugin.hooks.afterAllInstalled(mockProject)).rejects.toThrow(
        'Invalid dedupePluginMode: null. Must be one of: always, dependabot-only, never'
      );
    });

    it('should handle undefined dedupePluginMode', async () => {
      (mockProject.configuration.get as jest.Mock).mockReturnValue(undefined);

      await expect(plugin.hooks.afterAllInstalled(mockProject)).rejects.toThrow(
        'Invalid dedupePluginMode: undefined. Must be one of: always, dependabot-only, never'
      );
    });
  });
});
