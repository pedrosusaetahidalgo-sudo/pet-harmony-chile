import { Routine, RoutineCompletion, ROUTINE_CATEGORIES } from '@/hooks/useRoutines';
import { cn } from '@/lib/utils';
import { format, startOfWeek, addDays } from 'date-fns';
import { CheckCircle2, Circle, SkipForward } from '@/lib/icons';

const DAY_HEADERS = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D'];
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first

interface RoutineWeekViewProps {
  routines: Routine[];
  completions: RoutineCompletion[];
}

export function RoutineWeekView({ routines, completions }: RoutineWeekViewProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = format(new Date(), 'yyyy-MM-dd');

  // Group routines by time slot
  const sorted = [...routines].sort((a, b) => a.time_of_day.localeCompare(b.time_of_day));

  if (sorted.length === 0) return null;

  return (
    <div className="overflow-x-auto -mx-3 px-3">
      <div className="min-w-[500px]">
        {/* Header */}
        <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-1 mb-1">
          <div />
          {weekDates.map((d, i) => {
            const dateStr = format(d, 'yyyy-MM-dd');
            const isToday = dateStr === today;
            return (
              <div
                key={i}
                className={cn(
                  'text-center text-[10px] font-medium py-1 rounded',
                  isToday ? 'bg-purple-100 text-purple-700' : 'text-muted-foreground'
                )}
              >
                <div>{DAY_HEADERS[i]}</div>
                <div className="text-[9px]">{format(d, 'd')}</div>
              </div>
            );
          })}
        </div>

        {/* Rows */}
        {sorted.map((routine) => {
          const cat = ROUTINE_CATEGORIES[routine.category as keyof typeof ROUTINE_CATEGORIES];
          return (
            <div
              key={routine.id}
              className="grid grid-cols-[100px_repeat(7,1fr)] gap-1 mb-0.5 items-center"
            >
              <div className="flex items-center gap-1.5 min-w-0 pr-1">
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-[10px] font-medium truncate">{routine.title}</span>
                <span className="text-[9px] text-muted-foreground flex-shrink-0">
                  {routine.time_of_day.slice(0, 5)}
                </span>
              </div>
              {weekDates.map((d, i) => {
                const dow = DOW_ORDER[i];
                const dateStr = format(d, 'yyyy-MM-dd');
                const isScheduled = routine.days_of_week.includes(dow);
                const completion = completions.find(
                  (c) => c.routine_id === routine.id && c.completed_date === dateStr
                );

                if (!isScheduled) {
                  return <div key={i} className="h-6" />;
                }

                return (
                  <div key={i} className="flex justify-center">
                    {completion ? (
                      completion.skipped ? (
                        <SkipForward className="h-3.5 w-3.5 text-muted-foreground/50" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      )
                    ) : (
                      <Circle className="h-3.5 w-3.5" style={{ color: cat.color + '60' }} />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
