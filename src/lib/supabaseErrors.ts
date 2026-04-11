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
  // Mensaje específico por nombre de constraint si lo identificamos
  const constraintMatch = err.message?.match(/constraint "([^"]+)"/);
  if (constraintMatch && CONSTRAINT_MESSAGES[constraintMatch[1]]) {
    return CONSTRAINT_MESSAGES[constraintMatch[1]];
  }
  if (err.code && POSTGRES_MESSAGES[err.code]) return POSTGRES_MESSAGES[err.code];
  if (err.message?.includes('JWT')) return 'Tu sesión expiró. Inicia sesión de nuevo.';
  if (err.message?.includes('violates row-level security'))
    return 'No tienes permisos para realizar esta acción.';
  return fallback;
}
