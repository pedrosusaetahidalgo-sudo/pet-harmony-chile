import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  eachDayOfInterval,
  format,
  parseISO,
  isWithinInterval,
} from "date-fns";
import type { AnalyticsPeriod } from "./useProAnalytics";

export interface VetSummary {
  totalBookings: number;
  uniqueClients: number;
  avgRating: number;
  revenue: number;
  reviewCount: number;
}

export interface DailyVetActivity {
  date: string;
  bookings: number;
  revenue: number;
}

export interface ServiceBreakdown {
  serviceType: string;
  count: number;
  revenue: number;
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

export function useVetAnalytics({ period }: { period: AnalyticsPeriod }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["vet-analytics", user?.id, period],
    queryFn: async () => {
      if (!user?.id) return null;

      const range = getDateRange(period);
      const rangeStart = format(range.start, "yyyy-MM-dd");
      const rangeEnd = format(range.end, "yyyy-MM-dd");

      // Get provider info
      const { data: provider } = await supabase
        .from("service_providers")
        .select("id, rating, total_reviews")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!provider) return null;

      // Get order items for this provider in the period
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("id, service_type, unit_price_clp, provider_amount_clp, platform_fee_clp, scheduled_date, orders!inner(user_id, payment_status, paid_at)")
        .eq("provider_id", provider.id)
        .gte("scheduled_date", rangeStart)
        .lte("scheduled_date", rangeEnd);

      const items = (orderItems || []).filter(
        (item: any) => item.orders?.payment_status === "completed"
      );

      // Summary
      const uniqueClientIds = new Set(items.map((item: any) => item.orders?.user_id).filter(Boolean));
      const totalRevenue = items.reduce((sum: number, item: any) => sum + (item.provider_amount_clp || 0), 0);

      const summary: VetSummary = {
        totalBookings: items.length,
        uniqueClients: uniqueClientIds.size,
        avgRating: provider.rating ?? 0,
        revenue: totalRevenue,
        reviewCount: provider.total_reviews ?? 0,
      };

      // Daily timeline
      const days = eachDayOfInterval({
        start: range.start,
        end: new Date() < range.end ? new Date() : range.end,
      });
      const bookingsTimeline: DailyVetActivity[] = days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayItems = items.filter((item: any) => {
          try {
            return format(parseISO(item.scheduled_date), "yyyy-MM-dd") === dayStr;
          } catch {
            return false;
          }
        });
        return {
          date: dayStr,
          bookings: dayItems.length,
          revenue: dayItems.reduce((s: number, i: any) => s + (i.provider_amount_clp || 0), 0),
        };
      });

      // Service breakdown
      const breakdownMap = new Map<string, { count: number; revenue: number }>();
      items.forEach((item: any) => {
        const type = item.service_type || "otro";
        const existing = breakdownMap.get(type) || { count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += item.provider_amount_clp || 0;
        breakdownMap.set(type, existing);
      });
      const serviceBreakdown: ServiceBreakdown[] = Array.from(breakdownMap.entries()).map(
        ([serviceType, data]) => ({ serviceType, ...data })
      );

      return { summary, bookingsTimeline, serviceBreakdown };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
