import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  eachDayOfInterval,
  format,
  isWithinInterval,
  parseISO,
} from "date-fns";

export type AnalyticsPeriod = "current_month" | "last_month" | "last_3_months";

export interface AnalyticsSummary {
  remindersCompleted: number;
  vetVisits: number;
  vaccinesGiven: number;
  wellnessScore: number;
}

export interface DailyActivity {
  date: string;
  reminders: number;
  visits: number;
  vaccines: number;
}

export interface PeriodComparison {
  current: AnalyticsSummary;
  previous: AnalyticsSummary;
}

function getDateRange(period: AnalyticsPeriod) {
  const now = new Date();
  switch (period) {
    case "current_month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "last_month": {
      const prev = subMonths(now, 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
    case "last_3_months":
      return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
  }
}

function getPreviousRange(period: AnalyticsPeriod) {
  const now = new Date();
  switch (period) {
    case "current_month": {
      const prev = subMonths(now, 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
    case "last_month": {
      const prev = subMonths(now, 2);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
    case "last_3_months": {
      return {
        start: startOfMonth(subMonths(now, 5)),
        end: endOfMonth(subMonths(now, 3)),
      };
    }
  }
}

interface UseProAnalyticsParams {
  petId?: string;
  period: AnalyticsPeriod;
}

export function useProAnalytics({ petId, period }: UseProAnalyticsParams) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pro-analytics", user?.id, petId, period],
    queryFn: async () => {
      if (!user?.id) return null;

      const range = getDateRange(period);
      const prevRange = getPreviousRange(period);
      const rangeStart = format(range.start, "yyyy-MM-dd");
      const rangeEnd = format(range.end, "yyyy-MM-dd");
      const prevStart = format(prevRange.start, "yyyy-MM-dd");
      const prevEnd = format(prevRange.end, "yyyy-MM-dd");

      // Fetch reminders (completed in period)
      let remindersQ = (supabase as any)
        .from("pet_reminders")
        .select("id, completed_at, due_date, type, is_completed")
        .eq("user_id", user.id);
      if (petId) remindersQ = remindersQ.eq("pet_id", petId);
      const remindersRes = await remindersQ;

      // Fetch medical records
      let medicalQ = (supabase as any)
        .from("medical_records")
        .select("id, visit_date, record_type")
        .eq("owner_id", user.id);
      if (petId) medicalQ = medicalQ.eq("pet_id", petId);
      const medicalRes = await medicalQ;

      // Fetch wellness score
      let wellness: { health_score: number | null; happiness_score: number | null; activity_score: number | null } | null = null;
      if (petId) {
        const { data } = await (supabase as any)
          .from("pet_paw_progress")
          .select("health_score, happiness_score, activity_score")
          .eq("pet_id", petId)
          .maybeSingle();
        wellness = data;
      }

      const reminders = remindersRes.data || [];
      const medical = medicalRes.data || [];

      // Compute wellness score (average of available scores)
      let wellnessScore = 0;
      if (wellness) {
        const scores = [
          wellness.health_score,
          wellness.happiness_score,
          wellness.activity_score,
        ].filter((s: number | null) => s != null);
        wellnessScore =
          scores.length > 0
            ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
            : 0;
      }

      // Helper to count in a date range
      const countInRange = (
        items: Array<{ date: string }>,
        start: Date,
        end: Date,
      ) =>
        items.filter((item) => {
          try {
            const d = parseISO(item.date);
            return isWithinInterval(d, { start, end });
          } catch {
            return false;
          }
        }).length;

      // Normalize reminders and medical records to { date }
      const completedReminders = reminders
        .filter((r: any) => r.is_completed && r.completed_at)
        .map((r: any) => ({ date: r.completed_at.split("T")[0] }));

      const vetVisits = medical
        .filter((m: any) => m.record_type !== "vacuna")
        .map((m: any) => ({ date: m.visit_date }));

      const vaccines = medical
        .filter((m: any) => m.record_type === "vacuna")
        .map((m: any) => ({ date: m.visit_date }));

      // Current period summary
      const summary: AnalyticsSummary = {
        remindersCompleted: countInRange(completedReminders, range.start, range.end),
        vetVisits: countInRange(vetVisits, range.start, range.end),
        vaccinesGiven: countInRange(vaccines, range.start, range.end),
        wellnessScore,
      };

      // Previous period summary
      const previousSummary: AnalyticsSummary = {
        remindersCompleted: countInRange(completedReminders, prevRange.start, prevRange.end),
        vetVisits: countInRange(vetVisits, prevRange.start, prevRange.end),
        vaccinesGiven: countInRange(vaccines, prevRange.start, prevRange.end),
        wellnessScore: 0,
      };

      // Build daily activity timeline
      const days = eachDayOfInterval({ start: range.start, end: new Date() < range.end ? new Date() : range.end });
      const activityTimeline: DailyActivity[] = days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        return {
          date: dayStr,
          reminders: completedReminders.filter((r) => r.date === dayStr).length,
          visits: vetVisits.filter((v) => v.date === dayStr).length,
          vaccines: vaccines.filter((v) => v.date === dayStr).length,
        };
      });

      const periodComparison: PeriodComparison = {
        current: summary,
        previous: previousSummary,
      };

      return { summary, activityTimeline, periodComparison };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
