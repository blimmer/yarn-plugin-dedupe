# yarn-plugin-dedupe

A Yarn plugin to automatically deduplicate dependencies.

Ideally, this functionality would be built into yarn (see [yarnpkg/berry#4976](https://github.com/yarnpkg/berry/issues/4976)).

## Installation

Download the latest release: [Latest Release](https://github.com/blimmer/yarn-plugin-dedupe/releases/latest)

You can install this plugin using:

```bash
yarn plugin import https://github.com/blimmer/yarn-plugin-dedupe/releases/download/v1.0.0/plugin-dedupe.js
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

## License

MIT
