import { CalendarEvent } from '@/hooks/useUnifiedCalendar';
import { CalendarEventCard } from './CalendarEventCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays } from '@/lib/icons';
import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/lib/links';

interface UnifiedDayViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventTap?: (event: CalendarEvent) => void;
}

/** Group timed events by hour for visual structure */
function groupByHour(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const hour = event.time?.slice(0, 2) || '00';
    const label = `${parseInt(hour, 10) < 12 ? parseInt(hour, 10) || 12 : parseInt(hour, 10) === 12 ? 12 : parseInt(hour, 10) - 12}:00 ${parseInt(hour, 10) < 12 ? 'AM' : 'PM'}`;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(event);
  }
  return groups;
}

export function UnifiedDayView({ date, events, onEventTap }: UnifiedDayViewProps) {
  const navigate = useNavigate();
  const timed = events
    .filter((e) => e.time)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const allDay = events.filter((e) => !e.time);
  const hourGroups = groupByHour(timed);

  const routineCount = events.filter((e) => e.type === 'routine').length;
  const reminderCount = events.filter((e) => e.type === 'reminder').length;
  const otherCount = events.length - routineCount - reminderCount;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium capitalize">
          {format(date, "EEEE d 'de' MMMM", { locale: es })}
        </p>
        {events.length > 0 && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {routineCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                {routineCount} rutina{routineCount !== 1 ? 's' : ''}
              </span>
            )}
            {reminderCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {reminderCount} recordatorio{reminderCount !== 1 ? 's' : ''}
              </span>
            )}
            {otherCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                {otherCount} cita{otherCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {events.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Sin actividades para este día
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Agrega una rutina o recordatorio para empezar
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={() => navigate(LINKS.routinesTab())}
            >
              <Plus className="h-3.5 w-3.5" />
              Rutina
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={() => navigate(LINKS.remindersTab())}
            >
              <Plus className="h-3.5 w-3.5" />
              Recordatorio
            </Button>
          </div>
        </div>
      )}

      {/* Timed events grouped by hour */}
      {hourGroups.size > 0 && (
        <div className="space-y-3">
          {Array.from(hourGroups.entries()).map(([hourLabel, hourEvents]) => (
            <div key={hourLabel}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 pl-1">
                {hourLabel}
              </p>
              <div className="space-y-1.5 border-l-2 border-muted pl-3">
                {hourEvents.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onTap={() => onEventTap?.(event)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All-day events */}
      {allDay.length > 0 && (
        <div className="space-y-1.5">
          {timed.length > 0 && (
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-2 pl-1">
              Todo el día
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
