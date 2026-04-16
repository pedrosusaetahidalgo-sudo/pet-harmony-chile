import { useGamification } from './useGamification';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useAuth } from './useAuth';

export type RewardEvent =
  | { kind: 'walk_logged'; petId: string; petName: string }
  | { kind: 'medical_record_added'; petId: string; petName: string }
  | { kind: 'vet_review_left'; vetName: string }
  | { kind: 'pet_profile_completed'; petId: string; petName: string; pct: number }
  | { kind: 'vaccine_logged'; petId: string; petName: string; vaccineName: string };

const REWARD_CONFIG: Record<
  RewardEvent['kind'],
  { points: number; toastTitle: (e: RewardEvent) => string }
> = {
  walk_logged: { points: 5, toastTitle: () => 'Paseo registrado' },
  medical_record_added: { points: 10, toastTitle: () => 'Ficha actualizada' },
  vet_review_left: { points: 15, toastTitle: () => 'Reseña enviada' },
  pet_profile_completed: {
    points: 20,
    toastTitle: (e) =>
      e.kind === 'pet_profile_completed' ? `Perfil ${e.pct}% completo` : 'Perfil completo',
  },
  vaccine_logged: { points: 10, toastTitle: () => 'Vacuna registrada' },
};

// Map reward events to pet_activities rows (Fase 3). When the table does not
// yet exist, Supabase returns an error which we swallow via logger.
type ActivityInsert = {
  activity_type: string;
  title: string;
  pet_id: string;
  owner_id: string;
  metadata: Record<string, unknown>;
};

function buildActivityInsert(event: RewardEvent, ownerId: string): ActivityInsert | null {
  switch (event.kind) {
    case 'walk_logged':
      return {
        activity_type: 'walk',
        title: `${event.petName} salió a pasear`,
        pet_id: event.petId,
        owner_id: ownerId,
        metadata: {},
      };
    case 'vaccine_logged':
      return {
        activity_type: 'vaccine',
        title: `${event.petName}: ${event.vaccineName}`,
        pet_id: event.petId,
        owner_id: ownerId,
        metadata: { vaccine: event.vaccineName },
      };
    case 'medical_record_added':
      return {
        activity_type: 'vet_visit',
        title: `${event.petName} visitó al veterinario`,
        pet_id: event.petId,
        owner_id: ownerId,
        metadata: {},
      };
    case 'pet_profile_completed':
      return {
        activity_type: 'achievement',
        title: `${event.petName} completó su perfil al ${event.pct}%`,
        pet_id: event.petId,
        owner_id: ownerId,
        metadata: { pct: event.pct },
      };
    default:
      return null;
  }
}

/**
 * Fire-and-forget gamification rewards.
 * Never throws, never blocks the main flow. If gamification or the social
 * activity insert fail, only the logger knows — the user keeps moving.
 */
export function useOrganicRewards() {
  const { awardPoints } = useGamification();
  const { user } = useAuth();

  const reward = (event: RewardEvent) => {
    const config = REWARD_CONFIG[event.kind];
    if (!config) return;

    // Discreet toast, non-blocking
    toast(config.toastTitle(event), { description: `+${config.points} puntos` });

    // Award points in background, errors only to logger
    try {
      awardPoints({
        points: config.points,
        actionType: event.kind,
        actionId: 'petId' in event ? event.petId : undefined,
        description: config.toastTitle(event),
      });
    } catch (err) {
      logger.error('[useOrganicRewards] awardPoints failed', err);
    }

    // Also write to pet_activities social feed (Fase 3). Fire-and-forget.
    if (user?.id) {
      const activity = buildActivityInsert(event, user.id);
      if (activity) {
        // Cast through unknown because pet_activities is not yet in types.ts
        // until the migration 20260411000000 is applied.
        const client = supabase as unknown as {
          from: (table: string) => {
            insert: (row: ActivityInsert) => Promise<{ error: unknown }>;
          };
        };
        client
          .from('pet_activities')
          .insert(activity)
          .then(({ error }) => {
            if (error) {
              logger.error('[useOrganicRewards] pet_activities insert failed', error);
            }
          })
          .catch((err: unknown) => {
            logger.error('[useOrganicRewards] pet_activities insert threw', err);
          });
      }
    }
  };

  return { reward };
}
