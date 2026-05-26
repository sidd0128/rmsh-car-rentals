/**
 * Reads `.env` and writes `src/core/config/env.generated.ts` for Metro (no virtual @env module).
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const OUT_PATH = path.join(ROOT, 'src/core/config/env.generated.ts');

const ENV_KEYS = [
  'APP_ENV',
  'SHOW_DEV_DATA_TOOLS',
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
];

const parsed = dotenv.config({ path: ENV_PATH }).parsed ?? {};

const lines = [
  '/** Auto-generated from `.env` by `npm run sync-env` — do not edit. */',
  ...ENV_KEYS.map(key => `export const ${key} = ${JSON.stringify(parsed[key] ?? '')};`),
  '',
];

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, lines.join('\n'), 'utf8');
console.log(`sync-env: wrote ${path.relative(ROOT, OUT_PATH)}`);
