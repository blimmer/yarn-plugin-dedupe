import {Plugin, type Project} from '@yarnpkg/core';
import {execute} from '@yarnpkg/shell';

const dedupeModes = ['always', 'dependabot', 'never'] as const;
type DedupeMode = typeof dedupeModes[number];

const plugin: Plugin = {
  configuration: {
    // @ts-expect-error for some reason, the types don't allow adding to the configuration
    dedupePluginMode: {
      type: 'string',
      default: 'always',
      description: 'When to deduplicate packages. Always deduplicates all packages after any install command. Dependabot deduplicates only packages that are updated by Dependabot via GitHub Actions. None disables auto-deduplication.',
      choices: dedupeModes,
    }
  },
  hooks: {
    afterAllInstalled: async (project: Project) => {
      const dedupeMode = project.configuration.get('dedupePluginMode');

      // Ensure dedupeMode is one of the valid choices
      if (!isValidDedupeMode(dedupeMode)) {
        throw new Error(`Invalid dedupePluginMode: ${dedupeMode}. Must be one of: ${dedupeModes.join(', ')}`);
      }

      if (dedupeMode === 'never') {
        return;
      }

      if (dedupeMode === 'always') {
        await dedupe();
        return;
      }

      if (dedupeMode === 'dependabot') {
        if (process.env.GITHUB_ACTOR === 'dependabot[bot]') {
          await dedupe();
        }
        return;
      }
    },
  },
};

async function dedupe() {
  // use env var to prevent infinite loops
  const envVar = 'IS_YARN_PLUGIN_DEDUPE_ACTIVE';
  if (!process.env[envVar] && !process.argv.includes('dedupe')) {
    process.env[envVar] = 'true'
    // fast check for duplicates
    if (await execute('yarn dedupe --check')) {
      // run actual dedupe/link step
      await execute('yarn dedupe')
    }
  }
}

function isValidDedupeMode(mode: unknown): mode is DedupeMode {
  return typeof mode === 'string' && dedupeModes.includes(mode as DedupeMode);
}

export default plugin;
