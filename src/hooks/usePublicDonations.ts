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
 */
export function useMyDonationStats(enabled = true) {
  return useQuery({
    queryKey: ['my-donation-stats'],
    enabled,
    queryFn: async (): Promise<MyDonationStats | null> => {
      const { data, error } = await supabase.rpc('get_my_donation_stats');
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return null;
      const total = Number(row.total_clp ?? 0);
      if (total === 0) return null;
      return {
        total_clp: total,
        month_clp: Number(row.month_clp ?? 0),
        donation_count: Number(row.donation_count ?? 0),
        first_donation_at: row.first_donation_at ?? null,
        last_donation_at: row.last_donation_at ?? null,
      };
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}
