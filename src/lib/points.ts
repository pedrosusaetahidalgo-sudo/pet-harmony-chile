import { supabase } from '@/integrations/supabase/client';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';

// Acciones legacy (pre Refactor Maestro). Se mantienen por compatibilidad con
// callsites existentes y transacciones históricas. Cuando PAW_POINTS_CANONICAL
// está activo, las acciones marcadas como DEPRECATED en DEPRECATED_ACTIONS
// dejan de otorgar puntos (devuelven awarded=false).
type PointActionLegacy =
  | 'daily_checkin'
  | 'complete_mission'
  | 'post_feed'
  | 'first_pet'
  | 'pet_profile_complete'
  | 'user_profile_complete'
  | 'first_medical_doc'
  | 'first_pdf'
  | 'complete_reminder_ontime'
  | 'complete_reminder_late'
  | 'leave_review'
  | 'follow_user'
  | 'receive_like'
  | 'book_service'
  | 'collect_paw_card'
  | 'streak_7'
  | 'streak_30'
  | 'streak_90';

// Acciones canónicas (Refactor Maestro §5.4). Solo se otorgan por cuidado real.
type PointActionCanonical =
  | 'complete_vaccine' // Completar vacuna: +100
  | 'register_weight' // Registrar peso: +30
  | 'register_vet_visit' // Registrar consulta vet: +80
  | 'upload_monthly_photo' // Subir foto mensual: +40
  | 'complete_routine_day' // Completar rutina del día: +10
  | 'complete_vaccine_ocr' // Completar carnet vacunas (OCR): +150
  | 'share_record_first_time' // Compartir ficha por primera vez: +200
  | 'capture_nose_print'; // Captura de nose print: +200 (Fase 1)

type PointAction = PointActionLegacy | PointActionCanonical;

// Acciones que NO otorgan puntos cuando PAW_POINTS_CANONICAL=true.
// Razón: el plan §5.4 dice puntos solo por cuidado real. Estas son sociales
// o de engagement, no de cuidado, y diluyen la señal.
const DEPRECATED_ACTIONS: ReadonlySet<PointAction> = new Set([
  'daily_checkin',
  'post_feed',
  'follow_user',
  'receive_like',
  'collect_paw_card',
  'complete_reminder_late',
]);

const POINT_VALUES: Record<PointAction, number> = {
  // Legacy (sin cambios para preservar transacciones históricas)
  daily_checkin: 5,
  complete_mission: 15,
  post_feed: 5,
  first_pet: 20,
  pet_profile_complete: 30,
  user_profile_complete: 25,
  first_medical_doc: 20,
  first_pdf: 15,
  complete_reminder_ontime: 10,
  complete_reminder_late: 3,
  leave_review: 10,
  follow_user: 2,
  receive_like: 1,
  book_service: 10,
  collect_paw_card: 10,
  streak_7: 25,
  streak_30: 100,
  streak_90: 300,

  // Canónicas (Refactor Maestro §5.4)
  complete_vaccine: 100,
  register_weight: 30,
  register_vet_visit: 80,
  upload_monthly_photo: 40,
  complete_routine_day: 10,
  complete_vaccine_ocr: 150,
  share_record_first_time: 200,
  capture_nose_print: 200,
};

// Daily-limited actions
const DAILY_LIMITS: Partial<Record<PointAction, number>> = {
  daily_checkin: 1,
  post_feed: 1,
  complete_mission: 3,
  collect_paw_card: 5,
  upload_monthly_photo: 1, // 1 foto al día premia → no spam
  register_weight: 1, // 1 peso al día (más es ruido)
  complete_routine_day: 5, // máx 5 rutinas al día (rutinas reales)
};

// One-time actions (check if already earned)
const ONE_TIME_ACTIONS: PointAction[] = [
  'first_pet',
  'user_profile_complete',
  'first_medical_doc',
  'first_pdf',
  'streak_7',
  'streak_30',
  'streak_90',
  'share_record_first_time', // canonical: una sola vez se premia el "primero"
  'capture_nose_print', // canonical: una vez por mascota (chequear x mascota en metadata)
];

export async function awardPoints(
  userId: string,
  action: PointAction,
  metadata?: Record<string, unknown>
): Promise<{ awarded: boolean; points: number; error?: string }> {
  const points = POINT_VALUES[action];
  if (!points) return { awarded: false, points: 0, error: 'Invalid action' };

  // Refactor Maestro §5.4: cuando flag canónico activo, acciones que no son
  // de cuidado real no otorgan puntos.
  if (isFeatureEnabled('PAW_POINTS_CANONICAL') && DEPRECATED_ACTIONS.has(action)) {
    trackRefactor(RefactorEvent.pawPointsActionDeprecated, { action });
    return { awarded: false, points: 0, error: 'Action deprecated under canonical Paw Points' };
  }

  // Check one-time actions
  if (ONE_TIME_ACTIONS.includes(action)) {
    const { data: existing } = await supabase
      .from('paw_point_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('source_type', action)
      .limit(1);

    if (existing && existing.length > 0) {
      return { awarded: false, points: 0, error: 'Already earned' };
    }
  }

  // Check daily limits
  const dailyLimit = DAILY_LIMITS[action];
  if (dailyLimit) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayCount } = await supabase
      .from('paw_point_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('source_type', action)
      .gte('created_at', today.toISOString());

    if (todayCount && todayCount.length >= dailyLimit) {
      return { awarded: false, points: 0, error: 'Daily limit reached' };
    }
  }

  // Usar RPC atómico para evitar race conditions (read-then-write)
  // La función award_points_atomic inserta la transacción Y actualiza
  // el contador en una sola operación DB.
  const { error } = await supabase.rpc('award_points_atomic', {
    p_user_id: userId,
    p_points: points,
    p_action: action,
    p_transaction_type: 'earn',
  });

  if (error) return { awarded: false, points: 0, error: error.message };

  trackRefactor(RefactorEvent.pawPointsAwarded, { action, points });
  return { awarded: true, points };
}

export { POINT_VALUES };
export type { PointAction };
