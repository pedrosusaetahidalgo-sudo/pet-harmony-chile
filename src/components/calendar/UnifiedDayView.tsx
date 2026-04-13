import { CalendarEvent } from '@/hooks/useUnifiedCalendar';
import { CalendarEventCard } from './CalendarEventCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UnifiedDayViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventTap?: (event: CalendarEvent) => void;
}

export function UnifiedDayView({ date, events, onEventTap }: UnifiedDayViewProps) {
  const timed = events.filter((e) => e.time);
  const allDay = events.filter((e) => !e.time);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium capitalize">
        {format(date, "EEEE d 'de' MMMM", { locale: es })}
      </p>

      {events.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Sin actividades para este dia
        </p>
      )}

      {timed.length > 0 && (
        <div className="space-y-1.5">
          {timed.map((event) => (
            <CalendarEventCard key={event.id} event={event} onTap={() => onEventTap?.(event)} />
          ))}
        </div>
      )}

      {allDay.length > 0 && (
        <div className="space-y-1.5">
          {timed.length > 0 && (
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-2">
              Sin hora
            </p>
          )}
          {allDay.map((event) => (
            <CalendarEventCard key={event.id} event={event} onTap={() => onEventTap?.(event)} />
          ))}
        </div>
      )}
    </div>
  );
}
