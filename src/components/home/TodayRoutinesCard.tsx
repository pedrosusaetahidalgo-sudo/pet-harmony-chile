import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, SkipForward, CalendarDays } from '@/lib/icons';
import { useRoutines } from '@/hooks/useRoutines';
import { cn } from '@/lib/utils';
import { LINKS } from '@/lib/links';

export function TodayRoutinesCard() {
  const navigate = useNavigate();
  const { todayRoutines, completeToday, isLoading } = useRoutines();

  if (isLoading || todayRoutines.length === 0) return null;

  const completed = todayRoutines.filter(
    (r) => r.todayCompletion && !r.todayCompletion.skipped
  ).length;
  const total = todayRoutines.length;

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <span className="text-blue-900">Rutinas de hoy</span>
          </span>
          <Button
            variant="link"
            size="sm"
            className="text-xs h-6 px-0"
            onClick={() => navigate(LINKS.routinesTab())}
          >
            Ver mas
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {todayRoutines.slice(0, 5).map((routine) => {
          const isDone = routine.todayCompletion && !routine.todayCompletion.skipped;
          const isSkipped = routine.todayCompletion?.skipped;

          return (
            <div
              key={routine.id}
              className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-blue-100"
            >
              <button
                onClick={() => {
                  if (!isDone && !isSkipped) {
                    completeToday.mutate({ routineId: routine.id });
                  }
                }}
                className="flex-shrink-0"
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : isSkipped ? (
                  <SkipForward className="h-4 w-4 text-muted-foreground/50" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/30 hover:text-green-400 transition-colors" />
                )}
              </button>
              <span
                className={cn(
                  'text-sm truncate flex-1',
                  isDone && 'line-through text-muted-foreground'
                )}
              >
                {routine.title}
                {routine.pets?.name && (
                  <span className="text-muted-foreground"> - {routine.pets.name}</span>
                )}
              </span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {routine.time_of_day.slice(0, 5)}
              </span>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground text-center pt-1">
          {completed} de {total} completadas
        </p>
      </CardContent>
    </Card>
  );
}
