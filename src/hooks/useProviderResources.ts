import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export type ResourceType = 'room' | 'surgery' | 'equipment' | 'other';

export interface ProviderResource {
  id: string;
  provider_id: string;
  name: string;
  type: ResourceType;
  color: string;
  is_active: boolean;
  created_at: string;
}

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  room: 'Sala',
  surgery: 'Quirófano',
  equipment: 'Equipo',
  other: 'Otro',
};

export { RESOURCE_TYPE_LABELS };

export function useProviderResources(providerId: string | null) {
  return useQuery({
    queryKey: ['provider-resources', providerId],
    enabled: !!providerId,
    staleTime: 60_000,
    queryFn: async (): Promise<ProviderResource[]> => {
      const { data, error } = await sb
        .from('provider_resources')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerId,
      name,
      type,
      color,
    }: {
      providerId: string;
      name: string;
      type: ResourceType;
      color?: string;
    }) => {
      const { data, error } = await sb
        .from('provider_resources')
        .insert({ provider_id: providerId, name, type, color: color || '#9333ea' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['provider-resources', data.provider_id] });
      toast.success('Sala creada', { description: `${data.name} agregada` });
    },
    onError: () => {
      toast.error('Error al crear sala');
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resourceId, providerId }: { resourceId: string; providerId: string }) => {
      const { error } = await sb
        .from('provider_resources')
        .update({ is_active: false })
        .eq('id', resourceId);

      if (error) throw error;
      return { providerId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['provider-resources', result.providerId] });
      toast.success('Sala eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar sala');
    },
  });
}
