#!/usr/bin/env node
// Orquesta el pipeline completo de una campaña.
// Uso:
//   npm run render:all                                   # estaticos + video simple
//   npm run render:all -- semana-01                      # una campaña
//   npm run render:all -- semana-01 --voices             # + voz ElevenLabs
//   npm run render:all -- semana-01 --voices --stock     # + voz + B-roll Pexels
//   npm run render:all -- semana-01 --voices --stock --captions  # + captions TikTok
//   npm run render:all -- semana-01 --full               # alias: voices+stock+captions
//
// Pipeline (en orden):
//   1. fetch-stock.mjs   (si --stock)       → descarga B-roll Pexels
//   2. generate-voices   (si --voices)      → MP3 por escena (ElevenLabs)
//   3. generate-captions (si --captions)    → JSON timestamps (whisper.cpp)
//   4. render-static     (siempre)          → PNG del carrusel + hero LinkedIn
//   5. render-video      (siempre)          → MP4 reel con media+voz+captions

import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);

const full = argv.includes('--full');
const withStock = full || argv.includes('--stock');
const withVoices = full || argv.includes('--voices');
const withCaptions = full || argv.includes('--captions');
const withMusic = full || argv.includes('--music');
const only = argv.filter((a) => !a.startsWith('--'))[0];
const args = only ? [only] : [];

function run(cmd, extraNodeArgs = []) {
  const r = spawnSync('node', [...extraNodeArgs, cmd, ...args], {
    cwd: __dirname,
    stdio: 'inherit',
  });
  if (r.status !== 0) process.exit(r.status);
}

if (withStock) run('fetch-stock.mjs', ['--env-file=../.env']);
if (withMusic) run('fetch-music.mjs');
if (withVoices) run('generate-voices.mjs', ['--env-file=../.env']);
if (withCaptions) run('generate-captions.mjs');
run('render-static.mjs');
run('render-video.mjs');
