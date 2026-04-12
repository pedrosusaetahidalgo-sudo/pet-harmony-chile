/* eslint-disable @typescript-eslint/no-explicit-any */
// Los casts `as any` son temporales: holo_pattern, paw_card_id y paw_card_collections
// no existen en los tipos generados de Supabase hasta regenerarlos con `supabase gen types`.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PawCardData {
  petId: string;
  petName: string;
  species: string;
  breed: string | null;
  photoUrl: string | null;
  holoPattern: string;
  pawCardId: string;
  ownerName: string | null;
  collectorCount: number;
}

interface PetWithPawCard {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  photo_url: string | null;
  holo_pattern: string | null;
  paw_card_id: string | null;
  owner_id: string;
}

/**
 * Fetch Paw Card data by paw_card_id (for public landing page).
 *
 * Nota: holo_pattern y paw_card_id son columnas nuevas (migracion 20260412180000).
 * Los tipos generados de Supabase aun no las incluyen, por eso se usa casting.
 */
export function usePawCard(pawCardId: string | undefined) {
  return useQuery({
    queryKey: ['paw-card', pawCardId],
    queryFn: async (): Promise<PawCardData | null> => {
      if (!pawCardId) return null;

      // Fetch pet by paw_card_id (cast needed: new columns not in generated types yet)
      const { data: pet, error } = (await (
        supabase
          .from('pets')
          .select('id, name, species, breed, photo_url, holo_pattern, paw_card_id, owner_id') as any
      )
        .eq('paw_card_id', pawCardId)
        .maybeSingle()) as { data: PetWithPawCard | null; error: any };

      if (error || !pet) return null;

      // Fetch owner display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', pet.owner_id)
        .maybeSingle();

      // Count collectors (new table, cast needed)
      const { count } = (await (
        supabase
          .from('paw_card_collections' as any)
          .select('id', { count: 'exact', head: true }) as any
      ).eq('pet_id', pet.id)) as { count: number | null };

      return {
        petId: pet.id,
        petName: pet.name,
        species: pet.species,
        breed: pet.breed,
        photoUrl: pet.photo_url,
        holoPattern: pet.holo_pattern || 'holo-none',
        pawCardId: pet.paw_card_id || '',
        ownerName: profile?.display_name || null,
        collectorCount: count ?? 0,
      };
    },
    enabled: !!pawCardId,
    staleTime: 30_000,
  });
}

/**
 * Check if current user already collected a specific paw card.
 */
export function useHasCollected(petId: string | undefined) {
  return useQuery({
    queryKey: ['paw-card-collected', petId],
    queryFn: async () => {
      if (!petId) return false;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = (await (supabase.from('paw_card_collections' as any).select('id') as any)
        .eq('collector_id', user.id)
        .eq('pet_id', petId)
        .maybeSingle()) as { data: any };

      return !!data;
    },
    enabled: !!petId,
  });
}

/**
 * Collect a paw card (add to collection).
 */
export async function collectPawCard(petId: string): Promise<{ success: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Debes iniciar sesion para coleccionar' };

  // Check if it's own pet
  const { data: pet } = await supabase
    .from('pets')
    .select('owner_id')
    .eq('id', petId)
    .maybeSingle();

  if (pet?.owner_id === user.id) {
    return { success: false, error: 'No puedes coleccionar tus propias Paw Cards' };
  }

  const { error } = (await (supabase
    .from('paw_card_collections' as any)
    .insert({ collector_id: user.id, pet_id: petId }) as any)) as { error: any };

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Ya tienes esta Paw Card' };
    return { success: false, error: error.message };
  }

  return { success: true };
}
