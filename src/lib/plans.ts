import { FEATURE_FLAGS } from '@/lib/featureFlags';

/**
 * 2026-04-29 — Pivot a freemium real (Opcion 3 del Checkpoint 1, Plan v5).
 *
 * Modelo B2C v3:
 *   Free       — 2 mascotas, ficha clinica completa, recordatorios, OCR, Pet ID
 *                Card basica, QR, memorial, adoption, directorio vets.
 *   Paw Member — $3.990/mes o $39.900/ano. 4 mascotas. Desbloquea Paw Shield
 *                (Petify), Paw Passport PDF, Insights Pro, Audio notes IA,
 *                Reportes >30d, Compartir ficha 1 ano, descuentos Paw Partners.
 *   Manada     — $9.990/mes o $99.900/ano. 5 mascotas. Todo Paw Member +
 *                descuentos exclusivos + soporte prioritario + early access +
 *                badge Manada + $2.000/mes a Fondo Paw Friend Refugios.
 *
 * Razon: el costo Petify USD 0.75/mascota/mes lineal rompe el modelo "100%
 * gratis para todos" si activamos Paw Shield en universal. Con 15% conversion
 * a Paw Member (target) cubrimos COGS biometrico + dejamos margen para
 * partners B2B (pharma+seguros+retail) sin dependencia de fechas de firma.
 *
 * IDs DB:
 *   'free'       (sin cambio)
 *   'premium'    (alias DB legacy = 'paw_member' UI). NO renombrar columna DB.
 *   'paw_manada' (nuevo).
 *
 * Compat: normalizePlanId() mapea 'premium' ↔ 'paw_member' segun contexto.
 */
export type PlanId = 'free' | 'premium' | 'paw_manada';

/**
 * Alias UI → DB id. La DB sigue usando 'premium' por compat con suscripciones
 * Flow.cl existentes. La UI usa 'paw_member' por brand.
 */
export const PLAN_DB_TO_UI: Record<PlanId, string> = {
  free: 'free',
  premium: 'paw_member',
  paw_manada: 'paw_manada',
};

export const PLAN_UI_TO_DB: Record<string, PlanId> = {
  free: 'free',
  paw_member: 'premium',
  premium: 'premium',
  paw_manada: 'paw_manada',
};

/** Resuelve cualquier id (DB o UI, antiguo o nuevo) a PlanId canonico DB. */
export function normalizePlanId(id: string | null | undefined): PlanId {
  if (!id) return 'free';
  const lower = id.toLowerCase();
  if (lower === 'free') return 'free';
  if (lower === 'premium' || lower === 'paw_member') return 'premium';
  if (lower === 'paw_manada' || lower === 'manada') return 'paw_manada';
  return 'free';
}

export interface PlanFeature {
  id: string;
  name: string;
  free: string | number | boolean;
  premium: string | number | boolean;
  paw_manada: string | number | boolean;
}

