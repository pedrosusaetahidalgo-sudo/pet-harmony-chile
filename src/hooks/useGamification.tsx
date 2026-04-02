import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getLevelFromPoints, type LevelInfo } from "@/lib/levels";

export interface UserGamification {
  points: number;
  level: number;
  followers_count: number;
  following_count: number;
  posts_count: number;
  pets_count: number;
}

export interface Achievement {
  id: string;
  achievement_name: string;
  achievement_type: string;
  achievement_description: string | null;
  points_earned: number | null;
  earned_at: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  mission_type: string;
  target_action: string;
  target_count: number;
  points_reward: number;
  category: string;
  progress?: number;
  completed?: boolean;
  expires_at?: string;
}

export const useGamification = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const queryClient = useQueryClient();

  // Get user gamification stats from user_stats table
  const { data: stats, isLoading } = useQuery({
    queryKey: ["gamification", targetUserId],
    queryFn: async (): Promise<UserGamification | null> => {
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from("user_stats")
        .select("level, total_points, followers_count, following_count, posts_count, pets_count")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        points: data.total_points ?? 0,
        level: data.level ?? 1,
        followers_count: data.followers_count ?? 0,
        following_count: data.following_count ?? 0,
        posts_count: data.posts_count ?? 0,
        pets_count: data.pets_count ?? 0,
      };
    },
    enabled: !!targetUserId,
  });

  // Get user achievements directly (no FK join)
  const { data: achievements } = useQuery({
    queryKey: ["achievements", targetUserId],
    queryFn: async (): Promise<Achievement[]> => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select("id, achievement_name, achievement_type, achievement_description, points_earned, earned_at")
        .eq("user_id", targetUserId)
        .order("earned_at", { ascending: false });

      if (error) throw error;

      return (data || []) as Achievement[];
    },
    enabled: !!targetUserId,
  });

  // Get active missions from paw_missions + user_mission_progress
  const { data: missions } = useQuery({
    queryKey: ["missions", targetUserId],
    queryFn: async (): Promise<Mission[]> => {
      if (!targetUserId) return [];

      // Get active missions from paw_missions
      const { data: activeMissions, error: missionsError } = await supabase
        .from("paw_missions")
        .select("*")
        .eq("is_active", true)
        .order("mission_type", { ascending: true });

      if (missionsError) throw missionsError;

      // Get user mission progress
      const { data: userProgress, error: progressError } = await supabase
        .from("user_mission_progress")
        .select("*")
        .eq("user_id", targetUserId);

      if (progressError) throw progressError;

      // Combine missions with progress
      return (activeMissions || []).map((mission) => {
        const progress = (userProgress || []).find((up) => up.mission_id === mission.id);
        return {
          id: mission.id,
          title: mission.title,
          description: mission.description,
          mission_type: mission.mission_type,
          target_action: mission.target_action,
          target_count: mission.target_count,
          points_reward: mission.points_reward,
          category: mission.category,
          progress: progress?.current_progress || 0,
          completed: progress?.is_completed || false,
          expires_at: progress?.expires_at || undefined,
        };
      });
    },
    enabled: !!targetUserId,
  });

  // Award points mutation
  const awardPointsMutation = useMutation({
    mutationFn: async ({
      points,
      actionType,
      actionId,
      description,
    }: {
      points: number;
      actionType: string;
      actionId?: string;
      description?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Call Supabase function to award points
      const { data, error } = await supabase.rpc("award_points", {
        p_user_id: user.id,
        p_points: points,
        p_action_type: actionType,
        p_action_id: actionId || null,
        p_description: description || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gamification", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["achievements", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["missions", targetUserId] });
    },
  });

  const levelInfo: LevelInfo | null = stats ? getLevelFromPoints(stats.points) : null;

  return {
    stats,
    levelInfo,
    achievements: achievements || [],
    missions: missions || [],
    isLoading,
    awardPoints: awardPointsMutation.mutate,
    isAwarding: awardPointsMutation.isPending,
  };
};
