/**
 * AdminMRRChart — evolucion MRR B2B ultimas 6 semanas.
 *
 * Origen: Plan 90d — necesitamos visibilizar crecimiento para ritual
 * semanal + deck angels/CORFO. Usa RPC rpc_mrr_timeseries.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from '@/lib/icons';
import { formatCLPCompact } from '@/lib/format';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimeseriesRow {
  week_start: string;
  mrr_clp: number;
  paying_vets: number;
  new_paying_this_week: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TimeseriesRow & { label: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-slate-300 mb-1">Semana del {row.label}</p>
      <p className="text-xs text-white">
        MRR: <span className="font-bold">{formatCLPCompact(row.mrr_clp)}</span>
      </p>
      <p className="text-xs text-slate-300">
        {row.paying_vets} vet{row.paying_vets !== 1 ? 's' : ''} pagando
      </p>
      {row.new_paying_this_week > 0 && (
        <p className="text-xs text-emerald-400">+{row.new_paying_this_week} esta semana</p>
      )}
    </div>
  );
}

export default function AdminMRRChart() {
  const { data, isLoading, error } = useQuery<TimeseriesRow[]>({
    queryKey: ['admin-mrr-timeseries'],
    staleTime: 300_000,
    refetchInterval: 300_000,
    queryFn: async () => {
      const { data, error } = await sb.rpc('rpc_mrr_timeseries');
      if (error) {
        console.warn('[AdminMRRChart] RPC error', error);
        return [];
      }
      return (data || []) as TimeseriesRow[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[220px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="p-4 text-sm text-amber-900">
          MRR chart no disponible. Verifica que <code>20260704010000_mrr_timeseries_rpc.sql</code>{' '}
          esté aplicada.
        </CardContent>
      </Card>
    );
  }

  // Preparar data para chart (shorten date labels)
  const chartData = data.map((r) => ({
    ...r,
    label: format(new Date(r.week_start), 'd MMM', { locale: es }),
  }));

  const latest = chartData[chartData.length - 1];
  const previous = chartData.length > 1 ? chartData[chartData.length - 2] : null;
  const delta = previous ? latest.mrr_clp - previous.mrr_clp : 0;
  const deltaPct =
    previous && previous.mrr_clp > 0
      ? Math.round((delta / previous.mrr_clp) * 100)
      : latest.mrr_clp > 0
        ? 100
        : 0;

  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-slate-500';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-base">MRR B2B · 6 semanas</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Suscripciones Premium/Clínica/Pro Max activas
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-purple-700">
              {formatCLPCompact(latest.mrr_clp)}
            </p>
            <p
              className={cn('text-xs font-medium flex items-center gap-1 justify-end', trendColor)}
            >
              <TrendIcon className="h-3 w-3" />
              {delta >= 0 ? '+' : ''}
              {formatCLPCompact(Math.abs(delta))} ({deltaPct >= 0 ? '+' : ''}
              {deltaPct}% sem ant)
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9333ea" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#9333ea" stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(147,51,234,0.06)' }} />
            <Bar dataKey="mrr_clp" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={idx === chartData.length - 1 ? '#9333ea' : 'url(#mrrGrad)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Quick insight */}
        <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
          {latest.mrr_clp === 0 ? (
            <span>
              Sin vets pagando todavía. Objetivo plan 90d: <strong>$49.600 CLP MRR</strong> (3 vets
              Premium + 1 clínica).
            </span>
          ) : delta > 0 ? (
            <span className="text-emerald-700">
              ✓ Crecimiento {deltaPct}% semana. Mantener outreach vet consistente.
            </span>
          ) : delta === 0 ? (
            <span>MRR estable. Revisar pipeline vets en Admin → Proveedores → Churn risk.</span>
          ) : (
            <span className="text-red-700">
              ⚠ Bajó {Math.abs(deltaPct)}%. Posible churn — revisar cancelaciones.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
