module.exports = {
  branches: [
    'main',
    {
      name: 'initial-implementation',
      prerelease: 'alpha'
    }
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md'
      }
    ],
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'yarn build && node -e "const fs = require(\'fs\'); const content = fs.readFileSync(\'README.md\', \'utf8\'); const updated = content.replace(/download\/v[^\/]+\/plugin-dedupe\\.js/g, \'download/v${nextRelease.version}/plugin-dedupe.js\'); fs.writeFileSync(\'README.md\', updated);"'
      }
    ],
    [
      '@semantic-release/github',
      {
        assets: [
          {
            path: 'bundles/@yarnpkg/plugin-dedupe.js',
            name: 'plugin-dedupe.js',
            label: 'Yarn Plugin Dedupe'
          }
        ]
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'README.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ]
  ]
}
