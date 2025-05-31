import type { Project } from '@yarnpkg/core';
import { execute } from '@yarnpkg/shell';
import plugin, { type DedupeMode } from '../sources/index';
import { when } from 'jest-when';

jest.mock('@yarnpkg/shell', () => ({
  execute: jest.fn()
}));
const mockExecute = execute as jest.MockedFunction<typeof execute>;

describe('yarn-plugin-dedupe', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalArgv: string[];

  beforeEach(() => {
    // Save original environment and argv
    originalEnv = { ...process.env };
    originalArgv = [...process.argv];

    // Clear mock calls
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment and argv
    process.env = originalEnv;
    process.argv = originalArgv;
  });

  function setupTest(dedupePluginMode: DedupeMode | undefined, options: Record<string, unknown> = {}) {
    const configGetter = jest.fn();
    when(configGetter).calledWith('dedupePluginMode').mockReturnValue(dedupePluginMode);
    const mockProject = {
      configuration: {
        get: configGetter
      }
    } as unknown as Project;

    return {
      mockProject,
      options,
    }
  }

  describe('plugin configuration', () => {
    it('should have correct configuration schema', () => {
      const config = plugin.configuration as any;
      expect(config.dedupePluginMode.type).toBe('string');
      expect(config.dedupePluginMode.default).toBe('always');
      expect(config.dedupePluginMode.choices).toEqual(['always', 'dependabot-only', 'never']);
    });
  });

  describe('afterAllInstalled hook', () => {
    it('should always disable if immutable is set', async () => {
      const { mockProject, options } = setupTest("always", { immutable: true });
      await plugin.hooks.afterAllInstalled(mockProject, options);

      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should throw error for invalid dedupePluginMode', async () => {
      const { mockProject, options } = setupTest("invalid-mode" as any);

      await expect(plugin.hooks.afterAllInstalled(mockProject, options)).rejects.toThrow(
        'Invalid dedupePluginMode: invalid-mode. Must be one of: always, dependabot-only, never'
      );
    });

    it('should not dedupe when mode is "never"', async () => {
      const { mockProject, options } = setupTest("never");
      await plugin.hooks.afterAllInstalled(mockProject, options);

      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should dedupe when mode is "always"', async () => {
      const { mockProject, options } = setupTest("always");
      mockExecute
        .mockResolvedValueOnce(1) // dedupe --check returns truthy (duplicates found)
        .mockResolvedValueOnce(0); // dedupe command succeeds

      await plugin.hooks.afterAllInstalled(mockProject, options);

      expect(mockExecute).toHaveBeenCalledTimes(2);
      expect(mockExecute).toHaveBeenNthCalledWith(1, 'yarn dedupe --check');
      expect(mockExecute).toHaveBeenNthCalledWith(2, 'yarn dedupe');
    });

    it('should not run actual dedupe if check returns false (no duplicates)', async () => {
      const { mockProject, options } = setupTest("always");
      mockExecute.mockResolvedValueOnce(0); // dedupe --check returns falsy (no duplicates)

      await plugin.hooks.afterAllInstalled(mockProject, options);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      expect(mockExecute).toHaveBeenCalledWith('yarn dedupe --check');
    });

    it('should dedupe when mode is "dependabot-only" and DEPENDABOT env var is true', async () => {
      const { mockProject, options } = setupTest("dependabot-only");
      process.env.DEPENDABOT = 'true';
      mockExecute
        .mockResolvedValueOnce(1) // dedupe --check returns truthy
        .mockResolvedValueOnce(0); // dedupe command succeeds

      await plugin.hooks.afterAllInstalled(mockProject, options);

      expect(mockExecute).toHaveBeenCalledTimes(2);
      expect(mockExecute).toHaveBeenNthCalledWith(1, 'yarn dedupe --check');
      expect(mockExecute).toHaveBeenNthCalledWith(2, 'yarn dedupe');
    });

    it('should not dedupe when mode is "dependabot-only" and DEPENDABOT env var is not true', async () => {
      const { mockProject, options } = setupTest("dependabot-only");
      process.env.DEPENDABOT = 'false';

      await plugin.hooks.afterAllInstalled(mockProject, options);

      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should not dedupe when mode is "dependabot-only" and DEPENDABOT env var is undefined', async () => {
      const { mockProject, options } = setupTest("dependabot-only");
      delete process.env.DEPENDABOT;

      await plugin.hooks.afterAllInstalled(mockProject, options);

      expect(mockExecute).not.toHaveBeenCalled();
    });
  });

  describe('dedupe function infinite loop prevention', () => {
    it('should not run dedupe if IS_YARN_PLUGIN_DEDUPE_ACTIVE is set', async () => {
      const { mockProject, options } = setupTest("always");
      process.env.IS_YARN_PLUGIN_DEDUPE_ACTIVE = 'true';

      await plugin.hooks.afterAllInstalled(mockProject, options);

      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should not run dedupe if argv includes "dedupe"', async () => {
      const { mockProject, options } = setupTest("always");
      process.argv.push('dedupe');

      await plugin.hooks.afterAllInstalled(mockProject, options);

      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should set IS_YARN_PLUGIN_DEDUPE_ACTIVE environment variable when running dedupe', async () => {
      const { mockProject, options } = setupTest("always");
      mockExecute
        .mockResolvedValueOnce(1) // dedupe --check returns truthy
        .mockResolvedValueOnce(0); // dedupe command succeeds

      await plugin.hooks.afterAllInstalled(mockProject, options);

      expect(process.env.IS_YARN_PLUGIN_DEDUPE_ACTIVE).toBe('true');
    });
  });

  describe('edge cases', () => {
    it('should handle execute rejection gracefully', async () => {
      const { mockProject, options } = setupTest("always");
      mockExecute.mockRejectedValueOnce(new Error('Command failed'));

      await expect(plugin.hooks.afterAllInstalled(mockProject, options)).rejects.toThrow('Command failed');
    });

    it('should handle non-string dedupePluginMode', async () => {
      const { mockProject, options } = setupTest(123 as any);

      await expect(plugin.hooks.afterAllInstalled(mockProject, options)).rejects.toThrow(
        'Invalid dedupePluginMode: 123. Must be one of: always, dependabot-only, never'
      );
    });

    it('should handle null dedupePluginMode', async () => {
      const { mockProject, options } = setupTest(null as any);

      await expect(plugin.hooks.afterAllInstalled(mockProject, options)).rejects.toThrow(
        'Invalid dedupePluginMode: null. Must be one of: always, dependabot-only, never'
      );
    });

    it('should handle undefined dedupePluginMode', async () => {
      const { mockProject, options } = setupTest(undefined);

      await expect(plugin.hooks.afterAllInstalled(mockProject, options)).rejects.toThrow(
        'Invalid dedupePluginMode: undefined. Must be one of: always, dependabot-only, never'
      );
    });
  });
});
