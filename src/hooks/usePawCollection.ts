/* eslint-disable @typescript-eslint/no-explicit-any */
// Los casts `as any` son temporales: paw_card_collections no existe en los tipos
// generados de Supabase hasta regenerarlos con `supabase gen types`.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CollectedCard {
  id: string;
  collectedAt: string;
  isOwn: boolean;
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    photoUrl: string | null;
    holoPattern: string;
    pawCardId: string;
  };
  ownerName: string | null;
}

export interface CollectionStats {
  total: number;
  ownCards: number;
}

/**
 * Fetch the current user's paw card collection.
 *
 * Nota: paw_card_collections es tabla nueva (migracion 20260412180000).
 * Los tipos generados de Supabase aun no la incluyen, por eso se usa casting.
 */
export function usePawCollection() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['paw-collection', user?.id],
    queryFn: async (): Promise<CollectedCard[]> => {
      if (!user) return [];

      // 1. Fetch own pets first — always shown in collection
      const { data: ownPets } = await supabase
        .from('pets')
        .select(
          'id, name, species, breed, photo_url, holo_pattern, paw_card_id, owner_id, created_at'
        )
        .eq('owner_id', user.id)
        .eq('lifecycle_status', 'active')
        .order('created_at', { ascending: false });

      const ownCards: CollectedCard[] = (ownPets ?? []).map((pet) => ({
        id: `own-${pet.id}`,
        collectedAt: pet.created_at || new Date().toISOString(),
        isOwn: true,
        pet: {
          id: pet.id,
          name: pet.name,
          species: pet.species || '',
          breed: pet.breed,
          photoUrl: pet.photo_url,
          holoPattern: pet.holo_pattern || 'holo-none',
          pawCardId: pet.paw_card_id || '',
        },
        ownerName: null,
      }));

      // 2. Fetch collected cards from others (new table, cast needed)
      const { data, error } = (await (
        supabase.from('paw_card_collections' as any).select('id, collected_at, pet_id') as any
      )
        .eq('collector_id', user.id)
        .order('collected_at', { ascending: false })) as { data: any[] | null; error: any };

      if (error || !data || data.length === 0) return ownCards;

      // Fetch pet details for each collected card
      const petIds = data.map((d: any) => d.pet_id);
      const { data: pets } = (await (
        supabase
          .from('pets')
          .select('id, name, species, breed, photo_url, holo_pattern, paw_card_id, owner_id') as any
      ).in('id', petIds)) as { data: any[] | null };

      if (!pets) return ownCards;

      const petMap = new Map(pets.map((p: any) => [p.id, p]));

      // Get unique owner IDs for display names
      const ownerIds = [...new Set(pets.map((p: any) => p.owner_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', ownerIds as string[]);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

      const collectedCards: CollectedCard[] = data
        .map((item: any) => {
          const pet = petMap.get(item.pet_id);
          if (!pet) return null;
          return {
            id: item.id,
            collectedAt: item.collected_at,
            isOwn: false,
            pet: {
              id: pet.id,
              name: pet.name,
              species: pet.species,
              breed: pet.breed,
              photoUrl: pet.photo_url,
              holoPattern: pet.holo_pattern || 'holo-none',
              pawCardId: pet.paw_card_id || '',
            },
            ownerName: profileMap.get(pet.owner_id) || null,
          };
        })
        .filter(Boolean) as CollectedCard[];

      // Own cards first, then collected
      return [...ownCards, ...collectedCards];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

/**
 * Fetch collection stats.
 */
export function usePawCollectionStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['paw-collection-stats', user?.id],
    queryFn: async (): Promise<CollectionStats> => {
      if (!user) return { total: 0, ownCards: 0 };

      // Count collected (new table, cast needed)
      const { count: total } = (await (
        supabase
          .from('paw_card_collections' as any)
          .select('id', { count: 'exact', head: true }) as any
      ).eq('collector_id', user.id)) as { count: number | null };

      // Count own cards
      const { count: ownCards } = await supabase
        .from('pets')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .eq('lifecycle_status', 'active');

      return {
        total: total ?? 0,
        ownCards: ownCards ?? 0,
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
