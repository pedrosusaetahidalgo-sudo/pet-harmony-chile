import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { DaySlotsList } from "@/components/calendar/DaySlotsList";
import { BookingModal } from "@/components/calendar/BookingModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Filter } from "lucide-react";
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

export default function ServiceCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterType, setFilterType] = useState("all");
  const [bookingSlot, setBookingSlot] = useState<any>(null);

  // Fetch slots for selected date
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const { data: slots, isLoading } = useQuery({
    queryKey: ["service-slots", dateStr, filterType],
    queryFn: async () => {
      let query = supabase
        .from("service_slots")
        .select("*, provider:provider_id(id, user_id, avg_rating, total_reviews, profiles:user_id(display_name, avatar_url))")
        .eq("slot_date", dateStr)
        .eq("is_active", true)
        .order("start_time");

      if (filterType !== "all") {
        query = query.eq("service_type", filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
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
            Calendario de Servicios
          </h1>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {SERVICE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
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
