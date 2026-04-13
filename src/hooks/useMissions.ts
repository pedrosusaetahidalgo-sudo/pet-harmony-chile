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
 * Progress is computed client-side from collection data.
 */
export function useMissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['paw-missions', user?.id],
    queryFn: async (): Promise<MissionProgress[]> => {
      if (!user) return [];

      // 1. Fetch mission definitions
      const { data: missions } = (await (supabase.from('paw_missions' as any).select('*') as any)
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

      // 3. Fetch user's collection data for progress
      const { data: ownPets } = await supabase
        .from('pets')
        .select('id, species')
        .eq('owner_id', user.id)
        .eq('lifecycle_status', 'active');

      const { data: collected } = (await (
        supabase.from('paw_card_collections' as any).select('pet_id') as any
      ).eq('collector_id', user.id)) as { data: any[] | null };

      const collectedPetIds = (collected || []).map((c: any) => c.pet_id);
      const totalCollected = collectedPetIds.length;

      // Get species for collected pets
      let collectedSpecies: string[] = [];
      if (collectedPetIds.length > 0) {
        const { data: collPets } = (await (supabase.from('pets').select('id, species') as any).in(
          'id',
          collectedPetIds
        )) as { data: any[] | null };
        collectedSpecies = (collPets || []).map((p: any) => (p.species || '').toLowerCase());
      }

      // All species (own + collected)
      const ownSpecies = (ownPets || []).map((p) => (p.species || '').toLowerCase());
      const allSpecies = [...ownSpecies, ...collectedSpecies];
      const distinctSpecies = new Set(allSpecies);

      // 4. Compute progress for each mission
      return missions.map((m: any): MissionProgress => {
        const req = m.requirement_value || {};
        let current = 0;
        let target = 1;

        switch (m.requirement_type) {
          case 'collect_count':
            target = req.count || 1;
            current = totalCollected;
            break;

          case 'collect_species': {
            target = req.count || 1;
            const speciesKeywords = (req.species || '')
              .split(',')
              .map((s: string) => s.trim().toLowerCase());
            current = allSpecies.filter((sp) =>
              speciesKeywords.some((kw: string) => sp.includes(kw))
            ).length;
            break;
          }

          case 'collect_species_count':
            target = req.distinct_species || 5;
            current = distinctSpecies.size;
            break;

          case 'collect_rarity':
            // TODO: compute from paw_points / rarity data
            target = req.count || 1;
            current = 0;
            break;

          case 'collect_all_rarities':
            target = (req.rarities || []).length;
            current = 0; // TODO
            break;

          case 'be_collected': {
            // TODO: count how many times user's pets were collected
            target = req.count || 1;
            current = 0;
            break;
          }

          case 'collect_owners':
            target = req.count || 1;
            current = 0; // TODO: count distinct owners from collection
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
    staleTime: 60_000,
  });
}
