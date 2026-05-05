// Render todos los LaunchSlide como JPEGs.
// Uso: node scripts/render-slides.mjs
//
// Recorre la lista de slides definida abajo y los exporta a las rutas del
// carrusel/LinkedIn esperadas. Llama al binario local de remotion (still).

import { spawnSync } from 'node:child_process';
import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STUDIO_ROOT = resolve(__dirname, '..');
const REPO_ROOT = resolve(STUDIO_ROOT, '..');

// Bin remotion local
const REMOTION_BIN = resolve(
  STUDIO_ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'remotion.cmd' : 'remotion',
);

const OUT_BASE = resolve(
  REPO_ROOT,
  'content-studio',
  'output',
  'launch-2026-05-05',
);

const SLIDES = [
  // Carrusel 1 (lanzamiento) — 8 slides
  { id: 'launch-01', out: 'instagram/post-1-launch/carousel/01-cover.jpg' },
  { id: 'launch-02', out: 'instagram/post-1-launch/carousel/02-stats.jpg' },
  { id: 'launch-03', out: 'instagram/post-1-launch/carousel/03-pain.jpg' },
  { id: 'launch-04', out: 'instagram/post-1-launch/carousel/04-app1.jpg' },
  { id: 'launch-05', out: 'instagram/post-1-launch/carousel/05-app2.jpg' },
  { id: 'launch-06', out: 'instagram/post-1-launch/carousel/06-ema.jpg' },
  { id: 'launch-07', out: 'instagram/post-1-launch/carousel/07-gratis.jpg' },
  { id: 'launch-08', out: 'instagram/post-1-launch/carousel/08-cta.jpg' },
  // Carrusel 2 (Kai/Ema) — 6 slides
  { id: 'kai-ema-01', out: 'instagram/post-2-kai-ema/01-cover.jpg' },
  { id: 'kai-ema-02', out: 'instagram/post-2-kai-ema/02-kai.jpg' },
  { id: 'kai-ema-03', out: 'instagram/post-2-kai-ema/03-sofa.jpg' },
  { id: 'kai-ema-04', out: 'instagram/post-2-kai-ema/04-ema.jpg' },
  { id: 'kai-ema-05', out: 'instagram/post-2-kai-ema/05-purpose.jpg' },
  { id: 'kai-ema-06', out: 'instagram/post-2-kai-ema/06-cta.jpg' },
];

// LinkedIn images: copias de carrusel 1 ya regenerado.
const LINKEDIN_COPIES = [
  {
    from: 'instagram/post-1-launch/carousel/01-cover.jpg',
    to: 'linkedin/images/01-cover-kai.jpg',
  },
  {
    from: 'instagram/post-1-launch/carousel/04-app1.jpg',
    to: 'linkedin/images/02-app-vacunas.jpg',
  },
  {
    from: 'instagram/post-1-launch/carousel/05-app2.jpg',
    to: 'linkedin/images/03-app-compartir.jpg',
  },
];

function ensureDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function renderSlide({ id, out }) {
  const compId = `LaunchSlide-${id}`;
  const outAbs = resolve(OUT_BASE, out);
  ensureDir(outAbs);

  console.log(`\n[render] ${compId} -> ${out}`);
  const args = [
    'still',
    compId,
    outAbs,
    '--image-format=jpeg',
    '--jpeg-quality=92',
    '--frame=15',
    '--log=error',
  ];

  const res = spawnSync(REMOTION_BIN, args, {
    cwd: STUDIO_ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (res.status !== 0) {
    throw new Error(`remotion still failed for ${compId} (exit ${res.status})`);
  }

  if (!existsSync(outAbs)) {
    throw new Error(`Output file missing after render: ${outAbs}`);
  }
}

function copyLinkedIn({ from, to }) {
  const src = resolve(OUT_BASE, from);
  const dst = resolve(OUT_BASE, to);
  ensureDir(dst);
  copyFileSync(src, dst);
  console.log(`[copy]  ${from} -> ${to}`);
}

console.log(`Studio root: ${STUDIO_ROOT}`);
console.log(`Remotion bin: ${REMOTION_BIN}`);
console.log(`Output base: ${OUT_BASE}`);

for (const slide of SLIDES) {
  renderSlide(slide);
}

console.log('\n[linkedin] Copying selected slides...');
for (const copy of LINKEDIN_COPIES) {
  copyLinkedIn(copy);
}

console.log('\nDone.');
