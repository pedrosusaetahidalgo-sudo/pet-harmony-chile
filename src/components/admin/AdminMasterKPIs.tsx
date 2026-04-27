/**
 * AdminMasterKPIs — dashboard consolidado §13 del Refactor Maestro.
 *
 * Lee de la vista materializada master_kpis_daily (mig 20260902900000)
 * que se refresca via pg_cron diario. Boton "Refrescar" llama RPC
 * refresh_master_kpis() para actualizar on-demand.
 *
 * Diseno: 3 secciones que mapean a las 3 fases del plan.
 *   Fase 0: usuarios + actividad
 *   Fase 1: nose prints + passports + SEO + ficha completa
 *   Fase 2: cascadas + consent + B2B + correlations + refugios
 *
 * Cada KPI tiene "valor / meta" segun §13.1-3 del plan. Color verde si
 * cumple meta, amarillo si esta cerca, rojo si lejos.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  Target,
  Users,
  PawPrint,
  Activity,
  Heart,
  Database,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface MasterKpis {
  as_of_date: string;
  // Volumen
  users_total: number;
  users_active_7d: number;
  users_active_30d: number;
  pets_active: number;
  pets_memorial: number;
  // Fase 1
  pets_with_nose_print: number;
  passports_generated_total: number;
  passports_generated_30d: number;
  seo_landings_breed: number;
  seo_landings_species: number;
  seo_landings_vets: number;
  // Joya corona
  pets_complete_ficha: number;
  pets_with_active_share: number;
  // Engagement
  medical_records_30d: number;
  vaccines_up_to_date: number;
  vaccines_overdue: number;
  // Cascadas
  health_alerts_total: number;
  health_alerts_active: number;
  health_alerts_created_7d: number;
  // Consent
  users_consent_yes: number;
  users_consent_no: number;
  users_consent_pending: number;
  // B2B
  b2b_keys_active: number;
  b2b_requests_total: number;
  correlations_published: number;
  correlations_draft: number;
  // Refugios
  shelters_active: number;
  followups_total: number;
  followups_responded: number;
  refreshed_at: string;
}

interface KpiCardProps {
  label: string;
  value: number | string;
  target?: number | string;
  hint?: string;
  tone?: 'good' | 'warn' | 'bad' | 'neutral';
}

function KpiCard({ label, value, target, hint, tone = 'neutral' }: KpiCardProps) {
  const toneClasses = {
    good: 'border-emerald-500/30 bg-emerald-500/5',
    warn: 'border-amber-500/30 bg-amber-500/5',
    bad: 'border-red-500/30 bg-red-500/5',
    neutral: 'border-slate-800 bg-slate-900/40',
  };
  const valueColor = {
    good: 'text-emerald-400',
    warn: 'text-amber-400',
    bad: 'text-red-400',
    neutral: 'text-white',
  };

  return (
    <div className={cn('rounded-lg border p-3', toneClasses[tone])}>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{label}</p>
      <p className={cn('font-mono text-2xl font-bold leading-tight mt-1', valueColor[tone])}>
        {value}
      </p>
      {target && (
        <p className="text-[10px] text-slate-500 mt-1">
          meta: <span className="font-mono">{target}</span>
        </p>
      )}
      {hint && <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function tone(
  value: number,
  target: number,
  mode: 'higher' | 'lower' = 'higher'
): KpiCardProps['tone'] {
  if (mode === 'higher') {
    if (value >= target) return 'good';
    if (value >= target * 0.5) return 'warn';
    return 'bad';
  }
  if (value <= target) return 'good';
  if (value <= target * 1.5) return 'warn';
  return 'bad';
}

export default function AdminMasterKPIs() {
  const queryClient = useQueryClient();
  const [section, setSection] = useState<'all' | 'fase0' | 'fase1' | 'fase2'>('all');

  const { data, isLoading } = useQuery<MasterKpis | null>({
    queryKey: ['admin-master-kpis'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await sb
        .from('master_kpis_daily')
        .select('*')
        .order('as_of_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn('[AdminMasterKPIs] query error', error);
        return null;
      }
      return data as MasterKpis | null;
    },
  });

  const refresh = useMutation({
    mutationFn: async () => {
      const { error } = await sb.rpc('refresh_master_kpis');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('KPIs refrescados');
      queryClient.invalidateQueries({ queryKey: ['admin-master-kpis'] });
    },
    onError: (err) => {
      toast.error(`Error: ${err instanceof Error ? err.message : 'desconocido'}`);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 text-sm">
          La vista master_kpis_daily todavia no existe. Aplica la migracion
          20260902900000_master_kpis_view.sql desde Supabase Dashboard.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-400" /> Master KPIs (§13)
          </h2>
          <p className="text-xs text-muted-foreground">
            Snapshot consolidado de las 3 fases. Refrescado{' '}
            {formatDistanceToNow(new Date(data.refreshed_at), { locale: es, addSuffix: true })}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSection('all')}
            className={section === 'all' ? 'bg-slate-800' : ''}
          >
            Todas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSection('fase0')}
            className={section === 'fase0' ? 'bg-slate-800' : ''}
          >
            Fase 0
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSection('fase1')}
            className={section === 'fase1' ? 'bg-slate-800' : ''}
          >
            Fase 1
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSection('fase2')}
            className={section === 'fase2' ? 'bg-slate-800' : ''}
          >
            Fase 2
          </Button>
          <Button
            size="sm"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            className="gap-1"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refresh.isPending && 'animate-spin')} />
            Refrescar
          </Button>
        </div>
      </div>

      {/* Volumen base */}
      {(section === 'all' || section === 'fase0') && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> Volumen base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <KpiCard label="Users total" value={data.users_total} />
              <KpiCard label="Active 7d" value={data.users_active_7d} />
              <KpiCard label="Active 30d" value={data.users_active_30d} />
              <KpiCard label="Pets activas" value={data.pets_active} />
              <KpiCard label="Memorial" value={data.pets_memorial} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fase 1 */}
      {(section === 'all' || section === 'fase1') && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PawPrint className="h-4 w-4" /> Fase 1 — moat emergente (meta dia 90)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <KpiCard
                label="Pets con nose print"
                value={data.pets_with_nose_print}
                target="1.000"
                tone={tone(data.pets_with_nose_print, 1000)}
              />
              <KpiCard
                label="Passports generados"
                value={data.passports_generated_total}
                target="500"
                hint={`${data.passports_generated_30d} en 30d`}
                tone={tone(data.passports_generated_total, 500)}
              />
              <KpiCard
                label="SEO landings"
                value={data.seo_landings_breed + data.seo_landings_species + data.seo_landings_vets}
                target="20"
                hint={`${data.seo_landings_vets} vets / ${data.seo_landings_breed} razas / ${data.seo_landings_species} especies`}
                tone={tone(
                  data.seo_landings_breed + data.seo_landings_species + data.seo_landings_vets,
                  20
                )}
              />
              <KpiCard
                label="Pets ficha completa"
                value={data.pets_complete_ficha}
                target="5.000"
                hint=">=5 records"
                tone={tone(data.pets_complete_ficha, 5000)}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              <KpiCard label="Shares activos" value={data.pets_with_active_share} />
              <KpiCard
                label="Vacunas al dia"
                value={data.vaccines_up_to_date}
                hint={`${data.vaccines_overdue} vencidas`}
                tone={data.vaccines_overdue === 0 ? 'good' : 'warn'}
              />
              <KpiCard label="Records medicos 30d" value={data.medical_records_30d} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fase 2 — cascadas + consent + B2B + refugios */}
      {(section === 'all' || section === 'fase2') && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" /> Cascadas (§2.8.3 ambient computing)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <KpiCard label="Alertas total" value={data.health_alerts_total} />
                <KpiCard label="Activas" value={data.health_alerts_active} />
                <KpiCard
                  label="Creadas 7d"
                  value={data.health_alerts_created_7d}
                  hint={data.health_alerts_created_7d === 0 ? 'sin actividad' : 'cascadas activas'}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="h-4 w-4" /> Research consent (§7.3 Pharma pre-req)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <KpiCard
                  label="Opt-in (yes)"
                  value={data.users_consent_yes}
                  hint={
                    data.users_consent_yes + data.users_consent_no > 0
                      ? `${Math.round((data.users_consent_yes * 100) / (data.users_consent_yes + data.users_consent_no))}% del total decidido`
                      : 'sin decisiones'
                  }
                  tone={
                    data.users_consent_yes + data.users_consent_no > 0 &&
                    data.users_consent_yes / (data.users_consent_yes + data.users_consent_no) >= 0.3
                      ? 'good'
                      : 'warn'
                  }
                />
                <KpiCard label="Opt-out" value={data.users_consent_no} />
                <KpiCard label="Sin decidir" value={data.users_consent_pending} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4" /> B2B + correlations (§7.5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <KpiCard
                  label="API keys activas"
                  value={data.b2b_keys_active}
                  hint={
                    data.b2b_keys_active === 0
                      ? 'esperando primer deal'
                      : `${data.b2b_requests_total} requests total`
                  }
                />
                <KpiCard
                  label="Correlations published"
                  value={data.correlations_published}
                  target="3"
                  tone={tone(data.correlations_published, 3)}
                />
                <KpiCard label="Correlations draft" value={data.correlations_draft} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Refugios (§6.7)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <KpiCard label="Shelters activos" value={data.shelters_active} />
                <KpiCard
                  label="Follow-ups respondidos"
                  value={data.followups_responded}
                  hint={
                    data.followups_total > 0
                      ? `${Math.round((data.followups_responded * 100) / data.followups_total)}% rate`
                      : 'sin envios'
                  }
                  tone={
                    data.followups_total > 0 &&
                    data.followups_responded / data.followups_total >= 0.3
                      ? 'good'
                      : 'warn'
                  }
                />
                <KpiCard label="Total enviados" value={data.followups_total} />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Badge variant="outline" className="text-[10px]">
        Fuente: master_kpis_daily · Refresh diario via pg_cron + manual aqui
      </Badge>
    </div>
  );
}
