import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface QuickNote {
  id: string;
  pet_id: string;
  provider_id: string;
  content: string;
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'gray';
  created_at: string;
  updated_at: string;
}

export function useVetQuickNotes(petId: string | undefined, providerId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ['vet-quick-notes', petId, providerId];

  const { data: notes = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!petId || !providerId) return [];
      const { data, error } = await supabase
        .from('vet_quick_notes')
        .select('*')
        .eq('pet_id', petId)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as QuickNote[];
    },
    enabled: !!petId && !!providerId,
  });

  const addNote = useMutation({
    mutationFn: async ({
      content,
      color = 'yellow',
    }: {
      content: string;
      color?: QuickNote['color'];
    }) => {
      if (!petId || !providerId) throw new Error('Missing petId or providerId');
      const { error } = await supabase
        .from('vet_quick_notes')
        .insert({ pet_id: petId, provider_id: providerId, content, color });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast.success('Nota guardada');
    },
    onError: () => toast.error('No se pudo guardar la nota'),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase
        .from('vet_quick_notes')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: () => toast.error('No se pudo actualizar la nota'),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vet_quick_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast.success('Nota eliminada');
    },
    onError: () => toast.error('No se pudo eliminar la nota'),
  });

  return { notes, isLoading, addNote, updateNote, deleteNote };
}
