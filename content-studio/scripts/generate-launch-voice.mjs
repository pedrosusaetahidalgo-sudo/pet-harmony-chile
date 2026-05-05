#!/usr/bin/env node
// Genera el voiceover del video de lanzamiento Paw Friend.
// Output: content-studio/output/launch-2026-05-05/voice/narration.mp3
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ENV_PATH = join(ROOT, '..', '.env');

// Cargar .env manual
const envText = readFileSync(ENV_PATH, 'utf-8');
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] ||= m[2].trim().replace(/^["']|["']$/g, '');
}

const API_KEY = process.env.ELEVEN_LABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';

if (!API_KEY || !VOICE_ID) {
  console.error('❌ Falta ELEVEN_LABS_API_KEY o ELEVENLABS_VOICE_ID');
  process.exit(1);
}

const SEGMENTS = [
  { name: '01-intro', text: 'Hola. Este es Kai, mi pastor suizo blanco.' },
  { name: '02-pain', text: 'Como cualquier dueño, quería tener su ficha médica al día.' },
  { name: '03-features', text: 'Vacunas. Peso. Recordatorios. Todo en un solo lugar.' },
  { name: '04-built', text: 'Así que armé Paw Friend.' },
  { name: '05-cats', text: 'También para gatos.' },
  { name: '06-cta', text: 'Lo lancé hoy. Pawfriend punto cl. Gratis para dueños chilenos.' },
];

const OUT_DIR = join(ROOT, 'output', 'launch-2026-05-05', 'voice');
mkdirSync(OUT_DIR, { recursive: true });

async function tts(text, fileName) {
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
        stability: 0.55,
        similarity_boost: 0.75,
        style: 0.4,
        use_speaker_boost: true,
      },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const out = join(OUT_DIR, `${fileName}.mp3`);
  writeFileSync(out, buffer);
  return out;
}

console.log(`🎙️  Voice ID: ${VOICE_ID} · Model: ${MODEL}`);
for (const s of SEGMENTS) {
  process.stdout.write(`  ${s.name} ... `);
  try {
    const out = await tts(s.text, s.name);
    console.log(`✓ ${out.split(/[\\\/]/).pop()}`);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
console.log(`\n✓ ${SEGMENTS.length} segments en ${OUT_DIR}`);
