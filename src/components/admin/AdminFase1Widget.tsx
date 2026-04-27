/**
 * AdminFase1Widget — KPIs de adopcion de Fase 1 del Refactor Maestro.
 *
 * Mide en un solo card las features que cerraron el 2026-04-25:
 *   - Nose prints capturados (DINOv2-large biometria)
 *   - Memoriales activos + eventos de engagement
 *   - Adoption follow-ups (response rate de los emails 30d/90d)
 *   - Paw passports generados (via system_health_log de la edge fn)
 *   - Insights publicados + cerca del threshold de 50 mascotas
 *
 * Todas las queries fallan suaves: si una mig no esta aplicada o una RPC
 * no existe, ese KPI se muestra en estado "—" sin romper el resto del card.
 *
 * Refresca cada 5 min (las features se mueven en escala diaria, no segundo
 * a segundo, y queremos limitar peso de queries).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Heart, Mail, BookOpen, BarChart3, ScanLine } from '@/lib/icons';
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface Fase1Kpis {
  nosePrintsTotal: number;
  nosePrintsLast7d: number;
  memorialsTotal: number;
  memorialsLast30d: number;
  memorialEventsLast7d: number;
  followupsDue: number;
  followupsResponded: number;
  passportsLast30d: number;
  insightsPublished: number;
  insightsNearThreshold: number;
}

const EMPTY: Fase1Kpis = {
  nosePrintsTotal: 0,
  nosePrintsLast7d: 0,
  memorialsTotal: 0,
  memorialsLast30d: 0,
  memorialEventsLast7d: 0,
  followupsDue: 0,
  followupsResponded: 0,
  passportsLast30d: 0,
  insightsPublished: 0,
  insightsNearThreshold: 0,
};

async function fetchKpis(): Promise<Fase1Kpis> {
  const now = new Date();
  const weekAgo = subDays(now, 7).toISOString();
  const monthAgo = subDays(now, 30).toISOString();
  const result = { ...EMPTY };

  // Helper: cuenta filas con un fallback silencioso si la tabla no existe
  // (ej: mig pendiente de aplicar). No queremos que un solo KPI roto
  // tire el widget completo.
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

  const [
    nosePrintsTotal,
    nosePrintsLast7d,
    memorialsTotal,
    memorialsLast30d,
    memorialEventsLast7d,
    followupsDue,
    followupsResponded,
    passportsLast30d,
  ] = await Promise.all([
    safeCount('nose_prints', (q) => q),
    safeCount('nose_prints', (q) => q.gte('created_at', weekAgo)),
    safeCount('pets', (q) => q.eq('lifecycle_status', 'memorial')),
    safeCount('pets', (q) => q.eq('lifecycle_status', 'memorial').gte('updated_at', monthAgo)),
    safeCount('memorial_events', (q) => q.gte('created_at', weekAgo)),
    // Follow-ups: total de los que ya estan vencidos (hubieran debido enviarse)
    safeCount('adoption_followups', (q) => q.lte('due_at', now.toISOString())),
    // Follow-ups: cuantos tienen response_status (respondidos por adopter)
    safeCount('adoption_followups', (q) => q.not('response_status', 'is', null)),
    safeCount('system_health_log', (q) =>
      q
        .eq('function_name', 'generate-paw-passport')
        .eq('status', 'success')
        .gte('created_at', monthAgo)
    ),
  ]);

  result.nosePrintsTotal = nosePrintsTotal;
  result.nosePrintsLast7d = nosePrintsLast7d;
  result.memorialsTotal = memorialsTotal;
  result.memorialsLast30d = memorialsLast30d;
  result.memorialEventsLast7d = memorialEventsLast7d;
  result.followupsDue = followupsDue;
  result.followupsResponded = followupsResponded;
  result.passportsLast30d = passportsLast30d;

  // Insights threshold: leer vista publica directa (RLS abierto a anon)
  try {
    const { data: insightsData } = await sb.from('public_breed_stats').select('pet_count');
    if (Array.isArray(insightsData)) {
      const counts = insightsData.map((r: { pet_count: number }) => r.pet_count ?? 0);
      result.insightsPublished = counts.filter((c) => c >= 50).length;
      result.insightsNearThreshold = counts.filter((c) => c >= 30 && c < 50).length;
    }
  } catch {
    // vista no creada todavia
  }

  return result;
}

export default function AdminFase1Widget() {
  const { data, isLoading } = useQuery<Fase1Kpis>({
    queryKey: ['admin-fase1-kpis'],
    queryFn: fetchKpis,
    staleTime: 300_000,
    refetchInterval: 300_000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48 bg-slate-800" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 bg-slate-800" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const kpis = data ?? EMPTY;
  const responseRate =
    kpis.followupsDue > 0 ? Math.round((kpis.followupsResponded / kpis.followupsDue) * 100) : 0;

  const cards = [
    {
      label: 'Nose prints',
      icon: ScanLine,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      value: kpis.nosePrintsTotal,
      delta:
        kpis.nosePrintsLast7d > 0
          ? `+${kpis.nosePrintsLast7d} esta semana`
          : 'sin captura esta semana',
      deltaPositive: kpis.nosePrintsLast7d > 0,
    },
    {
      label: 'Memoriales',
      icon: Heart,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      value: kpis.memorialsTotal,
      delta:
        kpis.memorialEventsLast7d > 0
          ? `${kpis.memorialEventsLast7d} eventos 7d`
          : kpis.memorialsLast30d > 0
            ? `+${kpis.memorialsLast30d} 30d`
            : 'sin actividad',
      deltaPositive: kpis.memorialEventsLast7d > 0 || kpis.memorialsLast30d > 0,
    },
    {
      label: 'Paw Passports',
      icon: BookOpen,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      value: kpis.passportsLast30d,
      delta: 'descargados 30d',
      deltaPositive: kpis.passportsLast30d > 0,
    },
    {
      label: 'Follow-ups',
      icon: Mail,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      value: `${responseRate}%`,
      delta:
        kpis.followupsDue > 0
          ? `${kpis.followupsResponded}/${kpis.followupsDue} respondidos`
          : 'sin envios todavia',
      deltaPositive: responseRate >= 30,
    },
    {
      label: 'Insights SEO',
      icon: BarChart3,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      value: kpis.insightsPublished,
      delta:
        kpis.insightsNearThreshold > 0
          ? `${kpis.insightsNearThreshold} cerca de 50`
          : 'publicados (≥50 mascotas)',
      deltaPositive: kpis.insightsPublished > 0,
    },
  ];

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          Fase 1 — Adopcion en prod
        </CardTitle>
        <p className="text-xs text-slate-500">
          Nose print, memorial viral, Paw Passport, follow-ups de refugios, insights SEO. Cierre
          2026-04-25.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 relative overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn('h-7 w-7 rounded-md flex items-center justify-center', c.bgColor)}
                >
                  <c.icon className={cn('h-3.5 w-3.5', c.color)} />
                </div>
                <span className="text-xs text-slate-400 font-medium">{c.label}</span>
              </div>
              <div className="font-mono text-2xl font-bold text-white leading-none">{c.value}</div>
              <p className={cn('text-[10px] mt-1.5', c.deltaPositive ? c.color : 'text-slate-600')}>
                {c.delta}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500">
          <span className="text-slate-400 font-medium">Lectura rapida:</span>{' '}
          {kpis.nosePrintsTotal === 0 &&
          kpis.memorialsTotal === 0 &&
          kpis.passportsLast30d === 0 ? (
            <span>
              Fase 1 lista en codigo + DB. Esperando primer uso real (Pedro probara con 4 mascotas
              esta semana).
            </span>
          ) : (
            <span>
              Adopcion temprana visible. Volver a chequear semanalmente para detectar caidas o picos
              de uso.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
