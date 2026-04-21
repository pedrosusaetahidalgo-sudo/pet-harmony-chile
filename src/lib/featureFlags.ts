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
   * DESACTIVADO 2026-04-17: la app entrega 100% de las features a todos,
   * independiente del plan. La DB ya esta limpia (migracion 20260526000000
   * reseteo premium falsos a free) y el flujo Flow.cl + apply_premium RPC
   * siguen activos para upgrades reales. Cuando se decida que bloquear,
   * poner este flag en true y los PremiumGate pasaran a respetar plan_id.
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

  /**
   * Panel Pro de Analytics — previews en Home + página /panel-pro.
   * Kill switch: si se desactiva, las cards de analytics y la ruta no se muestran.
   */
  PRO_ANALYTICS: true,

  /**
   * Adopcion como seccion activa.
   * HABILITADO — funcional como Paw Labs (beta).
   */
  LABS_ADOPTION: true,

  /**
   * Red de donantes de sangre.
   * HABILITADO — funcional como Paw Labs (beta).
   */
  LABS_BLOOD_DONORS: true,

  /**
   * Comunidad / grupos por raza.
   * HABILITADO — UI lista pero sin grupos en DB aun.
   */
  LABS_COMMUNITY: true,

  /**
   * Lugares pet-friendly en el mapa.
   * DESHABILITADO — datos hardcodeados (10 lugares fijos en Santiago).
   * Reactivar cuando exista tabla pet_friendly_places en DB con data real.
   */
  MAP_PET_FRIENDLY: false,

  /**
   * Feed social (publicar fotos, likes, follows).
   * DESHABILITADO — no alineado con foco medico actual.
   * Rutas siguen existiendo en App.tsx; solo se esconde de navegacion.
   */
  FEED: false,

  /**
   * Chat / mensajeria directa.
   * DESHABILITADO — feature incompleto, se esconde de navegacion.
   * Rutas siguen existiendo en App.tsx.
   */
  CHAT: false,

  /**
   * Donaciones recurrentes mensuales en /donaciones (playbook §9.2).
   * BLOQUEADO hasta migrar cuenta Flow a SpA (riesgo fiscal: suscripciones
   * recurrentes a cuenta personal agravan el problema). UI + edge fn listas,
   * solo activar este flag cuando Flow.cl tenga titular SpA.
   */
  DONATIONS_MONTHLY: false,

  /**
   * Donaciones dirigidas a un refugio / hogar de adopcion.
   * ACTIVADO 2026-04-20 (Lote F auditoría pre-launch): Pedro confirmó SpA
   * ya constituida (SGSE SpA) + cuenta bancaria esta semana. Hooks DB
   * listos (beneficiary_type, beneficiary_adoption_center_id) + UI en
   * perfil publico del refugio + selector en /donaciones.
   */
  SHELTER_DONATIONS: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag] === true;
}

/** Alias semantico para el perfil publico del refugio. */
export function isShelterDonationsEnabled(): boolean {
  return isFeatureEnabled('SHELTER_DONATIONS');
}
