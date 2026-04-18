import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AdPlacement = 'home_feed' | 'donations_page' | 'vet_directory' | 'maps' | 'feed_top';

export interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  target_url: string;
  placement: AdPlacement;
  partner_id: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  impressions_count: number;
  clicks_count: number;
  priority: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdvertisementInput {
  title: string;
  description?: string | null;
  image_url?: string | null;
  target_url: string;
  placement: AdPlacement;
  partner_id?: string | null;
  start_date: string;
  end_date: string;
  is_active?: boolean;
  priority?: number;
  notes?: string | null;
}

export interface PlacementAd {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  target_url: string;
  placement: AdPlacement;
  partner_id: string | null;
}

/**
 * Lee 1 ad activo para un placement dado (via RPC).
 * Retorna null si no hay ad vigente.
 */
export function useAdForPlacement(placement: AdPlacement, enabled = true) {
  return useQuery({
    queryKey: ['ad-placement', placement],
    enabled,
    queryFn: async (): Promise<PlacementAd | null> => {
      const { data, error } = await supabase.rpc('get_ad_for_placement', {
        p_placement: placement,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return null;
      return row as PlacementAd;
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}

export function useTrackAdImpression() {
  return useMutation({
    mutationFn: async (adId: string) => {
      const { error } = await supabase.rpc('track_ad_impression', { p_ad_id: adId });
      if (error) throw error;
    },
  });
}

export function useTrackAdClick() {
  return useMutation({
    mutationFn: async (adId: string) => {
      const { error } = await supabase.rpc('track_ad_click', { p_ad_id: adId });
      if (error) throw error;
    },
  });
}

export function useAdminAdvertisements() {
  return useQuery({
    queryKey: ['advertisements', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('advertisements' as any)
        .select('*')
        .order('is_active', { ascending: false })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Advertisement[];
    },
    staleTime: 60_000,
  });
}

export function useUpsertAdvertisement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: AdvertisementInput }) => {
      if (id) {
        const { error } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from('advertisements' as any)
          .update(input)
          .eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('advertisements' as any)
        .insert(input)
        .select('id')
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['advertisements'] });
      qc.invalidateQueries({ queryKey: ['ad-placement'] });
    },
  });
}

export function useDeleteAdvertisement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('advertisements' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['advertisements'] });
      qc.invalidateQueries({ queryKey: ['ad-placement'] });
    },
  });
}
