import {
  CheckCircle2,
  Circle,
  SkipForward,
  MoreVertical,
  Pause,
  Trash2,
  Pencil,
} from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Routine, RoutineCompletion, ROUTINE_CATEGORIES } from '@/hooks/useRoutines';
import { format } from 'date-fns';

const DAY_LABELS = ['D', 'L', 'M', 'Mi', 'J', 'V', 'S'];

/** Derive a human-readable frequency label from days_of_week array */
function getFrequencyLabel(days: number[]): string {
  if (days.length === 7) return 'Diaria';
  if (days.length === 0) return '';
  const weekdays = [1, 2, 3, 4, 5];
  const weekend = [0, 6];
  if (weekdays.every((d) => days.includes(d)) && days.length === 5) return 'Lunes a viernes';
  if (weekend.every((d) => days.includes(d)) && days.length === 2) return 'Fines de semana';
  return `${days.length} días/sem`;
}

/** Format time_of_day (HH:mm:ss) to readable format */
function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (h === 0) return `12:${String(m).padStart(2, '0')} AM`;
  if (h < 12) return `${h}:${String(m).padStart(2, '0')} AM`;
  if (h === 12) return `12:${String(m).padStart(2, '0')} PM`;
  return `${h - 12}:${String(m).padStart(2, '0')} PM`;
}

interface RoutineCardProps {
  routine: Routine;
  todayCompletion?: RoutineCompletion;
  weeklyRate?: number;
  showPetName?: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

export function RoutineCard({
  routine,
  todayCompletion,
  weeklyRate,
  showPetName,
  onComplete,
  onSkip,
  onEdit,
  onToggleActive,
  onDelete,
}: RoutineCardProps) {
  const cat = ROUTINE_CATEGORIES[routine.category as keyof typeof ROUTINE_CATEGORIES];
  const isDoneToday = todayCompletion && !todayCompletion.skipped;
  const isSkippedToday = todayCompletion?.skipped;
  const isScheduledToday = routine.days_of_week.includes(new Date().getDay());

  return (
    <Card
      className={cn(
        'transition-colors',
        !routine.is_active && 'opacity-50',
        isDoneToday && 'bg-green-50/50 border-green-200'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Category icon */}
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ backgroundColor: cat.color + '20', color: cat.color }}
          >
            {routine.icon || categoryEmoji(routine.category)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold truncate">{routine.title}</p>
              {showPetName && routine.pets?.name && (
                <span className="text-xs text-muted-foreground">· {routine.pets.name}</span>
              )}
            </div>

            {/* Frequency label + days chips + time */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                {getFrequencyLabel(routine.days_of_week)}
              </span>
              <div className="flex gap-0.5">
                {DAY_LABELS.map((label, i) => (
                  <span
                    key={i}
                    className={cn(
                      'inline-flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-medium',
                      routine.days_of_week.includes(i)
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-muted-foreground/30'
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatTime(routine.time_of_day)}
              </span>
            </div>

            {/* Weekly progress */}
            {weeklyRate !== undefined && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${weeklyRate}%`,
                      backgroundColor:
                        weeklyRate >= 80 ? '#22c55e' : weeklyRate >= 50 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{weeklyRate}%</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isScheduledToday && routine.is_active && (
              <>
                {isDoneToday ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-xs font-medium">Hecho</span>
                  </div>
                ) : isSkippedToday ? (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <SkipForward className="h-4 w-4" />
                    <span className="text-xs">Saltado</span>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={onComplete}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      <span className="text-xs">Hecho</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-1.5 text-muted-foreground"
                      onClick={onSkip}
                    >
                      <SkipForward className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleActive}>
                  <Pause className="h-4 w-4 mr-2" />
                  {routine.is_active ? 'Pausar' : 'Reactivar'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function categoryEmoji(category: string): string {
  const map: Record<string, string> = {
    paseo: '🐾',
    comida: '🍽️',
    medicacion: '💊',
    higiene: '🚿',
    entrenamiento: '🏋️',
    juego: '🎮',
    suplemento: '🌿',
    otro: '📌',
  };
  return map[category] || '📌';
}
