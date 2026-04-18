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
