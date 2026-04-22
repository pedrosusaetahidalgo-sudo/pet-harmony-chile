#!/usr/bin/env node
// Transcribe los MP3 de voz con whisper.cpp local y genera captions
// palabra-por-palabra para que el reel muestre subtitulos animados.
//
// Uso:
//   npm run setup:whisper          # UNA SOLA VEZ (baja whisper.cpp + modelo)
//   npm run captions               # todas las campañas
//   npm run captions -- semana-01  # una
//   npm run captions -- semana-01 --force  # re-transcribe aunque exista cache
//
// Output: assets/captions/<slug>/<n>-<hash>.json con:
//   [ { text, startMs, endMs }, ... ]

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { transcribe, convertToCaptions } from '@remotion/install-whisper-cpp';
import ffmpegPath from 'ffmpeg-static';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CAMPAIGNS_DIR = join(ROOT, 'campaigns');
const CAPTIONS_DIR = join(ROOT, 'assets', 'captions');
const VOICE_DIR = join(ROOT, 'assets', 'voice');
const WHISPER_DIR = join(ROOT, 'whisper.cpp');
const WHISPER_MODEL = 'small';
const WHISPER_VERSION = '1.5.5';

function die(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!existsSync(WHISPER_DIR)) {
  die('No existe whisper.cpp. Corré "npm run setup:whisper" una sola vez antes.');
}

// Whisper.cpp requiere WAV 16kHz mono. Convertimos MP3 con ffmpeg-static.
function convertToWav16k(mp3Path) {
  const wavPath = mp3Path.replace(/\.mp3$/, '.wav');
  if (existsSync(wavPath)) return wavPath;
  const res = spawnSync(ffmpegPath, [
    '-y', '-loglevel', 'error',
    '-i', mp3Path,
    '-ar', '16000',
    '-ac', '1',
    wavPath,
  ]);
  if (res.status !== 0) throw new Error(`ffmpeg fallo: ${res.stderr?.toString() ?? 'desconocido'}`);
  return wavPath;
}

async function transcribeScene(voicePath, outPath) {
  const absMp3 = join(ROOT, 'assets', voicePath);
  if (!existsSync(absMp3)) throw new Error(`No existe voice MP3: ${absMp3}`);

  const wavPath = convertToWav16k(absMp3);

  const { transcription } = await transcribe({
    inputPath: wavPath,
    whisperPath: WHISPER_DIR,
    whisperCppVersion: WHISPER_VERSION,
    model: WHISPER_MODEL,
    language: 'es',
    tokenLevelTimestamps: true,
    // Initial prompt sesga a los nombres propios del proyecto para que
    // no escriba "Emma" en vez de "Ema" ni "Cai" en vez de "Kai".
    additionalArgs: ['--prompt', 'Ema, Kai, Paw Friend, pawfriend.cl, veterinario, mascota, ficha medica, Chile.'],
  });

  const { captions } = convertToCaptions({
    transcription,
    combineTokensWithinMilliseconds: 150,
  });

  writeFileSync(outPath, JSON.stringify(captions, null, 2));
  return captions.length;
}

async function processCampaign(campaignFile, { force }) {
  const campaign = JSON.parse(readFileSync(campaignFile, 'utf-8'));
  const { slug, reel } = campaign;
  if (!reel || !reel.scenes) return;

  const scenesWithVoice = reel.scenes.filter((s) => s.voicePath);
  if (scenesWithVoice.length === 0) {
    console.log(`⏭️  ${slug}: sin voicePath. Corré "npm run voices -- ${slug}" primero.`);
    return;
  }

  const outDir = join(CAPTIONS_DIR, slug);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  console.log(`\n✍️  ${slug} (${scenesWithVoice.length} escenas con voz)`);

  for (let i = 0; i < reel.scenes.length; i++) {
    const scene = reel.scenes[i];
    if (!scene.voicePath) continue;

    // Hash basado en el voicePath (que ya incluye hash del texto+voz).
    const sceneId = String(i + 1).padStart(2, '0');
    const vHash = scene.voicePath.match(/\b([a-f0-9]{12})\b/)?.[1] ?? 'nohash';
    const outPath = join(outDir, `${sceneId}-${vHash}.json`);
    const relPath = `captions/${slug}/${sceneId}-${vHash}.json`;

    if (existsSync(outPath) && !force) {
      console.log(`  ✅ escena ${i + 1} cacheada`);
      scene.captionsPath = relPath;
      continue;
    }

    console.log(`  ✍️  escena ${i + 1}: transcribiendo...`);
    try {
      const count = await transcribeScene(scene.voicePath, outPath);
      scene.captionsPath = relPath;
      console.log(`     ${count} segmentos guardados`);
    } catch (e) {
      console.error(`     ⚠️  ${e.message}`);
    }
  }

  writeFileSync(campaignFile, JSON.stringify(campaign, null, 2) + '\n');
  console.log(`  📝 ${slug}.json actualizado con captionsPath`);
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
  console.log(`\n✨ Listo. Captions en ${CAPTIONS_DIR}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
