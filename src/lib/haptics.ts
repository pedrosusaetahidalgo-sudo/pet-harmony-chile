/**
 * haptics — feedback táctil taxonómico para acciones clave.
 *
 * Auditoría top-tier 2026-04-20 (QW-5). El plugin @capacitor/haptics ya
 * estaba instalado pero sin usarse en toda la app. Esta abstracción:
 *   - oculta el import dinámico (no se añade al bundle web)
 *   - define una taxonomía semántica (no usar Light/Medium/Heavy del SDK
 *     directamente: los callers piden "confirm", "navigate", "error")
 *   - es no-op en web (evita `Haptics is not available` en consola)
 *   - nunca throwea: si falla, se traga el error silenciosamente
 *
 * Uso:
 *   import { haptics } from '@/lib/haptics';
 *   await haptics.confirm();
 *
 * Semántica:
 *   navigate → Light. Toggle de rol, cambio de tab, selección simple.
 *   confirm  → Medium. Confirmación de acción moderada (crear reminder,
 *              enviar invitación, completar rutina).
 *   success  → Medium + vibrate success pattern. Pago OK, booking
 *              confirmado, donación exitosa.
 *   warning  → Heavy. Acción potencialmente peligrosa (eliminar, cancelar
 *              suscripción, salir sin guardar).
 *   error    → Vibrate error pattern. Error mostrado al usuario.
 *   impact   → Heavy. Acciones decisivas puntuales (marcar como hecho,
 *              level up, achievement unlock).
 */
import { isNative } from './platform';

async function loadHaptics() {
  if (!isNative()) return null;
  try {
    const mod = await import('@capacitor/haptics');
    return mod;
  } catch {
    return null;
  }
}

async function impact(style: 'light' | 'medium' | 'heavy') {
  const mod = await loadHaptics();
  if (!mod) return;
  try {
    const { Haptics, ImpactStyle } = mod;
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[style] });
  } catch {
    // noop — dispositivo sin motor haptic, permisos denegados, etc.
  }
}

async function notify(type: 'success' | 'warning' | 'error') {
  const mod = await loadHaptics();
  if (!mod) return;
  try {
    const { Haptics, NotificationType } = mod;
    const typeMap = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    };
    await Haptics.notification({ type: typeMap[type] });
  } catch {
    // noop
  }
}

export const haptics = {
  /** Feedback liviano: toggle de tab, selección de chip, cambio de rol. */
  navigate: () => impact('light'),

  /** Feedback medio: confirmar acción (crear reminder, enviar invite). */
  confirm: () => impact('medium'),

  /** Feedback decisivo: marcar como hecho, achievement, level up. */
  impact: () => impact('heavy'),

  /** Pago / booking / donación completada. */
  success: () => notify('success'),

  /** Pre-confirm de acción destructiva (antes de AlertDialog). */
  warning: () => notify('warning'),

  /** Error mostrado al usuario. */
  error: () => notify('error'),
};