export interface PlanConfig {
  id: PlanId;
  /** Nombre publico en UI. */
  name: string;
  badge: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyMonthly: number;
  /** Si publicVisible=false el plan no aparece en pricing principal. */
  publicVisible: boolean;
  /**
   * Para Manada: aporte mensual en CLP que Paw Friend SpA destina al
   * Fondo Paw Friend Refugios. NO es donacion del user (evita Ley 19.885);
   * Paw Friend SpA donates legally como persona juridica (Art. 31 N°7 LIR).
   * UI muestra "tu plan apoya el fondo Paw Friend Refugios".
   */
  manadaRefugioAporteClp: number;
  features: Record<string, number | boolean | string>;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  // ────────────────────────── FREE ──────────────────────────
  // Lo esencial gratis para siempre. Diseñado para "el dueño flojo" del
  // modelo v2: ficha clinica completa, recordatorios, calendario, OCR,
  // Pet ID Card basica, QR, memorial, adoption, directorio vets,
  // gamificacion opt-in. 2 mascotas (genéroso para hogares con pareja
  // dueno+gato/perro). Sin Paw Shield, sin Paw Passport PDF, sin Insights
  // Pro, sin Audio IA, sin descuentos partners.
  free: {
    id: 'free',
    name: 'Gratis',
    badge: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthly: 0,
    publicVisible: true,
    manadaRefugioAporteClp: 0,
    features: {
      max_pets: 2,
      max_reminders: -1,
      max_routines_per_pet: -1,
      // IA basica gratis (motor invisibility + viralidad ficha)
      ai_behavior_analysis: 5,
      ai_vet_assistant: 10,
      ocr_scans: 5,
      export_pdf: true,
      share_clinical_days: 30,
      medical_history: 'all',
      weekly_summary: false,
      booking_user_fee: 0,
      priority_support: false,
      ad_free: true,
      pro_analytics: false,
      analytics_export: false,
      reports_history_days: 30,
      // Premium features OFF
      paw_shield: false,
      paw_passport: false,
      insights_pro: false,
      audio_notes_ai: false,
      partner_discounts: 'none',
      early_access: false,
    },
  },
  // ────────────────────────── PAW MEMBER (DB id 'premium') ──────────────
  // Tier paid real con feature unlock. Cubre el COGS Paw Shield + features
  // valor alto. Target conversion 15%. $3.990/mes o $39.900/ano (17% off).
  // Hasta 4 mascotas (suficiente para hogares medio-multi-pet).
  premium: {
    id: 'premium',
    name: 'Paw Member',
    badge: '💛',
    monthlyPrice: 3990,
    yearlyPrice: 39900,
    yearlyMonthly: 3325,
    publicVisible: true,
    manadaRefugioAporteClp: 0,
    features: {
      max_pets: 4,
      max_reminders: -1,
      max_routines_per_pet: -1,
      ai_behavior_analysis: -1,
      ai_vet_assistant: -1,
      ocr_scans: -1,
      export_pdf: true,
      share_clinical_days: 365,
      medical_history: 'all',
      weekly_summary: true,
      booking_user_fee: 0,
      priority_support: false,
      ad_free: true,
      pro_analytics: true,
      analytics_export: true,
      reports_history_days: -1,
      // Premium features ON
      paw_shield: true,
      paw_passport: true,
      insights_pro: true,
      audio_notes_ai: true,
      partner_discounts: 'basic',
      early_access: false,
    },
  },
  // ────────────────────────── MANADA ──────────────────────────
  // Para hogares con muchas mascotas + corazon refugio. $9.990/mes o
  // $99.900/ano (17% off). 5 mascotas. Todo Paw Member + extras de power
  // user (descuentos exclusivos, soporte prioritario, early access, badge)
  // + $2.000/mes que Paw Friend SpA destina al Fondo Refugios. Target
  // conversion 1-2%. Seccion secundaria en /paw-member, no pricing
  // principal.
  paw_manada: {
    id: 'paw_manada',
    name: 'Manada',
    badge: '👑',
    monthlyPrice: 9990,
    yearlyPrice: 99900,
    yearlyMonthly: 8325,
    publicVisible: true,
    manadaRefugioAporteClp: 2000,
    features: {
      max_pets: 5,
      max_reminders: -1,
      max_routines_per_pet: -1,
      ai_behavior_analysis: -1,
      ai_vet_assistant: -1,
      ocr_scans: -1,
      export_pdf: true,
      share_clinical_days: 365,
      medical_history: 'all',
      weekly_summary: true,
      booking_user_fee: 0,
      priority_support: true,
      ad_free: true,
      pro_analytics: true,
      analytics_export: true,
      reports_history_days: -1,
      paw_shield: true,
      paw_passport: true,
      insights_pro: true,
      audio_notes_ai: true,
      partner_discounts: 'exclusive',
      early_access: true,
    },
  },
};

/**
 * Resuelve el plan minimo que tiene `feature=true` o `feature>=value` y lo
 * retorna como upgrade target. Usado por canAccess() para sugerir el plan
 * correcto en el upsell — preferimos Paw Member (premium) por ser el target
 * de conversion principal; Manada solo si Paw Member no alcanza.
 */
function findMinUpgradePlan(feature: string, value: unknown): PlanId {
  if (typeof value === 'boolean') {
    for (const id of ['premium', 'paw_manada'] as PlanId[]) {
      if (PLANS[id].features[feature] === true) return id;
    }
    return 'premium';
  }
  if (typeof value === 'number') {
    for (const id of ['premium', 'paw_manada'] as PlanId[]) {
      const v = PLANS[id].features[feature];
      if (typeof v === 'number' && (v === -1 || v > value)) return id;
    }
    return 'premium';
  }
  return 'premium';
}

