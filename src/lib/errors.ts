/**
 * Sprint 1 P2 (2026-04-28): helpers para extraer mensaje de un error
 * `unknown`. Reemplazan el patrón duplicado:
 *
 *   err instanceof Error ? err.message : 'Error desconocido'
 *
 * "Error desconocido" sirve solo como fallback de log; en UI es frío y no
 * accionable. Estos helpers separan los dos casos:
 *
 *   - `errorMessageForUser(err)`: devuelve copy chileno + accionable. Default
 *     "Inténtalo de nuevo en unos segundos." Usar en `toast.error` cuando el
 *     mensaje del error se MUESTRA al usuario final.
 *
 *   - `errorMessageForLog(err)`: mantiene "Error desconocido" para Sentry /
 *     logs / audit. Útil cuando el mensaje se persiste, no se renderiza.
 */

const USER_FALLBACK = 'Inténtalo de nuevo en unos segundos.';
const LOG_FALLBACK = 'Error desconocido';

export function errorMessageForUser(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err.length > 0) return err;
  return USER_FALLBACK;
}

export function errorMessageForLog(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err.length > 0) return err;
  return LOG_FALLBACK;
}
