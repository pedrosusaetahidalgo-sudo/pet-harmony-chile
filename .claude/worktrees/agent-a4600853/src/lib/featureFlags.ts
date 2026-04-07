/**
 * Feature flags — Pivot médico 2026-04
 *
 * Reglas:
 * - NO eliminar código tras un flag. Esconder, no borrar.
 * - Reactivar un feature = poner el flag en true. No requiere reescribir nada.
 * - Cuando un flag esté en true por más de 6 meses, considerar quitarlo.
 */

export const FEATURE_FLAGS = {
  /**
   * B2C Premium para dueños de mascotas.
   * DESHABILITADO en el pivot médico — la app es 100% gratis para usuarios.
   * Reactivar cuando haya >5000 usuarios activos mensuales.
   */
  USER_PREMIUM: false,

  /**
   * PawGame visible en sidebar principal y Home.
   * REACTIVADO 2026-04 a pedido del usuario.
   * Sigue siendo secundario al pivot médico, pero accesible desde sidebar.
   */
  PAWGAME_SIDEBAR: true,

  /**
   * Marketplace de productos (carrito, checkout, órdenes).
   * DESHABILITADO — fuera del scope médico.
   * Tablas y backend siguen existiendo.
   */
  MARKETPLACE: false,

  /**
   * Paseos compartidos / grupales.
   * DESHABILITADO — feature no alineado con foco médico.
   */
  SHARED_WALKS: false,

  /**
   * Mascotas perdidas como sección propia del sidebar.
   * DESHABILITADO — se integra como filtro en mapa/feed.
   */
  LOST_PETS_SECTION: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag] === true;
}
