import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Activity,
  CheckCircle2,
  Stethoscope,
  Syringe,
  Heart,
  Download,
  Crown,
  TrendingUp,
  BarChart3,
} from '@/lib/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePlan } from '@/hooks/usePlan';
import { useProAnalytics, type AnalyticsPeriod } from '@/hooks/useProAnalytics';
import { useVetAnalytics } from '@/hooks/useVetAnalytics';
import { LockedOverlay } from '@/components/analytics/LockedOverlay';
import { ProUpgradeCTA } from '@/components/analytics/ProUpgradeCTA';
import { track, EVENTS } from '@/lib/analytics';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';

const activityChartConfig: ChartConfig = {
  reminders: { label: 'Recordatorios', color: 'hsl(262, 83%, 58%)' },
  visits: { label: 'Visitas vet', color: 'hsl(173, 80%, 40%)' },
  vaccines: { label: 'Vacunas', color: 'hsl(47, 96%, 53%)' },
};

const comparisonChartConfig: ChartConfig = {
  current: { label: 'Período actual', color: 'hsl(262, 83%, 58%)' },
  previous: { label: 'Período anterior', color: 'hsl(215, 20%, 65%)' },
};

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  current_month: 'Este mes',
  last_month: 'Mes pasado',
  last_3_months: 'Últimos 3 meses',
};

interface Pet {
  id: string;
  name: string;
}

