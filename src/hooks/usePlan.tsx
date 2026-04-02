import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PLANS, canAccess, PlanId } from '@/lib/plans';

export function usePlan() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['user-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('plan_id, plan_expires_at, plan_badge, is_premium')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const planId: PlanId = (profile?.plan_id as PlanId) || 'free';
  const plan = PLANS[planId];

  const checkAccess = useCallback(
    (feature: string, currentUsage?: number) => canAccess(planId, feature, currentUsage),
    [planId]
  );

  return {
    planId,
    plan,
    isPremium: planId !== 'free',
    badge: profile?.plan_badge || '',
    expiresAt: profile?.plan_expires_at,
    checkAccess,
  };
}
