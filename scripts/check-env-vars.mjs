#!/usr/bin/env node
/**
 * scripts/check-env-vars.mjs
 *
 * Pre-build guard: falla ruidosamente si las VITE_* env vars criticas no
 * estan presentes. Vite inlinea VITE_* en el bundle al build time; si faltan,
 * el bundle queda con `void 0` donde deberia ir la URL de Supabase y la app
 * entera explota en runtime con "supabaseUrl is required".
 *
 * Causa raiz del incidente 2026-05-05 (app en blanco horas despues del
 * lanzamiento beta): GitHub Actions ejecutaba `npm run build` sin pasar los
 * Secrets como env vars al workflow → bundle roto se commiteaba a docs/ →
 * GitHub Pages deployaba un bundle muerto a usuarios reales.
 *
 * Este script corre ANTES de `vite build` (via npm prebuild script o como
 * primer step explicito en el workflow). Si faltan vars, exit 1.
 *
 * Uso:
 *   node scripts/check-env-vars.mjs
 *
 * En GitHub Actions el script DEBE recibir los secrets como env vars:
 *   - run: node scripts/check-env-vars.mjs
 *     env:
 *       VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
 *       VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
 *
 * En local Vite carga .env automaticamente. El script tambien lo intenta
 * cargar para que validar manualmente funcione sin exportar a mano.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Carga .env si existe en local. En CI las vars vienen de los Secrets.
function loadDotEnv() {
  for (const file of ['.env.local', '.env']) {
    const path = resolve(projectRoot, file);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, 'utf8');
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx < 0) continue;
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      // No sobreescribimos vars que ya vinieron del entorno (Secrets > .env).
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

loadDotEnv();

const REQUIRED = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
];

const missing = REQUIRED.filter((k) => {
  const v = process.env[k];
  return !v || v.length < 5;
});

if (missing.length > 0) {
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('  ✗ BUILD ABORTADO: faltan env vars criticas');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  console.error('  Vite inlinea VITE_* en el bundle al build time. Si faltan,');
  console.error('  el bundle generaria un app en blanco en runtime con:');
  console.error('    "Uncaught Error: supabaseUrl is required."');
  console.error('');
  console.error('  Vars faltantes:');
  for (const k of missing) console.error(`    - ${k}`);
  console.error('');
  console.error('  Soluciones:');
  console.error('    Local: copia .env.example a .env y llena las vars.');
  console.error('    GitHub Actions: Settings > Secrets > Actions > New');
  console.error('       repository secret. Despues actualiza .github/workflows/');
  console.error('       deploy.yml para pasarlas como env del step Build.');
  console.error('');
  console.error('  Doc: docs-raiz/SECURITY_AUDIT_PRE_BETA_2026_05_05.md');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  process.exit(1);
}

console.log('✓ Env vars criticas presentes:');
for (const k of REQUIRED) {
  const v = process.env[k] ?? '';
  const masked = v.length > 16 ? `${v.slice(0, 8)}…${v.slice(-4)}` : '<set>';
  console.log(`  ${k}=${masked}`);
}
