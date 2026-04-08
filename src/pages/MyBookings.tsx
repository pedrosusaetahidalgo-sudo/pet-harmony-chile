import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { DaySlotsList } from "@/components/calendar/DaySlotsList";
import { BookingModal } from "@/components/calendar/BookingModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Filter } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const SERVICE_TYPES = [
  { value: "all", label: "Todos" },
  { value: "vet", label: "Veterinaria" },
  { value: "walk", label: "Paseo" },
  { value: "dogsitter", label: "Cuidador" },
  { value: "training", label: "Entrenamiento" },
  { value: "grooming", label: "Peluquería" },
];

export default function MyBookings() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterType, setFilterType] = useState("all");
  const [bookingSlot, setBookingSlot] = useState<any>(null);

  // Fetch slots for selected date
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const { data: slots, isLoading } = useQuery({
    queryKey: ["service-slots", dateStr, filterType],
    queryFn: async () => {
      // Refactor del join PostgREST anidado: el path
      // service_slots → service_providers → profiles no tiene FK explícita
      // a `profiles` y devuelve 400 Bad Request. Hacemos 3 fetches y mergeamos
      // en cliente (mismo patrón que adoption_posts y AdminProviders).
      let query = supabase
        .from("service_slots")
        .select("*")
        .eq("slot_date", dateStr)
        .eq("is_active", true)
        .order("start_time");

      if (filterType !== "all") {
        query = query.eq("service_type", filterType);
      }

      const { data: rawSlots, error } = await query;
      if (error) throw error;
      if (!rawSlots || rawSlots.length === 0) return [];

      const providerIds = Array.from(
        new Set(rawSlots.map((s: any) => s.provider_id).filter(Boolean))
      );
      if (providerIds.length === 0) {
        return rawSlots.map((s: any) => ({ ...s, provider: null }));
      }

      const { data: providers } = await supabase
        .from("service_providers")
        .select("id, user_id, avg_rating, total_reviews")
        .in("id", providerIds);

      const userIds = Array.from(
        new Set((providers || []).map((p: any) => p.user_id).filter(Boolean))
      );
      const { data: profiles } = userIds.length
        ? await supabase
            .from("profiles")
            .select("id, display_name, avatar_url")
            .in("id", userIds)
        : { data: [] as any[] };

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const providerMap = new Map(
        (providers || []).map((p: any) => [
          p.id,
          { ...p, profiles: profileMap.get(p.user_id) || null },
        ])
      );

      return rawSlots.map((s: any) => ({
        ...s,
        provider: providerMap.get(s.provider_id) || null,
      }));
    },
  });

  // Fetch slots count per day for the month (for calendar dots)
  const monthStart = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), "yyyy-MM-dd");
  const monthEnd = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0), "yyyy-MM-dd");

  const { data: monthSlots } = useQuery({
    queryKey: ["month-slots", monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_slots")
        .select("slot_date")
        .eq("is_active", true)
        .gte("slot_date", monthStart)
        .lte("slot_date", monthEnd);
      if (error) throw error;

      // Count slots per day
      const counts: Record<string, number> = {};
      data?.forEach((s) => {
        counts[s.slot_date] = (counts[s.slot_date] || 0) + 1;
      });
      return counts;
    },
  });

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Mis reservas
          </h1>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {SERVICE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === type.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Calendar grid */}
        <Card className="border-0 shadow-md">
          <CardContent className="pt-4">
            <CalendarGrid
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onChangeMonth={setCurrentMonth}
              slotsPerDay={monthSlots || {}}
            />
          </CardContent>
        </Card>

        {/* Day slots */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Disponible — {format(selectedDate, "EEEE d MMMM", { locale: es })}
          </h2>
          <DaySlotsList
            slots={slots || []}
            isLoading={isLoading}
            onBook={setBookingSlot}
          />
        </div>

        {/* Booking modal */}
        {bookingSlot && (
          <BookingModal
            slot={bookingSlot}
            open={!!bookingSlot}
            onClose={() => setBookingSlot(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
