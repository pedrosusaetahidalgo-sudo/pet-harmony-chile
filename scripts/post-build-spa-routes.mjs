// Post-build: genera index.html fisicos para rutas publicas del SPA.
//
// Por que: GitHub Pages devuelve HTTP 404 para cualquier ruta que no sea
// un archivo fisico, incluso sirviendo 404.html. Eso rompe validadores que
// no ejecutan JS (Meta, Google, link previews). Crear docs/<ruta>/index.html
// como copia de docs/index.html hace que GitHub Pages responda 200, y luego
// React Router toma control en el cliente.
//
// Las rutas listadas aqui son las publicas que crawlers/validadores pueden
// pedir: legales (Meta requirements), pricing/registro (SEO + ads), landings.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = join(__dirname, '..', 'docs');
const INDEX = join(DOCS, 'index.html');

if (!existsSync(INDEX)) {
  console.error(`[spa-routes] No existe ${INDEX}. Corre 'vite build' primero.`);
  process.exit(1);
}

const html = readFileSync(INDEX, 'utf8');

const PUBLIC_ROUTES = [
  // Legales (requeridos por Meta/Apple/Google para activar Login/store)
  'privacy',
  'terms',
  'delete-account',
  'faq',
  // Auth + landings publicas (SEO + campañas)
  'auth',
  'veterinarios',
  'precios-veterinarios',
  'para-veterinarios',
  'registro-veterinario',
  'registro-proveedor',
  'refugios-hogares',
  'paw-partners',
  'donaciones',
  'paw-core',
  'paw-member',
  'paw-companys',
  'paw-voices',
  'aplicar',
];

let created = 0;
for (const route of PUBLIC_ROUTES) {
  const dir = join(DOCS, route);
  const file = join(dir, 'index.html');
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, html);
  created += 1;
}

console.log(`[spa-routes] Generados ${created} index.html fisicos en docs/`);
