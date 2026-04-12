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
