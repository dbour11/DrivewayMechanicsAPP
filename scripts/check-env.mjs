#!/usr/bin/env node
// check-env.mjs — verifies the environment variables an app needs are set before boot.
// Zero dependencies. Never prints secret values.
//
// Usage:
//   node scripts/check-env.mjs                 # check ALL apps (union of every var)
//   node scripts/check-env.mjs --app=web       # only the Next.js web app
//   node scripts/check-env.mjs --app=mobile    # only the Expo app
//   node scripts/check-env.mjs --app=server    # only Edge Functions / backend
//   node scripts/check-env.mjs --app=web,server
//   node scripts/check-env.mjs --help
//
// Exit 0 if every required var for the selected app(s) is set, 1 otherwise.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// ── Per-app requirements ─────────────────────────────────────────────────
// Each app lists exactly the vars it needs to boot. Secrets belong to `server`
// (Edge Functions) only; clients (`web`, `mobile`) get PUBLIC-prefixed values.
const APPS = {
  server: [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_MESSAGING_SERVICE_SID',
    'MAPBOX_ACCESS_TOKEN',
  ],
  web: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'MAPBOX_PUBLIC_TOKEN',
  ],
  mobile: [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'MAPBOX_PUBLIC_TOKEN',
  ],
};

// ── CLI parsing ──────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
  console.log(
    `check-env — validate env vars per app\n\n` +
    `  node scripts/check-env.mjs [--app=<name[,name...]>]\n\n` +
    `  apps: ${Object.keys(APPS).join(', ')}, or "all" (default)\n`
  );
  process.exit(0);
}

const appArg = (argv.find((a) => a.startsWith('--app=')) || '').split('=')[1] || 'all';
const selected =
  appArg === 'all'
    ? Object.keys(APPS)
    : appArg.split(',').map((s) => s.trim()).filter(Boolean);

const unknown = selected.filter((a) => !APPS[a]);
if (unknown.length) {
  console.error(`✗ Unknown app(s): ${unknown.join(', ')}. Valid: ${Object.keys(APPS).join(', ')}, all`);
  process.exit(2);
}

// ── Minimal .env parser (handles inline `# comments` and quotes) ──────────
function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1);
    const quoted = val.match(/^\s*(['"])(.*?)\1\s*$/);
    if (quoted) {
      val = quoted[2];
    } else {
      const hash = val.search(/\s#/);
      if (hash !== -1) val = val.slice(0, hash);
      val = val.trim();
    }
    out[key] = val;
  }
  return out;
}

// process.env wins over .env (CI / hosting inject real values via the environment).
const fromFile = parseEnvFile(join(projectRoot, '.env'));
const isSet = (name) => (process.env[name] ?? fromFile[name] ?? '').trim() !== '';

// ── Run checks per selected app ──────────────────────────────────────────
const missing = new Set();
const lines = [`Environment variable check — apps: ${selected.join(', ')}`];

for (const app of selected) {
  lines.push(`\n  ${app}`);
  for (const name of APPS[app]) {
    const ok = isSet(name);
    if (!ok) missing.add(name);
    lines.push(`    ${ok ? '✓' : '✗'} ${name}${ok ? '' : '   MISSING'}`);
  }
}
console.log(lines.join('\n'));

if (missing.size) {
  console.error(
    `\n✗ Missing ${missing.size} required variable(s) for [${selected.join(', ')}]:\n   ` +
    [...missing].join('\n   ') +
    `\n\n   Copy .env.example → .env and fill in the blanks (see CLAUDE.md §6).` +
    `\n   Values are never printed by this script.\n`
  );
  process.exit(1);
}

console.log(`\n✓ All required variables for [${selected.join(', ')}] are set.\n`);
process.exit(0);
