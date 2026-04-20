/**
 * AdminAdoptionFunnel — embudo refugio → transfer → adoptante.
 *
 * Origen: Plan 90d — medir flujo shelter onboarding + transfer.
 * Lee rpc_adoption_funnel (mig 20260708010000).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Home, PawPrint, Send, CheckCircle2, Building2 } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface AdoptionFunnel {
  active_shelters: number;
  pets_loaded_by_shelters: number;
  pets_in_transfer: number;
  pets_transferred: number;
  shelters_with_transfers: number;
  captured_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export default function AdminAdoptionFunnel() {
  const { data, isLoading, error } = useQuery<AdoptionFunnel | null>({
    queryKey: ['admin-adoption-funnel'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await sb.rpc('rpc_adoption_funnel');
      if (error) {
        console.warn('[AdminAdoptionFunnel] RPC error', error);
        return null;
      }
      return (data?.[0] ?? null) as AdoptionFunnel | null;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="p-4 text-sm text-amber-900">
          No se pudo cargar. Verifica que <code>20260708010000_adoption_funnel_rpc.sql</code> esté
          aplicada.
        </CardContent>
      </Card>
    );
  }

  const universe = data.pets_loaded_by_shelters;

  const steps = [
    {
      label: 'Refugios activos',
      value: data.active_shelters,
      icon: Home,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      pct: 100,
      hint: 'cuentas shelter',
    },
    {
      label: 'Mascotas cargadas',
      value: data.pets_loaded_by_shelters,
      icon: PawPrint,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      pct: 100,
      hint: 'histórico total',
    },
    {
      label: 'En transferencia',
      value: data.pets_in_transfer,
      icon: Send,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      pct: universe > 0 ? Math.round((data.pets_in_transfer / universe) * 100) : 0,
      hint: 'shelter_adopted_at sin dueño',
    },
    {
      label: 'Transferidas',
      value: data.pets_transferred,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      pct: universe > 0 ? Math.round((data.pets_transferred / universe) * 100) : 0,
      hint: 'adoptante reclamó',
    },
  ];

  const conversionEnd = universe > 0 ? Math.round((data.pets_transferred / universe) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-purple-600" />
          Embudo de adopción
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Shelter onboarding → transfer al adoptante. Mide flujo del rol shelter.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className={cn(
                'rounded-lg border border-slate-200 p-3 relative',
                i === 0 ? 'bg-slate-50' : 'bg-white'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('h-7 w-7 rounded-md flex items-center justify-center', step.bg)}>
                  <step.icon className={cn('h-3.5 w-3.5', step.color)} />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">{step.label}</span>
              </div>
              <div className="font-mono text-2xl font-bold text-slate-900 leading-none">
                {step.value}
              </div>
              {i >= 2 && universe > 0 && (
                <p className={cn('text-[10px] font-semibold mt-1.5', step.color)}>
                  {step.pct}% del total cargado
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5 italic">{step.hint}</p>
            </div>
          ))}
        </div>

        {/* Insight */}
        <div className="pt-3 border-t border-slate-200 text-xs text-slate-600">
          {data.active_shelters === 0 ? (
            <span>
              Sin refugios activos. Ver <code className="text-purple-700">/onboarding-shelter</code>{' '}
              para primer registro.
            </span>
          ) : data.pets_transferred === 0 && data.pets_loaded_by_shelters > 0 ? (
            <span className="text-amber-700">
              ⚠ Mascotas cargadas pero ninguna transferida todavía. Revisar flujo transfer en{' '}
              <code>/shelter/transfer/:petId</code>.
            </span>
          ) : conversionEnd >= 30 ? (
            <span className="text-emerald-700">
              ✓ Tasa conversión {conversionEnd}% (carga → transferida). Buen flujo operacional.
            </span>
          ) : conversionEnd > 0 ? (
            <span className="text-amber-700">
              ⚠ Tasa conversión {conversionEnd}%. Mejorable con seguimiento activo post-intake.
            </span>
          ) : (
            <span>Sin transferencias todavía.</span>
          )}
          <span className="block mt-1 text-[10px] text-muted-foreground">
            Refugios con al menos 1 adopción exitosa: {data.shelters_with_transfers}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
