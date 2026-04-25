/**
 * Helper: extrae los SVGs del index.ts de la edge fn (los renderiza inline
 * con datos dummy de Kai) y los inyecta en preview_pet_id_card.html para
 * abrir en el navegador.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const EDGE_FN = join(REPO, 'supabase/functions/generate-pet-id-card/index.ts');
const HTML_TEMPLATE = join(REPO, 'scripts/preview_pet_id_card.html');
const OUT = join(REPO, 'scripts/_preview_pet_id_card.rendered.html');

// Datos dummy (Kai - perro de Pedro según memoria)
const dummyData = {
  pet_id: 'demo-uuid',
  card_number: 'PF-2026-A4F29X',
  pet_name: 'Kai',
  species: 'perro',
  breed: 'Pastor suizo',
  birth_date: '2020-03-15',
  gender: 'macho',
  neutered: true,
  color: 'Blanco',
  microchip_number: '982000123456789',
  chip_registry: 'Animalcheck',
  photo_url: '/_preview_pet_photo.jpg',
  blood_type: 'DEA 1+',
  allergies: 'Penicilina',
  chronic_conditions: null,
  emergency_vet_name: 'Dra. Sofia Rosi',
  emergency_vet_phone: '+56 9 8765 4321',
  owner_name: 'Pedro Susaeta',
  owner_phone: '+56 9 8209 2588',
  emergency_contact_alt: null,
  weight_kg: 24.5,
  weight_date: '2026-04-15',
  vaccination_status: 'al_dia',
  current_medications_summary: null,
  diet_summary: 'Royal Canin Adult',
  nose_print_hash: null,
  issued_at: new Date().toISOString(),
  expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString(),
};

function escapeXml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function calcAge(birthDate) {
  if (!birthDate) return '';
  try {
    const birth = new Date(birthDate);
    const years = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
    if (years >= 1) return `${years} año${years !== 1 ? 's' : ''}`;
    const months = Math.floor((Date.now() - birth.getTime()) / (30.44 * 24 * 3600 * 1000));
    return `${months} mes${months !== 1 ? 'es' : ''}`;
  } catch {
    return '';
  }
}

function speciesEmoji(species) {
  const map = {
    perro: '🐶', gato: '🐱', conejo: '🐰',
    hamster: '🐹', ave: '🐦', tortuga: '🐢', pez: '🐟',
  };
  return map[(species || '').toLowerCase()] || '🐾';
}

// Extraer función renderFrontSvg y renderBackSvg del archivo TS y ejecutarlas
const tsCode = readFileSync(EDGE_FN, 'utf-8');

// Tomar entre 'function renderFrontSvg' y la siguiente 'function ' (o }^)
function extractFn(name) {
  const start = tsCode.indexOf(`function ${name}`);
  if (start === -1) throw new Error(`fn ${name} not found`);
  // Encontrar el cierre balanceando llaves
  let i = tsCode.indexOf('{', start);
  let depth = 1;
  i++;
  while (depth > 0 && i < tsCode.length) {
    if (tsCode[i] === '{') depth++;
    else if (tsCode[i] === '}') depth--;
    i++;
  }
  return tsCode.slice(start, i);
}

const frontFnText = extractFn('renderFrontSvg');
const backFnText = extractFn('renderBackSvg');

// Eliminar TS types annotations para que sean válidos en JS
const stripTs = (s) => {
  let out = s;
  // Quitar return types tipo `: string)` `: number)` `: void)`
  out = out.replace(/\)\s*:\s*[A-Za-z_][\w<>\[\]| ,]*\s*\{/g, ') {');
  // Quitar param types: `(s: string, len: number)` -> `(s, len)`
  out = out.replace(/(\(|\,)\s*([a-zA-Z_$][\w$]*)\s*:\s*[A-Za-z_][\w<>\[\]| ,.'"]*(?=\s*[,)=])/g, '$1 $2');
  // Quitar `as Type`
  out = out.replace(/\s+as\s+[A-Za-z_][\w<>\[\]| ,.'"]*/g, '');
  // Quitar tipos en variable declarations: `const x: string =` -> `const x =`
  out = out.replace(/(const|let|var)\s+(\w+)\s*:\s*[A-Za-z_][\w<>\[\]| ,.'"]*(\s*=)/g, '$1 $2$3');
  return out;
};

const front = new Function('escapeXml', 'formatDate', 'calcAge', 'speciesEmoji', `${stripTs(frontFnText)}; return renderFrontSvg;`)(escapeXml, formatDate, calcAge, speciesEmoji);
const back = new Function('escapeXml', 'formatDate', `${stripTs(backFnText)}; return renderBackSvg;`)(escapeXml, formatDate);

const frontSvg = front(dummyData);
const backSvg = back(dummyData);

const tpl = readFileSync(HTML_TEMPLATE, 'utf-8');
const html = tpl
  .replace('<!-- FRENTE_PLACEHOLDER -->', frontSvg)
  .replace('<!-- REVERSO_PLACEHOLDER -->', backSvg);

writeFileSync(OUT, html);
console.log(`OK -> ${OUT}`);
console.log('Abrir en navegador para ver el preview.');
