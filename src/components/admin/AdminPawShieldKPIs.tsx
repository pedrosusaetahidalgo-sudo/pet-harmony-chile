/**
 * AdminPawShieldKPIs — Monitoreo de Paw Shield + COGS Petify.
 *
 * Mide en un card:
 *   - Pets con Paw Shield activado (high quality vs low vs pending)
 *   - Activacion 7d / 30d
 *   - COGS Petify estimado (Pro tier $0.75/pet/mes)
 *   - Imagenes archivadas con consent training (RPC paw_shield_archive_stats)
 *   - Identifies publicos /nose-scan ultimos 7 dias
 *   - Alerta visual si COGS estimado > threshold (default $1k USD/mes)
 *
 * Refresca cada 5 min. Queries fallan suaves.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, ShieldCheck, AlertCircle, ScanLine, Database, DollarSign } from '@/lib/icons';
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

/** Pro tier $0.75 / pet / mes (Petify pricing oficial 2026-04-29). */
const PETIFY_PRO_USD_PER_PET_MONTH = 0.75;
/** Alerta visual cuando COGS estimado supera este monto USD/mes. */
const COGS_ALERT_THRESHOLD_USD = 1000;

interface PawShieldKpis {
  petsHighQuality: number;
  petsLowQuality: number;
  petsPending: number;
  activatedLast7d: number;
  activatedLast30d: number;
  identifiesLast7d: number;
  identifiesNoMatchLast7d: number;
  archivedTotal: number;
  archivedWithConsent: number;
  archivePendingExpiry: number;
}

const EMPTY: PawShieldKpis = {
  petsHighQuality: 0,
  petsLowQuality: 0,
  petsPending: 0,
  activatedLast7d: 0,
  activatedLast30d: 0,
  identifiesLast7d: 0,
  identifiesNoMatchLast7d: 0,
  archivedTotal: 0,
  archivedWithConsent: 0,
  archivePendingExpiry: 0,
};

async function fetchKpis(): Promise<PawShieldKpis> {
  const now = new Date();
  const weekAgo = subDays(now, 7).toISOString();
  const monthAgo = subDays(now, 30).toISOString();
  const result = { ...EMPTY };

  const safeCount = async (
    table: string,
    filters: (q: ReturnType<typeof sb.from>) => ReturnType<typeof sb.from>
  ): Promise<number> => {
    try {
      const { count, error } = await filters(
        sb.from(table).select('*', { count: 'exact', head: true })
      );
      if (error) return 0;
      return count ?? 0;
    } catch {
      return 0;
    }
  };

  // Estado actual cohort.
  const [highQ, lowQ, pending] = await Promise.all([
    safeCount('pets', (q) => q.eq('petify_quality', 'high')),
    safeCount('pets', (q) => q.eq('petify_quality', 'low')),
    safeCount('pets', (q) => q.eq('nose_print_pending', true)),
  ]);
  result.petsHighQuality = highQ;
  result.petsLowQuality = lowQ;
  result.petsPending = pending;

  // Activacion reciente (filtrar por petify_registered_at).
  const [act7, act30] = await Promise.all([
    safeCount('pets', (q) => q.gte('petify_registered_at', weekAgo)),
    safeCount('pets', (q) => q.gte('petify_registered_at', monthAgo)),
  ]);
  result.activatedLast7d = act7;
  result.activatedLast30d = act30;

  // Identifies publicos.
  const [idSuccess, idNoMatch] = await Promise.all([
    safeCount('paw_shield_events', (q) =>
      q.eq('event_type', 'identify_success').gte('created_at', weekAgo)
    ),
    safeCount('paw_shield_events', (q) =>
      q.eq('event_type', 'identify_no_match').gte('created_at', weekAgo)
    ),
  ]);
  result.identifiesLast7d = idSuccess;
  result.identifiesNoMatchLast7d = idNoMatch;

  // Archive stats via RPC (mas eficiente que SELECT *).
  try {
    const { data, error } = await sb.rpc('paw_shield_archive_stats');
    if (!error && Array.isArray(data) && data.length > 0) {
      result.archivedTotal = Number(data[0]?.total_images ?? 0);
      result.archivedWithConsent = Number(data[0]?.with_consent ?? 0);
      result.archivePendingExpiry = Number(data[0]?.pending_expiration ?? 0);
    }
  } catch {
    // RPC no disponible (mig no aplicada todavia) — se queda en 0.
  }

  return result;
}

function fmt(n: number): string {
  return n.toLocaleString('es-CL');
}

export function AdminPawShieldKPIs() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-paw-shield-kpis'],
    queryFn: fetchKpis,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  const kpis = data ?? EMPTY;
  const totalActive = kpis.petsHighQuality + kpis.petsLowQuality;
  const cogsEstimateUsd = totalActive * PETIFY_PRO_USD_PER_PET_MONTH;
  const cogsAlert = cogsEstimateUsd > COGS_ALERT_THRESHOLD_USD;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-purple-600" />
          Paw Shield · Petify monitoring
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <KpiTile
                icon={<ShieldCheck className="h-4 w-4 text-green-600" />}
                label="Protegidas (3+ fotos)"
                value={fmt(kpis.petsHighQuality)}
              />
              <KpiTile
                icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
                label="Pocas fotos"
                value={fmt(kpis.petsLowQuality)}
              />
              <KpiTile
                icon={<AlertCircle className="h-4 w-4 text-amber-400" />}
                label="Pendientes"
                value={fmt(kpis.petsPending)}
              />
              <KpiTile
                icon={<Shield className="h-4 w-4 text-purple-600" />}
                label="Activacion 7d"
                value={`+${fmt(kpis.activatedLast7d)}`}
                hint={`+${fmt(kpis.activatedLast30d)} en 30d`}
              />
              <KpiTile
                icon={<ScanLine className="h-4 w-4 text-blue-500" />}
                label="Identifies /nose-scan 7d"
                value={fmt(kpis.identifiesLast7d)}
                hint={`${fmt(kpis.identifiesNoMatchLast7d)} sin match`}
              />
              <KpiTile
                icon={<Database className="h-4 w-4 text-indigo-500" />}
                label="Archivadas (training)"
                value={fmt(kpis.archivedWithConsent)}
                hint={`${fmt(kpis.archivedTotal)} totales · ${fmt(kpis.archivePendingExpiry)} expiran <7d`}
              />
            </div>

            <div
              className={cn(
                'rounded-lg p-3 flex items-start gap-3 text-sm',
                cogsAlert
                  ? 'border border-red-300 bg-red-50 text-red-900'
                  : 'border border-purple-200 bg-purple-50/50 text-purple-900'
              )}
            >
              <DollarSign
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  cogsAlert ? 'text-red-600' : 'text-purple-600'
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">
                  COGS Petify estimado: USD ${cogsEstimateUsd.toFixed(2)}/mes
                </p>
                <p className="text-xs opacity-80 leading-relaxed">
                  {fmt(totalActive)} pets activos × ${PETIFY_PRO_USD_PER_PET_MONTH.toFixed(2)} (Pro
                  tier).
                  {cogsAlert
                    ? ` Sobre threshold ($${COGS_ALERT_THRESHOLD_USD}/mes). Considera negociar volumen o limitar opt-in.`
                    : ' Dentro del rango aceptable.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KpiTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground truncate">{label}</span>
      </div>
      <p className="text-xl font-bold leading-none">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
