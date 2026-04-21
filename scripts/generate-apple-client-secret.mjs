// Genera el Client Secret JWT que Supabase pide para Sign in with Apple.
// Uso:
//   1) npm i -D jsonwebtoken
//   2) Copia tu AuthKey_XXX.p8 al root del repo (NO lo commitees)
//   3) node scripts/generate-apple-client-secret.mjs <ruta-del-p8>
//
// El JWT dura 180 dias (maximo que Apple permite). Regenerar antes de vencer.

import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';

const TEAM_ID = '7Q8L7A2WM7';
const KEY_ID = '8KX2B9489M';
const SERVICE_ID = 'cl.pawfriend.web';

const p8Path = process.argv[2];
if (!p8Path) {
  console.error('Uso: node scripts/generate-apple-client-secret.mjs <ruta-al-p8>');
  process.exit(1);
}

const absPath = path.resolve(p8Path);
if (!fs.existsSync(absPath)) {
  console.error(`No encontre el archivo: ${absPath}`);
  process.exit(1);
}

const privateKey = fs.readFileSync(absPath, 'utf8');

const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  audience: 'https://appleid.apple.com',
  issuer: TEAM_ID,
  subject: SERVICE_ID,
  keyid: KEY_ID,
});

console.log('\n===== Client Secret (pegalo en Supabase Secret Key) =====\n');
console.log(token);
console.log('\n===== Valido hasta =====');
console.log(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString());
