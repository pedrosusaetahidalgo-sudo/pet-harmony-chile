import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { PLANS, canAccess, PlanId } from '@/lib/plans';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

export function usePlan() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();

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

  // Trial detection: if premium with expiry in the past, treat as free
  const expiresAt = profile?.plan_expires_at;
  const isTrialExpired =
    expiresAt && profile?.plan_id === 'premium' && new Date(expiresAt) < new Date();
  const isTrialActive =
    expiresAt && profile?.plan_id === 'premium' && new Date(expiresAt) >= new Date();

  const effectivePlanId: PlanId = isTrialExpired ? 'free' : (profile?.plan_id as PlanId) || 'free';
  const plan = PLANS[effectivePlanId];

  // Days remaining in trial
  const trialDaysLeft = isTrialActive
    ? Math.max(0, Math.ceil((new Date(expiresAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const checkAccess = useCallback(
    (feature: string, currentUsage?: number) =>
      canAccess(effectivePlanId, feature, currentUsage, isAdmin),
    [effectivePlanId, isAdmin]
  );

  return {
    planId: effectivePlanId,
    plan,
    isPremium: !FEATURE_FLAGS.USER_PREMIUM || effectivePlanId !== 'free' || isAdmin,
    isAdmin,
    badge: profile?.plan_badge || '',
    expiresAt,
    isTrialActive: !!isTrialActive,
    trialDaysLeft,
    checkAccess,
  };
}
