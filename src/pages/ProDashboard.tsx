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

    if (exportFormat === 'pdf') {
      // PDF export pendiente
      alert('Proximamente — estamos trabajando en la exportacion PDF.');
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
    <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          Panel Pro
        </h1>
        <p className="text-sm text-muted-foreground">Analytics detallados de tus mascotas</p>
      </div>

      {/* Upgrade banner for free users */}
      {!isPremium && <ProUpgradeCTA variant="banner" context="pro_dashboard_header" />}

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={selectedPetId} onValueChange={handlePetChange}>
          <SelectTrigger className="w-[160px]">
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
          <SelectTrigger className="w-[180px]">
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

      {/* Activity chart (locked for free) */}
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
              <ChartContainer config={activityChartConfig} className="h-[200px] w-full aspect-auto">
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
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                Sin datos para este período
              </div>
            )}
          </CardContent>
        </Card>
      </LockedOverlay>

      {/* Period comparison chart (locked for free) */}
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
                <BarChart data={comparisonData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
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

      {/* Vet analytics section (for providers only) */}
      {isProvider && vetData && (
        <LockedOverlay
          locked={!analyticsAccess.allowed}
          title="Analytics para veterinarios"
          description="Métricas de tu práctica con el plan Premium"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-teal-600" />
                Resumen veterinario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryCard
                  icon={Activity}
                  iconColor="text-teal-500"
                  label="Reservas"
                  value={vetData.summary.totalBookings}
                />
                <SummaryCard
                  icon={Heart}
                  iconColor="text-purple-500"
                  label="Clientes únicos"
                  value={vetData.summary.uniqueClients}
                />
                <SummaryCard
                  icon={TrendingUp}
                  iconColor="text-green-500"
                  label="Ingresos"
                  value={vetData.summary.revenue}
                  prefix="$"
                  formatNumber
                />
                <SummaryCard
                  icon={CheckCircle2}
                  iconColor="text-amber-500"
                  label="Reseñas"
                  value={vetData.summary.reviewCount}
                />
              </div>
            </CardContent>
          </Card>
        </LockedOverlay>
      )}

      {/* Export bar (locked for free) */}
      <LockedOverlay
        locked={!exportAccess.allowed}
        title="Exportar reportes"
        description="Descarga tus datos en PDF o CSV con el plan Premium"
      >
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-semibold">Descargar reporte</p>
              <p className="text-xs text-muted-foreground">Exporta los datos de este período</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                className="gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                className="gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </LockedOverlay>
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
