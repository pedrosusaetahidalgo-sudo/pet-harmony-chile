import { useMemo } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import type { AvailabilityRule } from '@/lib/availabilitySlots';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

interface AvailabilityPreviewProps {
  rules: AvailabilityRule[];
  className?: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mie' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
];

interface DaySummary {
  day: number;
  label: string;
  ranges: { start: string; end: string }[];
  slots: number;
}

function durationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

/**
 * Muestra un resumen visual de las reglas de disponibilidad recurrentes
 * del provider. Sirve como confirmacion "asi se veria tu semana" antes
 * de que el vet guarde sus reglas.
 */
export function AvailabilityPreview({ rules, className }: AvailabilityPreviewProps) {
  const byDay = useMemo<DaySummary[]>(() => {
    return DAYS_OF_WEEK.map(({ value, label }) => {
      const active = rules.filter((r) => r.is_active && r.day_of_week === value);
      const ranges = active.map((r) => ({
        start: formatTime(r.start_time),
        end: formatTime(r.end_time),
      }));
      const slots = active.reduce((acc, r) => {
        const minutes = durationMinutes(r.start_time, r.end_time);
        const slotDuration = r.slot_duration_minutes + r.buffer_minutes;
        return acc + (slotDuration > 0 ? Math.floor(minutes / slotDuration) * r.capacity : 0);
      }, 0);
      return { day: value, label, ranges, slots };
    });
  }, [rules]);

  const totalSlots = byDay.reduce((acc, d) => acc + d.slots, 0);
  const activeDays = byDay.filter((d) => d.ranges.length > 0).length;

  if (rules.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground',
          className
        )}
      >
        <AlertCircle className="h-5 w-5 mx-auto mb-1 opacity-60" aria-hidden="true" />
        Aun no tienes reglas de disponibilidad. Al crear la primera, veras el preview aca.
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-card p-3 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Asi se veria tu semana</h3>
        <div className="text-xs text-muted-foreground">
          {activeDays} {activeDays === 1 ? 'dia' : 'dias'} · ~{totalSlots} citas posibles
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {byDay.map((d) => {
          const active = d.ranges.length > 0;
          return (
            <div
              key={d.day}
              className={cn(
                'rounded-md border p-1.5 text-center space-y-1 min-h-[70px]',
                active
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : 'border-slate-200 bg-slate-50/40 text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-wide',
                  active ? 'text-emerald-800' : ''
                )}
              >
                {d.label}
              </div>
              {active ? (
                <div className="space-y-0.5">
                  {d.ranges.map((r, i) => (
                    <div
                      key={i}
                      className="text-[10px] text-emerald-900 flex items-center justify-center gap-0.5"
                    >
                      <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                      {r.start}–{r.end}
                    </div>
                  ))}
                  <div className="text-[9px] text-emerald-700">
                    {d.slots} {d.slots === 1 ? 'cita' : 'citas'}
                  </div>
                </div>
              ) : (
                <div className="text-[10px]">Cerrado</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
