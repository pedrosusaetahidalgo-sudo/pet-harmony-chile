import { supabase } from "@/integrations/supabase/client";

type PointAction =
  | "daily_checkin"
  | "complete_mission"
  | "post_feed"
  | "first_pet"
  | "pet_profile_complete"
  | "user_profile_complete"
  | "first_medical_doc"
  | "first_pdf"
  | "complete_reminder_ontime"
  | "complete_reminder_late"
  | "leave_review"
  | "follow_user"
  | "receive_like"
  | "book_service"
  | "streak_7"
  | "streak_30"
  | "streak_90";

const POINT_VALUES: Record<PointAction, number> = {
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
  streak_7: 25,
  streak_30: 100,
  streak_90: 300,
};

// Daily-limited actions
const DAILY_LIMITS: Partial<Record<PointAction, number>> = {
  daily_checkin: 1,
  post_feed: 1,
  complete_mission: 3,
};

// One-time actions (check if already earned)
const ONE_TIME_ACTIONS: PointAction[] = [
  "first_pet",
  "user_profile_complete",
  "first_medical_doc",
  "first_pdf",
  "streak_7",
  "streak_30",
  "streak_90",
];

export async function awardPoints(
  userId: string,
  action: PointAction,
  metadata?: Record<string, unknown>
): Promise<{ awarded: boolean; points: number; error?: string }> {
  const points = POINT_VALUES[action];
  if (!points) return { awarded: false, points: 0, error: "Invalid action" };

  // Check one-time actions
  if (ONE_TIME_ACTIONS.includes(action)) {
    const { data: existing } = await supabase
      .from("paw_point_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("source_type", action)
      .limit(1);

    if (existing && existing.length > 0) {
      return { awarded: false, points: 0, error: "Already earned" };
    }
  }

  // Check daily limits
  const dailyLimit = DAILY_LIMITS[action];
  if (dailyLimit) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayCount } = await supabase
      .from("paw_point_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("source_type", action)
      .gte("created_at", today.toISOString());

    if (todayCount && todayCount.length >= dailyLimit) {
      return { awarded: false, points: 0, error: "Daily limit reached" };
    }
  }

  // Insert transaction
  const { error } = await supabase.from("paw_point_transactions").insert({
    user_id: userId,
    points_amount: points,
    transaction_type: "earned",
    source_type: action,
  });

  if (error) return { awarded: false, points: 0, error: error.message };

  return { awarded: true, points };
}

export { POINT_VALUES };
export type { PointAction };
