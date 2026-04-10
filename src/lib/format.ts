import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';
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

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * Capitaliza la primera letra de cada palabra (excepto preposiciones comunes).
 * Útil para normalizar nombres de perfil.
 * "pedro susaeta" → "Pedro Susaeta"
 * "maria del carmen" → "Maria del Carmen"
 */
/**
 * Auto-capitaliza texto: mayúscula al inicio y después de cada punto.
 * Uso: onBlur en campos de texto libre (bio, notas, comportamiento).
 * NO usar en: email, contraseña, Colmevet, microchip, URLs.
 */
export function smartCapitalize(text: string): string {
  if (!text.trim()) return text;
  return text
    .replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());
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
