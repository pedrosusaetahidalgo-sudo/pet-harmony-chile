#!/usr/bin/env node
// Renderiza assets estaticos (PNG) de todas las campañas en content-studio/campaigns/.
// Uso:
//   node scripts/render-static.mjs                       # todas las campañas
//   node scripts/render-static.mjs semana-01             # una campaña especifica
//   node scripts/render-static.mjs semana-01 --force     # re-render (ignora cache)

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { carouselSlide } from '../src/layouts/carousel.js';
import { linkedInHero } from '../src/layouts/linkedin.js';
import { FORMATS, COLORS } from '../src/brand.js';
import { loadAdditionalAsset } from '../src/emoji-loader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CAMPAIGNS_DIR = join(ROOT, 'campaigns');
const OUTPUT_DIR = join(ROOT, 'output');

// Inter font (TTF) desde @fontsource/inter
const fontDir = join(ROOT, 'node_modules', '@fontsource', 'inter', 'files');
const FONTS = [
  { name: 'Inter', weight: 400, style: 'normal', file: 'inter-latin-400-normal.woff' },
  { name: 'Inter', weight: 500, style: 'normal', file: 'inter-latin-500-normal.woff' },
  { name: 'Inter', weight: 700, style: 'normal', file: 'inter-latin-700-normal.woff' },
  { name: 'Inter', weight: 900, style: 'normal', file: 'inter-latin-900-normal.woff' },
].map((f) => ({ ...f, data: readFileSync(join(fontDir, f.file)) }));

// Normaliza schema {headline, sub, visualHint} → {title, subtitle, body}
// que usan los layouts de Satori. Ignora visualHint (guia para diseñador IA,
// no renderizable). Mantiene back-compat con schema viejo (title, subtitle, body).
function normalizeData(data, layout) {
  const out = { ...data };
  if (data.headline && !data.title) out.title = data.headline;
  if (data.sub && !data.subtitle && !data.body) {
    if (layout === 'carousel-cover' || layout === 'linkedin-hero') {
      out.subtitle = data.sub;
    } else {
      out.body = data.sub;
    }
  }
  // Si hay imagePath (de fetch-stock), la convertimos a data URI
  // para que Satori la pueda usar en <img src>.
  if (data.imagePath) {
    const absPath = join(ROOT, 'assets', data.imagePath.replace(/^stock\//, 'stock/'));
    if (existsSync(absPath)) {
      const buf = readFileSync(absPath);
      const mime = absPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
      out.imageDataUri = `data:${mime};base64,${buf.toString('base64')}`;
    }
  }
  return out;
}

const LAYOUTS = {
  'carousel-cover': (data) => ({
    markup: carouselSlide({ variant: 'cover', ...normalizeData(data, 'carousel-cover') }),
    format: FORMATS.igFeed,
  }),
  'carousel-body': (data) => ({
    markup: carouselSlide({ variant: 'body', ...normalizeData(data, 'carousel-body') }),
    format: FORMATS.igFeed,
  }),
  'carousel-cta': (data) => ({
    markup: carouselSlide({ variant: 'cta', ...normalizeData(data, 'carousel-cta') }),
    format: FORMATS.igFeed,
  }),
  'linkedin-hero': (data) => ({
    markup: linkedInHero(normalizeData(data, 'linkedin-hero')),
    format: FORMATS.linkedIn,
  }),
};

async function renderToPng(markup, { width, height }) {
  const svg = await satori(markup, { width, height, fonts: FONTS, loadAdditionalAsset });
  const resvg = new Resvg(svg, { background: 'white' });
  return resvg.render().asPng();
}

async function renderCampaign(campaignFile) {
  const campaign = JSON.parse(readFileSync(campaignFile, 'utf-8'));
  const { slug, staticAssets = [] } = campaign;
  if (!slug) throw new Error(`Campaign sin slug: ${campaignFile}`);

  const outDir = join(OUTPUT_DIR, slug);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  // Auto-numerar slides del carrusel (ignora linkedin-hero, etc.)
  const carouselAssets = staticAssets.filter((a) => a.layout.startsWith('carousel'));
  const totalSlides = carouselAssets.length;
  const carouselIndexById = new Map(carouselAssets.map((a, i) => [a.id, i + 1]));

  console.log(`\n📦 ${slug} (${staticAssets.length} assets estáticos)`);
  for (const asset of staticAssets) {
    const { id, layout, data } = asset;
    const builder = LAYOUTS[layout];
    if (!builder) {
      console.warn(`  ⚠️  layout desconocido: ${layout} (asset ${id})`);
      continue;
    }
    const enriched = { ...data };
    if (layout.startsWith('carousel') && carouselIndexById.has(id)) {
      enriched.slideNumber = carouselIndexById.get(id);
      enriched.totalSlides = totalSlides;
    }
    const { markup, format } = builder(enriched);
    const png = await renderToPng(markup, format);
    const outPath = join(outDir, `${id}.png`);
    writeFileSync(outPath, png);
    console.log(`  ✅ ${id}.png (${format.label})`);
  }
}

async function main() {
  const [only] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const files = readdirSync(CAMPAIGNS_DIR)
    .filter((f) => f.endsWith('.json'))
    .filter((f) => !only || f.startsWith(only))
    .map((f) => join(CAMPAIGNS_DIR, f));

  if (files.length === 0) {
    console.log(`No hay campañas que matcheen "${only ?? '*'}" en ${CAMPAIGNS_DIR}`);
    process.exit(0);
  }

  for (const file of files) await renderCampaign(file);
  console.log(`\n✨ Listo. Output en ${OUTPUT_DIR}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
