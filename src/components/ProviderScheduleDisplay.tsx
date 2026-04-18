import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Clock, CheckCircle2 } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface AvailabilityRule {
  day_of_week: number;
  start_time: string; // 'HH:MM:SS'
  end_time: string; // 'HH:MM:SS'
  service_type: string | null;
  is_active: boolean;
}

const DAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado',
};

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Lunes primero

function formatTime(t: string): string {
  // '09:00:00' -> '09:00'
  return t.slice(0, 5);
}

function isOpenNow(rule: AvailabilityRule, now: Date): boolean {
  if (!rule.is_active) return false;
  if (rule.day_of_week !== now.getDay()) return false;
  const nowHM = now.toTimeString().slice(0, 5); // 'HH:MM'
  return formatTime(rule.start_time) <= nowHM && nowHM < formatTime(rule.end_time);
}

interface Props {
  providerId: string;
  compact?: boolean;
  className?: string;
}

/**
 * Muestra los horarios del provider desde provider_availability_rules (booking V2).
 * Compact: solo dice "Abierto ahora" o "Cerrado - abre L/M a HH:MM".
 * Full: lista los 7 dias con sus rangos.
 */
export function ProviderScheduleDisplay({ providerId, compact = false, className }: Props) {
  const { data, isLoading } = useQuery<AvailabilityRule[]>({
    queryKey: ['provider-availability-rules', providerId],
    enabled: !!providerId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_availability_rules')
        .select('day_of_week, start_time, end_time, service_type, is_active')
        .eq('provider_id', providerId)
        .eq('is_active', true);
      if (error) throw error;
      return (data as AvailabilityRule[]) ?? [];
    },
  });

  if (isLoading || !data) return null;
  if (data.length === 0) return null;

  const now = new Date();
  const openRule = data.find((r) => isOpenNow(r, now));

  // Agrupar reglas por dia (puede haber varias por dia, aunque lo normal es 1)
  const rulesByDay = new Map<number, AvailabilityRule[]>();
  for (const r of data) {
    const arr = rulesByDay.get(r.day_of_week) ?? [];
    arr.push(r);
    rulesByDay.set(r.day_of_week, arr);
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs', className)}>
        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
        {openRule ? (
          <span className="text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Abierto ahora · cierra {formatTime(openRule.end_time)}
          </span>
        ) : (
          <span className="text-muted-foreground">
            Cerrado · {data.length} {data.length === 1 ? 'dia' : 'dias'} de atencion
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Clock className="h-4 w-4" />
        Horarios de atencion
        {openRule && (
          <span className="ml-auto text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Abierto ahora
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {DAY_ORDER.map((dow) => {
          const rules = rulesByDay.get(dow);
          const isToday = dow === now.getDay();
          return (
            <div
              key={dow}
              className={cn(
                'flex justify-between py-0.5',
                isToday && 'font-semibold text-foreground'
              )}
            >
              <span className="text-muted-foreground">{DAY_LABELS[dow]}</span>
              <span>
                {rules?.length ? (
                  rules
                    .map((r) => `${formatTime(r.start_time)}-${formatTime(r.end_time)}`)
                    .join(', ')
                ) : (
                  <span className="text-muted-foreground/60">Cerrado</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