export function canAccess(
  planId: PlanId,
  feature: string,
  currentUsage?: number,
  isAdmin?: boolean
): { allowed: boolean; reason?: string; upgradeRequired?: PlanId } {
  // Admin override: todo desbloqueado siempre
  if (isAdmin) return { allowed: true };

  // Si USER_PREMIUM esta off, todo desbloqueado (modo legacy 100% gratis).
  // Cuando flipea a true (Opcion 3 activa, 2026-04-29), aplicamos limites
  // reales segun PLANS.
  if (!FEATURE_FLAGS.USER_PREMIUM) return { allowed: true };

  const plan = PLANS[planId];
  const value = plan.features[feature];

  // String enum (ej: partner_discounts: 'none' | 'basic' | 'exclusive')
  if (typeof value === 'string') {
    if (value === 'none' || value === '') {
      const upgradeRequired = findMinUpgradePlan(feature, true);
      return {
        allowed: false,
        reason: `Disponible desde el plan ${PLANS[upgradeRequired].name}`,
        upgradeRequired,
      };
    }
    return { allowed: true };
  }

  if (typeof value === 'boolean') {
    if (!value) {
      const upgradeRequired = findMinUpgradePlan(feature, true);
      return {
        allowed: false,
        reason: `Disponible desde el plan ${PLANS[upgradeRequired].name}`,
        upgradeRequired,
      };
    }
    return { allowed: true };
  }

  if (typeof value === 'number') {
    if (value === -1) return { allowed: true };
    if (value === 0) {
      const upgradeRequired = findMinUpgradePlan(feature, 0);
      return {
        allowed: false,
        reason: `Disponible desde el plan ${PLANS[upgradeRequired].name}`,
        upgradeRequired,
      };
    }
    if (currentUsage !== undefined && currentUsage >= value) {
      const upgradeRequired = findMinUpgradePlan(feature, value);
      return {
        allowed: false,
        reason: `Llegaste al limite de ${value}. Mejora a ${PLANS[upgradeRequired].name} para mas.`,
        upgradeRequired,
      };
    }
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Helper UI: nombre publico del plan (con badge si tiene).
 * Usa esto en cualquier render que necesite mostrar plan name al user.
 */
export function getPlanLabel(planId: PlanId): string {
  const plan = PLANS[planId];
  return plan.badge ? `${plan.badge} ${plan.name}` : plan.name;
}

/**
 * Aporte mensual al Fondo Paw Friend Refugios para un plan dado.
 * Solo Manada aporta hoy ($2.000/mes). El aporte lo realiza Paw Friend SpA
 * a refugios verificados, no el user directamente — esto evita activar
 * Ley 19.885 de donatarios y mantiene el flujo simple legalmente.
 */
export function getRefugioAporteClp(planId: PlanId): number {
  return PLANS[planId].manadaRefugioAporteClp;
}

// Re-export from canonical location for backward compatibility
export { formatCLP } from '@/lib/format';

// ============================================================
// Provider plans (veterinarios independientes y clínicas)
// ============================================================

// ============================================================
// Provider plans (2026-04-19): 2 tracks con 4 tiers canonicos.
//
// Track INDIVIDUAL (vet profesional):
//   - provider_free      → "Básica"  $0
//   - provider_premium   → "Premium" $9.900/mes
//
// Track CLINICA (veterinaria):
//   - provider_clinic_starter → "Clínica" $19.900/mes (nuevo, enfocado
//                                a packs de usuarios + carga masiva CSV)
//   - provider_pro_max        → "Pro Max" $29.900/mes (multi-sucursal)
//
// IDs legacy se normalizan via normalizeProviderPlanId() para no romper
// suscripciones antiguas en DB.
// ============================================================

export type ProviderPlanId =
  | 'provider_free'
  | 'provider_premium'
  | 'provider_clinic_starter'
  | 'provider_pro_max';

export type ProviderSegment = 'individual' | 'clinic';

/** Alias de IDs antiguos → nuevos. Solo para backward compat en lecturas. */
export const DEPRECATED_PROVIDER_PLAN_ALIASES: Record<string, ProviderPlanId> = {
  // Antes de 2026-04-19
  provider_individual: 'provider_premium',
  // clinic_basic: antes mapeaba a premium; ahora tiene su tier propio
  provider_clinic_basic: 'provider_clinic_starter',
  provider_clinic_pro: 'provider_pro_max',
};

/**
 * Normaliza cualquier ID de plan (nuevo o legacy) al ID canonico actual.
 * Si el ID no matchea ninguno conocido, retorna 'provider_free' por defecto
 * seguro (mejor que crashear).
 */
export function normalizeProviderPlanId(id: string | null | undefined): ProviderPlanId {
  if (!id) return 'provider_free';
  if (
    id === 'provider_free' ||
    id === 'provider_premium' ||
    id === 'provider_clinic_starter' ||
    id === 'provider_pro_max'
  ) {
    return id;
  }
  return DEPRECATED_PROVIDER_PLAN_ALIASES[id] ?? 'provider_free';
}

export interface ProviderPlanFeatures {
  max_clients: number;
  max_bookings_per_month: number;
  max_review_invitations_per_month: number;
  /** Para clinicas: cantidad maxima de vets que pueden operar bajo la misma cuenta (pack). 1 = solo dueño. */
  max_vet_seats: number;
  public_profile: boolean;
  public_reviews: boolean;
  directory_listing: boolean;
  featured_position: boolean;
  multiple_vets: boolean;
  multiple_branches: boolean;
  /** Importar pacientes desde CSV/Excel en lote. Critico para clinicas. */
  bulk_patient_import: boolean;
  branding_level: 'none' | 'basic' | 'full';
  analytics_level: 'none' | 'basic' | 'advanced';
  priority_support: boolean;
  api_access: boolean;
  audio_transcription: boolean;
}

export interface ProviderPlanConfig {
  id: ProviderPlanId;
  name: string;
  segment: 'individual' | 'clinic';
  badge: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyMonthly: number;
  commissionRate: number;
  features: ProviderPlanFeatures;
  /**
   * Modelo v2 (2026-04-22): si false, el plan no aparece
   * en pricing publico (`/para-veterinarios`). Sigue asignable manualmente
   * desde admin, sigue funcionando si una cuenta lo tiene. Track Clinica
   * se vende como "Empresarial — contactanos" para no posicionar Paw Friend
   * como SaaS clinico (vet = canal de adquisicion, no revenue center).
   */
  publicVisible: boolean;
}

export const PROVIDER_PLANS: Record<ProviderPlanId, ProviderPlanConfig> = {
  // ────────────────────────── TRACK INDIVIDUAL ──────────────────────────
  // Basica (id 'provider_free' conservado por retrocompat DB): para que el
  // vet pruebe Paw Friend. 5 pacientes vinculados, directorio publico, sin
  // features avanzadas. Comision 10% en bookings.
  // 2026-04-19: Pedro clarifica que B2B es OPCIONAL solo para escalar. El
  // plan Basica cubre a vets que recien empiezan o tienen poco volumen.
  provider_free: {
    id: 'provider_free',
    name: 'Básica',
    segment: 'individual',
    badge: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthly: 0,
    commissionRate: 10,
    publicVisible: true,
    features: {
      max_clients: 5,
      max_bookings_per_month: 10,
      max_review_invitations_per_month: 2,
      max_vet_seats: 1,
      public_profile: true,
      public_reviews: true,
      directory_listing: true,
      featured_position: false,
      multiple_vets: false,
      multiple_branches: false,
      bulk_patient_import: false,
      branding_level: 'none',
      analytics_level: 'none',
      priority_support: false,
      api_access: false,
      audio_transcription: false,
    },
  },
  // Premium: para el vet individual que ya trabaja con Paw Friend.
  // Ilimitado en volumen, destacado en directorio, analytics basico,
  // audio. Sin multi-clinica ni API. Comision 5%. 1 seat (el dueño).
  // Precio bajo intencional (volumen > ticket).
  provider_premium: {
    id: 'provider_premium',
    name: 'Premium',
    segment: 'individual',
    badge: '⭐',
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    yearlyMonthly: 8250,
    commissionRate: 5,
    publicVisible: true,
    features: {
      max_clients: -1,
      max_bookings_per_month: -1,
      max_review_invitations_per_month: -1,
      max_vet_seats: 1,
      public_profile: true,
      public_reviews: true,
      directory_listing: true,
      featured_position: true,
      multiple_vets: false,
      multiple_branches: false,
      bulk_patient_import: false,
      branding_level: 'basic',
      analytics_level: 'basic',
      priority_support: false,
      api_access: false,
      audio_transcription: true,
    },
  },
  // ────────────────────────── TRACK CLINICA ──────────────────────────
  // Clinica Starter: la puerta de entrada para veterinarias. Pack de 3
  // vets bajo una misma cuenta + carga masiva de pacientes via CSV/Excel
  // (critico para migrar una base existente) + analytics avanzada.
  // Una sola sucursal. Comision 3%.
  provider_clinic_starter: {
    id: 'provider_clinic_starter',
    name: 'Clínica',
    segment: 'clinic',
    badge: '🏥',
    monthlyPrice: 19900,
    yearlyPrice: 199000,
    yearlyMonthly: 16583,
    commissionRate: 3,
    publicVisible: false, // modelo v2: escondido del pricing publico ("Empresarial — contactanos")
    features: {
      max_clients: 500,
      max_bookings_per_month: -1,
      max_review_invitations_per_month: 20,
      max_vet_seats: 3,
      public_profile: true,
      public_reviews: true,
      directory_listing: true,
      featured_position: true,
      multiple_vets: true,
      multiple_branches: false,
      bulk_patient_import: true,
      branding_level: 'full',
      analytics_level: 'advanced',
      priority_support: true,
      api_access: false,
      audio_transcription: true,
    },
  },
  // Pro Max: para veterinarias con varias sucursales o necesidades custom.
  // Todo ilimitado (seats, clientes, bookings), branding completo, API,
  // priority support, 0% comision. El tier "todo incluido".
  // Precio accesible intencional para clinicas chilenas.
  provider_pro_max: {
    id: 'provider_pro_max',
    name: 'Pro Max',
    segment: 'clinic',
    badge: '👑',
    monthlyPrice: 29900,
    yearlyPrice: 299000,
    yearlyMonthly: 24900,
    commissionRate: 0,
    publicVisible: false, // modelo v2: escondido del pricing publico ("Empresarial — contactanos")
    features: {
      max_clients: -1,
      max_bookings_per_month: -1,
      max_review_invitations_per_month: -1,
      max_vet_seats: -1,
      public_profile: true,
      public_reviews: true,
      directory_listing: true,
      featured_position: true,
      multiple_vets: true,
      multiple_branches: true,
      bulk_patient_import: true,
      branding_level: 'full',
      analytics_level: 'advanced',
      priority_support: true,
      api_access: true,
      audio_transcription: true,
    },
  },
};

export function canProviderAccess(
  planId: ProviderPlanId,
  feature: keyof ProviderPlanFeatures,
  currentUsage?: number,
  isAdmin?: boolean
): { allowed: boolean; reason?: string; upgradeRequired?: ProviderPlanId } {
  // Admin override: todo desbloqueado siempre
  if (isAdmin) return { allowed: true };

  const plan = PROVIDER_PLANS[planId];
  const value = plan.features[feature];

  if (typeof value === 'boolean') {
    if (!value) {
      const minPlan = (
        Object.entries(PROVIDER_PLANS) as [ProviderPlanId, ProviderPlanConfig][]
      ).find(([, p]) => p.features[feature] === true);
      return {
        allowed: false,
        reason: `Disponible desde el plan ${minPlan?.[1].name ?? 'Premium'}`,
        upgradeRequired: minPlan?.[0] ?? 'provider_premium',
      };
    }
    return { allowed: true };
  }

  if (typeof value === 'number') {
    if (value === -1) return { allowed: true };
    if (value === 0) {
      return {
        allowed: false,
        reason: 'No disponible en tu plan actual',
        upgradeRequired: 'provider_premium',
      };
    }
    if (currentUsage !== undefined && currentUsage >= value) {
      return {
        allowed: false,
        reason: `Llegaste al límite de ${value} este mes. Mejora tu plan para más.`,
        upgradeRequired:
          planId === 'provider_free'
            ? 'provider_premium'
            : planId === 'provider_premium'
              ? 'provider_clinic_starter'
              : 'provider_pro_max',
      };
    }
    return { allowed: true };
  }

  return { allowed: true };
}

export const FEATURE_LABELS: Record<string, string> = {
  max_pets: 'Mascotas registradas',
  max_reminders: 'Recordatorios activos',
  max_routines_per_pet: 'Rutinas por mascota',
  ai_behavior_analysis: 'Análisis IA de comportamiento',
  ai_vet_assistant: 'Asistente veterinario IA',
  export_pdf: 'Exportar ficha clínica PDF',
  share_clinical: 'Compartir ficha con veterinario',
  medical_history: 'Ficha clínica completa',
  weekly_summary: 'Resumen semanal IA',
  booking_user_fee: 'Tarifa de servicio',
  priority_support: 'Soporte prioritario',
  ad_free: 'Sin publicidad',
  pro_analytics: 'Panel Pro de Analytics',
  analytics_export: 'Exportar reportes (PDF/CSV)',
  ocr_scans: 'Escaneo de carnet con IA',
};
