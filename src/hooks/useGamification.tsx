import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserGamification {
  points: number;
  level: number;
  total_bookings: number;
  total_reviews: number;
  total_posts: number;
  total_adoptions: number;
  total_lost_pet_help: number;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
  category: string;
  unlocked_at?: string;
}

export interface Mission {
  id: string;
  code: string;
  name: string;
  description: string;
  mission_type: "daily" | "weekly" | "special";
  action_type: string;
  target_count: number;
  points_reward: number;
  progress?: number;
  completed?: boolean;
  expires_at?: string;
}

export const useGamification = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const queryClient = useQueryClient();

  // Get user gamification stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["gamification", targetUserId],
    queryFn: async (): Promise<UserGamification | null> => {
      if (!targetUserId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("points, level, total_bookings, total_reviews, total_posts, total_adoptions, total_lost_pet_help")
        .eq("id", targetUserId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!targetUserId,
  });

  // Get user achievements
  const { data: achievements } = useQuery({
    queryKey: ["achievements", targetUserId],
    queryFn: async (): Promise<Achievement[]> => {
      if (!targetUserId) return [];
      
      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          id,
          unlocked_at,
          achievements:achievement_id (
            id,
            code,
            name,
            description,
            icon,
            points_reward,
            category
          )
        `)
        .eq("user_id", targetUserId)
        .order("unlocked_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        id: item.id,
        code: item.achievements.code,
        name: item.achievements.name,
        description: item.achievements.description,
        icon: item.achievements.icon,
        points_reward: item.achievements.points_reward,
        category: item.achievements.category,
        unlocked_at: item.unlocked_at,
      }));
    },
    enabled: !!targetUserId,
  });

  // Get active missions
  const { data: missions } = useQuery({
    queryKey: ["missions", targetUserId],
    queryFn: async (): Promise<Mission[]> => {
      if (!targetUserId) return [];
      
      // Get active missions
      const { data: activeMissions, error: missionsError } = await supabase
        .from("missions")
        .select("*")
        .eq("is_active", true)
        .order("mission_type", { ascending: true });

      if (missionsError) throw missionsError;

      // Get user mission progress
      const { data: userMissions, error: progressError } = await supabase
        .from("user_missions")
        .select("*")
        .eq("user_id", targetUserId);

      if (progressError) throw progressError;

      // Combine missions with progress
      return (activeMissions || []).map((mission) => {
        const userMission = (userMissions || []).find((um) => um.mission_id === mission.id);
        return {
          id: mission.id,
          code: mission.code,
          name: mission.name,
          description: mission.description,
          mission_type: mission.mission_type,
          action_type: mission.action_type,
          target_count: mission.target_count,
          points_reward: mission.points_reward,
          progress: userMission?.progress || 0,
          completed: userMission?.completed || false,
          expires_at: userMission?.expires_at || mission.end_date,
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

  return {
    stats,
    achievements: achievements || [],
    missions: missions || [],
    isLoading,
    awardPoints: awardPointsMutation.mutate,
    isAwarding: awardPointsMutation.isPending,
  };
};

