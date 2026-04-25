/**
 * Hooks para tabla adoption_processes (refactor Bloque 2).
 *
 * - useAdopterProcesses: el adopter ve sus procesos (filtra por adopter_user_id implícito por RLS)
 * - useShelterProcesses: el shelter dueño ve los procesos de sus mascotas
 * - useUpdateAdoptionProcess: muta status, notas, fecha visita, motivo de rechazo
 * - useCreateAdoptionProcess: refugio crea proceso desde un interés
 *
 * Ver REFACTOR_ADOPCION_2026_04_24.md §3.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AdoptionProcessStatus =
  | 'interested'
  | 'contacted'
  | 'visit_scheduled'
  | 'visit_done'
  | 'approved'
  | 'rejected'
  | 'transferred';

export type AdoptionProcess = {
  id: string;
  pet_id: string;
  adopter_user_id: string;
  shelter_id: string;
  source_interest_id: string | null;
  status: AdoptionProcessStatus;
  notes_shelter: string | null;
  notes_adopter: string | null;
  visit_date: string | null;
  rejected_reason: string | null;
  approved_at: string | null;
  transferred_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdoptionProcessWithPet = AdoptionProcess & {
  pet: {
    id: string;
    name: string;
    species: string;
    photo_url: string | null;
    breed: string | null;
  } | null;
  shelter: {
    id: string;
    legal_name: string;
    slug: string | null;
    commune: string;
    logo_url: string | null;
  } | null;
};

const PET_SELECT = 'id, name, species, photo_url, breed';
const SHELTER_SELECT = 'id, legal_name, slug, commune, logo_url';

export function useAdopterProcesses() {
  const { user } = useAuth();
  return useQuery<AdoptionProcessWithPet[]>({
    queryKey: ['adoption-processes', 'adopter', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('adoption_processes')
        .select(
          `*,
          pet:pets!pet_id (${PET_SELECT}),
          shelter:adoption_centers!shelter_id (${SHELTER_SELECT})`
        )
        .eq('adopter_user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as AdoptionProcessWithPet[]) ?? [];
    },
    enabled: !!user?.id,
  });
}

export function useShelterProcesses(shelterId: string | undefined) {
  return useQuery<AdoptionProcessWithPet[]>({
    queryKey: ['adoption-processes', 'shelter', shelterId],
    queryFn: async () => {
      if (!shelterId) return [];
      const { data, error } = await supabase
        .from('adoption_processes')
        .select(
          `*,
          pet:pets!pet_id (${PET_SELECT}),
          shelter:adoption_centers!shelter_id (${SHELTER_SELECT})`
        )
        .eq('shelter_id', shelterId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as AdoptionProcessWithPet[]) ?? [];
    },
    enabled: !!shelterId,
    staleTime: 30_000,
  });
}

export function useUpdateAdoptionProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      status?: AdoptionProcessStatus;
      notes_shelter?: string;
      notes_adopter?: string;
      visit_date?: string | null;
      rejected_reason?: string | null;
    }) => {
      const { id, ...patch } = params;
      const { data, error } = await supabase
        .from('adoption_processes')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AdoptionProcess;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoption-processes'] });
    },
  });
}

export function useCreateAdoptionProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      pet_id: string;
      adopter_user_id: string;
      shelter_id: string;
      source_interest_id?: string;
      initial_status?: AdoptionProcessStatus;
    }) => {
      const { data, error } = await supabase
        .from('adoption_processes')
        .insert({
          pet_id: params.pet_id,
          adopter_user_id: params.adopter_user_id,
          shelter_id: params.shelter_id,
          source_interest_id: params.source_interest_id ?? null,
          status: params.initial_status ?? 'interested',
        })
        .select()
        .single();
      if (error) throw error;
      return data as AdoptionProcess;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoption-processes'] });
    },
  });
}

export const STATUS_LABELS: Record<AdoptionProcessStatus, string> = {
  interested: 'Interesado',
  contacted: 'Contactado',
  visit_scheduled: 'Visita agendada',
  visit_done: 'Visita realizada',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  transferred: 'Transferido',
};

export const STATUS_ORDER: AdoptionProcessStatus[] = [
  'interested',
  'contacted',
  'visit_scheduled',
  'visit_done',
  'approved',
  'transferred',
  'rejected',
];

export const STATUS_COLORS: Record<AdoptionProcessStatus, string> = {
  interested: 'bg-blue-100 text-blue-800 border-blue-300',
  contacted: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  visit_scheduled: 'bg-purple-100 text-purple-800 border-purple-300',
  visit_done: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  transferred: 'bg-emerald-200 text-emerald-900 border-emerald-400',
};
