import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const { data: followStatus, isLoading } = useQuery({
    queryKey: ["follows", user?.id, targetUserId],
    queryFn: async (): Promise<FollowStatus | null> => {
      if (!user?.id || !targetUserId || user.id === targetUserId) {
        return null;
      }

      // Check if current user follows target
      const { data: following } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();

      // Check if target follows current user
      const { data: followedBy } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", targetUserId)
        .eq("following_id", user.id)
        .maybeSingle();

      // Get follower/following counts
      const { count: followerCount } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUserId);

      const { count: followingCount } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", targetUserId);

      return {
        isFollowing: !!following,
        isFollowedBy: !!followedBy,
        isMutualFollow: !!following && !!followedBy,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
      };
    },
    enabled: !!user?.id && !!targetUserId && user.id !== targetUserId,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !targetUserId) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("user_follows")
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follows", user?.id, targetUserId] });
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !targetUserId) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follows", user?.id, targetUserId] });
    },
  });

  return {
    followStatus,
    isLoading,
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isFollowing: followMutation.isPending || unfollowMutation.isPending,
  };
};

export const useIsBlocked = (targetUserId?: string) => {
  const { user } = useAuth();

  const { data: isBlocked } = useQuery({
    queryKey: ["blocked", user?.id, targetUserId],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id || !targetUserId) return false;

      // Check if either user has blocked the other
      const { data, error } = await supabase
        .rpc("is_user_blocked", {
          blocker_id: user.id,
          blocked_id: targetUserId,
        });

      if (error) {
        console.error("Error checking block status:", error);
        return false;
      }

      return data || false;
    },
    enabled: !!user?.id && !!targetUserId,
  });

  return isBlocked || false;
};

