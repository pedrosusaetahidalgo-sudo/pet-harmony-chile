import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, XCircle, Clock } from '@/lib/icons';
import { cn } from '@/lib/utils';

/**
 * PaymentEventsFailedWidget — épica I.2 (auditoría top-tier 2026-04-20).
 *
 * Muestra los eventos de Flow.cl con outcome='failed' o 'skipped' en las
 * últimas 24h y 7d. Lee directamente de `payment_events` (PK flow_token,
 * status_code) — RLS permite SELECT para admins activos.
 *
 * Propósito: que Pedro detecte en <24h si algún webhook está fallando
 * sistemáticamente (apply_premium rota, service_providers update rota,
 * amount inválido recurrente) sin tener que abrir logs de Supabase.
 */

interface PaymentEventFailed {
  flow_token: string;
  status_code: number;
  received_at: string;
  processed_at: string | null;
  outcome: 'failed' | 'skipped';
  error_message: string | null;
}

const STATUS_CODE_LABEL: Record<number, string> = {
  1: 'Pendiente',
  2: 'Pagado',
  3: 'Rechazado',
  4: 'Anulado',
};

export function PaymentEventsFailedWidget() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-payment-events-failed'],
    staleTime: 60_000,
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('payment_events' as any)
        .select('flow_token, status_code, received_at, processed_at, outcome, error_message')
        .in('outcome', ['failed', 'skipped'])
        .gte('received_at', sevenDaysAgo)
        .order('received_at', { ascending: false })
        .limit(25);

      if (error) throw error;
      return (data ?? []) as unknown as PaymentEventFailed[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 flex items-center gap-2 text-amber-600 text-sm">
          <AlertTriangle className="h-4 w-4" />
          No pude leer payment_events. Verifica que aplicaste la migración
          20260713000000_payment_events_idempotency.sql.
        </CardContent>
      </Card>
    );
  }

  const rows = data ?? [];
  const last24h = rows.filter(
    (r) => new Date(r.received_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
  );
  const failedOnly = rows.filter((r) => r.outcome === 'failed');
  const skippedOnly = rows.filter((r) => r.outcome === 'skipped');

  // Si no hay nada, mostramos un estado "todo OK" discreto.
  if (rows.length === 0) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-4 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Sin pagos fallidos en los últimos 7 días.
        </CardContent>
      </Card>
    );
  }

  const severity = last24h.some((r) => r.outcome === 'failed') ? 'critical' : 'warning';

  return (
    <Card
      className={cn(
        severity === 'critical'
          ? 'border-red-500/40 bg-red-500/5'
          : 'border-amber-500/40 bg-amber-500/5'
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle
            className={cn('h-4 w-4', severity === 'critical' ? 'text-red-600' : 'text-amber-600')}
          />
          Pagos con problemas (últimos 7 días)
        </CardTitle>
        <CardDescription className="flex items-center gap-3 flex-wrap">
          <span>
            <strong>{failedOnly.length}</strong> fallidos · <strong>{skippedOnly.length}</strong>{' '}
            descartados
          </span>
          <span className="text-xs">{last24h.length} en las últimas 24h</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.slice(0, 8).map((r) => (
          <div
            key={`${r.flow_token}-${r.status_code}`}
            className="flex items-start gap-3 p-2 rounded-md bg-background/60 border border-border/40 text-xs"
          >
            <div className="mt-0.5">
              {r.outcome === 'failed' ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Clock className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] font-mono">
                  {r.flow_token.slice(0, 12)}…
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {STATUS_CODE_LABEL[r.status_code] ?? `status=${r.status_code}`}
                </Badge>
                <span className="text-muted-foreground">
                  hace {formatDistanceToNowStrict(new Date(r.received_at), { locale: es })}
                </span>
              </div>
              {r.error_message && (
                <p className="text-muted-foreground break-words">{r.error_message}</p>
              )}
            </div>
          </div>
        ))}
        {rows.length > 8 && (
          <p className="text-xs text-muted-foreground pt-1">
            +{rows.length - 8} evento{rows.length - 8 === 1 ? '' : 's'} más.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
