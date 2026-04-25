/**
 * Hook que lee/genera la cédula digital de una mascota.
 *
 * Pilar 1 de la Trinidad del Corazón (Refactor Maestro §2.4.1).
 *
 * Flujo:
 *   1. Lee pet_id_cards WHERE pet_id = ? AND is_active = true
 *   2. Si NO existe → llama a edge fn `generate-pet-id-card` que crea uno
 *   3. Ensambla datos de pet + card + owner + vet → PetIdCardData
 *
 * El componente PetIdCardDisplay consume este shape directo.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PetIdCardData {
  pet_id: string;
  card_number: string;
  pet_name: string;
  species: string;
  breed?: string | null;
  birth_date?: string | null;
  photo_url?: string | null;
  nose_print_hash?: string | null;
  issued_at?: string | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  vet_name?: string | null;
  vet_phone?: string | null;
  blood_type?: string | null;
  allergies?: string | null;
  chronic_conditions?: string | null;
  emergency_contact?: string | null;
  microchip_number?: string | null;
  gender?: string | null;
  neutered?: boolean | null;
  color?: string | null;
  size?: string | null;
}

const PET_SELECT = `
  id, name, species, breed, birth_date, photo_url, microchip_number,
  gender, neutered, color, size, blood_type, allergies, chronic_conditions,
  emergency_vet_name, emergency_vet_phone, owner_id
`;

const CARD_SELECT = 'id, card_number, issued_at, default_qr_mode, is_active, version';

async function fetchOwnerProfile(ownerId: string | null) {
  if (!ownerId) return { name: null, phone: null };
  const { data } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', ownerId)
    .maybeSingle();
  return {
    name: (data?.full_name as string) ?? null,
    phone: (data?.phone as string) ?? null,
  };
}

export function usePetIdCard(petId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<PetIdCardData | null>({
    queryKey: ['pet-id-card', petId],
    enabled: !!petId,
    queryFn: async () => {
      if (!petId) return null;

      const [petRes, cardRes] = await Promise.all([
        supabase.from('pets').select(PET_SELECT).eq('id', petId).maybeSingle(),
        supabase
          .from('pet_id_cards')
          .select(CARD_SELECT)
          .eq('pet_id', petId)
          .eq('is_active', true)
          .maybeSingle(),
      ]);

      if (petRes.error) throw petRes.error;
      if (!petRes.data) return null;

      const pet = petRes.data as Record<string, unknown>;
      const owner = await fetchOwnerProfile((pet.owner_id as string) ?? null);

      // Si no hay card aún, devolvemos data parcial sin card_number
      // (el botón "Generar cédula" llama a la mutation)
      const card = cardRes.data as Record<string, unknown> | null;

      const allergies = pet.allergies as string[] | null;
      const chronicConds = pet.chronic_conditions as string[] | null;

      return {
        pet_id: petId,
        card_number: (card?.card_number as string) ?? '',
        pet_name: (pet.name as string) ?? '',
        species: (pet.species as string) ?? '',
        breed: (pet.breed as string) ?? null,
        birth_date: (pet.birth_date as string) ?? null,
        photo_url: (pet.photo_url as string) ?? null,
        nose_print_hash: null, // Se llena con feature de huella nasal (Fase 1)
        issued_at: (card?.issued_at as string) ?? null,
        owner_name: owner.name,
        owner_phone: owner.phone,
        vet_name: (pet.emergency_vet_name as string) ?? null,
        vet_phone: (pet.emergency_vet_phone as string) ?? null,
        blood_type: (pet.blood_type as string) ?? null,
        allergies: allergies && allergies.length > 0 ? allergies.join(', ') : null,
        chronic_conditions:
          chronicConds && chronicConds.length > 0 ? chronicConds.join(', ') : null,
        emergency_contact: null,
        microchip_number: (pet.microchip_number as string) ?? null,
        gender: (pet.gender as string) ?? null,
        neutered: (pet.neutered as boolean) ?? null,
        color: (pet.color as string) ?? null,
        size: (pet.size as string) ?? null,
      };
    },
  });

  const generate = useMutation({
    mutationFn: async () => {
      if (!petId) throw new Error('petId requerido');
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Sesión expirada');

      const supabaseUrl =
        (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
        'https://gwailbjlvevkhwcrovfd.supabase.co';

      const res = await fetch(`${supabaseUrl}/functions/v1/generate-pet-id-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pet_id: petId }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Error generando cédula: ${txt}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-id-card', petId] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    hasCard: !!query.data?.card_number,
    generate: generate.mutate,
    isGenerating: generate.isPending,
    generateError: generate.error,
  };
}

export type { PetIdCardData };
