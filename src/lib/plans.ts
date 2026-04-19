import { FEATURE_FLAGS } from '@/lib/featureFlags';

export type PlanId = 'free' | 'premium';

export interface PlanFeature {
  id: string;
  name: string;
  free: string | number | boolean;
  premium: string | number | boolean;
}

export interface PlanConfig {
  id: PlanId;
  name: string;
  badge: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyMonthly: number;
  features: Record<string, number | boolean | string>;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  // 2026-04-19: modelo B2C 100% gratis. El plan "free" tiene los mismos
  // features que Paw Member — la membresia solo otorga badge visual y
  // reconocimiento publico, nunca bloquea funcionalidad. Los caps
  // historicos (max_pets=2, export_pdf=false, etc.) se reemplazaron por
  // valores ilimitados para que un usuario free pueda usar toda la app.
  // Si en el futuro se decide volver a capear features B2C, se cambia
  // aqui sin tocar la UI (canAccess sigue respetando estos numeros).
  free: {
    id: 'free',
    name: 'Gratis',
    badge: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthly: 0,
    features: {
      max_pets: -1,
      max_reminders: -1,
      max_routines_per_pet: -1,
      ai_behavior_analysis: -1,
      ai_vet_assistant: -1,
      export_pdf: true,
      share_clinical: -1,
      medical_history: 'all',
      weekly_summary: true,
      booking_user_fee: 0,
      priority_support: false,
      ad_free: true,
      pro_analytics: true,
      analytics_export: true,
      ocr_scans: -1,
    },
  },
  premium: {
    id: 'premium',
    // Desde 2026-04-19: renombrado a "Paw Member" (membresia voluntaria).
    // Mismos features que free — solo otorga badge visual y reconocimiento
    // publico. No desbloquea nada. El id 'premium' se conserva por
    // compatibilidad con DB y codigo existente.
    name: 'Paw Member',
    badge: '💛',
    monthlyPrice: 3990,
    yearlyPrice: 39900,
    yearlyMonthly: 3325,
    features: {
      max_pets: -1,
      max_reminders: -1,
      max_routines_per_pet: -1,
      ai_behavior_analysis: -1,
      ai_vet_assistant: -1,
      export_pdf: true,
      share_clinical: -1,
      medical_history: 'all',
      weekly_summary: true,
      booking_user_fee: 0,
      priority_support: true,
      ad_free: true,
      pro_analytics: true,
      analytics_export: true,
      ocr_scans: -1,
    },
  },
};

export function canAccess(
  planId: PlanId,
  feature: string,
  currentUsage?: number,
  isAdmin?: boolean
): { allowed: boolean; reason?: string; upgradeRequired?: PlanId } {
  // Admin override: todo desbloqueado siempre
  if (isAdmin) return { allowed: true };

  // Pivot médico: USER_PREMIUM=false → todo desbloqueado para todos.
  // Cuando se reactive premium, eliminar estas líneas.
  if (!FEATURE_FLAGS.USER_PREMIUM) return { allowed: true };

  const plan = PLANS[planId];
  const value = plan.features[feature];

  if (typeof value === 'boolean') {
    if (!value) {
      const minPlan = Object.entries(PLANS).find(([, p]) => p.features[feature] === true);
      return {
        allowed: false,
        reason: `Disponible desde el plan ${minPlan?.[1].name || 'Premium'}`,
        upgradeRequired: (minPlan?.[0] as PlanId) || 'premium',
      };
    }
    return { allowed: true };
  }

  if (typeof value === 'number') {
    if (value === -1) return { allowed: true };
    if (value === 0) {
      return {
        allowed: false,
        reason: 'Disponible desde el plan Premium',
        upgradeRequired: 'premium',
      };
    }
    if (currentUsage !== undefined && currentUsage >= value) {
      return {
        allowed: false,
        reason: `Llegaste al límite de ${value} este mes. Mejora tu plan para más.`,
        upgradeRequired: 'premium',
      };
    }
    return { allowed: true };
  }

  return { allowed: true };
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
