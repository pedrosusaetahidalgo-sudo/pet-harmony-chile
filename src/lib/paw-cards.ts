/**
 * Paw Cards Collectible — constantes, tipos y utilidades.
 *
 * Sistema de tarjetas coleccionables estilo TCG para mascotas.
 */

/* ── Tipos ── */

export type HoloPattern =
  | 'holo-none'
  | 'holo-paws'
  | 'holo-stars'
  | 'holo-hearts'
  | 'holo-diamonds'
  | 'holo-waves'
  | 'holo-fire'
  | 'holo-galaxy'
  | 'holo-rainbow';

export interface HoloPatternConfig {
  id: HoloPattern;
  name: string;
  cssClass: string;
  probability: number; // 0-1
  tier: 'standard' | 'rare' | 'ultra-rare';
}

/* ── Patrones holograficos con probabilidades ── */

export const HOLO_PATTERNS: HoloPatternConfig[] = [
  {
    id: 'holo-none',
    name: 'Clasica',
    cssClass: 'paw-holo-none',
    probability: 0.35,
    tier: 'standard',
  },
  {
    id: 'holo-paws',
    name: 'Huellas Holo',
    cssClass: 'paw-holo-paws',
    probability: 0.2,
    tier: 'standard',
  },
  {
    id: 'holo-stars',
    name: 'Starlight',
    cssClass: 'paw-holo-stars',
    probability: 0.15,
    tier: 'standard',
  },
  {
    id: 'holo-hearts',
    name: 'Heart Burst',
    cssClass: 'paw-holo-hearts',
    probability: 0.1,
    tier: 'rare',
  },
  {
    id: 'holo-diamonds',
    name: 'Diamond Dust',
    cssClass: 'paw-holo-diamonds',
    probability: 0.08,
    tier: 'rare',
  },
  {
    id: 'holo-waves',
    name: 'Ocean Wave',
    cssClass: 'paw-holo-waves',
    probability: 0.05,
    tier: 'rare',
  },
  {
    id: 'holo-fire',
    name: 'Phoenix Flame',
    cssClass: 'paw-holo-fire',
    probability: 0.04,
    tier: 'ultra-rare',
  },
  {
    id: 'holo-galaxy',
    name: 'Galaxy Swirl',
    cssClass: 'paw-holo-galaxy',
    probability: 0.02,
    tier: 'ultra-rare',
  },
  {
    id: 'holo-rainbow',
    name: 'Full Rainbow',
    cssClass: 'paw-holo-rainbow',
    probability: 0.01,
    tier: 'ultra-rare',
  },
];

/** Mapa rapido por ID */
export const HOLO_PATTERN_MAP: Record<HoloPattern, HoloPatternConfig> = Object.fromEntries(
  HOLO_PATTERNS.map((p) => [p.id, p])
) as Record<HoloPattern, HoloPatternConfig>;

/* ── Seleccion aleatoria ponderada ── */

export function rollHoloPattern(): HoloPattern {
  const roll = Math.random();
  let cumulative = 0;
  for (const pattern of HOLO_PATTERNS) {
    cumulative += pattern.probability;
    if (roll < cumulative) return pattern.id;
  }
  return 'holo-none';
}

/* ── Generador de Paw Card ID ── */

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin I/O/0/1 para evitar confusion

