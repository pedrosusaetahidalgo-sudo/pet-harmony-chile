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
  free: {
    id: 'free',
    name: 'Gratis',
    badge: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthly: 0,
    features: {
      max_pets: 2,
      max_reminders: 3,
      max_routines_per_pet: 3,
      ai_behavior_analysis: 1,
      ai_vet_assistant: 1,
      export_pdf: false,
      share_clinical: 1,
      medical_history: '6_months',
      weekly_summary: false,
      booking_user_fee: 5,
      priority_support: false,
      ad_free: false,
      pro_analytics: false,
      analytics_export: false,
      ocr_scans: 1,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    badge: '⭐',
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

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================
// Provider plans (veterinarios independientes y clínicas)
// ============================================================

export type ProviderPlanId =
  | 'provider_free'
  | 'provider_individual'
  | 'provider_clinic_basic'
  | 'provider_clinic_pro';

export interface ProviderPlanFeatures {
  max_clients: number;
  max_bookings_per_month: number;
  max_review_invitations_per_month: number;
  public_profile: boolean;
  public_reviews: boolean;
  directory_listing: boolean;
  featured_position: boolean;
  multiple_vets: boolean;
  multiple_branches: boolean;
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
  provider_free: {
    id: 'provider_free',
    name: 'Gratis',
    segment: 'individual',
    badge: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthly: 0,
    commissionRate: 10,
    features: {
      max_clients: 15,
      max_bookings_per_month: 10,
      max_review_invitations_per_month: 2,
      public_profile: true,
      public_reviews: true,
      directory_listing: true,
      featured_position: false,
      multiple_vets: false,
      multiple_branches: false,
      branding_level: 'none',
      analytics_level: 'none',
      priority_support: false,
      api_access: false,
      audio_transcription: false,
    },
  },
  provider_individual: {
    id: 'provider_individual',
    name: 'Individual',
    segment: 'individual',
    badge: '🩺',
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    yearlyMonthly: 8250,
    commissionRate: 10,
    features: {
      max_clients: 100,
      max_bookings_per_month: 50,
      max_review_invitations_per_month: 5,
      public_profile: true,
      public_reviews: true,
      directory_listing: true,
      featured_position: false,
      multiple_vets: false,
      multiple_branches: false,
      branding_level: 'basic',
      analytics_level: 'basic',
      priority_support: false,
      api_access: false,
      audio_transcription: true,
    },
  },
  provider_clinic_basic: {
    id: 'provider_clinic_basic',
    name: 'Clínica Básica',
    segment: 'clinic',
    badge: '🏥',
    monthlyPrice: 29900,
    yearlyPrice: 299000,
    yearlyMonthly: 24900,
    commissionRate: 10,
    features: {
      max_clients: 500,
      max_bookings_per_month: -1,
      max_review_invitations_per_month: 20,
      public_profile: true,
      public_reviews: true,
      directory_listing: true,
      featured_position: true,
      multiple_vets: true,
      multiple_branches: false,
      branding_level: 'full',
      analytics_level: 'advanced',
      priority_support: false,
      api_access: false,
      audio_transcription: true,
    },
  },
  provider_clinic_pro: {
    id: 'provider_clinic_pro',
    name: 'Clínica Pro',
    segment: 'clinic',
    badge: '⭐',
    monthlyPrice: 59900,
    yearlyPrice: 599000,
    yearlyMonthly: 49900,
    commissionRate: 0,
    features: {
      max_clients: -1,
      max_bookings_per_month: -1,
      max_review_invitations_per_month: -1,
      public_profile: true,
      public_reviews: true,
      directory_listing: true,
      featured_position: true,
      multiple_vets: true,
      multiple_branches: true,
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
        reason: `Disponible desde el plan ${minPlan?.[1].name ?? 'Individual'}`,
        upgradeRequired: minPlan?.[0] ?? 'provider_individual',
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
        upgradeRequired: 'provider_individual',
      };
    }
    if (currentUsage !== undefined && currentUsage >= value) {
      return {
        allowed: false,
        reason: `Llegaste al límite de ${value} este mes. Mejora tu plan para más.`,
        upgradeRequired:
          planId === 'provider_free'
            ? 'provider_individual'
            : planId === 'provider_individual'
              ? 'provider_clinic_basic'
              : 'provider_clinic_pro',
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
  medical_history: 'Historial médico',
  weekly_summary: 'Resumen semanal IA',
  booking_user_fee: 'Tarifa de servicio',
  priority_support: 'Soporte prioritario',
  ad_free: 'Sin publicidad',
  pro_analytics: 'Panel Pro de Analytics',
  analytics_export: 'Exportar reportes (PDF/CSV)',
  ocr_scans: 'Escaneo de carnet con IA',
};
