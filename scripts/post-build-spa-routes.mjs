// Post-build: genera index.html fisicos para rutas publicas del SPA y enriquece
// sitemap.xml con slugs dinamicos.
//
// Por que: GitHub Pages devuelve HTTP 404 para cualquier ruta que no sea
// un archivo fisico, incluso sirviendo 404.html. Eso rompe validadores que
// no ejecutan JS (Meta, Google, link previews). Crear docs/<ruta>/index.html
// como copia de docs/index.html hace que GitHub Pages responda 200, y luego
// React Router toma control en el cliente.
//
// Slugs dinamicos (insights): si VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
// estan disponibles en el entorno de build, se hace fetch al RPC
// list_public_insights_v2 y se generan docs/insights/<slug>/index.html para
// cada landing publicada. Tambien se agregan al sitemap.xml. Si las env vars
// faltan (ej: build local sin .env), se omite silenciosamente.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env si existe (vite ya lo hace, pero este script corre fuera de vite)
try {
  const dotenvPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
  if (existsSync(dotenvPath)) {
    const content = readFileSync(dotenvPath, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  }
} catch {
  // ignore
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = join(__dirname, '..', 'docs');
const INDEX = join(DOCS, 'index.html');
const SITEMAP = join(DOCS, 'sitemap.xml');

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
  // Refactor Maestro Fase 1 §6.5 — index SEO de insights
  'insights',
  // Refactor Maestro Fase 3 §2.9 — index publico de correlations
  'insights-pro',
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

// ─────────────────────────────────────────────────────────────────────────
// Slugs dinamicos: insights publicos (Refactor Maestro Fase 1 §6.5)
// ─────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/list_public_insights_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: '{}',
    });

    if (!res.ok) {
      console.warn(
        `[spa-routes] RPC list_public_insights_v2 → HTTP ${res.status}. ` +
          `Sin slugs dinamicos. (Probablemente la mig 20260901200000 no esta aplicada todavia.)`
      );
    } else {
      const insights = await res.json();
      const slugs = Array.isArray(insights) ? insights.map((i) => i.slug).filter(Boolean) : [];

      let dynCreated = 0;
      for (const slug of slugs) {
        const dir = join(DOCS, 'insights', slug);
        const file = join(dir, 'index.html');
        mkdirSync(dir, { recursive: true });
        writeFileSync(file, html);
        dynCreated += 1;
      }
      console.log(`[spa-routes] Generados ${dynCreated} index.html para insights/<slug>`);

      // Append slugs al sitemap.xml
      if (existsSync(SITEMAP) && slugs.length > 0) {
        const sitemap = readFileSync(SITEMAP, 'utf8');
        if (sitemap.includes('<!-- INSIGHTS_DYNAMIC -->')) {
          // Reemplazar bloque existente
          const block = [
            '  <!-- INSIGHTS_DYNAMIC -->',
            ...slugs.map(
              (s) =>
                `  <url><loc>https://pawfriend.cl/insights/${s}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`
            ),
            '  <!-- /INSIGHTS_DYNAMIC -->',
          ].join('\n');
          const updated = sitemap.replace(
            /  <!-- INSIGHTS_DYNAMIC -->[\s\S]*?<!-- \/INSIGHTS_DYNAMIC -->/,
            block
          );
          writeFileSync(SITEMAP, updated);
          console.log(`[spa-routes] Sitemap actualizado con ${slugs.length} insights dinamicos`);
        } else {
          // Insertar antes de </urlset>
          const block = [
            '',
            '  <!-- INSIGHTS_DYNAMIC -->',
            ...slugs.map(
              (s) =>
                `  <url><loc>https://pawfriend.cl/insights/${s}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`
            ),
            '  <!-- /INSIGHTS_DYNAMIC -->',
            '</urlset>',
          ].join('\n');
          const updated = sitemap.replace('</urlset>', block);
          writeFileSync(SITEMAP, updated);
          console.log(
            `[spa-routes] Sitemap extendido (primera vez) con ${slugs.length} insights dinamicos`
          );
        }
      }
    }
  } catch (err) {
    console.warn(`[spa-routes] Error fetcheando insights dinamicos: ${err.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Slugs Fase 3 §2.9: correlation_definitions con status='published'
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const corrRes = await fetch(`${SUPABASE_URL}/rest/v1/correlation_definitions?status=eq.published&select=slug`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!corrRes.ok) {
      console.warn(
        `[spa-routes] correlation_definitions HTTP ${corrRes.status}. ` +
          `Sin slugs Fase 3. (Probablemente la mig 20260902700000 no esta aplicada o no hay published.)`
      );
    } else {
      const correlations = await corrRes.json();
      const corrSlugs = Array.isArray(correlations)
        ? correlations.map((c) => c.slug).filter(Boolean)
        : [];

      let corrCreated = 0;
      for (const slug of corrSlugs) {
        const dir = join(DOCS, 'insights-pro', slug);
        const file = join(dir, 'index.html');
        mkdirSync(dir, { recursive: true });
        writeFileSync(file, html);
        corrCreated += 1;
      }
      if (corrSlugs.length > 0) {
        console.log(`[spa-routes] Generados ${corrCreated} index.html para insights-pro/<slug>`);

        // Append al sitemap
        if (existsSync(SITEMAP)) {
          const sitemap = readFileSync(SITEMAP, 'utf8');
          const block = [
            '  <!-- CORRELATIONS_DYNAMIC -->',
            ...corrSlugs.map(
              (s) =>
                `  <url><loc>https://pawfriend.cl/insights-pro/${s}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`
            ),
            '  <!-- /CORRELATIONS_DYNAMIC -->',
          ].join('\n');

          const updated = sitemap.includes('<!-- CORRELATIONS_DYNAMIC -->')
            ? sitemap.replace(
                /  <!-- CORRELATIONS_DYNAMIC -->[\s\S]*?<!-- \/CORRELATIONS_DYNAMIC -->/,
                block
              )
            : sitemap.replace('</urlset>', `\n${block}\n</urlset>`);

          writeFileSync(SITEMAP, updated);
          console.log(`[spa-routes] Sitemap actualizado con ${corrSlugs.length} correlations`);
        }
      } else {
        console.log('[spa-routes] 0 correlations published — esperando datos');
      }
    }
  } catch (err) {
    console.warn(`[spa-routes] Error fetcheando correlations: ${err.message}`);
  }
} else {
  console.log('[spa-routes] Sin VITE_SUPABASE_URL/KEY → omitiendo slugs dinamicos');
}
