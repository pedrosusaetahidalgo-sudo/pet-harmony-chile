/**
 * useRiskScore — calcula el score de salud de una mascota via la RPC
 * calculate_pet_risk_score (Refactor Maestro Fase 2 §7.5).
 *
 * Hoy heuristico (edad, vacunas, microchip, antiparasitario, condiciones).
 * Cuando tengamos 5k+ mascotas con outcome data, refinar con vet.
 *
 * Solo el owner del pet (o admin) puede llamar la RPC.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RiskScoreFactors {
  age_years?: number | null;
  neutered?: boolean;
  has_microchip?: boolean;
  vaccines_overdue?: number;
  recent_antiparasitic?: boolean;
  chronic_conditions?: number;
}

export interface RiskScoreResult {
  pet_id: string;
  risk_score: number;
  age_years: number;
  factors: RiskScoreFactors;
  computed_at: string;
}

export function useRiskScore(petId: string | undefined, enabled = true) {
  return useQuery<RiskScoreResult | null>({
    queryKey: ['pet-risk-score', petId],
    enabled: !!petId && enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!petId) return null;
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .rpc('calculate_pet_risk_score' as any, { p_pet_id: petId });
      if (error) {
        // RPC ausente (mig pendiente) o sin permiso. Silent fail.
        console.warn('[useRiskScore] RPC error', error);
        return null;
      }
      const row = (data as RiskScoreResult[] | null)?.[0];
      return row ?? null;
    },
  });
}