export function generatePawCardId(): string {
  const block = (len: number) =>
    Array.from({ length: len }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join('');
  return `PAW-${block(4)}-${block(4)}`;
}

/* ── Colores de borde por rareza (nuevo sistema) ── */

export const RARITY_BORDER_STYLES: Record<
  string,
  {
    gradient: string;
    speed: string;
    shadow: string;
    shadowHover: string;
    padding: string;
  }
> = {
  common: {
    gradient: 'linear-gradient(135deg, #CD7F32, #E8C07A, #B87333, #E8C07A, #CD7F32)',
    speed: '10s',
    shadow: '0 2px 10px -2px rgba(205,127,50,0.3)',
    shadowHover: '0 8px 30px -4px rgba(205,127,50,0.45)',
    padding: '5px',
  },
  uncommon: {
    gradient: 'linear-gradient(135deg, #C0C0C0, #E8E8E8, #A8A8A8, #D4D4D4, #C0C0C0)',
    speed: '7s',
    shadow: '0 2px 12px -2px rgba(192,192,192,0.35)',
    shadowHover: '0 8px 32px -4px rgba(192,192,192,0.5)',
    padding: '5px',
  },
  rare: {
    gradient: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700, #FFEC8B, #FFD700)',
    speed: '5s',
    shadow: '0 2px 16px -2px rgba(255,215,0,0.35)',
    shadowHover: '0 10px 36px -4px rgba(255,215,0,0.5)',
    padding: '5px',
  },
  epic: {
    gradient: 'linear-gradient(135deg, #00CED1, #7B68EE, #DA70D6, #00CED1, #7B68EE)',
    speed: '4s',
    shadow: '0 4px 20px -2px rgba(123,104,238,0.35), 0 0 30px -8px rgba(0,206,209,0.2)',
    shadowHover: '0 10px 40px -4px rgba(123,104,238,0.5), 0 0 40px -4px rgba(0,206,209,0.3)',
    padding: '5px',
  },
  legendary: {
    gradient: 'linear-gradient(135deg, #FF4500, #FF6347, #FFD700, #FF4500, #FF8C00, #FFD700)',
    speed: '3s',
    shadow: '0 4px 24px -2px rgba(255,69,0,0.4), 0 0 40px -8px rgba(255,165,0,0.25)',
    shadowHover: '0 12px 50px -4px rgba(255,69,0,0.55), 0 0 50px -4px rgba(255,165,0,0.35)',
    padding: '6px',
  },
  mythic: {
    gradient:
      'linear-gradient(135deg, #FF0080, #FF4500, #FFD700, #00FF88, #00BFFF, #8B5CF6, #FF0080)',
    speed: '2s',
    shadow: '0 4px 30px -2px rgba(139,92,246,0.4), 0 0 50px -8px rgba(0,191,255,0.3)',
    shadowHover: '0 12px 60px -4px rgba(139,92,246,0.55), 0 0 70px -8px rgba(0,191,255,0.4)',
    padding: '6px',
  },
};

/* ── Tier labels y colores para UI de holo pattern ── */

export const HOLO_TIER_LABELS: Record<string, { label: string; color: string }> = {
  standard: { label: 'Estandar', color: 'text-gray-500' },
  rare: { label: 'Raro', color: 'text-blue-500' },
  'ultra-rare': { label: 'Ultra Raro', color: 'text-purple-500' },
};

/* ── Watermark SVG inline (logo Paw Friend simplificado para patron de fondo) ── */
export const PAW_WATERMARK_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 680 680' width='60' height='60' opacity='0.04'%3E%3Cellipse cx='340' cy='430' rx='155' ry='135' fill='%239333EA'/%3E%3Cellipse cx='200' cy='270' rx='55' ry='68' transform='rotate(-22 200 270)' fill='%239333EA'/%3E%3Cellipse cx='288' cy='180' rx='50' ry='62' transform='rotate(-10 288 180)' fill='%239333EA'/%3E%3Cellipse cx='392' cy='180' rx='50' ry='62' transform='rotate(10 392 180)' fill='%239333EA'/%3E%3Cellipse cx='480' cy='270' rx='55' ry='68' transform='rotate(22 480 270)' fill='%239333EA'/%3E%3C/svg%3E")`;

/* ══════════════════════════════════════════════════
   SPECIES PALETTES — identidad visual por especie
   ══════════════════════════════════════════════════ */

export interface SpeciesPalette {
  /** CSS gradient for inner card light mode */
  lightBg: string;
  /** CSS gradient for inner card dark mode */
  darkBg: string;
  /** Accent color for badges, dividers */
  accent: string;
  /** Species emoji icon */
  icon: string;
}

export const SPECIES_PALETTES: Record<string, SpeciesPalette> = {
  perro: {
    lightBg:
      'radial-gradient(ellipse at 15% 0%, hsl(38 70% 88% / 0.7) 0%, transparent 50%), ' +
      'radial-gradient(ellipse at 85% 10%, hsl(30 60% 90% / 0.5) 0%, transparent 40%), ' +
      'radial-gradient(ellipse at 50% 100%, hsl(35 55% 87% / 0.5) 0%, transparent 45%), ' +
      'linear-gradient(180deg, hsl(40 50% 94%) 0%, hsl(35 40% 96%) 40%, hsl(38 45% 93%) 100%)',
    darkBg:
      'radial-gradient(ellipse at 15% 0%, hsl(38 40% 16% / 0.8) 0%, transparent 50%), ' +
      'radial-gradient(ellipse at 85% 10%, hsl(30 30% 14% / 0.6) 0%, transparent 40%), ' +
      'linear-gradient(180deg, hsl(35 20% 12%) 0%, hsl(30 15% 10%) 50%, hsl(38 18% 9%) 100%)',
    accent: '#D4A017',
    icon: '🐕',
  },
  gato: {
    lightBg:
      'radial-gradient(ellipse at 15% 0%, hsl(270 50% 88% / 0.7) 0%, transparent 50%), ' +
      'radial-gradient(ellipse at 85% 10%, hsl(260 45% 90% / 0.5) 0%, transparent 40%), ' +
      'radial-gradient(ellipse at 50% 100%, hsl(280 40% 88% / 0.5) 0%, transparent 45%), ' +
      'linear-gradient(180deg, hsl(268 40% 93%) 0%, hsl(275 30% 95%) 40%, hsl(265 35% 92%) 100%)',
    darkBg:
      'radial-gradient(ellipse at 15% 0%, hsl(270 35% 16% / 0.8) 0%, transparent 50%), ' +
      'radial-gradient(ellipse at 85% 10%, hsl(260 30% 14% / 0.6) 0%, transparent 40%), ' +
      'linear-gradient(180deg, hsl(268 20% 12%) 0%, hsl(270 15% 10%) 50%, hsl(265 18% 9%) 100%)',
    accent: '#7C3AED',
    icon: '🐈',
  },
  conejo: {
    lightBg:
      'radial-gradient(ellipse at 15% 0%, hsl(140 45% 88% / 0.7) 0%, transparent 50%), ' +
      'radial-gradient(ellipse at 85% 10%, hsl(130 40% 90% / 0.5) 0%, transparent 40%), ' +
      'radial-gradient(ellipse at 50% 100%, hsl(145 35% 87% / 0.5) 0%, transparent 45%), ' +
      'linear-gradient(180deg, hsl(138 35% 94%) 0%, hsl(140 25% 96%) 40%, hsl(135 30% 93%) 100%)',
    darkBg:
      'radial-gradient(ellipse at 15% 0%, hsl(140 30% 15% / 0.8) 0%, transparent 50%), ' +
      'linear-gradient(180deg, hsl(138 18% 11%) 0%, hsl(140 14% 9%) 100%)',
    accent: '#43A047',
    icon: '🐇',
  },
  ave: {
    lightBg:
      'radial-gradient(ellipse at 15% 0%, hsl(190 55% 88% / 0.7) 0%, transparent 50%), ' +
      'radial-gradient(ellipse at 85% 10%, hsl(195 50% 90% / 0.5) 0%, transparent 40%), ' +
      'radial-gradient(ellipse at 50% 100%, hsl(185 45% 87% / 0.5) 0%, transparent 45%), ' +
      'linear-gradient(180deg, hsl(192 40% 93%) 0%, hsl(195 30% 95%) 40%, hsl(188 35% 92%) 100%)',
    darkBg:
      'radial-gradient(ellipse at 15% 0%, hsl(190 35% 15% / 0.8) 0%, transparent 50%), ' +
      'linear-gradient(180deg, hsl(192 18% 11%) 0%, hsl(190 14% 9%) 100%)',
    accent: '#0097A7',
    icon: '🦜',
  },
  reptil: {
    lightBg:
      'radial-gradient(ellipse at 15% 0%, hsl(28 60% 88% / 0.7) 0%, transparent 50%), ' +
      'radial-gradient(ellipse at 85% 10%, hsl(22 55% 90% / 0.5) 0%, transparent 40%), ' +
      'radial-gradient(ellipse at 50% 100%, hsl(30 50% 87% / 0.5) 0%, transparent 45%), ' +
      'linear-gradient(180deg, hsl(25 45% 94%) 0%, hsl(28 35% 96%) 40%, hsl(22 40% 93%) 100%)',
    darkBg:
      'radial-gradient(ellipse at 15% 0%, hsl(28 35% 16% / 0.8) 0%, transparent 50%), ' +
      'linear-gradient(180deg, hsl(25 18% 12%) 0%, hsl(28 14% 9%) 100%)',
    accent: '#E65100',
    icon: '🦎',
  },
};

const DEFAULT_SPECIES_PALETTE: SpeciesPalette = {
  lightBg:
    'radial-gradient(ellipse at 15% 0%, hsl(271 60% 85% / 0.6) 0%, transparent 50%), ' +
    'radial-gradient(ellipse at 85% 10%, hsl(250 55% 88% / 0.5) 0%, transparent 40%), ' +
    'radial-gradient(ellipse at 50% 100%, hsl(290 50% 87% / 0.5) 0%, transparent 45%), ' +
    'linear-gradient(180deg, hsl(270 40% 93%) 0%, hsl(280 25% 95%) 40%, hsl(260 30% 94%) 100%)',
  darkBg:
    'radial-gradient(ellipse at 15% 0%, hsl(271 40% 18% / 0.8) 0%, transparent 50%), ' +
    'radial-gradient(ellipse at 85% 10%, hsl(250 35% 16% / 0.6) 0%, transparent 40%), ' +
    'linear-gradient(180deg, hsl(270 20% 12%) 0%, hsl(270 15% 10%) 50%, hsl(280 18% 11%) 100%)',
  accent: '#8E24AA',
  icon: '🐾',
};

/** Resolve species string to palette. Case-insensitive partial match. */
export function getSpeciesPalette(species: string): SpeciesPalette {
  const sp = species.toLowerCase();
  if (sp.includes('perro') || sp.includes('dog')) return SPECIES_PALETTES.perro;
  if (sp.includes('gato') || sp.includes('cat')) return SPECIES_PALETTES.gato;
  if (sp.includes('conejo') || sp.includes('rabbit')) return SPECIES_PALETTES.conejo;
  if (sp.includes('ave') || sp.includes('pajaro') || sp.includes('bird'))
    return SPECIES_PALETTES.ave;
  if (
    sp.includes('reptil') ||
    sp.includes('lagarto') ||
    sp.includes('tortuga') ||
    sp.includes('serpiente')
  )
    return SPECIES_PALETTES.reptil;
  return DEFAULT_SPECIES_PALETTE;
}

/* ══════════════════════════════════════════════════
   BREED TINT — refinamiento de color por raza
   ══════════════════════════════════════════════════ */

/** CSS overlay tint (light mode). Applied as extra radial-gradient layer at ~5-8% opacity. */
export const BREED_TINT: Record<string, string> = {
  // Perros
  'golden retriever':
    'radial-gradient(ellipse at 50% 50%, hsl(45 80% 65% / 0.08) 0%, transparent 70%)',
  labrador: 'radial-gradient(ellipse at 50% 50%, hsl(45 70% 60% / 0.07) 0%, transparent 70%)',
  husky: 'radial-gradient(ellipse at 50% 50%, hsl(210 60% 70% / 0.08) 0%, transparent 70%)',
  'pastor suizo':
    'radial-gradient(ellipse at 50% 50%, hsl(210 50% 75% / 0.07) 0%, transparent 70%)',
  'pastor aleman':
    'radial-gradient(ellipse at 50% 50%, hsl(30 55% 45% / 0.07) 0%, transparent 70%)',
  'bulldog frances':
    'radial-gradient(ellipse at 50% 50%, hsl(340 55% 70% / 0.07) 0%, transparent 70%)',
  bulldog: 'radial-gradient(ellipse at 50% 50%, hsl(340 50% 65% / 0.06) 0%, transparent 70%)',
  poodle: 'radial-gradient(ellipse at 50% 50%, hsl(290 50% 70% / 0.06) 0%, transparent 70%)',
  caniche: 'radial-gradient(ellipse at 50% 50%, hsl(290 50% 70% / 0.06) 0%, transparent 70%)',
  rottweiler: 'radial-gradient(ellipse at 50% 50%, hsl(15 60% 40% / 0.06) 0%, transparent 70%)',
  doberman: 'radial-gradient(ellipse at 50% 50%, hsl(15 55% 35% / 0.06) 0%, transparent 70%)',
  dalmata: 'radial-gradient(ellipse at 50% 50%, hsl(0 0% 85% / 0.08) 0%, transparent 70%)',
  chihuahua: 'radial-gradient(ellipse at 50% 50%, hsl(340 60% 75% / 0.07) 0%, transparent 70%)',
  pomeranian: 'radial-gradient(ellipse at 50% 50%, hsl(25 70% 65% / 0.07) 0%, transparent 70%)',
  corgi: 'radial-gradient(ellipse at 50% 50%, hsl(35 65% 60% / 0.07) 0%, transparent 70%)',
  // Gatos
  bengal: 'radial-gradient(ellipse at 50% 50%, hsl(30 70% 55% / 0.08) 0%, transparent 70%)',
  siames: 'radial-gradient(ellipse at 50% 50%, hsl(200 50% 70% / 0.07) 0%, transparent 70%)',
  persa: 'radial-gradient(ellipse at 50% 50%, hsl(340 45% 75% / 0.07) 0%, transparent 70%)',
  'maine coon': 'radial-gradient(ellipse at 50% 50%, hsl(0 0% 75% / 0.07) 0%, transparent 70%)',
  ragdoll: 'radial-gradient(ellipse at 50% 50%, hsl(220 40% 75% / 0.06) 0%, transparent 70%)',
  angora: 'radial-gradient(ellipse at 50% 50%, hsl(0 0% 80% / 0.07) 0%, transparent 70%)',
  sphynx: 'radial-gradient(ellipse at 50% 50%, hsl(30 40% 70% / 0.06) 0%, transparent 70%)',
};

/** Get breed-specific tint overlay, or null if no match */
export function getBreedTint(breed: string | null): string | null {
  if (!breed) return null;
  const b = breed.toLowerCase();
  for (const [key, tint] of Object.entries(BREED_TINT)) {
    if (b.includes(key)) return tint;
  }
  return null;
}

/* ══════════════════════════════════════════════════
   BREED → HOLO PATTERN — patron tematico por raza
   ══════════════════════════════════════════════════ */

const BREED_HOLO_MAP: [string[], HoloPattern][] = [
  // Perros nordicos → galaxy (cielo artico)
  [['husky', 'malamute', 'samoyedo', 'pastor suizo', 'akita'], 'holo-galaxy'],
  // Perros acuaticos → waves
  [['labrador', 'golden', 'cocker', 'terranova', 'setter', 'springer'], 'holo-waves'],
  // Razas toy → hearts
  [
    [
      'chihuahua',
      'pomeranian',
      'pomerania',
      'yorkie',
      'yorkshire',
      'maltese',
      'maltes',
      'bichon',
      'shih tzu',
      'papillon',
    ],
    'holo-hearts',
  ],
  // Guardianes → fire
  [
    [
      'pastor aleman',
      'rottweiler',
      'doberman',
      'boxer',
      'pit bull',
      'pitbull',
      'bullmastiff',
      'mastiff',
      'dogo',
      'cane corso',
      'presa canario',
    ],
    'holo-fire',
  ],
  // Elegantes → diamonds
  [
    [
      'caniche',
      'poodle',
      'galgo',
      'dalmata',
      'weimaraner',
      'whippet',
      'greyhound',
      'saluki',
      'afghan',
    ],
    'holo-diamonds',
  ],
  // Corgi / bulldog → paws (iconicos)
  [['corgi', 'bulldog', 'pug', 'beagle', 'basset', 'dachshund', 'teckel'], 'holo-paws'],
  // Gatos salvajes → fire
  [['bengal', 'savannah', 'abisinio'], 'holo-fire'],
  // Gatos lujo → diamonds
  [['persa', 'ragdoll', 'british', 'scottish'], 'holo-diamonds'],
  // Gatos exoticos → galaxy
  [['siames', 'oriental', 'sphynx', 'devon rex', 'cornish'], 'holo-galaxy'],
  // Gatos majestuosos → stars
  [['maine coon', 'angora', 'noruego', 'siberiano'], 'holo-stars'],
];

/** Determine holo pattern based on species and breed. Falls back to species-level default. */
export function getBreedHoloPattern(species: string, breed: string | null): HoloPattern {
  if (breed) {
    const b = breed.toLowerCase();
    for (const [keywords, pattern] of BREED_HOLO_MAP) {
      if (keywords.some((kw) => b.includes(kw))) return pattern;
    }
  }
  // Species-level defaults
  const sp = species.toLowerCase();
  if (sp.includes('gato') || sp.includes('cat')) return 'holo-stars';
  if (sp.includes('conejo') || sp.includes('rabbit')) return 'holo-paws';
  if (sp.includes('ave') || sp.includes('bird') || sp.includes('pajaro')) return 'holo-rainbow';
  if (sp.includes('reptil') || sp.includes('tortuga') || sp.includes('serpiente'))
    return 'holo-waves';
  // Default for perros y otros
  return 'holo-paws';
}

/* ══════════════════════════════════════════════════
   NAME GRADIENT — estilo del nombre por rareza
   ══════════════════════════════════════════════════ */

export const RARITY_NAME_STYLES: Record<string, { light: string; dark: string }> = {
  common: {
    light: 'linear-gradient(135deg, hsl(271 50% 25%), hsl(290 40% 30%))',
    dark: 'linear-gradient(135deg, hsl(271 60% 80%), hsl(290 50% 85%))',
  },
  uncommon: {
    light: 'linear-gradient(135deg, hsl(0 0% 20%), hsl(0 0% 35%))',
    dark: 'linear-gradient(135deg, hsl(0 0% 85%), hsl(0 0% 75%))',
  },
  rare: {
    light: 'linear-gradient(135deg, #b8860b, #daa520, #cd853f)',
    dark: 'linear-gradient(135deg, #ffd700, #ffb347, #ffd700)',
  },
  epic: {
    light: 'linear-gradient(135deg, #00838f, #5e35b1, #ad1457)',
    dark: 'linear-gradient(135deg, #4dd0e1, #b39ddb, #f48fb1)',
  },
  legendary: {
    light: 'linear-gradient(135deg, #ff4500, #ffd700, #ff6347)',
    dark: 'linear-gradient(135deg, #ff6347, #ffd700, #ff8c00)',
  },
  mythic: {
    light: 'linear-gradient(135deg, #ff0080, #ff4500, #ffd700, #00ff88, #00bfff, #8b5cf6)',
    dark: 'linear-gradient(135deg, #ff0080, #ff4500, #ffd700, #00ff88, #00bfff, #8b5cf6)',
  },
};
