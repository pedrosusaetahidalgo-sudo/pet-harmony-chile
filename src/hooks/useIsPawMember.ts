import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PawMemberInfo {
  is_member: boolean;
  plan_id: string | null;
  member_since: string | null;
}

/**
 * Devuelve info de membresia Paw Member del usuario. Membresia voluntaria
 * que NO desbloquea features — solo otorga badge visual y reconocimiento.
 *
 * Consideramos Paw Member a cualquier profile con is_premium=true (historico)
 * o plan_id='paw_member'/'premium'. El id 'premium' es legacy (misma cosa).
 */
export function useIsPawMember(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['paw-member', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<PawMemberInfo | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('is_premium, plan_id, premium_start_date')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const planId = (data as { plan_id: string | null }).plan_id ?? null;
      const isMember =
        Boolean((data as { is_premium: boolean | null }).is_premium) ||
        planId === 'premium' ||
        planId === 'paw_member';
      return {
        is_member: isMember,
        plan_id: planId,
        member_since: (data as { premium_start_date: string | null }).premium_start_date ?? null,
      };
    },
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });
}
