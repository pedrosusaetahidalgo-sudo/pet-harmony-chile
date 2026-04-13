/* eslint-disable @typescript-eslint/no-explicit-any */
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
 * Muestra las top N cards más escaneadas/coleccionadas.
 */
export function usePawCardRanking(limit = 10) {
  return useQuery({
    queryKey: ['paw-card-ranking', limit],
    queryFn: async (): Promise<RankedPawCard[]> => {
      // Aggregate collector counts per pet from paw_card_collections
      const { data: counts, error } = (await (supabase.rpc as any)('get_paw_card_ranking', {
        result_limit: limit,
      })) as {
        data: any[] | null;
        error: any;
      };

      // Fallback: if RPC doesn't exist, query manually
      if (error || !counts) {
        // Manual aggregation: get all collections grouped by pet_id
        const { data: collections } = (await (supabase
          .from('paw_card_collections' as any)
          .select('pet_id') as any)) as { data: any[] | null };

        if (!collections || collections.length === 0) return [];

        // Count per pet_id
        const countMap = new Map<string, number>();
        collections.forEach((c: any) => {
          countMap.set(c.pet_id, (countMap.get(c.pet_id) || 0) + 1);
        });

        // Sort by count descending, take top N
        const topPetIds = [...countMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);

        if (topPetIds.length === 0) return [];

        // Fetch pet details
        const petIds = topPetIds.map(([id]) => id);
        const { data: pets } = (await (
          supabase
            .from('pets')
            .select('id, name, species, photo_url, holo_pattern, paw_card_id, owner_id') as any
        ).in('id', petIds)) as { data: any[] | null };

        if (!pets) return [];

        const petMap = new Map(pets.map((p: any) => [p.id, p]));

        // Fetch owner names
        const ownerIds = [...new Set(pets.map((p: any) => p.owner_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', ownerIds as string[]);

        const profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

        return topPetIds
          .map(([petId, count]) => {
            const pet = petMap.get(petId);
            if (!pet) return null;
            return {
              petId: pet.id,
              petName: pet.name,
              species: pet.species,
              photoUrl: pet.photo_url,
              pawCardId: pet.paw_card_id || '',
              holoPattern: pet.holo_pattern || 'holo-none',
              ownerName: profileMap.get(pet.owner_id) || null,
              collectorCount: count,
            };
          })
          .filter(Boolean) as RankedPawCard[];
      }

      return counts as RankedPawCard[];
    },
    staleTime: 5 * 60_000,
  });
}
