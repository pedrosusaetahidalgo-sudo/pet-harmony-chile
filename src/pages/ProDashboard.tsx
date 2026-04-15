import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart,
} from 'recharts';
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
  Users,
  DollarSign,
  Star,
  Calendar,
} from '@/lib/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePlan } from '@/hooks/usePlan';
import { useProAnalytics, type AnalyticsPeriod } from '@/hooks/useProAnalytics';
import { useVetAnalytics } from '@/hooks/useVetAnalytics';
import { useActiveRole } from '@/hooks/useActiveRole';
import { LockedOverlay } from '@/components/analytics/LockedOverlay';
import { ProUpgradeCTA } from '@/components/analytics/ProUpgradeCTA';
import { track, EVENTS } from '@/lib/analytics';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  current_month: 'Este mes',
  last_month: 'Mes pasado',
  last_3_months: 'Últimos 3 meses',
};

// ─── Chart configs ─────────────────────────────────────────────
const vetBookingsChartConfig: ChartConfig = {
  bookings: { label: 'Reservas', color: 'hsl(173, 80%, 40%)' },
  revenue: { label: 'Ingresos', color: 'hsl(262, 83%, 58%)' },
};

const vetComparisonConfig: ChartConfig = {
  current: { label: 'Período actual', color: 'hsl(173, 80%, 40%)' },
  previous: { label: 'Período anterior', color: 'hsl(215, 20%, 65%)' },
};

const ownerActivityConfig: ChartConfig = {
  reminders: { label: 'Recordatorios', color: 'hsl(262, 83%, 58%)' },
  visits: { label: 'Visitas vet', color: 'hsl(173, 80%, 40%)' },
  vaccines: { label: 'Vacunas', color: 'hsl(47, 96%, 53%)' },
};

const ownerComparisonConfig: ChartConfig = {
  current: { label: 'Período actual', color: 'hsl(262, 83%, 58%)' },
  previous: { label: 'Período anterior', color: 'hsl(215, 20%, 65%)' },
};

const SERVICE_COLORS = [
  'hsl(173, 80%, 40%)',
  'hsl(262, 83%, 58%)',
  'hsl(47, 96%, 53%)',
  'hsl(340, 75%, 55%)',
  'hsl(200, 70%, 50%)',
  'hsl(140, 60%, 45%)',
];

const SERVICE_LABELS: Record<string, string> = {
  consultation: 'Consulta',
  vaccination: 'Vacunación',
  surgery: 'Cirugía',
  grooming: 'Peluquería',
  dental: 'Dental',
  emergency: 'Urgencia',
  otro: 'Otro',
};

interface Pet {
  id: string;
  name: string;
}

