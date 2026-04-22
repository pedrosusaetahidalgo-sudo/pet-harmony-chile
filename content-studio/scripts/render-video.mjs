#!/usr/bin/env node
// Renderiza los reels (MP4 1080x1920) de todas las campañas.
// Uso:
//   node scripts/render-video.mjs                    # todas
//   node scripts/render-video.mjs semana-01          # una campaña

import { readFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { parseFile } from 'music-metadata';

// Pad de silencio (segundos) que se agrega al final de cada escena con voz
// para dar aire al caption/transicion. La escena dura = voiceDuration + pad.
const VOICE_TAIL_PAD = 0.55;
// Pad de silencio antes de que arranque la voz en cada escena.
const VOICE_HEAD_PAD = 0.15;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CAMPAIGNS_DIR = join(ROOT, 'campaigns');
const OUTPUT_DIR = join(ROOT, 'output');
const ENTRY = join(ROOT, 'remotion', 'index.jsx');

async function main() {
  const [only] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const files = readdirSync(CAMPAIGNS_DIR)
    .filter((f) => f.endsWith('.json'))
    .filter((f) => !only || f.startsWith(only));

  if (files.length === 0) {
    console.log(`No hay campañas que matcheen "${only ?? '*'}"`);
    process.exit(0);
  }

  console.log('📦 Bundling Remotion project...');
  const bundled = await bundle({
    entryPoint: ENTRY,
    publicDir: join(ROOT, 'assets'),
  });
  console.log('✅ Bundle listo.\n');

  for (const file of files) {
    const campaign = JSON.parse(readFileSync(join(CAMPAIGNS_DIR, file), 'utf-8'));
    const { slug, reel } = campaign;
    if (!reel) {
      console.log(`⏭️  ${slug}: sin "reel" definido, skip`);
      continue;
    }

    const outDir = join(OUTPUT_DIR, slug);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, 'reel-1080x1920.mp4');

    // Cargar captions + medir duracion real del MP3 de voz para auto-ajustar
    // la duracion de cada escena (evita que la voz vaya corrida).
    const scenesWithCaptions = [];
    for (const s of reel.scenes) {
      let scene = { ...s };

      // Auto-duration basada en voz real + pad (head + tail).
      if (scene.voicePath) {
        const absVoice = join(ROOT, 'assets', scene.voicePath);
        if (existsSync(absVoice)) {
          try {
            const meta = await parseFile(absVoice, { duration: true, skipCovers: true });
            const voiceDur = meta.format.duration ?? null;
            if (voiceDur && voiceDur > 0) {
              const autoDur = Number((VOICE_HEAD_PAD + voiceDur + VOICE_TAIL_PAD).toFixed(3));
              // Respetar minimo del JSON (si el autor pone mas tiempo a proposito).
              scene.durationInSeconds = Math.max(autoDur, scene.durationInSeconds ?? 0);
            }
          } catch {}
        }
      }

      // Captions
      if (scene.captionsPath) {
        const absCap = join(ROOT, 'assets', scene.captionsPath);
        if (existsSync(absCap)) {
          try {
            scene.captions = JSON.parse(readFileSync(absCap, 'utf-8'));
          } catch {}
        }
      }
      scenesWithCaptions.push(scene);
    }

    // 2.4s adicionales para el BrandedOutro (logo + URL) al final.
    const OUTRO_SECONDS = 2.4;
    const scenesSeconds = scenesWithCaptions.reduce((acc, s) => acc + s.durationInSeconds, 0);
    console.log(`   auto-dur escenas: ${scenesWithCaptions.map((s) => s.durationInSeconds.toFixed(2)).join(' + ')} = ${scenesSeconds.toFixed(2)}s`);

    // SFX opcionales: solo incluimos paths que existan en disco.
    const sfxPaths = {};
    const whooshAbs = join(ROOT, 'assets', 'sfx', 'whoosh.mp3');
    const dingAbs = join(ROOT, 'assets', 'sfx', 'ding.mp3');
    if (existsSync(whooshAbs)) sfxPaths.whoosh = 'sfx/whoosh.mp3';
    if (existsSync(dingAbs)) sfxPaths.ding = 'sfx/ding.mp3';

    const inputProps = {
      totalSeconds: scenesSeconds + OUTRO_SECONDS,
      brandHandle: reel.brandHandle ?? '@pawfriend.cl',
      scenes: scenesWithCaptions,
      musicPath: campaign.music?.path ?? null,
      sfxPaths,
    };

    const composition = await selectComposition({
      serveUrl: bundled,
      id: 'VerticalReel',
      inputProps,
    });

    console.log(`🎬 ${slug} → ${inputProps.totalSeconds}s, ${composition.durationInFrames} frames`);
    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outPath,
      inputProps,
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 100);
        process.stdout.write(`\r   render ${pct}%   `);
      },
    });
    process.stdout.write('\n');
    console.log(`   ✅ ${outPath}\n`);
  }

  console.log(`✨ Listo. Videos en ${OUTPUT_DIR}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
