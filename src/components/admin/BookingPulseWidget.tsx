import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBookingPulseKpis } from '@/hooks/useBookingPulseKpis';
import { cn } from '@/lib/utils';

/**
 * Widget "Pulso de reservas" para el Admin Dashboard.
 * Muestra 4 KPIs (confirmacion, cancelacion, no-show, pendientes >24h)
 * + breakdown de citas de hoy por status.
 *
 * Criterios de alerta:
 * - Confirmacion < 85% (meta 30d post-release)
 * - Cancelacion > 10% (meta 30d)
 * - No-show > 15% (meta 30d)
 * - Cualquier pendiente > 24h
 */
export function BookingPulseWidget() {
  const { data, isLoading } = useBookingPulseKpis();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" aria-hidden="true" />
            Pulso de reservas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const confirmationOk = data.confirmationRate7d >= 0.85;
  const cancelOk = data.cancelRate7d <= 0.1;
  const noShowOk = data.noShowRate30d <= 0.15;
  const stalePendingOk = data.stalePending === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" aria-hidden="true" />
          Pulso de reservas
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            Ultimos 7 dias (30 para no-show)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Tasa confirmacion"
            value={`${(data.confirmationRate7d * 100).toFixed(0)}%`}
            sub={`${data.total7d} reservas`}
            variant={confirmationOk ? 'good' : 'warn'}
            direction={confirmationOk ? 'up' : 'down'}
          />
          <KpiTile
            icon={<XCircle className="h-4 w-4" />}
            label="Tasa cancelacion"
            value={`${(data.cancelRate7d * 100).toFixed(0)}%`}
            sub="meta < 10%"
            variant={cancelOk ? 'good' : 'warn'}
            direction={cancelOk ? 'up' : 'down'}
          />
          <KpiTile
            icon={<AlertTriangle className="h-4 w-4" />}
            label="No-show 30d"
            value={`${(data.noShowRate30d * 100).toFixed(0)}%`}
            sub={`${data.total30d} total`}
            variant={noShowOk ? 'good' : 'warn'}
            direction={noShowOk ? 'up' : 'down'}
          />
          <KpiTile
            icon={<Clock className="h-4 w-4" />}
            label="Pendientes >24h"
            value={data.stalePending.toString()}
            sub="sin confirmar"
            variant={stalePendingOk ? 'good' : 'alert'}
            direction={stalePendingOk ? 'up' : 'down'}
          />
        </div>

        {/* Breakdown hoy */}
        <div className="rounded-md border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Hoy
          </p>
          {Object.keys(data.todayTotals).length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin citas programadas para hoy.</p>
          ) : (
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(data.todayTotals).map(([status, count]) => (
                <span
                  key={status}
                  className="inline-flex items-center gap-1 rounded-full bg-background border px-2 py-0.5"
                >
                  <span className="font-semibold">{count}</span>
                  <span className="text-muted-foreground capitalize">
                    {status.replace('_', ' ')}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface KpiTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  variant: 'good' | 'warn' | 'alert';
  direction: 'up' | 'down';
}

function KpiTile({ icon, label, value, sub, variant, direction }: KpiTileProps) {
  const Arrow = direction === 'up' ? TrendingUp : TrendingDown;
  const classes = {
    good: 'border-emerald-200 bg-emerald-50/60 text-emerald-900',
    warn: 'border-amber-200 bg-amber-50/60 text-amber-900',
    alert: 'border-red-200 bg-red-50/60 text-red-900',
  }[variant];

  return (
    <div className={cn('rounded-md border p-3 space-y-1', classes)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide opacity-80 flex items-center gap-1">
          {icon}
          {label}
        </span>
        <Arrow className="h-3 w-3" aria-hidden="true" />
      </div>
      <div className="text-xl font-bold leading-tight">{value}</div>
      <div className="text-[10px] opacity-70">{sub}</div>
    </div>
  );
}
