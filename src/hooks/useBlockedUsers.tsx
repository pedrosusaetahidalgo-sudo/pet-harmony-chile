import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useBlockedUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['blocked-users', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id);
      return data?.map((b) => b.blocked_id) || [];
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 min cache
  });

  const blockedIds = new Set(data || []);

  const blockUser = useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user?.id) throw new Error('No autenticado');
      const { error } = await supabase
        .from('user_blocks')
        .insert({ blocker_id: user.id, blocked_id: blockedId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      toast.success('Usuario bloqueado');
    },
    onError: () => toast.error('No se pudo bloquear al usuario'),
  });

  const unblockUser = useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user?.id) throw new Error('No autenticado');
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      toast.success('Usuario desbloqueado');
    },
    onError: () => toast.error('No se pudo desbloquear al usuario'),
  });

  return {
    blockedIds,
    isBlocked: (userId: string) => blockedIds.has(userId),
    filterBlocked: <T extends { user_id?: string; owner_id?: string; id?: string }>(
      items: T[],
      userIdField: keyof T = 'user_id' as keyof T
    ) => items.filter((item) => !blockedIds.has(String(item[userIdField] || ''))),
    blockUser: blockUser.mutate,
    unblockUser: unblockUser.mutate,
    isBlocking: blockUser.isPending,
    isUnblocking: unblockUser.isPending,
  };
}
