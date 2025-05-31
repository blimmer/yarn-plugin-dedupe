import {Plugin} from '@yarnpkg/core';

const plugin: Plugin = {
  configuration: {
    // @ts-expect-error for some reason, the types don't allow adding to the configuration
    dedupePluginMode: {
      type: 'string',
      default: 'always',
      description: 'When to deduplicate packages. Always deduplicates all packages after any install command. Dependabot deduplicates only packages that are updated by Dependabot via GitHub Actions. None disables auto-deduplication.',
      choices: ['always', 'dependabot', 'none'],
    }
  },
  hooks: {
    afterAllInstalled: async (project) => {
      const dedupeMode = project.configuration.get('dedupePluginMode');
    },
  },
};

export default plugin;
