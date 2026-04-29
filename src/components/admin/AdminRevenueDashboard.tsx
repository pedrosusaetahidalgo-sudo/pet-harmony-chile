/**
 * AdminRevenueDashboard — vista consolidada de los 7 motores Revenue Master Plan.
 *
 * Spec: REVENUE_MASTER_PLAN_2026.md.
 *
 * Para auditoria de monetizacion en una sola pantalla:
 *   - Motor #1 Pharma B2B: API keys activas + uso 30d
 *   - Motor #2 Aseguradoras: leads 30d + status breakdown + ARR estimado
 *   - Motor #3 Retail: clicks 30d + conversion rate (si hay) + partners activos
 *   - Motor #4-7 Inbound: pitch_applications por kind 30d + approved rate
 *   - COGS Petify estimado (Pro tier $0.75/pet activo)
 *   - ARR proyectado vs target Y1 conservador ($120k) / optimista ($420k)
 *
 * Refresca cada 5 min. Queries fallan suaves si tabla aun no aplicada.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Shield, ShoppingBag, Building2, Globe, DollarSign } from '@/lib/icons';
import { Banknote, Landmark, KeyRound } from 'lucide-react';
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

const PETIFY_PRO_USD_PER_PET = 0.75;

interface RevenueKpis {
  // Motor #1
  b2bKeysActive: number;
  b2bRequestsLast30d: number;
  // Motor #2
  insuranceLeadsLast30d: number;
  insuranceLeadsSent: number;
  insuranceLeadsClosed: number;
  insuranceLeadsLost: number;
  insuranceQuotesAvgClp: number;
  // Motor #3
  retailClicksLast30d: number;
  retailUniqueOwnersLast30d: number;
  retailConversionsLast30d: number;
  retailConversionClpTotal: number;
  retailPartnersActive: number;
  // Motor #4-7
  govApplicationsLast30d: number;
  bancaApplicationsLast30d: number;
  edificiosApplicationsLast30d: number;
  longtailApplicationsLast30d: number;
  // COGS
  petifyActivePets: number;
  // Insurance partners + retail partners
  insurancePartnersActive: number;
  // Birthday + vet checkin
  birthdayPartnersActive: number;
  vetCheckinKeysActive: number;
  vetCheckinIdentifiesLast30d: number;
}

const EMPTY: RevenueKpis = {
  b2bKeysActive: 0,
  b2bRequestsLast30d: 0,
  insuranceLeadsLast30d: 0,
  insuranceLeadsSent: 0,
  insuranceLeadsClosed: 0,
  insuranceLeadsLost: 0,
  insuranceQuotesAvgClp: 0,
  retailClicksLast30d: 0,
  retailUniqueOwnersLast30d: 0,
  retailConversionsLast30d: 0,
  retailConversionClpTotal: 0,
  retailPartnersActive: 0,
  govApplicationsLast30d: 0,
  bancaApplicationsLast30d: 0,
  edificiosApplicationsLast30d: 0,
  longtailApplicationsLast30d: 0,
  petifyActivePets: 0,
  insurancePartnersActive: 0,
  birthdayPartnersActive: 0,
  vetCheckinKeysActive: 0,
  vetCheckinIdentifiesLast30d: 0,
};

async function fetchRevenueKpis(): Promise<RevenueKpis> {
  const result = { ...EMPTY };
  const monthAgo = subDays(new Date(), 30).toISOString();

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

  // Motor #1 B2B keys
  result.b2bKeysActive = await safeCount('b2b_api_keys', (q) => q.eq('is_active', true));
  try {
    const { data } = await sb
      .from('b2b_api_usage')
      .select('request_count')
      .gte('window_start', monthAgo);
    result.b2bRequestsLast30d = (data ?? []).reduce(
      (acc: number, r: { request_count: number }) => acc + (r.request_count ?? 0),
      0
    );
  } catch {
    /* tabla puede no existir */
  }

  // Motor #2 Insurance
  result.insuranceLeadsLast30d = await safeCount('insurance_leads', (q) =>
    q.gte('created_at', monthAgo)
  );
  result.insuranceLeadsSent = await safeCount('insurance_leads', (q) =>
    q.eq('status', 'sent').gte('created_at', monthAgo)
  );
  result.insuranceLeadsClosed = await safeCount('insurance_leads', (q) =>
    q.eq('status', 'closed').gte('created_at', monthAgo)
  );
  result.insuranceLeadsLost = await safeCount('insurance_leads', (q) =>
    q.eq('status', 'lost').gte('created_at', monthAgo)
  );
  result.insurancePartnersActive = await safeCount('insurance_partners', (q) =>
    q.eq('is_active', true)
  );
  try {
    const { data: avg } = await sb
      .from('insurance_quotes')
      .select('monthly_premium_clp')
      .gte('computed_at', monthAgo);
    if (avg && avg.length > 0) {
      const total = (avg as { monthly_premium_clp: number }[]).reduce(
        (acc, r) => acc + (r.monthly_premium_clp ?? 0),
        0
      );
      result.insuranceQuotesAvgClp = Math.round(total / avg.length);
    }
  } catch {
    /* no aplicada aun */
  }

  // Motor #3 Retail
  try {
    const { data: clicks } = await sb
      .from('retail_clicks')
      .select('owner_id, conversion_clp, converted_at')
      .gte('created_at', monthAgo);
    if (clicks) {
      result.retailClicksLast30d = clicks.length;
      result.retailUniqueOwnersLast30d = new Set(
        (clicks as { owner_id: string }[]).map((c) => c.owner_id)
      ).size;
      const conversions = (
        clicks as { converted_at: string | null; conversion_clp: number | null }[]
      ).filter((c) => c.converted_at);
      result.retailConversionsLast30d = conversions.length;
      result.retailConversionClpTotal = conversions.reduce(
        (acc, c) => acc + (c.conversion_clp ?? 0),
        0
      );
    }
  } catch {
    /* no aplicada aun */
  }
  result.retailPartnersActive = await safeCount('retail_partners', (q) => q.eq('is_active', true));

  // Motor #4-7 Inbound (pitch_applications por kind)
  result.govApplicationsLast30d = await safeCount('pitch_applications', (q) =>
    q.eq('kind', 'gobierno_municipio').gte('created_at', monthAgo)
  );
  result.bancaApplicationsLast30d = await safeCount('pitch_applications', (q) =>
    q.eq('kind', 'banca').gte('created_at', monthAgo)
  );
  result.edificiosApplicationsLast30d = await safeCount('pitch_applications', (q) =>
    q.eq('kind', 'edificios').gte('created_at', monthAgo)
  );
  result.longtailApplicationsLast30d = await safeCount('pitch_applications', (q) =>
    q.eq('kind', 'longtail').gte('created_at', monthAgo)
  );

  // COGS Petify
  result.petifyActivePets = await safeCount('pets', (q) => q.not('petify_pet_id', 'is', null));

  // Birthday + vet checkin
  result.birthdayPartnersActive = await safeCount('birthday_coupon_partners', (q) =>
    q.eq('is_active', true)
  );
  result.vetCheckinKeysActive = await safeCount('vet_api_keys', (q) => q.eq('is_active', true));
  result.vetCheckinIdentifiesLast30d = await safeCount('vet_checkin_log', (q) =>
    q.eq('result', 'matched').gte('created_at', monthAgo)
  );

  return result;
}