export default function ProDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, checkAccess } = usePlan();
  const [period, setPeriod] = useState<AnalyticsPeriod>('current_month');
  const [selectedPetId, setSelectedPetId] = useState<string>('all');

  const analyticsAccess = checkAccess('pro_analytics');
  const exportAccess = checkAccess('analytics_export');

  // Fetch user's pets
  const { data: pets } = useQuery({
    queryKey: ['pro-dashboard-pets', user?.id],
    queryFn: async (): Promise<Pet[]> => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('pets')
        .select('id, name')
        .eq('owner_id', user.id)
        .eq('lifecycle_status', 'active');
      return (data || []) as Pet[];
    },
    enabled: !!user?.id,
  });

  // Check if user is a provider
  const { data: isProvider } = useQuery({
    queryKey: ['is-provider', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
  });

  const petIdParam = selectedPetId === 'all' ? undefined : selectedPetId;
  const { data: analytics, isLoading } = useProAnalytics({ petId: petIdParam, period });
  const { data: vetData } = useVetAnalytics({ period });

  useEffect(() => {
    track({ event: EVENTS.PRO_PANEL_VIEWED });
  }, []);

  const handlePeriodChange = (value: string) => {
    setPeriod(value as AnalyticsPeriod);
    track({ event: EVENTS.PRO_PANEL_FILTER_CHANGED, properties: { filter: 'period', value } });
  };

  const handlePetChange = (value: string) => {
    setSelectedPetId(value);
    track({ event: EVENTS.PRO_PANEL_FILTER_CHANGED, properties: { filter: 'pet', value } });
  };

  const handleExport = (exportFormat: string) => {
    track({ event: EVENTS.PRO_PANEL_EXPORT_CLICKED, properties: { format: exportFormat } });

    if (exportFormat === 'csv' && analytics) {
      const rows: string[][] = [
        ['Metrica', 'Valor'],
        ['Recordatorios completados', String(analytics.summary.remindersCompleted)],
        ['Visitas veterinarias', String(analytics.summary.vetVisits)],
        ['Vacunas aplicadas', String(analytics.summary.vaccinesGiven)],
        ['Score de bienestar', String(analytics.summary.wellnessScore)],
      ];

      if (vetData) {
        rows.push(
          ['Reservas totales', String(vetData.summary.totalBookings)],
          ['Clientes unicos', String(vetData.summary.uniqueClients)],
          ['Ingresos', String(vetData.summary.revenue)],
          ['Resenas', String(vetData.summary.reviewCount)]
        );
      }

      if (analytics.activityTimeline.length > 0) {
        rows.push([], ['Fecha', 'Recordatorios', 'Visitas', 'Vacunas']);
        for (const point of analytics.activityTimeline) {
          rows.push([
            point.date,
            String(point.reminders),
            String(point.visits),
            String(point.vaccines),
          ]);
        }
      }

      const csv = rows.map((r) => r.join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paw-friend-analytics-${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (exportFormat === 'pdf' && analytics) {
      const periodLabel = PERIOD_LABELS[period] || period;
      const selectedPetName =
        selectedPetId === 'all'
          ? 'Todas las mascotas'
          : pets?.find((p) => p.id === selectedPetId)?.name || '';

      let vetSection = '';
      if (vetData) {
        vetSection = `
          <h2 style="margin-top:24px;color:#7c3aed;">Métricas Veterinarias</h2>
          <table><tbody>
            <tr><td>Reservas totales</td><td><strong>${vetData.summary.totalBookings}</strong></td></tr>
            <tr><td>Clientes únicos</td><td><strong>${vetData.summary.uniqueClients}</strong></td></tr>
            <tr><td>Ingresos</td><td><strong>$${vetData.summary.revenue.toLocaleString('es-CL')}</strong></td></tr>
            <tr><td>Reseñas</td><td><strong>${vetData.summary.reviewCount}</strong></td></tr>
          </tbody></table>`;
      }

      let timelineSection = '';
      if (analytics.activityTimeline.length > 0) {
        const timelineRows = analytics.activityTimeline
          .map(
            (p) =>
              `<tr><td>${p.date}</td><td>${p.reminders}</td><td>${p.visits}</td><td>${p.vaccines}</td></tr>`
          )
          .join('');
        timelineSection = `
          <h2 style="margin-top:24px;color:#7c3aed;">Línea de Tiempo</h2>
          <table>
            <thead><tr><th>Fecha</th><th>Recordatorios</th><th>Visitas</th><th>Vacunas</th></tr></thead>
            <tbody>${timelineRows}</tbody>
          </table>`;
      }

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
        <title>Paw Friend — Reporte ${periodLabel}</title>
        <style>
          body{font-family:system-ui,sans-serif;padding:40px;color:#1e1b4b;max-width:700px;margin:0 auto}
          h1{color:#7c3aed;font-size:22px;margin-bottom:4px}
          .subtitle{color:#6b7280;font-size:13px;margin-bottom:24px}
          table{width:100%;border-collapse:collapse;margin-top:8px}
          th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}
          th{background:#f3f0ff;color:#7c3aed;font-weight:600}
          .footer{margin-top:32px;font-size:11px;color:#9ca3af;text-align:center}
        </style></head><body>
        <h1>🐾 Paw Friend — Panel Pro</h1>
        <p class="subtitle">Período: ${periodLabel} · ${selectedPetName} · Generado: ${new Date().toLocaleDateString('es-CL')}</p>
        <h2 style="color:#7c3aed;">Resumen de Salud</h2>
        <table><tbody>
          <tr><td>Recordatorios completados</td><td><strong>${analytics.summary.remindersCompleted}</strong></td></tr>
          <tr><td>Visitas veterinarias</td><td><strong>${analytics.summary.vetVisits}</strong></td></tr>
          <tr><td>Vacunas aplicadas</td><td><strong>${analytics.summary.vaccinesGiven}</strong></td></tr>
          <tr><td>Score de bienestar</td><td><strong>${analytics.summary.wellnessScore}/100</strong></td></tr>
        </tbody></table>
        ${vetSection}
        ${timelineSection}
        <div class="footer">Generado por Paw Friend · pawfriend.cl</div>
      </body></html>`;

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const printWin = window.open(url, '_blank');
      if (printWin) {
        printWin.addEventListener('load', () => {
          printWin.print();
          URL.revokeObjectURL(url);
        });
      } else {
        // Fallback: download as HTML if popup blocked
        const a = document.createElement('a');
        a.href = url;
        a.download = `paw-friend-reporte-${period}.html`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  // Comparison data for bar chart
  const comparisonData = useMemo(() => {
    if (!analytics) return [];
    const { current, previous } = analytics.periodComparison;
    return [
      {
        metric: 'Recordatorios',
        current: current.remindersCompleted,
        previous: previous.remindersCompleted,
      },
      { metric: 'Visitas vet', current: current.vetVisits, previous: previous.vetVisits },
      { metric: 'Vacunas', current: current.vaccinesGiven, previous: previous.vaccinesGiven },
    ];
  }, [analytics]);

  // Format X-axis dates
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'd', { locale: es });
    } catch {
      return dateStr;
    }
  };

  if (!isFeatureEnabled('PRO_ANALYTICS')) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6 text-center py-20">
        <Crown className="h-12 w-12 text-purple-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-muted-foreground">Próximamente</h2>
        <p className="text-sm text-muted-foreground mt-2">
          El Panel Pro de analytics estará disponible pronto.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-4 animate-fade-in">
      {/* Breadcrumb for providers */}
      {isProvider && (
        <button
          onClick={() => navigate('/provider/dashboard')}
          className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 -mb-2"
        >
          ← Mi consultorio
        </button>
      )}

      {/* Header + Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Panel Pro
          </h1>
          <p className="text-sm text-muted-foreground">
            {isProvider ? 'Analytics de tu consultorio' : 'Analytics detallados de tus mascotas'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPetId} onValueChange={handlePetChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Mascota" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {(pets || []).map((pet) => (
                <SelectItem key={pet.id} value={pet.id}>
                  {pet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Upgrade banner for free users */}
      {!isPremium && <ProUpgradeCTA variant="banner" context="pro_dashboard_header" />}

      {/* Summary row (always visible) */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            icon={CheckCircle2}
            iconColor="text-purple-500"
            label="Recordatorios"
            value={analytics.summary.remindersCompleted}
          />
          <SummaryCard
            icon={Stethoscope}
            iconColor="text-teal-500"
            label="Visitas vet"
            value={analytics.summary.vetVisits}
          />
          <SummaryCard
            icon={Syringe}
            iconColor="text-amber-500"
            label="Vacunas"
            value={analytics.summary.vaccinesGiven}
          />
          <SummaryCard
            icon={Heart}
            iconColor="text-green-500"
            label="Bienestar"
            value={analytics.summary.wellnessScore}
            suffix="/100"
          />
        </div>
      ) : null}

      {/* Grid 2 columnas: charts + resumen lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Charts (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Activity chart */}
          <LockedOverlay
            locked={!analyticsAccess.allowed}
            title="Gráfico de actividad mensual"
            description="Ve tu actividad día a día con tu plan Premium"
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-600" />
                  Actividad del período
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && analytics.activityTimeline.length > 1 ? (
                  <ChartContainer
                    config={activityChartConfig}
                    className="h-[220px] w-full aspect-auto"
                  >
                    <AreaChart
                      data={analytics.activityTimeline}
                      margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <defs>
                        <linearGradient id="fillRemindersChart" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-reminders)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-reminders)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fillVisitsChart" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-visits)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-visits)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="reminders"
                        stroke="var(--color-reminders)"
                        strokeWidth={2}
                        fill="url(#fillRemindersChart)"
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="visits"
                        stroke="var(--color-visits)"
                        strokeWidth={2}
                        fill="url(#fillVisitsChart)"
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="vaccines"
                        stroke="var(--color-vaccines)"
                        strokeWidth={2}
                        fill="transparent"
                        dot={false}
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                    Sin datos para este período
                  </div>
                )}
              </CardContent>
            </Card>
          </LockedOverlay>

          {/* Period comparison chart */}
          <LockedOverlay
            locked={!analyticsAccess.allowed}
            title="Comparativo entre períodos"
            description="Compara la actividad entre meses con tu plan Premium"
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Comparativo de períodos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {comparisonData.length > 0 ? (
                  <ChartContainer
                    config={comparisonChartConfig}
                    className="h-[200px] w-full aspect-auto"
                  >
                    <BarChart
                      data={comparisonData}
                      margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="current" fill="var(--color-current)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="previous" fill="var(--color-previous)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                    Sin datos para comparar
                  </div>
                )}
              </CardContent>
            </Card>
          </LockedOverlay>
        </div>

        {/* Sidebar derecho: resumen vet + export (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Resumen veterinario */}
          {isProvider && vetData && (
            <LockedOverlay
              locked={!analyticsAccess.allowed}
              title="Métricas veterinarias"
              description="Con el plan Premium"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-teal-600" />
                    Resumen veterinario
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Reservas</span>
                    <span className="text-sm font-bold">{vetData.summary.totalBookings}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Clientes únicos</span>
                    <span className="text-sm font-bold">{vetData.summary.uniqueClients}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Ingresos</span>
                    <span className="text-sm font-bold text-green-600">
                      ${new Intl.NumberFormat('es-CL').format(vetData.summary.revenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-muted-foreground">Reseñas</span>
                    <span className="text-sm font-bold">{vetData.summary.reviewCount}</span>
                  </div>
                </CardContent>
              </Card>
            </LockedOverlay>
          )}

          {/* Export */}
          <LockedOverlay
            locked={!exportAccess.allowed}
            title="Exportar reportes"
            description="Descarga con el plan Premium"
          >
            <Card>
              <CardContent className="py-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold">Descargar reporte</p>
                  <p className="text-xs text-muted-foreground">Exporta los datos de este período</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('pdf')}
                    className="gap-1.5 flex-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('csv')}
                    className="gap-1.5 flex-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </LockedOverlay>
        </div>
      </div>
    </div>
  );
}

// Internal summary card component
function SummaryCard({
  icon: Icon,
  iconColor,
  label,
  value,
  suffix,
  prefix,
  formatNumber,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  formatNumber?: boolean;
}) {
  const displayValue = formatNumber ? new Intl.NumberFormat('es-CL').format(value) : value;

  return (
    <Card className="border-muted">
      <CardContent className="py-3 px-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
            {label}
          </span>
        </div>
        <p className="text-xl font-bold">
          {prefix}
          {displayValue}
          {suffix}
        </p>
      </CardContent>
    </Card>
  );
}
