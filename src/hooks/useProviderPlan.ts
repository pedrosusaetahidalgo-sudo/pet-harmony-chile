/**
 * useProviderPlan — hook para leer el plan B2B vigente del vet logueado.
 *
 * Origen: Lote C auditoría E2E pre-launch 2026-04-20.
 * Sirve para gatear features (analytics_level, max_clients, audio_transcription,
 * bulk_patient_import) en la UI.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  PROVIDER_PLANS,
  normalizeProviderPlanId,
  type ProviderPlanId,
  type ProviderPlanFeatures,
} from '@/lib/plans';

export interface ProviderPlanContext {
  plan: ProviderPlanId;
  features: ProviderPlanFeatures;
  planName: string;
  planExpiresAt: string | null;
  /** true si el vet está en provider_free (sin plan pago activo). */
  isFree: boolean;
  analyticsLevel: 'none' | 'basic' | 'advanced';
  canAudioTranscription: boolean;
  canBulkImport: boolean;
  canMultiVet: boolean;
}

export function useProviderPlan() {
  const { user } = useAuth();

  return useQuery<ProviderPlanContext | null>({
    queryKey: ['provider-plan-context', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('service_providers')
        .select('provider_plan, plan_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      const row = data as {
        provider_plan: string | null;
        plan_expires_at: string | null;
      } | null;

      const plan = normalizeProviderPlanId(row?.provider_plan ?? undefined);
      const cfg = PROVIDER_PLANS[plan];

      return {
        plan,
        features: cfg.features,
        planName: cfg.name,
        planExpiresAt: row?.plan_expires_at ?? null,
        isFree: plan === 'provider_free',
        analyticsLevel: cfg.features.analytics_level,
        canAudioTranscription: cfg.features.audio_transcription,
        canBulkImport: cfg.features.bulk_patient_import,
        canMultiVet: cfg.features.multiple_vets,
      } satisfies ProviderPlanContext;
    },
  });
}
