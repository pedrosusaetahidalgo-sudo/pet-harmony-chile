import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  differenceInYears,
  differenceInMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return 'Hoy';
  if (isTomorrow(d)) return 'Mañana';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "d 'de' MMMM", { locale: es });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  const dateStr = formatDate(d);
  const timeStr = format(d, 'HH:mm');
  return `${dateStr} a las ${timeStr}`;
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea un monto en CLP. Acepta null/undefined → retorna 'Consultar'.
 * Canonical version — importar desde aquí en vez de definir localmente.
 */
export function formatCLP(amount: number | null | undefined): string {
  if (amount == null) return 'Consultar';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea CLP en forma compacta: $1.2M, $45k, $500.
 * Usado en dashboards admin donde el espacio es limitado.
 */
export function formatCLPCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * Capitaliza la primera letra de cada palabra (excepto preposiciones comunes).
 * Útil para normalizar nombres de perfil.
 * "maria lopez" → "Maria Lopez"
 * "maria del carmen" → "Maria del Carmen"
 */
/**
 * Auto-capitaliza texto: mayúscula al inicio y después de cada punto.
 * Uso: onBlur en campos de texto libre (bio, notas, comportamiento).
 * NO usar en: email, contraseña, Colmevet, microchip, URLs.
 */
export function smartCapitalize(text: string): string {
  if (!text.trim()) return text;
  return text.replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());
}

export function toTitleCase(text: string): string {
  const lower = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'en', 'y', 'e', 'o', 'u']);
  return text
    .trim()
    .split(/\s+/)
    .map((word, i) => {
      if (i > 0 && lower.has(word.toLowerCase())) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// --- Default display name generator ---

const NAME_ADJECTIVES = [
  'Feliz',
  'Tierno',
  'Valiente',
  'Curioso',
  'Jugueton',
  'Dormilon',
  'Travieso',
  'Peludo',
  'Saltarin',
  'Mimoso',
  'Alegre',
  'Brillante',
  'Suave',
  'Rapido',
  'Noble',
  'Fiel',
  'Dulce',
  'Manso',
  'Audaz',
  'Sereno',
];

const NAME_ANIMALS = [
  'Gatito',
  'Perrito',
  'Conejito',
  'Hamster',
  'Pajarito',
  'Tortuga',
  'Panda',
  'Koala',
  'Delfin',
  'Zorro',
  'Lobo',
  'Oso',
  'Tigre',
  'Leon',
  'Halcon',
  'Colibri',
  'Nutria',
  'Foca',
  'Buho',
  'Ciervo',
];

/** Generates a unique-ish friendly display name like "GatitoFeliz_3847" */
export function generateDefaultName(): string {
  const adj = NAME_ADJECTIVES[Math.floor(Math.random() * NAME_ADJECTIVES.length)];
  const animal = NAME_ANIMALS[Math.floor(Math.random() * NAME_ANIMALS.length)];
  const num = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `${animal}${adj}_${num}`;
}

/** Checks if a display name looks like a generic/placeholder name */
export function isGenericDisplayName(name: string | null | undefined): boolean {
  if (!name || !name.trim()) return true;
  const trimmed = name.trim().toLowerCase();
  // Matches email-like names (anything with @ or pure email prefix patterns)
  if (/^[a-z0-9._+-]+$/.test(trimmed) && trimmed.length > 3) return true;
  // Matches "Usuario" or our generated pattern (already has a name, not generic)
  if (trimmed === 'usuario') return true;
  return false;
}

/**
 * Calcula la edad de una mascota a partir de su fecha de nacimiento.
 * Acepta null → retorna 'Edad desconocida'.
 * Canonical version — importar desde aquí en vez de definir localmente.
 */
export function calculateAge(birthDate: string | null): string {
  if (!birthDate) return 'Edad desconocida';

  const birth = new Date(birthDate + 'T00:00:00');
  if (isNaN(birth.getTime())) return 'Edad no disponible';

  const now = new Date();
  if (birth > now) return 'Edad no disponible';

  const years = differenceInYears(now, birth);

  // Defensive clamp: ninguna mascota doméstica supera ~30 años. Si la fecha
  // ingresada da un valor absurdo, lo más probable es un typo del usuario.
  if (years > 30) return 'Revisa la fecha de nacimiento';

  const months = differenceInMonths(now, birth) % 12;

  if (years === 0 && months === 0) return 'Menos de 1 mes';
  if (years === 0) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  if (months === 0) return `${years} ${years === 1 ? 'año' : 'años'}`;
  return `${years} ${years === 1 ? 'año' : 'años'}, ${months} ${months === 1 ? 'mes' : 'meses'}`;
}
