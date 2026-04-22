// Carga logos SVG del brand v2 como data URIs para usar en Satori
// (Satori no hace fetch a archivos locales; requiere data URI o URL http).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BRAND_DIR = join(__dirname, '..', 'assets', 'brand');

function toDataUri(svgPath) {
  const svg = readFileSync(svgPath, 'utf-8');
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export const LOGO = {
  // Icon principal: squircle morado con pata+corazon en negative space.
  // Sirve sobre fondo claro. 680x680.
  iconPrincipal: toDataUri(join(BRAND_DIR, 'paw_friend_icon_principal.svg')),
  // Reverse: para fondos morados/oscuros (pata+corazon moradas sobre
  // squircle blanco). 680x680.
  iconReverse: toDataUri(join(BRAND_DIR, 'paw_friend_icon_reverse.svg')),
  // Wordmark horizontal con "paw friend" en Fredoka. 680x220.
  wordmarkHorizontal: toDataUri(join(BRAND_DIR, 'paw_friend_wordmark_horizontal.svg')),
};