function fmt(n: number): string {
  return n.toLocaleString('es-CL');
}

function fmtUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function fmtClp(n: number): string {
  return `$${n.toLocaleString('es-CL')}`;
}

interface MotorCardProps {
  icon: React.ReactNode;
  motorId: string;
  title: string;
  status: 'live' | 'inbound' | 'seed';
  metrics: { label: string; value: string; hint?: string; tone?: 'green' | 'amber' | 'red' }[];
}

function MotorCard({ icon, motorId, title, status, metrics }: MotorCardProps) {
  const statusBadge = {
    live: { label: 'LIVE', cls: 'bg-green-100 text-green-800' },
    inbound: { label: 'Inbound', cls: 'bg-blue-100 text-blue-800' },
    seed: { label: 'Seed', cls: 'bg-amber-100 text-amber-800' },
  }[status];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs font-mono">#{motorId}</span>
            {icon}
            <span>{title}</span>
          </div>
          <Badge className={cn('text-[10px]', statusBadge.cls)}>{statusBadge.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center justify-between gap-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              {m.hint && <p className="text-[10px] text-muted-foreground/70">{m.hint}</p>}
            </div>
            <p
              className={cn(
                'font-bold tabular-nums shrink-0',
                m.tone === 'green' && 'text-green-700',
                m.tone === 'amber' && 'text-amber-700',
                m.tone === 'red' && 'text-red-700'
              )}
            >
              {m.value}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AdminRevenueDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-revenue-dashboard'],
    queryFn: fetchRevenueKpis,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  const kpis = data ?? EMPTY;

  // COGS Petify estimado (mensual + anual)
  const cogsMonthly = kpis.petifyActivePets * PETIFY_PRO_USD_PER_PET;
  const cogsAnnual = cogsMonthly * 12;

  // ARR estimado bottom-up (super simplificado, solo para auditoria visual)
  // Insurance: leads_closed × poliza promedio mensual × 12 × commission 8%
  const insuranceArrEstimateUsd =
    kpis.insuranceLeadsClosed * (kpis.insuranceQuotesAvgClp / 920) * 12 * 0.08;
  // Retail: conversiones × ticket promedio × commission 10% (proxy si no hay attribution real)
  const retailArrEstimateUsd = (kpis.retailConversionClpTotal / 920) * 0.1 * 12;

  // Targets Master Plan
  const targetY1Conservative = 120_000; // USD
  const targetY1Optimistic = 420_000;

  return (
    <div className="space-y-4">
      {/* Header con resumen ARR + COGS */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            Revenue Master Plan · vista consolidada
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs text-muted-foreground">ARR estimado activo</p>
                <p className="text-lg font-bold text-green-700">
                  {fmtUsd(insuranceArrEstimateUsd + retailArrEstimateUsd)} USD
                </p>
                <p className="text-[10px] text-muted-foreground">
                  vs target Y1 conservador {fmtUsd(targetY1Conservative)}
                </p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs text-muted-foreground">COGS Petify mensual</p>
                <p
                  className={cn(
                    'text-lg font-bold',
                    cogsMonthly > 1000 ? 'text-red-700' : 'text-purple-700'
                  )}
                >
                  {fmtUsd(cogsMonthly)} USD
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {fmt(kpis.petifyActivePets)} pets activos · {fmtUsd(cogsAnnual)}/año
                </p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs text-muted-foreground">Target Y1 conservador</p>
                <p className="text-lg font-bold text-purple-700">
                  {fmtUsd(targetY1Conservative)} USD
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {(
                    ((insuranceArrEstimateUsd + retailArrEstimateUsd) / targetY1Conservative) *
                    100
                  ).toFixed(1)}
                  % logrado
                </p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs text-muted-foreground">Target Y1 optimista</p>
                <p className="text-lg font-bold text-purple-900">
                  {fmtUsd(targetY1Optimistic)} USD
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {(
                    ((insuranceArrEstimateUsd + retailArrEstimateUsd) / targetY1Optimistic) *
                    100
                  ).toFixed(1)}
                  % logrado
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid de motores */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <MotorCard
            motorId="1"
            icon={<KeyRound className="h-4 w-4 text-purple-600" />}
            title="Pharma B2B / API"
            status="live"
            metrics={[
              { label: 'API keys activas', value: fmt(kpis.b2bKeysActive) },
              {
                label: 'Requests 30d',
                value: fmt(kpis.b2bRequestsLast30d),
                hint: 'Rate limit per-tier',
              },
            ]}
          />
          <MotorCard
            motorId="2"
            icon={<Shield className="h-4 w-4 text-blue-600" />}
            title="Aseguradoras"
            status={kpis.insurancePartnersActive > 0 ? 'live' : 'seed'}
            metrics={[
              {
                label: 'Partners activos',
                value: fmt(kpis.insurancePartnersActive),
                hint: 'Seed: Sura/BCI/Mapfre (inactivos hasta firma)',
              },
              { label: 'Leads 30d', value: fmt(kpis.insuranceLeadsLast30d) },
              {
                label: 'Sent / Closed / Lost',
                value: `${kpis.insuranceLeadsSent} / ${kpis.insuranceLeadsClosed} / ${kpis.insuranceLeadsLost}`,
              },
              {
                label: 'Prima promedio',
                value: kpis.insuranceQuotesAvgClp > 0 ? fmtClp(kpis.insuranceQuotesAvgClp) : '—',
                hint: 'CLP/mes',
              },
            ]}
          />
          <MotorCard
            motorId="3"
            icon={<ShoppingBag className="h-4 w-4 text-orange-600" />}
            title="Retail"
            status={kpis.retailPartnersActive > 0 ? 'live' : 'seed'}
            metrics={[
              {
                label: 'Partners activos',
                value: fmt(kpis.retailPartnersActive),
                hint: 'Seed: Master Dog/Puppis/Pet Star',
              },
              { label: 'Clicks 30d', value: fmt(kpis.retailClicksLast30d) },
              {
                label: 'Owners únicos 30d',
                value: fmt(kpis.retailUniqueOwnersLast30d),
              },
              {
                label: 'Conversiones 30d',
                value:
                  kpis.retailConversionsLast30d > 0
                    ? `${fmt(kpis.retailConversionsLast30d)} · ${fmtClp(kpis.retailConversionClpTotal)}`
                    : '—',
                hint: 'Si partner reporta attribution',
              },
            ]}
          />
          <MotorCard
            motorId="4"
            icon={<Landmark className="h-4 w-4 text-emerald-600" />}
            title="Gobierno · Municipios"
            status="inbound"
            metrics={[
              {
                label: 'Aplicaciones 30d',
                value: fmt(kpis.govApplicationsLast30d),
                hint: 'Ley 21.020 inbound',
              },
            ]}
          />
          <MotorCard
            motorId="5"
            icon={<Banknote className="h-4 w-4 text-amber-600" />}
            title="Banca"
            status="inbound"
            metrics={[
              {
                label: 'Aplicaciones 30d',
                value: fmt(kpis.bancaApplicationsLast30d),
                hint: 'Loyalty pet-friendly',
              },
            ]}
          />
          <MotorCard
            motorId="6"
            icon={<Building2 className="h-4 w-4 text-slate-600" />}
            title="Edificios · Inmobiliarias"
            status="inbound"
            metrics={[
              {
                label: 'Aplicaciones 30d',
                value: fmt(kpis.edificiosApplicationsLast30d),
                hint: 'Pet-friendly registro digital',
              },
            ]}
          />
          <MotorCard
            motorId="7"
            icon={<Globe className="h-4 w-4 text-violet-600" />}
            title="Long-tail"
            status="inbound"
            metrics={[
              {
                label: 'Aplicaciones 30d',
                value: fmt(kpis.longtailApplicationsLast30d),
                hint: 'Aerolineas · academia · hardware · etc',
              },
            ]}
          />
        </div>
      )}

      {/* Bonus motors: birthday coupons + vet checkin */}
      {!isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Motores secundarios (Paw Shield ideas RICE)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Birthday partners activos</p>
                <p className="font-bold">{fmt(kpis.birthdayPartnersActive)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vet check-in keys activas</p>
                <p className="font-bold">{fmt(kpis.vetCheckinKeysActive)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vet check-in identifies 30d</p>
                <p className="font-bold">{fmt(kpis.vetCheckinIdentifiesLast30d)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Note */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-3 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
          <DollarSign className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Nota auditoria:</strong> ARR estimado es bottom-up super simplificado (insurance
            leads_closed × prima × commission 8% + retail attribution × commission 10%). Para
            auditoria fiscal usar datos reales de Flow.cl + reportes de partners.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
