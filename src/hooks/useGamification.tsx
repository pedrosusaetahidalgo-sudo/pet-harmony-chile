/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getLevelFromPoints, type LevelInfo } from '@/lib/levels';

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
  // Aliases consumed by AchievementBadge / Profile UI
  code: string;
  name: string;
  description: string;
  unlocked_at: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  mission_type: 'daily' | 'weekly' | 'special';
  target_action: string;
  target_count: number;
  points_reward: number;
  category: string;
  progress?: number;
  completed?: boolean;
  expires_at?: string;
  // Alias consumed by MissionCard
  name: string;
}

export const useGamification = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const queryClient = useQueryClient();

  // Get user gamification stats from user_stats table
  const { data: stats, isLoading } = useQuery({
    queryKey: ['gamification', targetUserId],
    queryFn: async (): Promise<UserGamification | null> => {
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from('user_stats')
        .select('level, total_points, followers_count, following_count, posts_count, pets_count')
        .eq('user_id', targetUserId)
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
    staleTime: 5 * 60 * 1000,
  });

  // Get user achievements — schema: id, user_id, mission_id, unlocked_at
  // Join with paw_missions to get display info
  const { data: achievements } = useQuery({
    queryKey: ['achievements', targetUserId],
    queryFn: async (): Promise<Achievement[]> => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('user_achievements')
        .select('id, mission_id, unlocked_at')
        .eq('user_id', targetUserId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch mission details for display
      const missionIds = data.map((d: any) => d.mission_id);
      const { data: missions } = await supabase
        .from('paw_missions')
        .select('id, title, description, category, icon, achievement_title')
        .in('id', missionIds);

      const missionMap = new Map((missions || []).map((m: any) => [m.id, m]));

      return data.map((row: any): Achievement => {
        const mission = missionMap.get(row.mission_id);
        return {
          id: row.id,
          achievement_name: mission?.achievement_title || row.mission_id,
          achievement_type: mission?.category || 'special',
          achievement_description: mission?.description || null,
          points_earned: null,
          earned_at: row.unlocked_at,
          code: mission?.category || 'special',
          name: mission?.achievement_title || row.mission_id,
          description: mission?.description ?? '',
          unlocked_at: row.unlocked_at,
        };
      });
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000,
  });

  // Get active missions from paw_missions
  // Schema: id(TEXT), title, description, category, icon, achievement_title,
  //         requirement_type, requirement_value(JSONB), sort_order, is_active
  const { data: missions } = useQuery({
    queryKey: ['missions', targetUserId],
    queryFn: async (): Promise<Mission[]> => {
      if (!targetUserId) return [];

      const { data: activeMissions, error: missionsError } = await supabase
        .from('paw_missions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (missionsError) throw missionsError;

      // Check which missions the user has unlocked
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('mission_id')
        .eq('user_id', targetUserId);

      const unlockedSet = new Set((userAchievements || []).map((a: any) => a.mission_id));

      return (activeMissions || []).map((mission: any): Mission => {
        const reqValue = mission.requirement_value || {};
        const targetCount = reqValue.count || reqValue.distinct_species || reqValue.streak || 1;
        return {
          id: mission.id,
          title: mission.title,
          description: mission.description,
          mission_type: 'special',
          target_action: mission.requirement_type,
          target_count: targetCount,
          points_reward: 0,
          category: mission.category,
          progress: 0,
          completed: unlockedSet.has(mission.id),
          name: mission.title,
        };
      });
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000,
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
      if (!user?.id) throw new Error('User not authenticated');

      // Call Supabase function to award points
      const { data, error } = await supabase.rpc('award_points', {
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
      queryClient.invalidateQueries({ queryKey: ['gamification', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['achievements', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['missions', targetUserId] });
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
