/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Achievement {
  id: string;
  missionId: string;
  achievementTitle: string;
  unlockedAt: string;
}

/**
 * Fetch user's unlocked achievements and manage active title.
 */
export function useAchievements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: achievements = [], ...rest } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async (): Promise<Achievement[]> => {
      if (!user) return [];

      const { data } = (await (
        supabase.from('user_achievements' as any).select('id, mission_id, unlocked_at') as any
      )
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false })) as { data: any[] | null };

      if (!data) return [];

      // Get mission titles
      const missionIds = data.map((a: any) => a.mission_id);
      const { data: missions } = (await (
        supabase.from('paw_missions' as any).select('id, achievement_title') as any
      ).in('id', missionIds)) as { data: any[] | null };

      const titleMap = new Map((missions || []).map((m: any) => [m.id, m.achievement_title]));

      return data.map((a: any) => ({
        id: a.id,
        missionId: a.mission_id,
        achievementTitle: titleMap.get(a.mission_id) || a.mission_id,
        unlockedAt: a.unlocked_at,
      }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch active title from profile
  const { data: activeTitle } = useQuery({
    queryKey: ['active-title', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data } = await (supabase as any)
        .from('profiles')
        .select('active_title')
        .eq('id', user.id)
        .maybeSingle();
      return (data as { active_title?: string } | null)?.active_title || null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Set active title
  const setActiveTitle = useMutation({
    mutationFn: async (title: string | null) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('profiles')
        .update({ active_title: title })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-title', user?.id] });
    },
  });

  // Unlock an achievement
  const unlock = useMutation({
    mutationFn: async (missionId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await (supabase
        .from('user_achievements' as any)
        .insert({ user_id: user.id, mission_id: missionId }) as any);
      if (error && !error.message?.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['paw-missions', user?.id] });
    },
  });

  return {
    achievements,
    activeTitle,
    setActiveTitle,
    unlock,
    ...rest,
  };
}
