module.exports = {
  branches: [
    'main',
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
        prepareCmd: 'yarn build && node scripts/updateReadmeVersion.js ${nextRelease.version}'
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
