import { useMemo, useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addWeeks,
  subWeeks,
  isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { BookingDetailDrawer } from '@/components/booking/BookingDetailDrawer';
import type { BookingType, BookingStatus } from '@/lib/bookingStateMachine';
import { getStatusColor } from '@/lib/bookingStateMachine';

/**
 * CC-25 (Booking V3 Master Plan §18.2 + §22) — vista agenda del provider.
 *
 * Vista semanal con grid horas × días. Click en booking abre el drawer
 * detalle con acciones (confirmar/cancelar/reprogramar/completar).
 *
 * Feature-flag PROVIDER_AGENDA_CALENDAR controla visibilidad. Cuando
 * esté estable, reemplaza a TodayAgendaCard como vista principal del
 * provider.
 *
 * Nota F4: drag-and-drop está en roadmap pero no es MVP de este ticket.
 * Por ahora se reprograma haciendo click en booking → drawer → action.
 */
interface ProviderAgendaCalendarProps {
  providerId: string;
  providerUserId?: string;
}

interface AgendaBooking {
  id: string;
  booking_type: BookingType;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  status: BookingStatus;
  service_type: string;
  pet_name: string | null;
  owner_name: string | null;
  is_emergency: boolean;
}

// Horario base: 08:00 — 20:00, cada 30 min. Filas de la grilla.
const HOURS = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

export function ProviderAgendaCalendar({
  providerId,
  providerUserId,
}: ProviderAgendaCalendarProps) {
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<AgendaBooking | null>(null);

  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekAnchor, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['provider-agenda-week', providerId, format(weekStart, 'yyyy-MM-dd')],
    queryFn: async (): Promise<AgendaBooking[]> => {
      if (!providerId) return [];

      // Reusa el patrón OR (CC-01): captura bookings directorio + legacy vet_id.
      const orClause = providerUserId
        ? `service_provider_id.eq.${providerId},vet_id.eq.${providerUserId}`
        : `service_provider_id.eq.${providerId}`;

      const { data, error } = await supabase
        .from('vet_bookings')
        .select(
          'id, scheduled_date, start_time, end_time, status, service_type, is_emergency, pet_id, owner_id'
        )
        .or(orClause)
        .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
        .not('status', 'in', '("cancelado","no_show")')
        .order('scheduled_date', { ascending: true });

      if (error || !data) return [];

      // Enriquecer con pet_name + owner_name.
      const petIds = Array.from(new Set(data.map((b) => b.pet_id).filter(Boolean))) as string[];
      const ownerIds = Array.from(new Set(data.map((b) => b.owner_id).filter(Boolean))) as string[];

      const [petsRes, profilesRes] = await Promise.all([
        petIds.length
          ? supabase.from('pets').select('id, name').in('id', petIds)
          : Promise.resolve({ data: [] }),
        ownerIds.length
          ? supabase.from('profiles').select('id, display_name').in('id', ownerIds)
          : Promise.resolve({ data: [] }),
      ]);

      const petMap = new Map((petsRes.data ?? []).map((p) => [p.id, p.name]));
      const ownerMap = new Map(
        (profilesRes.data ?? []).map((p) => [
          p.id,
          (p as { display_name?: string }).display_name ?? null,
        ])
      );

      return data.map((b) => ({
        id: b.id,
        booking_type: 'vet' as BookingType,
        scheduled_date: b.scheduled_date,
        start_time: b.start_time,
        end_time: b.end_time,
        status: b.status as BookingStatus,
        service_type: b.service_type,
        pet_name: b.pet_id ? (petMap.get(b.pet_id) ?? null) : null,
        owner_name: b.owner_id ? (ownerMap.get(b.owner_id) ?? null) : null,
        is_emergency: b.is_emergency ?? false,
      }));
    },
    enabled: !!providerId,
    staleTime: 30_000,
  });

  // Index bookings por día + hora de inicio (truncada a HH:00).
  const bookingsByDayHour = useMemo(() => {
    const m = new Map<string, AgendaBooking[]>();
    for (const b of bookings) {
      const date = b.scheduled_date.split('T')[0];
      const hour = b.start_time?.slice(0, 2) ?? '08';
      const key = `${date}_${hour}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(b);
    }
    return m;
  }, [bookings]);

  return (
    <>
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Header semana */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekAnchor((w) => subWeeks(w, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-semibold capitalize text-center">
              <CalendarDays className="h-4 w-4 inline mr-1.5 text-purple-600" />
              {format(weekStart, "d 'de' MMM", { locale: es })} —{' '}
              {format(weekEnd, "d 'de' MMM yyyy", { locale: es })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekAnchor((w) => addWeeks(w, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <Skeleton className="h-[400px] w-full rounded-md" />
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px] grid grid-cols-8 gap-px bg-slate-200 rounded-md overflow-hidden">
                {/* Header row */}
                <div className="bg-slate-50 p-2 text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Hora
                </div>
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`bg-slate-50 p-2 text-center text-[11px] font-semibold ${
                      isToday(day) ? 'text-purple-700 bg-purple-50' : 'text-slate-700'
                    }`}
                  >
                    <div className="capitalize">{format(day, 'EEE', { locale: es })}</div>
                    <div className="text-base font-bold">{format(day, 'd')}</div>
                  </div>
                ))}

                {/* Filas de horas */}
                {HOURS.map((hour) => (
                  <>
                    <div
                      key={`label-${hour}`}
                      className="bg-white p-1.5 text-[10px] text-slate-500 text-right border-b border-slate-100"
                    >
                      {hour}
                    </div>
                    {days.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const slotBookings =
                        bookingsByDayHour.get(`${dateStr}_${hour.slice(0, 2)}`) ?? [];
                      return (
                        <div
                          key={`cell-${dateStr}-${hour}`}
                          className={`bg-white p-1 min-h-[48px] border-b border-slate-100 ${
                            isToday(day) ? 'bg-purple-50/30' : ''
                          }`}
                        >
                          {slotBookings.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => setSelectedBooking(b)}
                              className={`w-full text-left text-[10px] p-1 rounded truncate transition-colors ${getStatusColor(b.status)} hover:ring-1 hover:ring-purple-400`}
                              title={`${b.pet_name ?? 'Paciente'} · ${b.service_type}`}
                            >
                              <div className="font-medium truncate">
                                {b.start_time?.slice(0, 5)} · {b.pet_name ?? 'Sin mascota'}
                              </div>
                              <div className="truncate opacity-80">{b.service_type}</div>
                              {b.is_emergency && (
                                <div className="text-red-700 font-bold">⚡ Urgencia</div>
                              )}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          )}

          {bookings.length === 0 && !isLoading && (
            <p className="text-center text-xs text-muted-foreground py-6">
              Sin citas programadas esta semana.
            </p>
          )}
        </CardContent>
      </Card>

      {selectedBooking && (
        <BookingDetailDrawer
          open={!!selectedBooking}
          onOpenChange={(open) => !open && setSelectedBooking(null)}
          bookingId={selectedBooking.id}
          bookingType={selectedBooking.booking_type}
          viewerRole="provider"
        />
      )}
    </>
  );
}
