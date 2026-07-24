#!/usr/bin/env node
// check-env.mjs — verifies required environment variables are set before the app boots.
// Zero dependencies. Run:  node scripts/check-env.mjs
// Exits 0 if all required vars are present, 1 otherwise. Never prints secret values.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// ── Config: which vars must be present ───────────────────────────────────
// `required`: app cannot run without these. `recommended`: warn but don't fail.
const groups = {
  Supabase: {
    required: ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    recommended: ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
                  'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
  },
  Stripe: {
    required: ['STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    recommended: [],
  },
  Twilio: {
    required: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_MESSAGING_SERVICE_SID'],
    recommended: [],
  },
  Mapbox: {
    required: ['MAPBOX_PUBLIC_TOKEN', 'MAPBOX_ACCESS_TOKEN'],
    recommended: [],
  },
};

// Vars whose names indicate a public/client value (safe to expose). Everything
// else is treated as a secret for reporting purposes (value never printed either way).
const isPublic = (name) =>
  /PUBLIC|PUBLISHABLE|_URL$/.test(name) && !/SERVICE_ROLE|SECRET|TOKEN$|AUTH_TOKEN/.test(name);

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
    // Quoted value: take contents verbatim. Unquoted: strip trailing ` # comment`.
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
const get = (name) => (process.env[name] ?? fromFile[name] ?? '').trim();

// ── Run checks ───────────────────────────────────────────────────────────
const missingRequired = [];
const missingRecommended = [];
const lines = [];

for (const [group, { required, recommended }] of Object.entries(groups)) {
  lines.push(`\n  ${group}`);
  for (const name of required) {
    const ok = get(name) !== '';
    if (!ok) missingRequired.push(name);
    lines.push(`    ${ok ? '✓' : '✗'} ${name}${ok ? '' : '   MISSING (required)'}`);
  }
  for (const name of recommended) {
    const ok = get(name) !== '';
    if (!ok) missingRecommended.push(name);
    lines.push(`    ${ok ? '✓' : '•'} ${name}${ok ? '' : '   not set (recommended)'}`);
  }
}

console.log('Environment variable check' + lines.join('\n'));

if (missingRecommended.length) {
  console.warn(`\n⚠  ${missingRecommended.length} recommended var(s) not set: ${missingRecommended.join(', ')}`);
}

if (missingRequired.length) {
  console.error(
    `\n✗ Missing ${missingRequired.length} required environment variable(s):\n   ` +
    missingRequired.join('\n   ') +
    `\n\n   Copy .env.example → .env and fill in the blanks (see CLAUDE.md §6).` +
    `\n   Values are never printed by this script.\n`
  );
  process.exit(1);
}

console.log('\n✓ All required environment variables are set.\n');
process.exit(0);
