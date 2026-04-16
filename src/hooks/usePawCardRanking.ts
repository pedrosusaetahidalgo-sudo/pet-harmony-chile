import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RankedPawCard {
  petId: string;
  petName: string;
  species: string;
  photoUrl: string | null;
  pawCardId: string;
  holoPattern: string;
  ownerName: string | null;
  collectorCount: number;
}

/**
 * Ranking global de Paw Cards ordenadas por cantidad de coleccionistas.
 * Uses server-side RPC `get_paw_card_ranking` for efficient aggregation
 * (single query with JOIN instead of client-side 500-row processing).
 */
export function usePawCardRanking(limit = 10) {
  return useQuery({
    queryKey: ['paw-card-ranking', limit],
    queryFn: async (): Promise<RankedPawCard[]> => {
      const { data, error } = await supabase.rpc('get_paw_card_ranking', {
        result_limit: limit,
      });

      if (error) {
        console.error('get_paw_card_ranking RPC error:', error);
        return [];
      }

      return (data ?? []) as RankedPawCard[];
    },
    staleTime: 5 * 60_000,
  });
}
