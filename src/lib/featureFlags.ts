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
   * siguen activos para upgrades reales. Si en el futuro se decide volver
   * a capear features B2C, activar este flag y reintroducir los gates en
   * los callsites relevantes (hoy PremiumGate fue removido).
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

  // ── Booking V3 Master Plan (docs-raiz/planes/BOOKING_SYSTEM_MASTER_PLAN.md) ──

  /**
   * Booking Wizard V3 — reemplaza BookingFlow actual con wizard de 3 pasos
   * (service+slot → details → confirm) con auto-select, precio visible,
   * PolicyBanner y BookingSuccessScreen.
   * DESACTIVADO por default. Activar por rollout gradual 10% → 50% → 100%.
   */
  BOOKING_V3_WIZARD: false,

  /**
   * Calendario operativo del provider — ruta /provider/agenda con vista
   * dia/semana/mes y drag-to-reschedule. Reemplaza la agenda 24h actual
   * de TodayAgendaCard como unica fuente visual.
   * DESACTIVADO hasta que el componente ProviderAgendaCalendar este listo.
   */
  PROVIDER_AGENDA_CALENDAR: false,

  /**
   * Push FCM para provider cuando llega booking nuevo (booking.created).
   * Infraestructura (send-push-notification edge fn + fcm_tokens) ya existe;
   * solo falta encender el trigger. Activar 1 a 1 con smoke test real para
   * evitar incidente tipo verify_jwt (ver feedback_no_global_jwt_flip).
   */
  PROVIDER_PUSH: false,

  /**
   * Export de calendario en formato .ics (Apple Calendar / Outlook).
   * Util para tutores que no quieren conectar Google Calendar.
   * DESACTIVADO hasta implementar el util + boton.
   */
  ICS_EXPORT: false,

  // ══════════════════════════════════════════════════════════════════════
  // REFACTOR MAESTRO 2026-04-23 — docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md
  // Estos flags colapsan el frankenstein y pivotan la app alrededor de la
  // trinidad: Pet ID Card + Huella Nasal + Ficha Medica con Timeline.
  //
  // Estado inicial: casi todos en FALSE hasta que cada componente este
  // implementado y verificado. Rollout gradual por flag.
  // ══════════════════════════════════════════════════════════════════════

  // ── Fase 0 (0-30d): Unificar eje ──

  /**
   * Home rediseñado como "Mi mascota hoy" en foco (refactor maestro §5.2.2).
   * Antes del flag: dashboard con multiples widgets genericos.
   * Despues: 1 mascota en foco, siguiente accion pendiente, timeline corto.
   */
  HOME_PET_FOCUS: true,

  /**
   * BottomTab colapsado a 4 ejes: Mascota / Calendario / Vets / Yo
   * (refactor maestro §5.2.1). Gamificacion pasa a seccion secundaria en "Yo".
   */
  BOTTOM_TAB_V2: true,

  /**
   * Sidebar colapsado a 3 grupos default (Mascotas, Red, Yo) + resto oculto
   * bajo "Mas" (refactor maestro §5.2.4). Reduce overwhelm visual.
   */
  SIDEBAR_COLLAPSED: true,

  /**
   * Onboarding minimal de 3 pasos tras signup (refactor maestro §5.3):
   * foto+nombre+especie / nose print opcional / chip opcional con mensaje.
   * No pide 20 campos al primer ingreso.
   */
  ONBOARDING_V2_MINIMAL: true,

  /**
   * Paw Game visible como feature prominente (home/bottomtab).
   * POR DEFAULT: false → queda accesible solo desde sidebar colapsado.
   */
  PAWGAME_PROMINENT: false,

  /**
   * Tab "Historia" como default en ficha clinica (refactor maestro §5.2.3).
   * Timeline cronologico visual con filtros por 10 categorias canonicas.
   * Requiere migracion pet_timeline_events aplicada.
   */
  FICHA_HISTORIA_TAB: true,

  /**
   * Pet ID Card — cedula digital de la mascota con QR al dashboard publico
   * (refactor maestro §2.4.1). Trinidad pilar 1.
   * Requiere migracion pet_id_cards aplicada.
   */
  PET_ID_CARD_V1: true,

  /**
   * Refactor flujo adopcion 2026-04-24 (REFACTOR_ADOPCION_2026_04_24.md).
   * Cuando true:
   *   - /adoption con tabs Mascotas/Refugios + filtros (comuna/especie/tamano/edad/urgente)
   *   - Feed mezcla adoption_posts + pets de refugio en cards uniformes
   *   - /refugios-hogares redirige a /adoption?tab=refugios
   *   - /refugios/:slug muestra boton "Me interesa" por mascota
   * Requiere migracion 20260730000000_unify_adoption_feed.sql aplicada.
   * Aplicada y activada 2026-04-24 (PM).
   */
  ADOPTION_UNIFIED_FEED: true,

  /**
   * Memorial viral (Refactor Maestro §6.7 Fase 1).
   * Cuando true:
   *   - Pagina publica /memoria/:petId con OG meta tags (preview bonito en WhatsApp)
   *   - Boton "Compartir memoria" en MemorialCard (lista /en-memoria)
   * Visible solo si la mascota tiene passed_away_at + memorial_visibility='public'
   * o memorial_remembrance_enabled=true.
   */
  MEMORIAL_VIRAL: true,

  /**
   * Paw Points canonizados (Refactor Maestro §5.4).
   * Cuando true:
   *   - Acciones de "cuidado real" otorgan puntos: vacunas, peso, vet visit,
   *     foto mensual, rutinas, OCR carnet, compartir ficha, nose print.
   *   - Acciones sociales/engagement quedan deprecated (daily_checkin, post_feed,
   *     follow_user, receive_like, collect_paw_card, complete_reminder_late)
   *     → siguen siendo callables pero devuelven awarded=false.
   * Cuando false: comportamiento legacy (todas las acciones otorgan puntos).
   */
  PAW_POINTS_CANONICAL: true,

  /**
   * Refactor flujo adopcion Bloque 2 (procesos con estados + kanban + onboarding).
   * Cuando true:
   *   - Cuando un adopter expresa interes con pet_id, refugio puede crear
   *     adoption_process desde su dashboard
   *   - /shelter/adopciones muestra kanban con 7 columnas
   *   - /mis-adopciones muestra timeline al adopter de cada proceso
   *   - BecomeShelterDialog tiene paso 4 opcional (subir 3 mascotas iniciales)
   *   - /shelter/dashboard muestra tour la primera vez
   * Requiere migraciones 20260801000000_adoption_processes.sql,
   * 20260801000001_shelter_onboarding.sql y
   * 20260802000000_adoption_interest_to_process_trigger.sql aplicadas.
   * Aplicadas y activado 2026-04-24 (PM). Pendiente: deploy de
   * supabase/functions/send-adoption-status-email + secret RESEND_API_KEY
   * para que los cambios de status disparen email al adopter.
   */
  ADOPTION_PROCESSES_V1: true,

  /**
   * Timeline unificado con 10 categorias canonicas
   * (refactor maestro §2.4.3). Feed cronologico de toda la vida de la mascota.
   * Requiere migracion pet_timeline_events aplicada.
   */
  TIMELINE_CATEGORIES: true,

  /**
   * Audio notes desde el dueño (no solo desde vet) — (refactor maestro §2.6.2).
   * Tutor graba consulta/observacion → IA estructura → evento timeline.
   * Requiere migracion owner_audio_notes + extension process-consultation-transcript.
   */
  OWNER_AUDIO_NOTES: true,

  /**
   * Quick Actions Hub — widget one-tap en Home (refactor maestro §2.7).
   * 6 acciones mas usadas con captura automatica de metadata.
   */
  QUICK_ACTIONS_HUB: true,

  /**
   * Cascada: al aplicar vacuna, crear automaticamente reminder de proximo refuerzo
   * (refactor maestro §2.8.3). Ya existe logica parcial en triggers DB.
   */
  CASCADE_AUTO_REMINDERS: true,

  /**
   * Cascada: generar automaticamente share card al cumpleaños
   * (refactor maestro §2.8.3). Usa birth_date + genera imagen compartible.
   */
  CASCADE_BIRTHDAY_AUTO: false,

  // ── Fase 1 (30-90d): Moat emergente ──

  /**
   * Nose print MVP — captura + matching biometrico (refactor maestro §6.2).
   * Trinidad pilar 2. Rollout gradual 10% → 50% → 100%.
   * Requiere pgvector habilitado + migracion nose_prints aplicada + edge fns.
   */
  NOSE_PRINT_ENABLED: false,

  /**
   * Integrar captura nose print en onboarding de mascota.
   * Activar solo cuando NOSE_PRINT_ENABLED haya pasado validacion.
   */
  NOSE_PRINT_ONBOARDING: false,

  /**
   * Ruta publica /nose-scan para encontrar mascotas perdidas.
   * Activar al final de Fase 1 con masa de nose prints suficiente.
   */
  NOSE_PRINT_PUBLIC_SCAN: false,

  /**
   * Paw Passport — PDF narrativo + share card exportable
   * (refactor maestro §6.3). Viralidad de la historia de vida.
   */
  PAW_PASSPORT: false,

  /**
   * Descuentos en partners retail para Paw Members
   * (refactor maestro §6.4). Solo activar cuando 1+ partner firmado.
   */
  PARTNER_DISCOUNTS: false,

  /**
   * Landings SEO publicas /insights/* con data agregada anonima
   * (refactor maestro §6.5). Requiere masa critica (>1k mascotas).
   */
  PUBLIC_INSIGHTS: false,

  /**
   * Memorial compartible — share card viral cuando muere mascota
   * (refactor maestro §6.6). Momento emocional + signups de amigos del dueño.
   */
  MEMORIAL_SHARE: false,

  /**
   * Follow-up automatico post-adopcion 30/90 dias
   * (refactor maestro §6.7). Loop retention para refugios.
   */
  SHELTER_FOLLOWUP: false,

  /**
   * Tracking GPS background de paseos con consent
   * (refactor maestro §2.7.2). Requiere permisos background iOS/Android.
   */
  WALK_GPS_TRACKING: false,

  /**
   * Cascada: alerta cuando peso baja 10%+ en 30 dias
   * (refactor maestro §2.8.3).
   */
  CASCADE_WEIGHT_ALERTS: false,

  // ── Fase 2 (90-365d): Producto invisible ──

  /**
   * Seguros embebidos en la app con aseguradora partner
   * (refactor maestro §7.2). Motor de revenue B2B mas grande.
   */
  EMBEDDED_INSURANCE: false,

  /**
   * Pharma insights API + dashboard B2B
   * (refactor maestro §7.3). Monetizacion de data moat anonima.
   */
  PHARMA_INSIGHTS_API: false,

  /**
   * Retail fulfillment comisionado con partners
   * (refactor maestro §7.4). Requires partners integrados.
   */
  RETAIL_FULFILLMENT: false,

  /**
   * API publica B2B con auth keys y rate limits
   * (refactor maestro §7.5). Para vets grandes + aseguradoras.
   */
  B2B_API: false,

  /**
   * Scanner fisico en partners — tablet con app de scanning
   * (refactor maestro §2.8.2). Nice-to-have, no bloquea plan.
   */
  PARTNER_SCANNER_API: false,

  /**
   * Auto-creacion de eventos timeline desde scanner de partner
   * (refactor maestro §2.8.2).
   */
  PARTNER_AUTO_TIMELINE: false,

  /**
   * Deteccion pasiva de visitas a clinicas via geofencing
   * (refactor maestro §2.8.1).
   */
  PASSIVE_DETECTION_GPS: false,

  /**
   * Capa de AI que sugiere proxima accion segun contexto
   * (refactor maestro §2.8.3). Requiere volumen data minimo.
   */
  CASCADE_AI_SUGGESTIONS: false,

  /**
   * Push si no hay actividad en la app 7d
   * (refactor maestro §2.8.3). Detectar abandono.
   */
  CASCADE_INACTIVITY_CHECK: false,

  /**
   * ML pattern detection sobre 30d+ de data para sugerir rutinas
   * (refactor maestro §2.8.1). Requiere >1k users con historial.
   */
  AI_PATTERN_DETECTION: false,

  /**
   * Expansion LATAM Mexico — solo si Chile saturado en Y2+
   * (refactor maestro §7.6).
   */
  LATAM_MX: false,

  /**
   * Expansion LATAM Argentina.
   */
  LATAM_AR: false,

  /**
   * Expansion LATAM Colombia.
   */
  LATAM_CO: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag] === true;
}

/** Alias semantico para el perfil publico del refugio. */
export function isShelterDonationsEnabled(): boolean {
  return isFeatureEnabled('SHELTER_DONATIONS');
}
