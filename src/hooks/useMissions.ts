/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  achievementTitle: string;
  requirementType: string;
  requirementValue: Record<string, any>;
  sortOrder: number;
}

export interface MissionProgress extends Mission {
  current: number;
  target: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

/**
 * Fetch all active missions with user progress.
 *
 * Progress stats are computed server-side via `get_mission_progress` RPC,
 * then mapped to each mission's requirement_type client-side.
 * This replaces ~200 lines of client-side aggregation with a single DB call.
 */
export function useMissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['paw-missions', user?.id],
    queryFn: async (): Promise<MissionProgress[]> => {
      if (!user) return [];

      // 1. Fetch mission definitions
      const { data: missions } = (await (
        supabase
          .from('paw_missions' as any)
          .select(
            'id, title, description, category, icon, achievement_title, requirement_type, requirement_value, sort_order, is_active'
          ) as any
      )
        .eq('is_active', true)
        .order('sort_order', { ascending: true })) as { data: any[] | null };

      if (!missions || missions.length === 0) return [];

      // 2. Fetch user achievements
      const { data: achievements } = (await (
        supabase.from('user_achievements' as any).select('mission_id, unlocked_at') as any
      ).eq('user_id', user.id)) as { data: any[] | null };

      const achievementMap = new Map(
        (achievements || []).map((a: any) => [a.mission_id, a.unlocked_at])
      );

      // 3. Fetch aggregated progress from server-side RPC
      const { data: progress, error: rpcError } = await supabase.rpc('get_mission_progress', {
        p_user_id: user.id,
      });

      // Fallback values if RPC not yet deployed
      const stats = rpcError
        ? {
            collected_count: 0,
            distinct_species: 0,
            be_collected_count: 0,
            distinct_owners: 0,
            completed_reminders: 0,
            bookings_count: 0,
            reviews_count: 0,
            vaccine_count: 0,
            has_complete_profile: false,
            distinct_rarities: 0,
          }
        : (progress as Record<string, any>);

      // 4. Map progress to each mission
      return missions.map((m: any): MissionProgress => {
        const req = m.requirement_value || {};
        let current = 0;
        let target = 1;

        switch (m.requirement_type) {
          case 'collect_count':
            target = req.count || 1;
            current = stats.collected_count;
            break;

          case 'collect_species':
            // For species-specific missions we still use collected_count as approximation
            // (exact species filtering would need per-species counts in the RPC)
            target = req.count || 1;
            current = Math.min(stats.collected_count, target);
            break;

          case 'collect_species_count':
            target = req.distinct_species || 5;
            current = stats.distinct_species;
            break;

          case 'collect_rarity':
            target = req.count || 1;
            // Approximation — full rarity breakdown needs extended RPC
            current = Math.min(stats.collected_count, target);
            break;

          case 'collect_all_rarities': {
            const requiredRarities: string[] = req.rarities || [
              'common',
              'uncommon',
              'rare',
              'epic',
              'legendary',
              'mythic',
            ];
            target = requiredRarities.length;
            current = stats.distinct_rarities;
            break;
          }

          case 'be_collected':
            target = req.count || 1;
            current = stats.be_collected_count;
            break;

          case 'collect_owners':
            target = req.count || 1;
            current = stats.distinct_owners;
            break;

          case 'complete_reminders':
            target = req.count || 10;
            current = stats.completed_reminders;
            break;

          case 'book_vet':
            target = req.count || 1;
            current = stats.bookings_count;
            break;

          case 'leave_review':
            target = req.count || 1;
            current = stats.reviews_count;
            break;

          case 'log_vaccine':
            target = req.count || 1;
            current = stats.vaccine_count;
            break;

          case 'complete_profile':
            target = 1;
            current = stats.has_complete_profile ? 1 : 0;
            break;

          default:
            target = 1;
            current = 0;
        }

        const unlocked = achievementMap.has(m.id);

        return {
          id: m.id,
          title: m.title,
          description: m.description,
          category: m.category,
          icon: m.icon,
          achievementTitle: m.achievement_title,
          requirementType: m.requirement_type,
          requirementValue: req,
          sortOrder: m.sort_order,
          current: Math.min(current, target),
          target,
          unlocked,
          unlockedAt: unlocked ? achievementMap.get(m.id) : null,
        };
      });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
