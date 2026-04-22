#!/usr/bin/env node
// Genera MP3 por escena usando ElevenLabs TTS.
// Uso:
//   npm run voices                    # todas las campañas
//   npm run voices -- semana-01       # una campaña
//   npm run voices -- semana-01 --force  # re-genera aunque exista cache
//
// Requiere .env con:
//   ELEVEN_LABS_API_KEY=...
//   ELEVENLABS_VOICE_ID=...
//   ELEVENLABS_MODEL=eleven_multilingual_v2  (opcional)

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CAMPAIGNS_DIR = join(ROOT, 'campaigns');
const VOICE_DIR = join(ROOT, 'assets', 'voice');

const API_KEY = process.env.ELEVEN_LABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';

function die(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!API_KEY) die('Falta ELEVEN_LABS_API_KEY en .env. Copiá .env.example → .env.');
if (!VOICE_ID) die('Falta ELEVENLABS_VOICE_ID en .env. Buscá una voz en https://elevenlabs.io/app/voice-library y copiá su ID.');

// Texto a narrar por escena: si no hay scene.voiceText explicito,
// usa headline + ". " + sub (saltandose signos raros).
function sceneVoiceText(scene) {
  if (scene.voiceText && scene.voiceText.trim()) return scene.voiceText.trim();
  const parts = [scene.headline, scene.sub].filter(Boolean).map((s) => s.trim());
  return parts.join('. ');
}

// Hash del contenido (text + voice + model) para invalidar cache cuando cambia.
function sceneHash(text) {
  return createHash('sha256').update(`${VOICE_ID}|${MODEL}|${text}`).digest('hex').slice(0, 12);
}

async function ttsElevenLabs(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: {
        // stability bajo = mucha variacion natural, maxima emocion
        stability: 0.28,
        similarity_boost: 0.82,
        // style muy alto = tiktok-grade expresivo
        style: 0.75,
        use_speaker_boost: true,
      },
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`ElevenLabs ${res.status}: ${errBody.slice(0, 500)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function renderCampaignVoices(campaignFile, { force } = {}) {
  const campaign = JSON.parse(readFileSync(campaignFile, 'utf-8'));
  const { slug, reel } = campaign;
  if (!reel || !reel.scenes) {
    console.log(`⏭️  ${slug}: sin reel.scenes`);
    return;
  }

  const outDir = join(VOICE_DIR, slug);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  console.log(`\n🎙️  ${slug} (${reel.scenes.length} escenas)`);

  for (let i = 0; i < reel.scenes.length; i++) {
    const scene = reel.scenes[i];
    const text = sceneVoiceText(scene);
    if (!text) {
      console.log(`  ⏭️  escena ${i + 1} sin texto`);
      continue;
    }

    const hash = sceneHash(text);
    const sceneId = String(i + 1).padStart(2, '0');
    const outPath = join(outDir, `${sceneId}-${hash}.mp3`);

    if (existsSync(outPath) && !force) {
      console.log(`  ✅ escena ${i + 1} cacheada (${hash})`);
      scene.voicePath = `voice/${slug}/${sceneId}-${hash}.mp3`;
      continue;
    }

    console.log(`  🔊 escena ${i + 1}: "${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`);
    try {
      const mp3 = await ttsElevenLabs(text);
      writeFileSync(outPath, mp3);
      scene.voicePath = `voice/${slug}/${sceneId}-${hash}.mp3`;
      console.log(`     guardado ${Math.round(mp3.length / 1024)} KB`);
    } catch (e) {
      console.error(`     ⚠️  ${e.message}`);
    }
  }

  // Re-escribir el JSON con voicePath en cada escena (idempotente).
  writeFileSync(campaignFile, JSON.stringify(campaign, null, 2) + '\n');
  console.log(`  📝 ${slug}.json actualizado con voicePath por escena`);
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

  for (const file of files) await renderCampaignVoices(file, { force });
  console.log(`\n✨ Listo. Voices en ${VOICE_DIR}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
