# yarn-plugin-dedupe

A Yarn plugin to automatically deduplicate dependencies.

Ideally, this functionality would be built into yarn (see [yarnpkg/berry#4976](https://github.com/yarnpkg/berry/issues/4976)).

The lack of an auto-dedupe also causes problems with Dependabot PRs (see [dependabot/dependabot-core#5830](https://github.com/dependabot/dependabot-core/issues/5830)).
You can configure this plugin to run only on dependabot PRs (see [usage](#usage)).

## Installation

Download the latest release: [Latest Release](https://github.com/blimmer/yarn-plugin-dedupe/releases/latest)

You can install this plugin using:

```bash
yarn plugin import https://github.com/blimmer/yarn-plugin-dedupe/releases/download/v1.0.0-alpha.2/plugin-dedupe.js
```

## Usage

By default, the plugin will automatically dedupe after all `install` commands.

You can configure this behavior in your `.yarnrc.yml` file via the `dedupePluginMode` configuration
option.

|       Option       |                                   Behavior                                   |
| ------------------ | ---------------------------------------------------------------------------- |
| `always` (default) | `yarn dedupe` is run after every `yarn` install command                      |
| `dependabot`       | `yarn dedupe` is run only in GitHub Actions-based dependabot update commands |
| `none`             | automatic dedupe is disabled                                                 |

### Example

```yml
# .yarnrc.yml
dedupePluginMode: dependabot
```

## License

MIT
