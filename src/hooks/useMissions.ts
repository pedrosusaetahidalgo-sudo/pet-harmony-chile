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
        .select('id, species, breed, birth_date, gender, weight, photo_url, microchip_number')
        .eq('owner_id', user.id)
        .eq('lifecycle_status', 'active');

      const ownPetIds = (ownPets || []).map((p) => p.id);

      const { data: collected } = (await (
        supabase.from('paw_card_collections' as any).select('pet_id') as any
      ).eq('collector_id', user.id)) as { data: any[] | null };

      const collectedPetIds = (collected || []).map((c: any) => c.pet_id);
      const totalCollected = collectedPetIds.length;

      // Get species + owner_id for collected pets
      let collectedSpecies: string[] = [];
      let collectedPets: { id: string; species: string; owner_id: string }[] = [];
      if (collectedPetIds.length > 0) {
        const { data: collPets } = (await (
          supabase.from('pets').select('id, species, owner_id') as any
        ).in('id', collectedPetIds)) as { data: any[] | null };
        collectedPets = (collPets || []) as typeof collectedPets;
        collectedSpecies = collectedPets.map((p) => (p.species || '').toLowerCase());
      }

      // All species (own + collected)
      const ownSpecies = (ownPets || []).map((p) => (p.species || '').toLowerCase());
      const allSpecies = [...ownSpecies, ...collectedSpecies];
      const distinctSpecies = new Set(allSpecies);

      // Fetch owner points for rarity computation
      const allOwnerIds = [...new Set(collectedPets.map((p) => p.owner_id))];
      let ownerPointsMap = new Map<string, number>();
      if (allOwnerIds.length > 0) {
        const { data: ownerStats } = await supabase
          .from('user_stats')
          .select('user_id, total_points')
          .in('user_id', allOwnerIds);
        ownerPointsMap = new Map(
          (ownerStats || []).map((s: any) => [s.user_id, s.total_points ?? 0])
        );
      }

      // Compute rarities for collected pets
      const rarityThresholds = (score: number): string => {
        if (score >= 95) return 'mythic';
        if (score >= 80) return 'legendary';
        if (score >= 60) return 'epic';
        if (score >= 40) return 'rare';
        if (score >= 20) return 'uncommon';
        return 'common';
      };
      const collectedRarities = collectedPets.map((p) =>
        rarityThresholds(ownerPointsMap.get(p.owner_id) ?? 0)
      );
      const distinctRarities = new Set(collectedRarities);

      // Count how many times user's pets were collected by others
      let beCollectedCount = 0;
      if (ownPetIds.length > 0) {
        const { count } = (await (
          supabase
            .from('paw_card_collections' as any)
            .select('id', { count: 'exact', head: true }) as any
        ).in('pet_id', ownPetIds)) as { count: number | null };
        beCollectedCount = count ?? 0;
      }

      // Count distinct owners from collected pets
      const distinctOwners = new Set(collectedPets.map((p) => p.owner_id));

      // 4b. Fetch core-action data for new mission types
      const [completedRemindersRes, bookingsRes, reviewsRes, vaccineRecordsRes] = await Promise.all(
        [
          supabase
            .from('pet_reminders')
            .select('id', { count: 'exact', head: true })
            .eq('owner_id', user.id)
            .eq('is_completed', true),
          supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'confirmed'),
          supabase
            .from('service_reviews')
            .select('id', { count: 'exact', head: true })
            .eq('reviewer_id', user.id),
          supabase
            .from('medical_records')
            .select('id', { count: 'exact', head: true })
            .eq('owner_id', user.id)
            .eq('record_type', 'vacuna'),
        ]
      );

      const completedRemindersCount = completedRemindersRes.count ?? 0;
      const bookingsCount = bookingsRes.count ?? 0;
      const reviewsCount = reviewsRes.count ?? 0;
      const vaccineRecordsCount = vaccineRecordsRes.count ?? 0;

      // 5. Compute progress for each mission
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

          case 'collect_rarity': {
            target = req.count || 1;
            const targetRarity = (req.rarity || '').toLowerCase();
            current = collectedRarities.filter((r) => r === targetRarity).length;
            break;
          }

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
            current = requiredRarities.filter((r) => distinctRarities.has(r)).length;
            break;
          }

          case 'be_collected': {
            target = req.count || 1;
            current = beCollectedCount;
            break;
          }

          case 'collect_owners':
            target = req.count || 1;
            current = distinctOwners.size;
            break;

          case 'complete_reminders':
            target = req.count || 10;
            current = completedRemindersCount;
            break;

          case 'book_vet':
            target = req.count || 1;
            current = bookingsCount;
            break;

          case 'leave_review':
            target = req.count || 1;
            current = reviewsCount;
            break;

          case 'log_vaccine':
            target = req.count || 1;
            current = vaccineRecordsCount;
            break;

          case 'complete_profile':
            // Simplified: count pets with >= pct% completeness
            target = 1;
            current = ownPets?.some((p: any) => {
              const fields = [
                'species',
                'breed',
                'birth_date',
                'gender',
                'weight',
                'photo_url',
                'microchip_number',
              ];
              const filled = fields.filter((f) => (p as any)[f]).length;
              return (filled / fields.length) * 100 >= (req.pct || 80);
            })
              ? 1
              : 0;
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
