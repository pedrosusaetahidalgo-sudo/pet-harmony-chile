export type PlanId = 'free' | 'premium' | 'premium_plus';

export interface PlanFeature {
  id: string;
  name: string;
  free: string | number | boolean;
  premium: string | number | boolean;
  premium_plus: string | number | boolean;
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
      max_reminders: 5,
      ai_behavior_analysis: 1,
      ai_vet_assistant: 0,
      export_pdf: false,
      share_clinical: false,
      medical_history: '1_year',
      weekly_summary: false,
      booking_user_fee: 5,
      priority_support: false,
      ad_free: false,
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    badge: '⭐',
    monthlyPrice: 3990,
    yearlyPrice: 39900,
    yearlyMonthly: 3325,
    features: {
      max_pets: 5,
      max_reminders: 20,
      ai_behavior_analysis: 5,
      ai_vet_assistant: 5,
      export_pdf: true,
      share_clinical: true,
      medical_history: 'all',
      weekly_summary: true,
      booking_user_fee: 0,
      priority_support: false,
      ad_free: true,
    }
  },
  premium_plus: {
    id: 'premium_plus',
    name: 'Premium+',
    badge: '💎',
    monthlyPrice: 6990,
    yearlyPrice: 69900,
    yearlyMonthly: 5825,
    features: {
      max_pets: -1,
      max_reminders: -1,
      ai_behavior_analysis: -1,
      ai_vet_assistant: -1,
      export_pdf: true,
      share_clinical: true,
      medical_history: 'all',
      weekly_summary: true,
      booking_user_fee: 0,
      priority_support: true,
      ad_free: true,
    }
  }
};

export function canAccess(
  planId: PlanId,
  feature: string,
  currentUsage?: number
): { allowed: boolean; reason?: string; upgradeRequired?: PlanId } {
  const plan = PLANS[planId];
  const value = plan.features[feature];

  if (typeof value === 'boolean') {
    if (!value) {
      const minPlan = Object.entries(PLANS).find(
        ([, p]) => p.features[feature] === true
      );
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
        upgradeRequired: planId === 'free' ? 'premium' : 'premium_plus',
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

export const FEATURE_LABELS: Record<string, string> = {
  max_pets: 'Mascotas registradas',
  max_reminders: 'Recordatorios activos',
  ai_behavior_analysis: 'Análisis IA de comportamiento',
  ai_vet_assistant: 'Asistente veterinario IA',
  export_pdf: 'Exportar ficha clínica PDF',
  share_clinical: 'Compartir ficha con veterinario',
  medical_history: 'Historial médico',
  weekly_summary: 'Resumen semanal IA',
  booking_user_fee: 'Tarifa de servicio',
  priority_support: 'Soporte prioritario',
  ad_free: 'Sin publicidad',
};
