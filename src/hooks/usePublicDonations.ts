import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicDonation {
  id: string;
  donor_name: string;
  message: string;
  amount_clp: number;
  paid_at: string;
}

export interface PublicDonationStats {
  total_clp: number;
  month_clp: number;
  donors_total: number;
  donors_month: number;
  first_donation_at: string | null;
}

export interface DonationsGoalProgress {
  percent: number;
  month_clp: number;
  donors_total: number;
  donors_month: number;
}

export interface MyDonationStats {
  total_clp: number;
  month_clp: number;
  donation_count: number;
  first_donation_at: string | null;
  last_donation_at: string | null;
  /** Fecha de creacion de la cuenta del user (para calcular meses usando la app). */
  account_created_at: string | null;
  /** Meses (redondeados hacia arriba, minimo 1) desde que se registro en Paw Friend. */
  account_months: number;
  /** Promedio mensual = total_clp / account_months. "Simulando membresia voluntaria". */
  avg_monthly_clp: number;
}

/** Historial detallado del user (para pagina /paw-member). */
export interface MyDonationRecord {
  id: string;
  amount_clp: number;
  status: string;
  message: string | null;
  is_public: boolean;
  paid_at: string | null;
  created_at: string;
  source: string | null;
}

export function usePublicDonations(limit = 30) {
  return useQuery({
    queryKey: ['public-donations', limit],
    queryFn: async (): Promise<PublicDonation[]> => {
      const { data, error } = await supabase.rpc('get_public_donations', { p_limit: limit });
      if (error) throw error;
      return (data ?? []) as PublicDonation[];
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}

export function usePublicDonationStats() {
  return useQuery({
    queryKey: ['public-donation-stats'],
    queryFn: async (): Promise<PublicDonationStats | null> => {
      const { data, error } = await supabase.rpc('get_donations_public_stats');
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return null;
      return {
        total_clp: Number(row.total_clp ?? 0),
        month_clp: Number(row.month_clp ?? 0),
        donors_total: Number(row.donors_total ?? 0),
        donors_month: Number(row.donors_month ?? 0),
        first_donation_at: row.first_donation_at ?? null,
      };
    },
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });
}

/**
 * Progreso publico hacia la meta (NO expone total recaudado exacto).
 */
export function useDonationsGoalProgress() {
  return useQuery({
    queryKey: ['donations-goal-progress'],
    queryFn: async (): Promise<DonationsGoalProgress | null> => {
      const { data, error } = await supabase.rpc('get_donations_goal_progress');
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return null;
      return {
        percent: Math.max(0, Math.min(100, Number(row.percent ?? 0))),
        month_clp: Number(row.month_clp ?? 0),
        donors_total: Number(row.donors_total ?? 0),
        donors_month: Number(row.donors_month ?? 0),
      };
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}

/**
 * Aporte acumulado del user logueado (membresia simulada). Null si no ha donado.
 *
 * Incluye `avg_monthly_clp` calculado como total / meses_desde_registro para
 * mostrar "si tuvieras una membresia mensual, estarias aportando ~$X".
 */
export function useMyDonationStats(enabled = true) {
  return useQuery({
    queryKey: ['my-donation-stats'],
    enabled,
    queryFn: async (): Promise<MyDonationStats | null> => {
      // 1. Stats del RPC (total, month, count, first/last donation).
      const { data: statsData, error: statsError } = await supabase.rpc('get_my_donation_stats');
      if (statsError) throw statsError;
      const row = Array.isArray(statsData) ? statsData[0] : statsData;
      if (!row) return null;
      const total = Number(row.total_clp ?? 0);
      if (total === 0) return null;

      // 2. Fecha de creacion de la cuenta (profile.created_at). Solo el user
      // puede leer su propio profile por RLS.
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      let accountCreatedAt: string | null = null;
      if (userId) {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', userId)
          .maybeSingle();
        accountCreatedAt = (profileRow as { created_at: string | null } | null)?.created_at ?? null;
      }

      // 3. Calcular meses activos (minimo 1) y promedio mensual.
      let accountMonths = 1;
      if (accountCreatedAt) {
        const startMs = new Date(accountCreatedAt).getTime();
        const nowMs = Date.now();
        const diffMs = Math.max(0, nowMs - startMs);
        const msInMonth = 30.44 * 24 * 60 * 60 * 1000;
        accountMonths = Math.max(1, Math.ceil(diffMs / msInMonth));
      }
      const avgMonthlyClp = Math.round(total / accountMonths);

      return {
        total_clp: total,
        month_clp: Number(row.month_clp ?? 0),
        donation_count: Number(row.donation_count ?? 0),
        first_donation_at: row.first_donation_at ?? null,
        last_donation_at: row.last_donation_at ?? null,
        account_created_at: accountCreatedAt,
        account_months: accountMonths,
        avg_monthly_clp: avgMonthlyClp,
      };
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}

/**
 * Historial de donaciones del user logueado para /paw-member.
 * Respeta RLS (donations policy "donations_own_read" permite SELECT solo
 * cuando user_id = auth.uid()).
 */
export function useMyDonationHistory(enabled = true) {
  return useQuery({
    queryKey: ['my-donation-history'],
    enabled,
    queryFn: async (): Promise<MyDonationRecord[]> => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('donations' as any)
        .select('id, amount_clp, status, message, is_public, paid_at, created_at, source')
        .order('paid_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as MyDonationRecord[];
    },
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
  });
}
