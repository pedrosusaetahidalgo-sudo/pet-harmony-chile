import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PlusCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Play,
  CheckCheck,
  AlertTriangle,
  Star,
  CreditCard,
  Undo2,
  BellRing,
  Truck,
  History,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { BookingEventType } from '@/lib/bookingStateMachine';
import type { BookingEvent } from '@/hooks/useBookingEvents';

interface BookingTimelineProps {
  events: BookingEvent[];
  isLoading?: boolean;
  className?: string;
  /** Si true, oculta el header "Historial" y solo renderiza la lista */
  hideHeader?: boolean;
  /** Cantidad maxima de eventos a mostrar. undefined = todos */
  maxItems?: number;
}

const EVENT_LABEL: Record<BookingEventType, string> = {
  created: 'Reserva creada',
  confirmed: 'Reserva confirmada',
  cancelled_by_owner: 'Cancelada por el dueno',
  cancelled_by_provider: 'Cancelada por el profesional',
  rescheduled: 'Reprogramada',
  in_progress: 'Consulta iniciada',
  completed: 'Completada',
  no_show: 'No se presento',
  reviewed: 'Resena recibida',
  payment_received: 'Pago recibido',
  payment_refunded: 'Pago reembolsado',
  reminder_sent: 'Recordatorio enviado',
  en_camino: 'Profesional en camino',
};

function iconForEvent(type: BookingEventType) {
  switch (type) {
    case 'created':
      return PlusCircle;
    case 'confirmed':
      return CheckCircle2;
    case 'cancelled_by_owner':
    case 'cancelled_by_provider':
      return XCircle;
    case 'rescheduled':
      return RotateCcw;
    case 'in_progress':
      return Play;
    case 'completed':
      return CheckCheck;
    case 'no_show':
      return AlertTriangle;
    case 'reviewed':
      return Star;
    case 'payment_received':
      return CreditCard;
    case 'payment_refunded':
      return Undo2;
    case 'reminder_sent':
      return BellRing;
    case 'en_camino':
      return Truck;
    default:
      return CheckCircle2;
  }
}

function colorForEvent(type: BookingEventType): string {
  switch (type) {
    case 'created':
      return 'text-slate-700 bg-slate-100';
    case 'confirmed':
      return 'text-emerald-700 bg-emerald-100';
    case 'cancelled_by_owner':
    case 'cancelled_by_provider':
      return 'text-red-700 bg-red-100';
    case 'rescheduled':
      return 'text-amber-700 bg-amber-100';
    case 'in_progress':
      return 'text-indigo-700 bg-indigo-100';
    case 'completed':
      return 'text-green-700 bg-green-100';
    case 'no_show':
      return 'text-red-700 bg-red-100';
    case 'reviewed':
      return 'text-yellow-700 bg-yellow-100';
    case 'payment_received':
      return 'text-emerald-700 bg-emerald-100';
    case 'payment_refunded':
      return 'text-orange-700 bg-orange-100';
    case 'reminder_sent':
      return 'text-sky-700 bg-sky-100';
    case 'en_camino':
      return 'text-sky-700 bg-sky-100';
    default:
      return 'text-slate-700 bg-slate-100';
  }
}

function actorLabel(role: BookingEvent['actor_role']): string {
  switch (role) {
    case 'owner':
      return 'Dueno';
    case 'provider':
      return 'Profesional';
    case 'admin':
      return 'Soporte';
    case 'system':
      return 'Sistema';
    default:
      return '';
  }
}

export function BookingTimeline({
  events,
  isLoading = false,
  className,
  hideHeader = false,
  maxItems,
}: BookingTimelineProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {!hideHeader && (
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <History className="h-4 w-4" aria-hidden="true" />
            Historial
          </div>
        )}
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className={cn('space-y-2', className)}>
        {!hideHeader && (
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <History className="h-4 w-4" aria-hidden="true" />
            Historial
          </div>
        )}
        <p className="text-xs text-muted-foreground py-2">Sin eventos registrados.</p>
      </div>
    );
  }

  const visible = typeof maxItems === 'number' ? events.slice(-maxItems) : events;

  return (
    <div className={cn('space-y-2', className)}>
      {!hideHeader && (
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <History className="h-4 w-4" aria-hidden="true" />
          Historial ({events.length})
        </div>
      )}
      <ol className="space-y-3 relative" aria-label="Historial de eventos de la reserva">
        <span aria-hidden="true" className="absolute left-3 top-1 bottom-1 w-px bg-border" />
        {visible.map((ev) => {
          const Icon = iconForEvent(ev.event_type);
          const label = EVENT_LABEL[ev.event_type] ?? ev.event_type;
          const actor = actorLabel(ev.actor_role);
          return (
            <li key={ev.id} className="relative flex gap-3 pl-0">
              <span
                className={cn(
                  'relative z-10 flex h-6 w-6 items-center justify-center rounded-full shrink-0',
                  colorForEvent(ev.event_type)
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="text-sm font-medium leading-tight">{label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {format(new Date(ev.created_at), "d 'de' MMM · HH:mm", { locale: es })}
                  {actor && ` · ${actor}`}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
