import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DonorTier = 'bronze' | 'silver' | 'gold';

export interface DonorBadgeData {
  tier: DonorTier;
  first_donation_at: string;
  donation_count: number;
}

export function useDonorBadge(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['donor-badge', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<DonorBadgeData | null> => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc('get_user_donor_badge', {
        p_user_id: userId,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || !row.tier) return null;
      return {
        tier: row.tier as DonorTier,
        first_donation_at: row.first_donation_at,
        donation_count: Number(row.donation_count ?? 0),
      };
    },
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });
}
