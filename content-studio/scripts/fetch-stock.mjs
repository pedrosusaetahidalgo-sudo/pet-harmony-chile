#!/usr/bin/env node
// Fetch B-roll de Pexels Videos y lo asigna a escenas con stockSearch.
// Uso:
//   npm run stock                       # todas las campañas
//   npm run stock -- semana-01          # una
//   npm run stock -- semana-01 --force  # re-descarga ignorando cache
//
// Requiere .env con PEXELS_API_KEY. Gratis: https://www.pexels.com/api/new/
// Licencia Pexels: uso comercial OK, sin atribucion requerida.

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CAMPAIGNS_DIR = join(ROOT, 'campaigns');
const STOCK_DIR = join(ROOT, 'assets', 'stock');

const API_KEY = process.env.PEXELS_API_KEY;

function die(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!API_KEY) die('Falta PEXELS_API_KEY en .env. Obtén una gratis en https://www.pexels.com/api/new/');

// Cache de búsquedas ya realizadas (por query string) para no re-consultar.
const SEARCH_CACHE_FILE = join(STOCK_DIR, '.search-cache.json');
let searchCache = {};
if (existsSync(SEARCH_CACHE_FILE)) {
  try {
    searchCache = JSON.parse(readFileSync(SEARCH_CACHE_FILE, 'utf-8'));
  } catch {}
}

function saveSearchCache() {
  if (!existsSync(STOCK_DIR)) mkdirSync(STOCK_DIR, { recursive: true });
  writeFileSync(SEARCH_CACHE_FILE, JSON.stringify(searchCache, null, 2));
}

function searchHash(query) {
  return createHash('sha256').update(query).digest('hex').slice(0, 10);
}

