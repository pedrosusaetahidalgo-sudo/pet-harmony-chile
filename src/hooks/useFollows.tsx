import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

export interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutualFollow: boolean;
  followerCount: number;
  followingCount: number;
}

export const useFollows = (targetUserId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get follow status
  // Single RPC replaces 4 sequential queries
  const {
    data: followStatus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['follows', user?.id, targetUserId],
    queryFn: async (): Promise<FollowStatus | null> => {
      if (!user?.id || !targetUserId || user.id === targetUserId) {
        return null;
      }

      const { data, error: rpcError } = await supabase.rpc('get_follow_status', {
        p_viewer_id: user.id,
        p_target_id: targetUserId,
      });

      if (rpcError) {
        // Fallback: 4 sequential queries if RPC not yet deployed
        const [f1, f2, f3, f4] = await Promise.all([
          supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', targetUserId)
            .maybeSingle(),
          supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', targetUserId)
            .eq('following_id', user.id)
            .maybeSingle(),
          supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', targetUserId),
          supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', targetUserId),
        ]);
        return {
          isFollowing: !!f1.data,
          isFollowedBy: !!f2.data,
          isMutualFollow: !!f1.data && !!f2.data,
          followerCount: f3.count || 0,
          followingCount: f4.count || 0,
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = data as any;
      return {
        isFollowing: result.is_following,
        isFollowedBy: result.is_followed_by,
        isMutualFollow: result.is_following && result.is_followed_by,
        followerCount: result.follower_count || 0,
        followingCount: result.following_count || 0,
      };
    },
    enabled: !!user?.id && !!targetUserId && user.id !== targetUserId,
    staleTime: 5 * 60 * 1000,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !targetUserId) throw new Error('User not authenticated');

      const { error } = await supabase.from('user_follows').insert({
        follower_id: user.id,
        following_id: targetUserId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows', user?.id, targetUserId] });
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !targetUserId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows', user?.id, targetUserId] });
    },
  });

  return {
    followStatus,
    isLoading,
    error,
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isFollowing: followMutation.isPending || unfollowMutation.isPending,
  };
};

export const useIsBlocked = (targetUserId?: string) => {
  const { user } = useAuth();

  const { data: isBlocked } = useQuery({
    queryKey: ['blocked', user?.id, targetUserId],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id || !targetUserId) return false;

      // Check if either user has blocked the other
      const { data, error } = await supabase.rpc('is_user_blocked', {
        blocker_id: user.id,
        blocked_id: targetUserId,
      });

      if (error) {
        logger.error('Error checking block status:', error);
        return false;
      }

      return data || false;
    },
    enabled: !!user?.id && !!targetUserId,
    staleTime: 10 * 60 * 1000,
  });

  return isBlocked || false;
};
