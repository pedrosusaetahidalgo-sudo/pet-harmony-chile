/**
 * AdminActivationFunnelWidget — embudo 30 dias: signup -> 1ra mascota ->
 * 1ra accion -> retenido 7d+.
 *
 * Origen: Plan 90d Tanda 16. Complementa AdminPDFFunnelWidget (que mide
 * progreso de ficha). Este mide activacion general.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, PawPrint, Zap, CheckCircle } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface FunnelRow {
  signups: number;
  with_pet: number;
  with_action: number;
  retained: number;
  captured_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export default function AdminActivationFunnelWidget() {
  const { data, isLoading, error } = useQuery<FunnelRow | null>({
    queryKey: ['admin-activation-funnel-30d'],
    staleTime: 120_000,
    refetchInterval: 120_000,
    queryFn: async () => {
      const { data, error } = await sb.rpc('rpc_activation_funnel_30d');
      if (error) {
        console.warn('[AdminActivationFunnelWidget] RPC error', error);
        return null;
      }
      return (data?.[0] ?? null) as FunnelRow | null;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Activación 30d</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Activación 30d</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Aplica la migración <code>20260711000000_activation_funnel_rpc.sql</code> para activar
            este widget.
          </p>
        </CardContent>
      </Card>
    );
  }

  const pct = (n: number) => (data.signups > 0 ? Math.round((n / data.signups) * 100) : 0);

  const steps: Array<{
    icon: typeof Users;
    label: string;
    value: number;
    pct: number;
    color: string;
  }> = [
    {
      icon: Users,
      label: 'Signups',
      value: data.signups,
      pct: 100,
      color: 'bg-slate-400',
    },
    {
      icon: PawPrint,
      label: '1ra mascota (7d)',
      value: data.with_pet,
      pct: pct(data.with_pet),
      color: 'bg-purple-500',
    },
    {
      icon: Zap,
      label: '1ra acción (7d)',
      value: data.with_action,
      pct: pct(data.with_action),
      color: 'bg-amber-500',
    },
    {
      icon: CheckCircle,
      label: 'Retenido 7d+',
      value: data.retained,
      pct: pct(data.retained),
      color: 'bg-emerald-500',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Activación 30d</span>
          <span className="text-[10px] text-muted-foreground font-normal">
            cohorte últimos 30 días
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {step.label}
                </span>
                <span className="font-semibold tabular-nums">
                  {step.value}{' '}
                  <span className="text-muted-foreground font-normal">({step.pct}%)</span>
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', step.color)}
                  style={{ width: `${step.pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {data.signups > 0 && data.with_pet === 0 && (
          <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded p-2 mt-2">
            Alerta: signups sin agregar mascota. Revisa onboarding.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
