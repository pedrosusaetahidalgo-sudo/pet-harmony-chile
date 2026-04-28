/**
 * Helpers centralizados de toasts para mantener microcopy consistente y
 * en español de Chile (tuteo) en toda la app.
 *
 * Sprint 1 P2 LOC-MICROCOPY (2026-04-28): el audit detecto 77 instancias de
 * `toast.error('Algo salió mal'…)` y 13 fallbacks `'Error desconocido'`. Esto
 * helper estandariza tono cálido + accionable sin perder severidad. Reemplazo
 * gradual: nuevos callsites usan toastError; los 77 viejos se migran cuando
 * se toque el archivo (no big-bang).
 */
import { toast } from 'sonner';

/**
 * Toast de error con tono cálido y acción clara.
 *
 * @param action Frase corta que dice QUE no se pudo. Empieza en mayuscula y
 *   describe la accion fallida en presente. Ejemplos: "No pudimos crear la
 *   reserva", "No pudimos enviar la invitacion", "Revisa el peso".
 * @param options.hint Detalle accionable opcional. Ejemplos: "Inténtalo de
 *   nuevo en unos segundos.", "Si sigue, escríbenos a hola@pawfriend.cl."
 * @param options.error Error original (opcional) para describir codigo.
 */
export function toastError(
  action: string,
  options?: {
    hint?: string;
    error?: unknown;
  }
): void {
  const description =
    options?.hint ??
    'Inténtalo de nuevo en unos segundos. Si sigue, escríbenos a hola@pawfriend.cl.';
  toast.error(action, { description });
}

/**
 * Atajo para errores de auth/permisos. Mensaje user-friendly que NO suena a
 * "se rompio" sino a "te falta un paso".
 */
export function toastAuthRequired(message = 'Inicia sesión para continuar'): void {
  toast.error(message, {
    description: 'Tu acción se completará al volver.',
  });
}

/**
 * Re-export de toast.success/info/warning para que los callsites consuman un
 * unico modulo y se pueda agregar telemetria centralizada en el futuro.
 */
export const toastSuccess = toast.success;
export const toastInfo = toast.info;
export const toastWarning = toast.warning;
