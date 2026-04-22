#!/usr/bin/env node
// Instala whisper.cpp + modelo small (mejor ratio calidad/tamaño para español).
// Se ejecuta una sola vez. Output: content-studio/whisper.cpp/
//
// Uso:
//   npm run setup:whisper

import { installWhisperCpp, downloadWhisperModel } from '@remotion/install-whisper-cpp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WHISPER_DIR = join(__dirname, '..', 'whisper.cpp');
const WHISPER_VERSION = '1.5.5';
const MODEL = 'small'; // opciones: tiny, base, small, medium, large

console.log(`📦 Instalando whisper.cpp ${WHISPER_VERSION} en ${WHISPER_DIR}...`);
await installWhisperCpp({
  to: WHISPER_DIR,
  version: WHISPER_VERSION,
});
console.log('✅ whisper.cpp compilado');

console.log(`\n📥 Bajando modelo "${MODEL}" (~465MB para small)...`);
await downloadWhisperModel({
  folder: WHISPER_DIR,
  model: MODEL,
});
console.log(`✅ Modelo ${MODEL} listo`);

console.log('\n✨ Setup completo. Ahora podés correr: npm run captions');