// ─── Main component ────────────────────────────────────────────
export default function ProDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, checkAccess } = usePlan();
  const { isProvider } = useActiveRole();
  const [period, setPeriod] = useState<AnalyticsPeriod>('current_month');
  const [selectedPetId, setSelectedPetId] = useState<string>('all');

  const analyticsAccess = checkAccess('pro_analytics');
  const exportAccess = checkAccess('analytics_export');

  // Fetch user's pets (only for owner view)
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
    enabled: !!user?.id && !isProvider,
  });

  const petIdParam = selectedPetId === 'all' ? undefined : selectedPetId;
  const { data: ownerAnalytics, isLoading: ownerLoading } = useProAnalytics({
    petId: petIdParam,
    period,
  });
  const { data: vetData, isLoading: vetLoading } = useVetAnalytics({ period });

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

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'd', { locale: es });
    } catch {
      return dateStr;
    }
  };

  const formatCLP = (amount: number) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);

  // ─── Export handler ────────────────────────────────────────────
  const handleExport = (exportFormat: string) => {
    track({ event: EVENTS.PRO_PANEL_EXPORT_CLICKED, properties: { format: exportFormat } });

    if (isProvider && vetData) {
      // Vet export
      if (exportFormat === 'csv') {
        const rows: string[][] = [
          ['Metrica', 'Valor'],
          ['Reservas totales', String(vetData.summary.totalBookings)],
          ['Clientes unicos', String(vetData.summary.uniqueClients)],
          ['Ingresos', String(vetData.summary.revenue)],
          ['Rating promedio', String(vetData.summary.avgRating)],
          ['Resenas', String(vetData.summary.reviewCount)],
        ];
        if (vetData.bookingsTimeline.length > 0) {
          rows.push([], ['Fecha', 'Reservas', 'Ingresos']);
          for (const point of vetData.bookingsTimeline) {
            rows.push([point.date, String(point.bookings), String(point.revenue)]);
          }
        }
        downloadCSV(rows, `paw-friend-vet-analytics-${period}.csv`);
        return;
      }
      if (exportFormat === 'pdf') {
        const periodLabel = PERIOD_LABELS[period] || period;
        const timelineRows = vetData.bookingsTimeline
          .filter((p) => p.bookings > 0)
          .map(
            (p) =>
              `<tr><td>${p.date}</td><td>${p.bookings}</td><td>${formatCLP(p.revenue)}</td></tr>`
          )
          .join('');
        const html = buildPDFHtml({
          title: 'Reporte Veterinario',
          subtitle: `Período: ${periodLabel} · Generado: ${new Date().toLocaleDateString('es-CL')}`,
          sections: [
            {
              title: 'Resumen',
              rows: [
                ['Reservas totales', String(vetData.summary.totalBookings)],
                ['Clientes únicos', String(vetData.summary.uniqueClients)],
                ['Ingresos', formatCLP(vetData.summary.revenue)],
                ['Rating promedio', `${vetData.summary.avgRating.toFixed(1)}/5`],
                ['Reseñas', String(vetData.summary.reviewCount)],
              ],
            },
            ...(timelineRows
              ? [
                  {
                    title: 'Detalle Diario',
                    tableHtml: `<table><thead><tr><th>Fecha</th><th>Reservas</th><th>Ingresos</th></tr></thead><tbody>${timelineRows}</tbody></table>`,
                  },
                ]
              : []),
          ],
        });
        openPrintWindow(html, `paw-friend-vet-reporte-${period}.html`);
        return;
      }
    }

    if (!isProvider && ownerAnalytics) {
      // Owner export
      if (exportFormat === 'csv') {
        const rows: string[][] = [
          ['Metrica', 'Valor'],
          ['Recordatorios completados', String(ownerAnalytics.summary.remindersCompleted)],
          ['Visitas veterinarias', String(ownerAnalytics.summary.vetVisits)],
          ['Vacunas aplicadas', String(ownerAnalytics.summary.vaccinesGiven)],
          ['Score de bienestar', String(ownerAnalytics.summary.wellnessScore)],
        ];
        if (ownerAnalytics.activityTimeline.length > 0) {
          rows.push([], ['Fecha', 'Recordatorios', 'Visitas', 'Vacunas']);
          for (const point of ownerAnalytics.activityTimeline) {
            rows.push([
              point.date,
              String(point.reminders),
              String(point.visits),
              String(point.vaccines),
            ]);
          }
        }
        downloadCSV(rows, `paw-friend-analytics-${period}.csv`);
        return;
      }
      if (exportFormat === 'pdf') {
        const periodLabel = PERIOD_LABELS[period] || period;
        const selectedPetName =
          selectedPetId === 'all'
            ? 'Todas las mascotas'
            : pets?.find((p) => p.id === selectedPetId)?.name || '';
        const html = buildPDFHtml({
          title: 'Reporte de Salud',
          subtitle: `Período: ${periodLabel} · ${selectedPetName} · Generado: ${new Date().toLocaleDateString('es-CL')}`,
          sections: [
            {
              title: 'Resumen',
              rows: [
                ['Recordatorios completados', String(ownerAnalytics.summary.remindersCompleted)],
                ['Visitas veterinarias', String(ownerAnalytics.summary.vetVisits)],
                ['Vacunas aplicadas', String(ownerAnalytics.summary.vaccinesGiven)],
                ['Score de bienestar', `${ownerAnalytics.summary.wellnessScore}/100`],
              ],
            },
          ],
        });
        openPrintWindow(html, `paw-friend-reporte-${period}.html`);
        return;
      }
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

  // ─── Provider / Vet view ───────────────────────────────────────
  if (isProvider) {
    return (
      <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-teal-600" />
              Panel Pro
            </h1>
            <p className="text-sm text-muted-foreground">Analytics de tu consultorio</p>
          </div>
          <div className="flex gap-2">
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

        {!isPremium && <ProUpgradeCTA variant="banner" context="pro_dashboard_header" />}

        {/* KPI Cards */}
        {vetLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : vetData ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard
              icon={Calendar}
              iconColor="text-teal-500"
              label="Reservas"
              value={vetData.summary.totalBookings}
            />
            <SummaryCard
              icon={Users}
              iconColor="text-blue-500"
              label="Clientes"
              value={vetData.summary.uniqueClients}
            />
            <SummaryCard
              icon={DollarSign}
              iconColor="text-green-500"
              label="Ingresos"
              value={vetData.summary.revenue}
              formatNumber
              prefix="$"
            />
            <SummaryCard
              icon={Star}
              iconColor="text-amber-500"
              label="Rating"
              value={Number(vetData.summary.avgRating.toFixed(1))}
              suffix="/5"
            />
          </div>
        ) : null}

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Main charts (3/5) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Bookings timeline */}
            <LockedOverlay
              locked={!analyticsAccess.allowed}
              title="Gráfico de reservas"
              description="Ve tu actividad día a día con tu plan Premium"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-teal-600" />
                    Reservas del período
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vetData && vetData.bookingsTimeline.length > 1 ? (
                    <ChartContainer
                      config={vetBookingsChartConfig}
                      className="h-[220px] w-full aspect-auto"
                    >
                      <AreaChart
                        data={vetData.bookingsTimeline}
                        margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <defs>
                          <linearGradient id="fillBookings" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-bookings)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--color-bookings)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="bookings"
                          stroke="var(--color-bookings)"
                          strokeWidth={2}
                          fill="url(#fillBookings)"
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

            {/* Revenue timeline */}
            <LockedOverlay
              locked={!analyticsAccess.allowed}
              title="Gráfico de ingresos"
              description="Visualiza tus ingresos con el plan Premium"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Ingresos del período
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vetData && vetData.bookingsTimeline.length > 1 ? (
                    <ChartContainer
                      config={vetBookingsChartConfig}
                      className="h-[200px] w-full aspect-auto"
                    >
                      <AreaChart
                        data={vetData.bookingsTimeline}
                        margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <defs>
                          <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="var(--color-revenue)"
                          strokeWidth={2}
                          fill="url(#fillRevenue)"
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
          </div>

          {/* Right sidebar (2/5) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Service breakdown */}
            <LockedOverlay
              locked={!analyticsAccess.allowed}
              title="Desglose por servicio"
              description="Con el plan Premium"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-teal-600" />
                    Servicios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vetData && vetData.serviceBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {vetData.serviceBreakdown.map((s, i) => (
                        <div
                          key={s.serviceType}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length],
                              }}
                            />
                            <span className="text-muted-foreground">
                              {SERVICE_LABELS[s.serviceType] || s.serviceType}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{s.count}</span>
                            <span className="text-muted-foreground text-[10px]">
                              {formatCLP(s.revenue)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[120px] flex items-center justify-center text-sm text-muted-foreground">
                      Sin servicios en este período
                    </div>
                  )}
                </CardContent>
              </Card>
            </LockedOverlay>

            {/* Quick stats */}
            <Card>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Reseñas totales</span>
                  <span className="text-sm font-bold">{vetData?.summary.reviewCount ?? 0}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Ingreso promedio/reserva</span>
                  <span className="text-sm font-bold text-green-600">
                    {vetData && vetData.summary.totalBookings > 0
                      ? formatCLP(
                          Math.round(vetData.summary.revenue / vetData.summary.totalBookings)
                        )
                      : '$0'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-muted-foreground">Tasa de retorno</span>
                  <span className="text-sm font-bold">
                    {vetData &&
                    vetData.summary.uniqueClients > 0 &&
                    vetData.summary.totalBookings > vetData.summary.uniqueClients
                      ? `${Math.round(
                          ((vetData.summary.totalBookings - vetData.summary.uniqueClients) /
                            vetData.summary.totalBookings) *
                            100
                        )}%`
                      : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>

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
                    <p className="text-xs text-muted-foreground">
                      Exporta los datos de este período
                    </p>
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

  // ─── Owner view ────────────────────────────────────────────────
  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-4 animate-fade-in">
      {/* Header + Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Panel Pro
          </h1>
          <p className="text-sm text-muted-foreground">Analytics detallados de tus mascotas</p>
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

      {!isPremium && <ProUpgradeCTA variant="banner" context="pro_dashboard_header" />}

      {/* Summary KPIs */}
      {ownerLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : ownerAnalytics ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            icon={CheckCircle2}
            iconColor="text-purple-500"
            label="Recordatorios"
            value={ownerAnalytics.summary.remindersCompleted}
          />
          <SummaryCard
            icon={Stethoscope}
            iconColor="text-teal-500"
            label="Visitas vet"
            value={ownerAnalytics.summary.vetVisits}
          />
          <SummaryCard
            icon={Syringe}
            iconColor="text-amber-500"
            label="Vacunas"
            value={ownerAnalytics.summary.vaccinesGiven}
          />
          <SummaryCard
            icon={Heart}
            iconColor="text-green-500"
            label="Bienestar"
            value={ownerAnalytics.summary.wellnessScore}
            suffix="/100"
          />
        </div>
      ) : null}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
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
                {ownerAnalytics && ownerAnalytics.activityTimeline.length > 1 ? (
                  <ChartContainer
                    config={ownerActivityConfig}
                    className="h-[220px] w-full aspect-auto"
                  >
                    <AreaChart
                      data={ownerAnalytics.activityTimeline}
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

          {/* Period comparison */}
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
                {ownerAnalytics ? (
                  <OwnerComparisonChart analytics={ownerAnalytics} />
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                    Sin datos para comparar
                  </div>
                )}
              </CardContent>
            </Card>
          </LockedOverlay>
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-2 space-y-4">
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

// ─── Owner comparison chart ──────────────────────────────────────
function OwnerComparisonChart({
  analytics,
}: {
  analytics: NonNullable<ReturnType<typeof useProAnalytics>['data']>;
}) {
  const comparisonData = useMemo(() => {
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

  if (comparisonData.every((d) => d.current === 0 && d.previous === 0)) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
        Sin datos para comparar
      </div>
    );
  }

  return (
    <ChartContainer config={ownerComparisonConfig} className="h-[200px] w-full aspect-auto">
      <BarChart data={comparisonData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="current" fill="var(--color-current)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="previous" fill="var(--color-previous)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

// ─── Summary card ────────────────────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────
function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildPDFHtml({
  title,
  subtitle,
  sections,
}: {
  title: string;
  subtitle: string;
  sections: Array<{
    title: string;
    rows?: string[][];
    tableHtml?: string;
  }>;
}): string {
  const sectionHtml = sections
    .map((s) => {
      if (s.tableHtml) {
        return `<h2 style="margin-top:24px;color:#0d9488;">${s.title}</h2>${s.tableHtml}`;
      }
      const rowsHtml = (s.rows || [])
        .map((r) => `<tr><td>${r[0]}</td><td><strong>${r[1]}</strong></td></tr>`)
        .join('');
      return `<h2 style="margin-top:24px;color:#0d9488;">${s.title}</h2><table><tbody>${rowsHtml}</tbody></table>`;
    })
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Paw Friend — ${title}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:40px;color:#1e1b4b;max-width:700px;margin:0 auto}
      h1{color:#0d9488;font-size:22px;margin-bottom:4px}
      .subtitle{color:#6b7280;font-size:13px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}
      th{background:#f0fdfa;color:#0d9488;font-weight:600}
      .footer{margin-top:32px;font-size:11px;color:#9ca3af;text-align:center}
    </style></head><body>
    <h1>Paw Friend — ${title}</h1>
    <p class="subtitle">${subtitle}</p>
    ${sectionHtml}
    <div class="footer">Generado por Paw Friend · pawfriend.cl</div>
  </body></html>`;
}

function openPrintWindow(html: string, fallbackFilename: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWin = window.open(url, '_blank');
  if (printWin) {
    printWin.addEventListener('load', () => {
      printWin.print();
      URL.revokeObjectURL(url);
    });
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = fallbackFilename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
