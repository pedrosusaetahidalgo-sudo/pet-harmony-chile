/**
 * AdminPDFFunnelWidget — embudo owner → ficha completa → compartida → abierta.
 *
 * Origen: Plan 90d — métricas North Star admin.
 * Mide el aha moment de Paw Friend con proxies Supabase (PostHog complementa).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PawPrint, FileText, Share2, Eye, TrendingUp } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface FunnelRow {
  owners_with_pet: number | null;
  owners_with_filled_ficha: number | null;
  owners_shared: number | null;
  owners_share_opened: number | null;
  captured_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export default function AdminPDFFunnelWidget() {
  const { data, isLoading, error } = useQuery<FunnelRow | null>({
    queryKey: ['admin-pdf-funnel'],
    staleTime: 120_000,
    refetchInterval: 120_000,
    queryFn: async () => {
      const { data, error } = await sb.rpc('rpc_pdf_funnel');
      if (error) {
        console.warn('[AdminPDFFunnelWidget] RPC error', error);
        return null;
      }
      return (data?.[0] ?? null) as FunnelRow | null;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40 bg-slate-800" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 bg-slate-800" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 text-sm text-amber-200">
          Embudo no disponible. Verifica que la migración{' '}
          <code>20260703010000_pdf_funnel_rpc.sql</code> esté aplicada y que tengas permisos admin.
        </CardContent>
      </Card>
    );
  }

  const universe = data.owners_with_pet ?? 0;
  const steps = [
    {
      label: 'Con mascota',
      value: universe,
      icon: PawPrint,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      pct: 100,
    },
    {
      label: 'Ficha completa',
      value: data.owners_with_filled_ficha ?? 0,
      icon: FileText,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      pct: universe > 0 ? Math.round(((data.owners_with_filled_ficha ?? 0) / universe) * 100) : 0,
      subtitle: '≥3 registros médicos',
    },
    {
      label: 'Compartió',
      value: data.owners_shared ?? 0,
      icon: Share2,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      pct: universe > 0 ? Math.round(((data.owners_shared ?? 0) / universe) * 100) : 0,
      subtitle: 'creó share token',
    },
    {
      label: 'Vet abrió',
      value: data.owners_share_opened ?? 0,
      icon: Eye,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      pct: universe > 0 ? Math.round(((data.owners_share_opened ?? 0) / universe) * 100) : 0,
      subtitle: 'share abierto ≥1 vez',
    },
  ];

  const openedPct = steps[3].pct;

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5" />
          Embudo Joya de la Corona
        </CardTitle>
        <p className="text-xs text-slate-500">
          Owner → ficha llena → compartida → vet la abrió. Proxy del North Star.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className={cn(
                'rounded-lg border border-slate-800 p-3 relative overflow-hidden',
                i === 0 ? 'bg-slate-900/60' : 'bg-slate-900/40'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    'h-7 w-7 rounded-md flex items-center justify-center',
                    step.bgColor
                  )}
                >
                  <step.icon className={cn('h-3.5 w-3.5', step.color)} />
                </div>
                <span className="text-xs text-slate-400 font-medium">{step.label}</span>
              </div>
              <div className="font-mono text-2xl font-bold text-white leading-none">
                {step.value}
              </div>
              {i > 0 && (
                <p className="text-[10px] text-slate-500 mt-1.5">
                  <span className={cn('font-semibold', step.color)}>{step.pct}%</span> del total
                </p>
              )}
              {step.subtitle && (
                <p className="text-[10px] text-slate-600 mt-0.5 italic">{step.subtitle}</p>
              )}
            </div>
          ))}
        </div>

        {/* Insight line */}
        <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
          {universe === 0 ? (
            <span>Sin datos todavía — crea mascotas de prueba para ver el embudo.</span>
          ) : openedPct >= 25 ? (
            <span className="text-emerald-400">
              ✓ Conversión top del embudo {openedPct}% (vets abren shares). Objetivo: ≥25%.
            </span>
          ) : openedPct >= 10 ? (
            <span className="text-amber-400">
              ⚠ Conversión {openedPct}%. Hay fricción en el paso "ficha abierta por vet". Priorizar
              notify-vet-share + onboarding vet.
            </span>
          ) : (
            <span className="text-red-400">
              ⚠ Conversión crítica {openedPct}%. Revisar por qué los shares no se abren.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
