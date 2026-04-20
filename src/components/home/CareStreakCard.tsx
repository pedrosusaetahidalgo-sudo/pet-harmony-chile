/**
 * CareStreakCard — racha de cuidado del usuario (gamificación light).
 *
 * Origen: Plan 90d — incentivar completar reminders/routines dando
 * visibilidad a la racha. No hay sistema de puntos (eso es Paw Game),
 * solo refuerzo emocional positivo.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Trophy, Calendar } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface StreakData {
  current_streak_days: number | null;
  longest_streak_days: number | null;
  last_active_date: string | null;
  actions_last_7d: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

function streakMessage(current: number, longest: number, actions7d: number): string {
  if (current === 0 && actions7d === 0) {
    return 'Empieza hoy completando un recordatorio.';
  }
  if (current === 0 && actions7d > 0) {
    return 'Retoma tu racha marcando 1 tarea hoy.';
  }
  if (current === 1) {
    return '¡Primer día! Mañana súmale otro.';
  }
  if (current >= 2 && current < 7) {
    return `${current} días seguidos. Vas bien.`;
  }
  if (current >= 7 && current < 30) {
    return `${current} días — impresionante rutina.`;
  }
  if (current >= 30 && current === longest) {
    return `${current} días — estás batiendo tu récord.`;
  }
  if (current >= 30) {
    return `${current} días — tu mejor racha fue ${longest}.`;
  }
  return `${current} días de racha.`;
}

export function CareStreakCard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<StreakData | null>({
    queryKey: ['home-care-streak', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await sb.rpc('rpc_user_care_streak');
      if (error) {
        console.warn('[CareStreakCard] RPC error', error);
        return null;
      }
      return (data?.[0] ?? null) as StreakData | null;
    },
  });

  if (isLoading) {
    return (
      <Card className="border-amber-100">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const current = data.current_streak_days ?? 0;
  const longest = data.longest_streak_days ?? 0;
  const actions7d = data.actions_last_7d ?? 0;

  // Si nunca hubo actividad, no mostrar (evita card vacío para usuarios nuevos)
  if (current === 0 && longest === 0 && actions7d === 0) return null;

  const message = streakMessage(current, longest, actions7d);
  const isBreaking = current >= longest && current > 0;

  return (
    <Card
      className={cn(
        'overflow-hidden border transition-all',
        current > 0
          ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50/50 to-white'
          : 'border-slate-200 bg-slate-50/50'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-14 w-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
              current > 0
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                : 'bg-slate-200 text-slate-500'
            )}
          >
            {current >= 30 ? (
              <Trophy className="h-7 w-7" />
            ) : current > 0 ? (
              <Flame className="h-7 w-7" />
            ) : (
              <Calendar className="h-7 w-7" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-3xl font-black text-slate-900 leading-none">
                {current}
              </span>
              <span className="text-sm text-muted-foreground">
                día{current !== 1 ? 's' : ''} seguido{current !== 1 ? 's' : ''}
              </span>
              {isBreaking && current >= 7 && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  RÉCORD
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 mt-1">{message}</p>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span>Mejor: {longest}d</span>
              <span>·</span>
              <span>Últimos 7d: {actions7d} acciones</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
