// Manually loads .env.local into process.env for Node test processes (Playwright's
// test runner does not auto-load it the way `next dev` does). Same parsing pattern as
// scripts/seed-test-users.js: split lines, skip blank/#, split on first '=', strip
// surrounding quotes, and never clobber a var that's already set in the environment.
const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '..', '.env.local');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, 'utf8');
  const lines = contents.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

module.exports = { loadEnvLocal };
