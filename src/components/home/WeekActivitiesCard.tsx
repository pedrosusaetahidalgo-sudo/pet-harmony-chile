/**
 * WeekActivitiesCard — consolida actividades pendientes de los próximos 7 días.
 *
 * Origen: Plan 90d — visión unificada de qué pasa la próxima semana:
 *   - pet_reminders pendientes (vacunas, antiparasitarios, etc.).
 *   - vet_bookings confirmadas.
 *
 * Complemento a NextBookingCard (próxima cita puntual) y el calendario
 * completo (/calendario).
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Syringe, Bug, Stethoscope, Clock, ChevronRight, PawPrint } from '@/lib/icons';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface WeekItem {
  kind: 'reminder' | 'booking';
  id: string;
  date: string;
  title: string;
  pet_name?: string | null;
  icon_type?: string;
  route: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

function iconForReminder(type: string | null | undefined) {
  switch (type) {
    case 'vaccine':
      return Syringe;
    case 'antiparasitic':
    case 'deworming':
      return Bug;
    default:
      return Calendar;
  }
}

function dayLabel(date: Date): string {
  if (isToday(date)) return 'Hoy';
  if (isTomorrow(date)) return 'Mañana';
  return format(date, 'EEEE d', { locale: es });
}

export function WeekActivitiesCard() {
  const { user } = useAuth();

  const { data: items, isLoading } = useQuery<WeekItem[]>({
    queryKey: ['home-week-activities', user?.id],
    enabled: !!user?.id,
    staleTime: 2 * 60_000,
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      if (!user?.id) return [];
      const today = new Date();
      const weekAhead = addDays(today, 7);

      const [remindersResp, bookingsResp] = await Promise.all([
        sb
          .from('pet_reminders')
          .select('id, title, type, due_date, pets(name)')
          .eq('owner_id', user.id)
          .gte('due_date', today.toISOString().slice(0, 10))
          .lte('due_date', weekAhead.toISOString().slice(0, 10))
          .or('is_completed.is.null,is_completed.eq.false')
          .order('due_date', { ascending: true })
          .limit(10),
        sb
          .from('vet_bookings')
          .select('id, scheduled_date, service_type, status, pet_id, pets(name)')
          .eq('owner_id', user.id)
          .in('status', ['pendiente', 'confirmado', 'en_camino'])
          .gte('scheduled_date', today.toISOString())
          .lte('scheduled_date', weekAhead.toISOString())
          .order('scheduled_date', { ascending: true })
          .limit(10),
      ]);

      const items: WeekItem[] = [];

      (remindersResp.data || []).forEach((r: Record<string, unknown>) => {
        const pets = r.pets as { name: string | null } | null;
        items.push({
          kind: 'reminder',
          id: String(r.id),
          date: String(r.due_date),
          title: String(r.title || 'Recordatorio'),
          pet_name: pets?.name ?? null,
          icon_type: (r.type as string) ?? '',
          route: '/reminders',
        });
      });

      (bookingsResp.data || []).forEach((b: Record<string, unknown>) => {
        const pets = b.pets as { name: string | null } | null;
        items.push({
          kind: 'booking',
          id: String(b.id),
          date: String(b.scheduled_date),
          title: `Consulta vet ${b.service_type ? `· ${String(b.service_type).replace(/_/g, ' ')}` : ''}`,
          pet_name: pets?.name ?? null,
          route: '/mis-reservas',
        });
      });

      // Ordenar por fecha
      items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return items.slice(0, 6);
    },
  });

  if (isLoading) {
    return (
      <Card className="border-indigo-100">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-40 mb-3" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Sin actividades → no mostrar (evita card con empty state ruido)
  if (!items || items.length === 0) return null;

  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                Actividades de la semana
              </p>
              <p className="text-[10px] text-muted-foreground">
                {items.length} evento{items.length !== 1 ? 's' : ''} próximo
                {items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Link
            to="/calendario"
            className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
          >
            Calendario <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-1.5">
          {items.map((item) => {
            const date = new Date(item.date);
            const Icon = item.kind === 'booking' ? Stethoscope : iconForReminder(item.icon_type);
            const isBooking = item.kind === 'booking';
            const dayText = dayLabel(date);
            const timeText = isBooking ? format(date, 'HH:mm') : '';

            return (
              <Link
                key={`${item.kind}-${item.id}`}
                to={item.route}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-indigo-100 transition-colors group"
              >
                <div
                  className={cn(
                    'h-8 w-8 rounded-md flex items-center justify-center shrink-0',
                    isBooking
                      ? 'bg-blue-100 text-blue-600'
                      : item.icon_type === 'vaccine'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-amber-100 text-amber-700'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    {item.pet_name && (
                      <>
                        <PawPrint className="h-2.5 w-2.5" />
                        <span className="truncate">{item.pet_name}</span>
                        <span>·</span>
                      </>
                    )}
                    <Clock className="h-2.5 w-2.5" />
                    <span className="capitalize">
                      {dayText}
                      {timeText ? ` ${timeText}` : ''}
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
