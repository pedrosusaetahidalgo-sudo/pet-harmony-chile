/**
 * Tipos canonicos de recordatorios clinicos y no-clinicos.
 *
 * Fuente unica de verdad para el frontend. La lista debe mantenerse en
 * sincronia con el CHECK constraint de `pet_reminders.type` en
 * supabase/migrations (ver mig 20260521000040 que unifico la
 * taxonomia y back-filleo valores legacy).
 *
 * Valores legacy ('antiparasitic', 'appointment') son mapeados al
 * valor canonico mediante `normalizeReminderType()` (idempotente).
 */

export const REMINDER_TYPES = [
  { value: 'vaccine', label: 'Vacuna', defaultRecurrence: 'yearly' },
  { value: 'checkup', label: 'Control veterinario', defaultRecurrence: 'biannual' },
  { value: 'deworming', label: 'Desparasitación interna', defaultRecurrence: 'quarterly' },
  { value: 'flea', label: 'Antipulgas / garrapatas', defaultRecurrence: 'monthly' },
  { value: 'medication', label: 'Medicamento', defaultRecurrence: null },
  { value: 'grooming', label: 'Baño / peluquería', defaultRecurrence: 'monthly' },
  { value: 'weight', label: 'Control de peso', defaultRecurrence: 'monthly' },
  { value: 'dental', label: 'Limpieza dental', defaultRecurrence: 'yearly' },
  { value: 'food', label: 'Comprar alimento', defaultRecurrence: 'monthly' },
  { value: 'insurance', label: 'Renovar seguro', defaultRecurrence: 'yearly' },
  { value: 'license', label: 'Renovar registro municipal', defaultRecurrence: 'yearly' },
  { value: 'custom', label: 'Otro (personalizado)', defaultRecurrence: null },
] as const;

export type ReminderType = (typeof REMINDER_TYPES)[number]['value'];

/**
 * Normaliza un `type` potencialmente legacy al valor canonico.
 * Idempotente: si ya esta normalizado, retorna tal cual.
 *
 * Legacy mappings:
 * - `'antiparasitic'` → `'deworming'` (version pre-split 2026-06-29)
 * - `'appointment'` → `'checkup'`
 * - cualquier valor no reconocido → `'custom'`
 */
export function normalizeReminderType(value: string | null | undefined): ReminderType {
  if (!value) return 'custom';
  const legacy: Record<string, ReminderType> = {
    antiparasitic: 'deworming',
    appointment: 'checkup',
  };
  const normalized = legacy[value] ?? value;
  const isValid = REMINDER_TYPES.some((t) => t.value === normalized);
  return (isValid ? normalized : 'custom') as ReminderType;
}

/**
 * Label humano para mostrar en UI. Respeta normalizacion de legacy.
 */
export function labelForReminderType(value: string | null | undefined): string {
  const normalized = normalizeReminderType(value);
  const entry = REMINDER_TYPES.find((t) => t.value === normalized);
  return entry?.label ?? 'Recordatorio';
}
