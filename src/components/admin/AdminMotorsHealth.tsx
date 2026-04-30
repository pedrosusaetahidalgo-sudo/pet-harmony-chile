/**
 * AdminMotorsHealth — vista de actividad continua de los 7 motores B2B.
 *
 * Diferencia con AdminRiskMonitor:
 *   - AdminRiskMonitor = alertas (solo aparece cuando hay signal critical/warn).
 *   - AdminMotorsHealth = panel siempre visible con last_activity + counts
 *     24h/7d/30d por motor. Muestra "el motor está vivo" o "lleva X días silencioso".
 *
 * Source: RPC compute_motors_activity() (mig 20260930000001).
 *
 * Colores semáforo:
 *   - Verde 🟢 'active' (count_24h > 0)
 *   - Azul 🔵 'recent' (count_7d > 0 pero no 24h)
 *   - Ámbar 🟡 'silent' (lifetime > 0 pero 30d = 0)
 *   - Gris ⚪ 'inactive' (nunca hubo actividad)
 *
 * Se monta dentro de AdminRevenueDashboard al tope, después del header.
 */
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertCircle } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface MotorActivity {
  motor_id: string;
  motor_name: string;
  status: 'active' | 'recent' | 'silent' | 'inactive';
  last_activity_at: string | null;
  count_24h: number;
  count_7d: number;
  count_30d: number;
  count_lifetime: number;
}

const STATUS_META: Record<
  MotorActivity['status'],
  { label: string; emoji: string; color: string; bg: string }
> = {
  active: {
    label: 'Activo',
    emoji: '🟢',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200',
  },
  recent: {
    label: 'Reciente',
    emoji: '🔵',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200',
  },
  silent: {
    label: 'Silencioso',
    emoji: '🟡',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200',
  },
  inactive: {
    label: 'Sin actividad',
    emoji: '⚪',
    color: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-900/30 border-slate-200',
  },
};

export function AdminMotorsHealth() {
  const { data: motors, isLoading } = useQuery<MotorActivity[]>({
    queryKey: ['admin-motors-activity'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await sb.rpc('compute_motors_activity');
      if (error) throw error;
      return (data ?? []) as MotorActivity[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Salud de motores B2B
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const allInactive = motors?.every((m) => m.status === 'inactive');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Salud de motores B2B
          {allInactive && (
            <Badge variant="outline" className="ml-auto text-[10px]">
              Sin actividad real aún
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Estado de actividad continua de los 7 motores Revenue Master Plan. Diferente de las
          alertas críticas (esas viven en Risk Monitor al tope del Dashboard).
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {motors?.map((m) => {
            const meta = STATUS_META[m.status];
            return (
              <div
                key={m.motor_id}
                className={cn('rounded-lg border p-3 space-y-1', meta.bg)}
                title={`${meta.label}: lifetime ${m.count_lifetime} eventos`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                    {m.motor_name}
                  </div>
                  <span className="text-base" aria-label={meta.label}>
                    {meta.emoji}
                  </span>
                </div>
                <div className={cn('text-lg font-bold', meta.color)}>{m.count_7d}</div>
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <div>
                    24h: <strong>{m.count_24h}</strong> · 7d: {m.count_7d} · 30d: {m.count_30d}
                  </div>
                  {m.last_activity_at ? (
                    <div className="truncate" title={m.last_activity_at}>
                      Último:{' '}
                      {formatDistanceToNow(new Date(m.last_activity_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                  ) : (
                    <div className="italic">Nunca activo</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {allInactive && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/40 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong>Pre-launch:</strong> los 7 motores están listos en código pero sin actividad
              comercial real todavía. Usa{' '}
              <code className="text-[10px]">/admin → Comercial → Outreach B2B</code> para arrancar
              el outreach masivo (RICE 15.75 según SINTESIS_2026_04_30.md).
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
