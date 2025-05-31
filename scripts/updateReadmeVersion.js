#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the new version from command line argument
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Usage: node updateReadmeVersion.js <version>');
  process.exit(1);
}

// Read the README file
const readmePath = path.join(__dirname, '..', 'README.md');
const content = fs.readFileSync(readmePath, 'utf8');

// Replace the version in the download URL
// Matches: download/v1.0.0/plugin-dedupe.js or download/v1.0.0-alpha.1/plugin-dedupe.js
const versionRegex = /download\/v[^\/]+\/plugin-dedupe\.js/g;
const updated = content.replace(versionRegex, `download/v${newVersion}/plugin-dedupe.js`);

// Write the updated content back
fs.writeFileSync(readmePath, updated);

console.log(`Updated README.md with version ${newVersion}`);
