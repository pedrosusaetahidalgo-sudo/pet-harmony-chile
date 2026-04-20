/**
 * NextBookingCard — card destacada en Home con la próxima cita vet confirmada.
 *
 * Origen: Plan 90d — cierra loop post-booking. Dueño ve en home "tu
 * próxima cita con el Dr/a X" con countdown y acción rápida.
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, Stethoscope, ChevronRight, PawPrint } from '@/lib/icons';
import { format, formatDistanceToNow, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NextBooking {
  id: string;
  scheduled_date: string;
  service_type: string | null;
  status: string;
  visit_address: string | null;
  vet_id: string | null;
  pet_id: string | null;
  pet_name: string | null;
  vet_display_name: string | null;
  vet_avatar_url: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export function NextBookingCard() {
  const { user } = useAuth();

  const { data: booking, isLoading } = useQuery<NextBooking | null>({
    queryKey: ['home-next-booking', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    refetchInterval: 2 * 60_000,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await sb
        .from('vet_bookings')
        .select(
          `id, scheduled_date, service_type, status, visit_address, vet_id, pet_id,
           pets(name),
           profiles!vet_bookings_vet_id_fkey(display_name, avatar_url)`
        )
        .eq('owner_id', user.id)
        .in('status', ['pendiente', 'confirmado', 'en_camino'])
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!data) return null;

      // Normalize nested
      return {
        id: data.id,
        scheduled_date: data.scheduled_date,
        service_type: data.service_type,
        status: data.status,
        visit_address: data.visit_address,
        vet_id: data.vet_id,
        pet_id: data.pet_id,
        pet_name: data.pets?.name ?? null,
        vet_display_name: data.profiles?.display_name ?? null,
        vet_avatar_url: data.profiles?.avatar_url ?? null,
      };
    },
  });

  if (isLoading) {
    return (
      <Card className="border-blue-100 bg-gradient-to-br from-blue-50/40 to-white">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Sin cita → no mostrar el card (evita ruido en home)
  if (!booking) return null;

  const date = new Date(booking.scheduled_date);
  const hoursAway = differenceInHours(date, new Date());

  let whenLabel: string;
  if (isToday(date)) {
    whenLabel = `Hoy ${format(date, 'HH:mm')}`;
  } else if (isTomorrow(date)) {
    whenLabel = `Mañana ${format(date, 'HH:mm')}`;
  } else if (hoursAway <= 24 * 7) {
    whenLabel = format(date, "EEEE d 'a las' HH:mm", { locale: es });
  } else {
    whenLabel = format(date, "d 'de' MMMM 'a las' HH:mm", { locale: es });
  }

  const inDistanceLabel = formatDistanceToNow(date, { locale: es, addSuffix: true });

  // Status pills
  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    pendiente: { label: 'Pendiente confirmar', bg: 'bg-amber-100', text: 'text-amber-800' },
    confirmado: { label: 'Confirmada', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    en_camino: { label: 'El vet va en camino', bg: 'bg-blue-100', text: 'text-blue-800' },
  };
  const statusPill = statusConfig[booking.status] ?? statusConfig.confirmado;

  // Urgency: si es en <24h mostramos con borde blue más fuerte
  const isSoon = hoursAway >= 0 && hoursAway <= 24;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all',
        isSoon
          ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-white ring-2 ring-blue-100'
          : 'border-blue-100 bg-gradient-to-br from-blue-50/50 to-white'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-white" />
            </div>
            <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
              Tu próxima cita
            </p>
          </div>
          <span
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-medium',
              statusPill.bg,
              statusPill.text
            )}
          >
            {statusPill.label}
          </span>
        </div>

        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-slate-900">{whenLabel}</p>
            <p className="text-xs text-muted-foreground">{inDistanceLabel}</p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          {booking.vet_display_name && (
            <div className="flex items-center gap-1.5 text-slate-700">
              <Stethoscope className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span className="truncate">
                {booking.vet_display_name.startsWith('Dr') ? '' : 'Dr/a '}
                {booking.vet_display_name}
              </span>
            </div>
          )}
          {booking.pet_name && (
            <div className="flex items-center gap-1.5 text-slate-700">
              <PawPrint className="h-3.5 w-3.5 text-purple-500 shrink-0" />
              <span className="truncate">{booking.pet_name}</span>
            </div>
          )}
          {booking.service_type && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate capitalize">{booking.service_type.replace(/_/g, ' ')}</span>
            </div>
          )}
          {booking.visit_address && booking.visit_address !== 'A coordinar con el veterinario' && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{booking.visit_address}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button asChild size="sm" className="flex-1 h-8 bg-blue-600 hover:bg-blue-700 text-white">
            <Link to="/mis-reservas">
              Ver detalle
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </Button>
          {booking.pet_id && (
            <Button asChild variant="outline" size="sm" className="h-8">
              <Link to={`/ficha/${booking.pet_id}`}>Ficha</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
