/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { DaySlotsList } from '@/components/calendar/DaySlotsList';
import { BookingModal } from '@/components/calendar/BookingModal';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, CalendarDays, Clock, CheckCircle2 } from '@/lib/icons';

const SERVICE_TYPES = [
  { value: 'all', label: 'Todos' },
  { value: 'vet', label: 'Veterinaria' },
  { value: 'walk', label: 'Paseo' },
  { value: 'dogsitter', label: 'Cuidador' },
  { value: 'training', label: 'Entrenamiento' },
  { value: 'grooming', label: 'Peluquería' },
];

export default function MyBookings() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterType, setFilterType] = useState('all');
  const [bookingSlot, setBookingSlot] = useState<any>(null);

  // Fetch slots for selected date
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: slots, isLoading } = useQuery({
    queryKey: ['service-slots', dateStr, filterType],
    queryFn: async () => {
      // Refactor del join PostgREST anidado: el path
      // service_slots → service_providers → profiles no tiene FK explícita
      // a `profiles` y devuelve 400 Bad Request. Hacemos 3 fetches y mergeamos
      // en cliente (mismo patrón que adoption_posts y AdminProviders).
      let query = supabase
        .from('service_slots')
        .select('*')
        .eq('slot_date', dateStr)
        .eq('is_active', true)
        .order('start_time');

      if (filterType !== 'all') {
        query = query.eq('service_type', filterType);
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
        .from('service_providers')
        .select('id, user_id, avg_rating, total_reviews')
        .in('id', providerIds);

      const userIds = Array.from(
        new Set((providers || []).map((p: any) => p.user_id).filter(Boolean))
      );
      const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', userIds)
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
  const monthStart = format(
    new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
    'yyyy-MM-dd'
  );
  const monthEnd = format(
    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0),
    'yyyy-MM-dd'
  );

  const { data: monthSlots } = useQuery({
    queryKey: ['month-slots', monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_slots')
        .select('slot_date')
        .eq('is_active', true)
        .gte('slot_date', monthStart)
        .lte('slot_date', monthEnd);
      if (error) throw error;

      // Count slots per day
      const counts: Record<string, number> = {};
      data?.forEach((s) => {
        counts[s.slot_date] = (counts[s.slot_date] || 0) + 1;
      });
      return counts;
    },
  });

  // Mini metrics
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const todayCount = useMemo(() => monthSlots?.[todayStr] ?? 0, [monthSlots, todayStr]);
  const weekCount = useMemo(() => {
    if (!monthSlots) return 0;
    return Object.entries(monthSlots).reduce((sum, [date, count]) => {
      const d = new Date(date + 'T12:00:00');
      if (isWithinInterval(d, { start: weekStart, end: weekEnd })) return sum + count;
      return sum;
    }, 0);
  }, [monthSlots, weekStart, weekEnd]);
  const monthCount = useMemo(() => {
    if (!monthSlots) return 0;
    return Object.values(monthSlots).reduce((sum, count) => sum + count, 0);
  }, [monthSlots]);

  return (
    <>
      <PageHeader title="Mis reservas" />
      <div className="container max-w-6xl mx-auto p-4 space-y-4">
        {/* Mini metricas */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="py-3 px-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  Hoy
                </span>
              </div>
              <p className="text-xl font-bold">{todayCount}</p>
              <p className="text-[11px] text-muted-foreground">citas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-3">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  Semana
                </span>
              </div>
              <p className="text-xl font-bold">{weekCount}</p>
              <p className="text-[11px] text-muted-foreground">citas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  Mes
                </span>
              </div>
              <p className="text-xl font-bold">{monthCount}</p>
              <p className="text-[11px] text-muted-foreground">total</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {SERVICE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === type.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Grid: Calendario + Slots del dia */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Calendario (3/5) */}
          <div className="lg:col-span-3">
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
          </div>

          {/* Panel de slots del dia (2/5) */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="pt-4">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  {format(selectedDate, 'EEEE d MMMM', { locale: es })}
                </h2>
                <DaySlotsList slots={slots || []} isLoading={isLoading} onBook={setBookingSlot} />
              </CardContent>
            </Card>
          </div>
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
    </>
  );
}
