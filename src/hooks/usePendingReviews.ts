import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PendingReview {
  id: string;
  target_user_id: string;
  target_type: string;
  transaction_id: string;
  pet_id: string | null;
  expires_at: string;
  created_at: string;
  // joined
  provider_name?: string;
  pet_name?: string;
}

/**
 * Fetch pending reviews for the current user.
 * Uses the pending_reviews table (migration 20260422000003).
 * Falls back gracefully if the table doesn't exist yet (migration not applied).
 */
export function usePendingReviews() {
  const { user } = useAuth();

  return useQuery<PendingReview[]>({
    queryKey: ['pending-reviews', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        const sb = supabase as unknown as {
          from: (table: string) => ReturnType<typeof supabase.from>;
        };
        const { data, error } = await sb
          .from('pending_reviews')
          .select('*')
          .eq('user_id', user!.id)
          .is('completed_at', null)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          // Table may not exist yet - fail silently
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            return [];
          }
          throw error;
        }
        return (data ?? []) as PendingReview[];
      } catch {
        return [];
      }
    },
  });
}

export function usePendingReviewCount() {
  const { data } = usePendingReviews();
  return data?.length ?? 0;
}
