import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Clock, AlertTriangle, PawPrint, User, History } from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useBookingDetail, type BookingEvent } from '@/hooks/useBookingDetail';
import {
  getStatusColor,
  getStatusLabel,
  type BookingType,
  type BookingEventType,
} from '@/lib/bookingStateMachine';
import { formatCLP } from '@/lib/format';
import { cn } from '@/lib/utils';

interface BookingDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string | undefined;
  bookingType: BookingType;
}

const EVENT_LABEL: Record<BookingEventType, string> = {
  created: 'Reserva creada',
  confirmed: 'Reserva confirmada',
  cancelled_by_owner: 'Cancelada por el dueño',
  cancelled_by_provider: 'Cancelada por el proveedor',
  rescheduled: 'Reprogramada',
  in_progress: 'Consulta iniciada',
  completed: 'Completada',
  no_show: 'No se presentó',
  reviewed: 'Reseña recibida',
  payment_received: 'Pago recibido',
  payment_refunded: 'Pago reembolsado',
  reminder_sent: 'Recordatorio enviado',
  en_camino: 'Proveedor en camino',
};

export function BookingDetailDrawer({
  open,
  onOpenChange,
  bookingId,
  bookingType,
}: BookingDetailDrawerProps) {
  const { data, isLoading } = useBookingDetail(bookingId, bookingType);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalle de la reserva</SheetTitle>
          <SheetDescription>
            Información completa y timeline de eventos de esta reserva.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-3 mt-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-32" />
            <Skeleton className="h-40" />
          </div>
        ) : !data ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No se pudo cargar la reserva.
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {/* Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn('text-xs', getStatusColor(data.status))}>
                {getStatusLabel(data.status)}
              </Badge>
              {data.is_emergency && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Emergencia
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto">#{data.id.slice(0, 8)}</span>
            </div>

            {/* Pet + Owner */}
            <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={data.pet_photo ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <PawPrint className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {data.pet_name ?? 'Sin mascota'}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {data.pet_species ?? '—'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-dashed">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={data.owner_avatar ?? undefined} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Dueño</div>
                  <div className="text-sm font-medium truncate">
                    {data.owner_name ?? 'Sin nombre'}
                  </div>
                </div>
              </div>
            </div>

            {/* Date + service */}
            <div className="grid grid-cols-2 gap-3">
              <InfoTile
                icon={<CalendarDays className="h-4 w-4" />}
                label="Fecha"
                value={format(new Date(data.scheduled_date), "d 'de' MMMM yyyy", { locale: es })}
              />
              <InfoTile
                icon={<Clock className="h-4 w-4" />}
                label="Horario"
                value={
                  data.start_time
                    ? `${data.start_time.slice(0, 5)}${
                        data.end_time ? ` – ${data.end_time.slice(0, 5)}` : ''
                      }`
                    : '—'
                }
              />
              <InfoTile label="Servicio" value={data.service_type || '—'} className="col-span-2" />
              {data.total_price != null && (
                <InfoTile
                  label="Precio"
                  value={formatCLP(data.total_price)}
                  className="col-span-2"
                />
              )}
            </div>

            {/* Sintomas / razon cancelacion */}
            {data.symptoms && (
              <div className="rounded-lg border p-3 space-y-1 bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60">
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  Síntomas reportados
                </div>
                <p className="text-sm text-foreground/80">{data.symptoms}</p>
              </div>
            )}
            {data.cancellation_reason && (
              <div className="rounded-lg border p-3 space-y-1 bg-red-50/60 dark:bg-red-950/20 border-red-200/60">
                <div className="text-xs font-semibold text-red-800 dark:text-red-200">
                  Motivo de cancelación
                </div>
                <p className="text-sm text-foreground/80">{data.cancellation_reason}</p>
              </div>
            )}

            {/* Timeline */}
            {data.events.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <History className="h-4 w-4" />
                  Historial ({data.events.length})
                </div>
                <ol className="space-y-2 border-l-2 border-muted pl-4">
                  {data.events.map((ev) => (
                    <EventRow key={ev.id} event={ev} />
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoTile({
  icon,
  label,
  value,
  className,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-md border p-2.5 space-y-0.5 bg-background', className)}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function EventRow({ event }: { event: BookingEvent }) {
  const label = EVENT_LABEL[event.event_type] ?? event.event_type;
  return (
    <li className="relative">
      <span
        aria-hidden
        className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full bg-primary/60 border-2 border-background"
      />
      <div className="text-sm font-medium">{label}</div>
      <div className="text-[11px] text-muted-foreground">
        {format(new Date(event.created_at), 'd MMM yyyy · HH:mm', { locale: es })}
        {event.actor_role && ` · por ${event.actor_role}`}
      </div>
    </li>
  );
}
