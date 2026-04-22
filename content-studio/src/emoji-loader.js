// Cache local + fallback a Twemoji para renderizar emojis en Satori.
// Inter solo tiene glyphs latinos, asi que todo emoji (🐾 ✨ →) lo
// servimos desde Twemoji. Primer uso descarga; siguientes usan cache.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '..', 'assets', '.emoji-cache');
if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

// Convierte un emoji a su hex codepoint (ignorando variation selectors
// y zero-width joiners donde corresponda — mismo comportamiento que
// Twemoji.parse).
function toHex(emoji) {
  const codePoints = [];
  for (const char of emoji) {
    const cp = char.codePointAt(0);
    // Ignorar variation selector U+FE0F salvo que sea el unico
    if (cp !== 0xfe0f) codePoints.push(cp.toString(16));
  }
  return codePoints.join('-');
}

async function downloadEmoji(hex) {
  // Twemoji 14.0.2 (CDN estable).
  const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${hex}.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Twemoji ${hex} no encontrado: ${res.status}`);
  return res.text();
}

export async function loadEmojiSvg(segment) {
  const hex = toHex(segment);
  const cachePath = join(CACHE_DIR, `${hex}.svg`);
  if (existsSync(cachePath)) {
    return readFileSync(cachePath, 'utf-8');
  }
  const svg = await downloadEmoji(hex);
  writeFileSync(cachePath, svg);
  return svg;
}

// Hook para satori: si detecta un segmento sin font, llama a esto.
export async function loadAdditionalAsset(code, segment) {
  if (code === 'emoji') {
    try {
      const svg = await loadEmojiSvg(segment);
      return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    } catch (e) {
      console.warn(`[emoji] no pude cargar "${segment}": ${e.message}`);
      return '';
    }
  }
  // code === 'font' → podria cargar fuentes on-demand, no lo necesito.
  return code;
}
