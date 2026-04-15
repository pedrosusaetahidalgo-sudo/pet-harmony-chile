import { CalendarEvent } from '@/hooks/useUnifiedCalendar';
import { CheckCircle2, Circle, SkipForward, Clock, AlertCircle } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface CalendarEventCardProps {
  event: CalendarEvent;
  onTap?: () => void;
}

const STATUS_ICONS = {
  pending: Circle,
  completed: CheckCircle2,
  skipped: SkipForward,
  overdue: AlertCircle,
};

export function CalendarEventCard({ event, onTap }: CalendarEventCardProps) {
  const StatusIcon = STATUS_ICONS[event.status];

  return (
    <button
      onClick={onTap}
      className={cn(
        'w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors hover:bg-muted/50',
        event.status === 'completed' && 'bg-green-50/50 border-green-200',
        event.status === 'overdue' && 'bg-red-50/50 border-red-200',
        event.status === 'skipped' && 'opacity-60'
      )}
    >
      {/* Color bar */}
      <div
        className="w-1 h-10 rounded-full flex-shrink-0"
        style={{ backgroundColor: event.color }}
      />

      {/* Time */}
      {event.time && (
        <div className="flex-shrink-0 w-12 text-center">
          <span className="text-xs font-medium text-muted-foreground">{event.time}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.title}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {event.pet_name && <span>{event.pet_name}</span>}
          {event.pet_name && event.duration_minutes && <span>·</span>}
          {event.duration_minutes && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {event.duration_minutes}min
            </span>
          )}
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: event.color }}
          />
          <span className="capitalize">
            {event.type === 'routine'
              ? event.category
              : event.type === 'reminder'
                ? 'recordatorio'
                : event.type === 'followup'
                  ? 'seguimiento'
                  : event.type === 'vet_booking'
                    ? 'cita'
                    : 'cita'}
          </span>
        </div>
      </div>

      {/* Status */}
      <StatusIcon
        className={cn(
          'h-5 w-5 flex-shrink-0',
          event.status === 'completed' && 'text-green-500',
          event.status === 'overdue' && 'text-red-500',
          event.status === 'skipped' && 'text-muted-foreground',
          event.status === 'pending' && 'text-muted-foreground/40'
        )}
      />
    </button>
  );
}
