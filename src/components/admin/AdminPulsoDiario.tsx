import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Widget "Pulso Diario" — monitor auto-pilotado.
 *
 * Muestra el ultimo snapshot (populado por edge function audit-cron-daily)
 * con delta vs ayer, auto-fixes aplicados y items que requieren decision
 * humana (maximo 3, priorizados).
 *
 * Pensado para que Pedro revise <2 min al dia y sepa que hacer.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface AuditSnapshot {
  id: string;
  snapshot_date: string;
  health_score: number;
  total_users: number;
  premium_users: number;
  active_pets: number;
  orphan_pets: number;
  verified_providers: number;
  providers_without_slug: number;
  total_bookings: number;
  error_logs_24h: number;
  error_logs_total: number;
  unique_error_patterns: number;
  auto_fixes_applied: Array<{ fixer: string; applied_count: number }>;
  needs_human_attention: Array<{
    category: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    suggested_action: string;
    count?: number;
  }>;
  created_at: string;
}

function DeltaBadge({ value, positiveGood = true }: { value: number; positiveGood?: boolean }) {
  if (value === 0) return <span className="text-slate-500 text-xs">±0</span>;
  const isPositive = value > 0;
  const isGood = positiveGood ? isPositive : !isPositive;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs',
        isGood ? 'text-green-400' : 'text-red-400'
      )}
    >
      <Icon className="h-3 w-3" />
      {isPositive ? '+' : ''}
      {value}
    </span>
  );
}

export default function AdminPulsoDiario() {
  // Ultimo snapshot + snapshot de ayer para delta
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit-snapshot-latest'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: rows } = await sb
        .from('audit_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(2);
      const list = (rows ?? []) as AuditSnapshot[];
      return {
        latest: list[0] ?? null,
        previous: list[1] ?? null,
      };
    },
  });

  const triggerRun = async () => {
    toast.info('Ejecutando audit-cron ahora...');
    try {
      const { error } = await supabase.functions.invoke('audit-cron-daily');
      if (error) throw error;
      toast.success('Audit ejecutado. Refrescando...');
      setTimeout(() => refetch(), 1500);
    } catch (err) {
      toast.error('No se pudo ejecutar: ' + (err instanceof Error ? err.message : 'error'));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const snap = data?.latest;
  const prev = data?.previous;

  if (!snap) {
    return (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Pulso Diario — pendiente de primer run
          </CardTitle>
          <CardDescription>
            La edge function <span className="font-mono text-xs">audit-cron-daily</span> aún no ha
            corrido. Ejecútala manualmente ahora o configura el cron diario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={triggerRun} disabled={isFetching} size="sm">
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isFetching && 'animate-spin')} />
            Ejecutar primer audit
          </Button>
        </CardContent>
      </Card>
    );
  }

  const healthColor =
    snap.health_score >= 85
      ? 'text-green-400'
      : snap.health_score >= 60
        ? 'text-amber-400'
        : 'text-red-400';

  const attentionItems = snap.needs_human_attention || [];
  const autoFixes = (snap.auto_fixes_applied || []).filter((f) => f.applied_count > 0);

  const healthDelta = prev ? snap.health_score - prev.health_score : 0;
  const usersDelta = prev ? snap.total_users - prev.total_users : 0;
  const premiumDelta = prev ? snap.premium_users - prev.premium_users : 0;
  const errorsDelta = prev ? snap.error_logs_total - prev.error_logs_total : 0;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Heart className={cn('h-4 w-4', healthColor)} />
              Pulso Diario
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Snapshot del{' '}
              {format(new Date(snap.snapshot_date + 'T00:00:00'), "d 'de' MMMM", { locale: es })} ·
              auto-pilotado
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-7 text-xs text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className={cn('h-3 w-3 mr-1', isFetching && 'animate-spin')} />
            Refrescar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health score grande */}
        <div className="flex items-baseline gap-3">
          <span className={cn('text-4xl font-bold', healthColor)}>{snap.health_score}</span>
          <span className="text-sm text-slate-400">/ 100</span>
          {prev && <DeltaBadge value={healthDelta} />}
          <Badge
            variant="outline"
            className={cn(
              'ml-auto text-[10px]',
              snap.health_score >= 85
                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                : snap.health_score >= 60
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-red-500/20 text-red-300 border-red-500/30'
            )}
          >
            {snap.health_score >= 85
              ? 'Saludable'
              : snap.health_score >= 60
                ? 'Degradada'
                : 'Crítica'}
          </Badge>
        </div>

        {/* Mini KPIs con delta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="rounded-md bg-slate-800/50 border border-slate-800 p-2">
            <p className="text-slate-500 uppercase text-[10px]">Usuarios</p>
            <p className="text-lg font-semibold text-white">{snap.total_users}</p>
            {prev && <DeltaBadge value={usersDelta} />}
          </div>
          <div className="rounded-md bg-slate-800/50 border border-slate-800 p-2">
            <p className="text-slate-500 uppercase text-[10px]">Premium</p>
            <p className="text-lg font-semibold text-white">{snap.premium_users}</p>
            {prev && <DeltaBadge value={premiumDelta} />}
          </div>
          <div className="rounded-md bg-slate-800/50 border border-slate-800 p-2">
            <p className="text-slate-500 uppercase text-[10px]">Mascotas</p>
            <p className="text-lg font-semibold text-white">{snap.active_pets}</p>
          </div>
          <div className="rounded-md bg-slate-800/50 border border-slate-800 p-2">
            <p className="text-slate-500 uppercase text-[10px]">Errores total</p>
            <p className="text-lg font-semibold text-white">{snap.error_logs_total}</p>
            {prev && <DeltaBadge value={errorsDelta} positiveGood={false} />}
          </div>
        </div>

        {/* Auto-fixes aplicados */}
        {autoFixes.length > 0 && (
          <div className="rounded-md border border-green-500/30 bg-green-500/5 p-2.5">
            <p className="text-xs font-semibold text-green-300 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Auto-correcciones aplicadas hoy
            </p>
            <ul className="space-y-0.5">
              {autoFixes.map((f) => (
                <li key={f.fixer} className="text-[11px] text-green-200/80 font-mono">
                  · {f.fixer}: {f.applied_count} items corregidos
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Items que requieren atención humana */}
        {attentionItems.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              Requiere tu decisión ({attentionItems.length})
            </p>
            {attentionItems.slice(0, 3).map((item, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-md border p-2.5 text-xs',
                  item.severity === 'critical'
                    ? 'border-red-500/40 bg-red-500/5'
                    : item.severity === 'warning'
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-slate-700 bg-slate-800/30'
                )}
              >
                <div className="flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px] px-1.5 py-0',
                      item.severity === 'critical'
                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                        : item.severity === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-slate-700 text-slate-300 border-slate-600'
                    )}
                  >
                    {item.severity.toUpperCase()}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{item.title}</p>
                    <p className="text-slate-400 mt-0.5">{item.description}</p>
                    <p className="text-slate-500 mt-1 italic">→ {item.suggested_action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-green-500/30 bg-green-500/5 p-3 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-400 mx-auto mb-1" />
            <p className="text-xs text-green-300 font-medium">
              Nada requiere tu atención hoy — todo ok ✓
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
          <span>
            Ultimo run: {format(new Date(snap.created_at), 'HH:mm', { locale: es })} · auto-pilotado
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={triggerRun}
            disabled={isFetching}
            className="h-6 text-[10px] text-indigo-400 hover:text-indigo-300"
          >
            Forzar ejecución
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
