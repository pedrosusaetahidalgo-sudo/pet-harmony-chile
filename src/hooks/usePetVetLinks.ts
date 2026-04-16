import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export interface PetVetLink {
  id: string;
  pet_id: string;
  owner_id: string;
  provider_id: string;
  status: 'pending' | 'active' | 'rejected' | 'revoked_by_owner' | 'revoked_by_vet';
  message: string | null;
  created_at: string;
  responded_at: string | null;
  revoked_at: string | null;
}

export interface PetVetLinkWithDetails extends PetVetLink {
  pets?: {
    id: string;
    name: string | null;
    species: string | null;
    breed: string | null;
    birth_date: string | null;
    photo_url: string | null;
    weight: number | null;
    gender: string | null;
  } | null;
  profiles?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  service_providers?: {
    id: string;
    display_name: string | null;
    comuna: string | null;
    specialty: string | null;
    user_id: string | null;
  } | null;
}

/** Links for a specific pet (owner view) */
export function usePetVetLinksByPet(petId: string | undefined) {
  return useQuery({
    queryKey: ['pet-vet-links', 'by-pet', petId],
    queryFn: async () => {
      if (!petId) return [] as PetVetLinkWithDetails[];
      const { data, error } = await sb
        .from('pet_vet_links')
        .select('*, service_providers(id, display_name, comuna, specialty, user_id)')
        .eq('pet_id', petId)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false });
      if (error) return [] as PetVetLinkWithDetails[];
      return (data || []) as PetVetLinkWithDetails[];
    },
    enabled: !!petId,
  });
}

/** Pending links for a vet (provider dashboard view) */
export function usePendingVetLinks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pet-vet-links', 'pending', user?.id],
    queryFn: async () => {
      if (!user) return [] as PetVetLinkWithDetails[];
      // Get provider id first
      const { data: providerRow } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!providerRow?.id) return [] as PetVetLinkWithDetails[];

      const { data, error } = await sb
        .from('pet_vet_links')
        .select(
          '*, pets(id, name, species, breed, birth_date, photo_url, weight, gender), profiles!pet_vet_links_owner_id_fkey(id, display_name, avatar_url)'
        )
        .eq('provider_id', providerRow.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) return [] as PetVetLinkWithDetails[];
      return (data || []) as PetVetLinkWithDetails[];
    },
    enabled: !!user,
  });
}

/** Active linked patients for a vet */
export function useLinkedPatients() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pet-vet-links', 'active', user?.id],
    queryFn: async () => {
      if (!user) return [] as PetVetLinkWithDetails[];
      const { data: providerRow } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!providerRow?.id) return [] as PetVetLinkWithDetails[];

      const { data, error } = await sb
        .from('pet_vet_links')
        .select(
          '*, pets(id, name, species, breed, birth_date, photo_url, weight, gender), profiles!pet_vet_links_owner_id_fkey(id, display_name, avatar_url)'
        )
        .eq('provider_id', providerRow.id)
        .eq('status', 'active')
        .order('responded_at', { ascending: false });
      if (error) return [] as PetVetLinkWithDetails[];
      return (data || []) as PetVetLinkWithDetails[];
    },
    enabled: !!user,
  });
}

/** Create a link request (owner sends to vet) */
export function useCreatePetVetLink() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      petId,
      providerId,
      message,
    }: {
      petId: string;
      providerId: string;
      message?: string;
    }) => {
      if (!user) throw new Error('No autenticado');

      // Atomic upsert: inserts on first request, recycles rejected/revoked links on retry.
      // Guard against re-opening an already active/pending link is handled by the
      // status check on the returned row — the DB constraint (pet_id, provider_id)
      // guarantees only one row exists, so no TOCTOU window.
      const { data, error } = await sb
        .from('pet_vet_links')
        .upsert(
          {
            pet_id: petId,
            owner_id: user.id,
            provider_id: providerId,
            status: 'pending',
            message: message || null,
            responded_at: null,
            revoked_at: null,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'pet_id,provider_id' }
        )
        .select()
        .single();
      if (error) throw error;
      const result = data as PetVetLink;
      if (result.status === 'active') {
        throw new Error('Ya tienes acceso activo con este veterinario');
      }
      return result;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pet-vet-links', 'by-pet', vars.petId] });
      toast.success('Solicitud enviada correctamente');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al enviar solicitud');
    },
  });
}

/** Vet accepts a link request */
export function useAcceptPetVetLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await sb
        .from('pet_vet_links')
        .update({ status: 'active', responded_at: new Date().toISOString() })
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pet-vet-links'] });
      toast.success('Paciente aceptado');
    },
    onError: () => toast.error('Error al aceptar solicitud'),
  });
}

/** Vet rejects a link request */
export function useRejectPetVetLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await sb
        .from('pet_vet_links')
        .update({ status: 'rejected', responded_at: new Date().toISOString() })
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pet-vet-links'] });
      toast.success('Solicitud rechazada');
    },
    onError: () => toast.error('Error al rechazar solicitud'),
  });
}

/** Vet requests access to a pet (vet-initiated, owner must accept) */
export function useRequestVetAccess() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ petId }: { petId: string }) => {
      if (!user) throw new Error('No autenticado');

      // Get vet's provider ID
      const { data: providerRow } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!providerRow?.id) throw new Error('No tienes un perfil de proveedor registrado');

      // Get pet owner
      const { data: pet } = await sb.from('pets').select('owner_id').eq('id', petId).single();
      if (!pet?.owner_id) throw new Error('No se encontró la mascota o no tiene dueño asignado');

      // Atomic upsert: inserts on first QR scan, recycles rejected/revoked links on retry.
      // The DB UNIQUE constraint (pet_id, provider_id) ensures no TOCTOU window.
      const { data, error } = await sb
        .from('pet_vet_links')
        .upsert(
          {
            pet_id: petId,
            owner_id: pet.owner_id,
            provider_id: providerRow.id,
            status: 'pending',
            message: 'Solicitud de acceso via QR',
            responded_at: null,
            revoked_at: null,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'pet_id,provider_id' }
        )
        .select()
        .single();
      if (error) throw error;
      const result = data as PetVetLink;
      if (result.status === 'active') {
        throw new Error('Ya tienes acceso a esta mascota');
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pet-vet-links'] });
      toast.success('Solicitud enviada al dueño');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al solicitar acceso');
    },
  });
}

/** Owner revokes an active link */
export function useRevokePetVetLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await sb
        .from('pet_vet_links')
        .update({ status: 'revoked_by_owner', revoked_at: new Date().toISOString() })
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pet-vet-links'] });
      toast.success('Vinculacion revocada');
    },
    onError: () => toast.error('Error al revocar vinculacion'),
  });
}
