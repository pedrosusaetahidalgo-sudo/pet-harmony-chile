import { logger } from './logger';

type SupabaseLikeError =
  | {
      code?: string | null;
      message?: string | null;
      details?: string | null;
      hint?: string | null;
    }
  | null
  | undefined;

const POSTGRES_MESSAGES: Record<string, string> = {
  '23505': 'Ya existe un registro con esos datos.',
  '23503': 'No se puede guardar: falta un dato relacionado o referencia inválida.',
  '23502': 'Falta completar un campo obligatorio.',
  '23514': 'Alguno de los datos ingresados no cumple las reglas de validación.',
  '42501': 'No tienes permisos para realizar esta acción.',
  '42P01': 'La tabla solicitada no existe. Avisa al equipo técnico.',
  '42703':
    'Una columna usada por la app no existe en la base. Reporta este error a soporte@pawfriend.cl para que lo solucionemos rápido.',
  PGRST116: 'No se encontró el registro buscado.',
  PGRST301: 'Tu sesión expiró. Inicia sesión de nuevo.',
};

// Mensajes específicos por nombre de constraint, cuando el CHECK genérico
// no le dice nada al usuario. Postgres expone el nombre en err.message
// como `... violates check constraint "pets_species_check"`.
const CONSTRAINT_MESSAGES: Record<string, string> = {
  pets_species_check:
    'La especie seleccionada no está permitida. Avisa al equipo si crees que es un error.',
  pets_birth_date_reasonable:
    'La fecha de nacimiento no es válida (debe estar dentro de los últimos 30 años y no en el futuro).',
  pets_size_check:
    'El tamaño seleccionado no está permitido. Elige uno del listado (miniatura, pequeño, mediano, grande, gigante).',
  pets_gender_check: 'El género debe ser macho, hembra o desconocido.',
  chk_pet_has_responsible:
    'La mascota debe tener un dueño o un veterinario creador. No se puede crear sin responsable.',
  pet_reminders_type_check:
    'El tipo de recordatorio automático no es válido. Avisa al equipo (posible migración SQL pendiente).',
};

/**
 * Convierte un error de Supabase / PostgREST en un mensaje en español
 * apto para mostrar al usuario en un toast. Loguea el error completo
 * en consola dev para diagnóstico.
 */
export function describeSupabaseError(
  err: SupabaseLikeError,
  fallback = 'Ocurrió un error inesperado. Inténtalo de nuevo en unos segundos.'
): string {
  if (!err) return fallback;
  logger.error('[supabase]', {
    code: err.code,
    message: err.message,
    details: err.details,
    hint: err.hint,
  });
  // Mensaje específico por nombre de constraint si lo identificamos.
  // Si reconocemos el nombre pero no lo tenemos mapeado, lo mostramos
  // igual (mejor saber cuál constraint rompió que un mensaje genérico).
  const constraintMatch = err.message?.match(/constraint "([^"]+)"/);
  if (constraintMatch) {
    const name = constraintMatch[1];
    if (CONSTRAINT_MESSAGES[name]) return CONSTRAINT_MESSAGES[name];
    return `Una regla de la base de datos rechazó el registro (${name}). Revisa el campo asociado o avisa al equipo técnico.`;
  }
  if (err.message?.includes('JWT')) return 'Tu sesión expiró. Inicia sesión de nuevo.';
  if (err.message?.includes('violates row-level security'))
    return 'No tienes permisos para realizar esta acción.';
  if (err.code && POSTGRES_MESSAGES[err.code]) return POSTGRES_MESSAGES[err.code];
  // Último recurso: mostrar el mensaje real del servidor antes que el fallback genérico.
  const parts = [err.message, err.details, err.hint].filter(Boolean);
  if (parts.length > 0) return parts.join(' — ');
  return fallback;
}
