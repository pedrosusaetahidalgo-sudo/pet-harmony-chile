#!/usr/bin/env node
// Fetch musica de fondo desde Jamendo (royalty-free, Creative Commons).
// Uso:
//   npm run music                              # todas las campañas
//   npm run music -- semana-01                 # una
//   npm run music -- semana-01 --tags=chill,upbeat
//
// El JSON de campaña debe tener opcionalmente:
//   "music": { "searchTags": "upbeat chill", "moodFallback": "happy" }
//
// Si ya hay music.path y el MP3 existe, no re-descarga.
// Jamendo devuelve MP3 con licencia CC-BY / CC-BY-SA (uso comercial OK, atribución opcional).

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, createWriteStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CAMPAIGNS_DIR = join(ROOT, 'campaigns');
const MUSIC_DIR = join(ROOT, 'assets', 'music');

// Client ID publico de Jamendo (documentado en dev portal, sin rate limit estricto).
const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID || '56d30c95';

function searchHash(q) {
  return createHash('sha256').update(q).digest('hex').slice(0, 10);
}

async function searchJamendo(tagsStr) {
  // Prueba primero con todos los tags, luego va relajando a 1 tag.
  const tagList = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);
  const attempts = [tagList.join('+'), ...tagList];

  for (const query of attempts) {
    const url = new URL('https://api.jamendo.com/v3.0/tracks/');
    url.searchParams.set('client_id', JAMENDO_CLIENT_ID);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '10');
    url.searchParams.set('fuzzytags', query);
    url.searchParams.set('audioformat', 'mp32');
    url.searchParams.set('boost', 'popularity_total');
    url.searchParams.set('include', 'licenses');

    const res = await fetch(url.toString());
    if (!res.ok) continue;
    const json = await res.json();
    if (json.results?.length > 0) {
      console.log(`  (usando tags "${query}")`);
      return json.results;
    }
  }
  return [];
}

async function downloadTrack(audioUrl, outPath) {
  const res = await fetch(audioUrl);
  if (!res.ok) throw new Error(`Download ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(outPath));
}

async function processCampaign(campaignFile, { force }) {
  const campaign = JSON.parse(readFileSync(campaignFile, 'utf-8'));
  const { slug, music } = campaign;
  if (!music) {
    console.log(`⏭️  ${slug}: sin bloque music`);
    return;
  }

  if (!existsSync(MUSIC_DIR)) mkdirSync(MUSIC_DIR, { recursive: true });

  // Si ya hay music.path y el archivo existe, usa esa (modo manual).
  if (music.path) {
    const abs = join(ROOT, 'assets', music.path);
    if (existsSync(abs)) {
      console.log(`\n🎵 ${slug}: música manual detectada en ${music.path} ✅`);
      return;
    } else {
      console.warn(`\n🎵 ${slug}: music.path "${music.path}" NO existe en disco`);
    }
  }

  // Intento automatico por searchTags (Jamendo). Si falla, da instrucciones manuales.
  if (!music.searchTags) {
    console.log(`⏭️  ${slug}: sin music.searchTags ni music.path`);
    return;
  }

  const tags = music.searchTags;
  const hash = searchHash(tags);
  const filename = `${slug}-${hash}.mp3`;
  const outPath = join(MUSIC_DIR, filename);
  const relPath = `music/${filename}`;

  if (existsSync(outPath) && !force) {
    console.log(`\n🎵 ${slug}: cacheado "${tags}"`);
    campaign.music.path = relPath;
    writeFileSync(campaignFile, JSON.stringify(campaign, null, 2) + '\n');
    return;
  }

  console.log(`\n🎵 ${slug}: intentando buscar "${tags}" en Jamendo...`);
  try {
    const tracks = await searchJamendo(tags);
    if (tracks.length > 0) {
      const track = tracks[0];
      console.log(`  → "${track.name}" by ${track.artist_name}`);
      await downloadTrack(track.audio, outPath);
      campaign.music.path = relPath;
      campaign.music.attribution = `${track.name} — ${track.artist_name} (Jamendo)`;
      writeFileSync(campaignFile, JSON.stringify(campaign, null, 2) + '\n');
      console.log(`  ✅ guardado → ${filename}`);
      return;
    }
  } catch (e) {
    console.warn(`  ⚠️  Jamendo falló: ${e.message}`);
  }

  // Fallback manual con instrucciones claras.
  console.warn(`\n  ⚠️  No se pudo descargar música automáticamente (Jamendo API suspendida o sin resultados).`);
  console.warn(`\n  📝 Fallback manual (2 min):`);
  console.warn(`     1. Entra a https://pixabay.com/music/search/mood/happy/ (gratis, uso comercial OK)`);
  console.warn(`        o https://mixkit.co/free-stock-music/mood/happy/`);
  console.warn(`     2. Descarga un MP3 y guardalo en:`);
  console.warn(`        assets/music/${slug}.mp3`);
  console.warn(`     3. En ${campaignFile} reemplaza el bloque music por:`);
  console.warn(`        "music": { "path": "music/${slug}.mp3" }`);
  console.warn(`     4. Volvé a correr "npm run render:all -- ${slug} --full"\n`);
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
  console.log(`\n✨ Listo. Música en ${MUSIC_DIR}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