async function searchPexelsVideos(query) {
  const key = `video:${query}`;
  if (searchCache[key]) return searchCache[key];

  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&size=medium&per_page=10`;
  const res = await fetch(url, { headers: { Authorization: API_KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  searchCache[key] = json;
  saveSearchCache();
  return json;
}

async function searchPexelsImages(query, orientation = 'portrait') {
  const key = `img:${orientation}:${query}`;
  if (searchCache[key]) return searchCache[key];

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=${orientation}&size=large&per_page=10`;
  const res = await fetch(url, { headers: { Authorization: API_KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  searchCache[key] = json;
  saveSearchCache();
  return json;
}

// Elige el mejor archivo: portrait HD de resolución mediana.
function pickBestVideoFile(videoFiles) {
  // Preferencia: HD portrait (1080x1920 o similar), sino cualquier portrait, sino el más chico.
  const portrait = videoFiles.filter((f) => f.height > f.width);
  if (portrait.length > 0) {
    // Buscar 1080p o 720p para no pesar demasiado
    const hd = portrait.find((f) => f.height === 1920 || f.height === 1280);
    if (hd) return hd;
    return portrait.reduce((a, b) => (a.height > b.height ? b : a));
  }
  // Fallback: cualquier archivo
  return videoFiles.reduce((a, b) => (a.height > b.height ? b : a));
}

async function downloadVideo(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(outPath));
}

async function fetchForScene(scene, slug, sceneIndex, { force }) {
  const query = scene.stockSearch;
  if (!query) return null;

  const hash = searchHash(query);
  const filename = `${slug}-${String(sceneIndex + 1).padStart(2, '0')}-${hash}.mp4`;
  const outPath = join(STOCK_DIR, filename);
  const relPath = `stock/${filename}`;

  if (existsSync(outPath) && !force) {
    console.log(`  ✅ escena ${sceneIndex + 1} cacheada "${query}"`);
    return relPath;
  }

  console.log(`  🎞️  escena ${sceneIndex + 1}: buscar "${query}"`);
  const search = await searchPexelsVideos(query);
  if (!search.videos || search.videos.length === 0) {
    console.warn(`     ⚠️  sin resultados para "${query}"`);
    return null;
  }

  const video = search.videos[0];
  const file = pickBestVideoFile(video.video_files);
  console.log(`     → "${video.user.name}" ${file.width}x${file.height} (${Math.round(file.fps)}fps)`);

  if (!existsSync(STOCK_DIR)) mkdirSync(STOCK_DIR, { recursive: true });
  await downloadVideo(file.link, outPath);
  console.log(`     guardado → ${filename}`);
  return relPath;
}

// Imagen de Pexels para staticAssets. Orientacion segun layout.
async function fetchImageForAsset(asset, slug, { force }) {
  const query = asset.data?.imageSearch;
  if (!query) return null;

  const orientation = asset.layout === 'linkedin-hero' ? 'landscape' : 'portrait';
  const hash = searchHash(`${orientation}:${query}`);
  const filename = `${slug}-${asset.id}-${hash}.jpg`;
  const outPath = join(STOCK_DIR, filename);
  const relPath = `stock/${filename}`;

  if (existsSync(outPath) && !force) {
    console.log(`  ✅ asset ${asset.id} cacheado "${query}"`);
    return relPath;
  }

  console.log(`  🖼️  asset ${asset.id}: buscar "${query}" (${orientation})`);
  const search = await searchPexelsImages(query, orientation);
  if (!search.photos || search.photos.length === 0) {
    console.warn(`     ⚠️  sin resultados para "${query}"`);
    return null;
  }

  const photo = search.photos[0];
  const imgUrl = photo.src.large2x ?? photo.src.large ?? photo.src.original;
  console.log(`     → "${photo.photographer}" ${photo.width}x${photo.height}`);

  if (!existsSync(STOCK_DIR)) mkdirSync(STOCK_DIR, { recursive: true });
  await downloadVideo(imgUrl, outPath); // reusa la misma funcion de download binario
  console.log(`     guardado → ${filename}`);
  return relPath;
}

async function processCampaign(campaignFile, { force } = {}) {
  const campaign = JSON.parse(readFileSync(campaignFile, 'utf-8'));
  const { slug, reel, staticAssets } = campaign;

  const scenesWithStock = reel?.scenes?.filter((s) => s.stockSearch) ?? [];
  const assetsWithImage = staticAssets?.filter((a) => a.data?.imageSearch) ?? [];

  if (scenesWithStock.length === 0 && assetsWithImage.length === 0) {
    console.log(`⏭️  ${slug}: sin stockSearch ni imageSearch`);
    return;
  }

  console.log(`\n📹 ${slug} (${scenesWithStock.length} videos + ${assetsWithImage.length} imgs)`);

  // Videos para reel
  for (let i = 0; i < (reel?.scenes?.length ?? 0); i++) {
    const scene = reel.scenes[i];
    if (!scene.stockSearch) continue;
    try {
      const mediaPath = await fetchForScene(scene, slug, i, { force });
      if (mediaPath) {
        scene.mediaPath = mediaPath;
        scene.mediaKind = 'video';
      }
    } catch (e) {
      console.error(`     ⚠️  ${e.message}`);
    }
  }

  // Imagenes para estaticos
  for (const asset of staticAssets ?? []) {
    if (!asset.data?.imageSearch) continue;
    try {
      const imagePath = await fetchImageForAsset(asset, slug, { force });
      if (imagePath) {
        asset.data.imagePath = imagePath;
      }
    } catch (e) {
      console.error(`     ⚠️  ${e.message}`);
    }
  }

  writeFileSync(campaignFile, JSON.stringify(campaign, null, 2) + '\n');
  console.log(`  📝 ${slug}.json actualizado con mediaPath e imagePath`);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = args.find((a) => !a.startsWith('--'));

  const files = readdirSync(CAMPAIGNS_DIR)
    .filter((f) => f.endsWith('.json'))
    .filter((f) => !only || f.startsWith(only))
    .map((f) => join(CAMPAIGNS_DIR, f));

  if (files.length === 0) {
    console.log(`No hay campañas que matcheen "${only ?? '*'}"`);
    process.exit(0);
  }

  for (const file of files) await processCampaign(file, { force });
  console.log(`\n✨ Listo. Stock en ${STOCK_DIR}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
