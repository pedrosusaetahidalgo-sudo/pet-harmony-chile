/**
 * Dashboard de Analytics standalone — NO linkeado a rutas ni navegacion.
 *
 * Para probar: importar manualmente en App.tsx con una ruta temporal.
 * Usa datos mock para mostrar la experiencia completa sin depender de Supabase.
 *
 * Incluye:
 * - KPIs resumen con indicadores de cambio
 * - Grafico de actividad mensual (AreaChart)
 * - Grafico de distribucion por tipo de servicio (BarChart horizontal)
 * - Grafico de bienestar por mascota (RadialBarChart)
 * - Comparativo de periodos (BarChart agrupado)
 * - Timeline de salud (LineChart)
 * - Tabla de eventos recientes
 * - Seccion vet con revenue y bookings
 */

import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
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
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  CheckCircle2,
  Crown,
  Download,
  Heart,
  Minus,
  PawPrint,
  Stethoscope,
  Syringe,
  TrendingUp,
} from '@/lib/icons';
import { formatCLP } from '@/lib/plans';

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_PETS = [
  { id: '1', name: 'Luna', species: 'Perro', breed: 'Golden Retriever' },
  { id: '2', name: 'Milo', species: 'Gato', breed: 'Siamés' },
  { id: '3', name: 'Rocky', species: 'Perro', breed: 'Bulldog Francés' },
];

// Daily activity for the current month (30 days)
function generateDailyActivity() {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    // More activity on weekdays
    const base = dayOfWeek === 0 || dayOfWeek === 6 ? 0.5 : 1;
    data.push({
      date: `${date.getDate()}/${date.getMonth() + 1}`,
      reminders: Math.floor(Math.random() * 3 * base),
      visitas: Math.round(Math.random() * 1.5 * base),
      vacunas: Math.random() > 0.85 ? 1 : 0,
    });
  }
  return data;
}

const DAILY_ACTIVITY = generateDailyActivity();

const SERVICE_DISTRIBUTION = [
  { service: 'Consulta general', count: 12, revenue: 336000 },
  { service: 'Vacunación', count: 8, revenue: 144000 },
  { service: 'Control sano', count: 6, revenue: 132000 },
  { service: 'Desparasitación', count: 5, revenue: 75000 },
  { service: 'Urgencia', count: 3, revenue: 135000 },
  { service: 'Peluquería', count: 4, revenue: 100000 },
  { service: 'Teleconsulta', count: 7, revenue: 105000 },
  { service: 'Cirugía menor', count: 2, revenue: 170000 },
];

const WELLNESS_BY_PET = [
  { name: 'Luna', score: 87, fill: 'hsl(142, 71%, 45%)' },
  { name: 'Milo', score: 62, fill: 'hsl(47, 96%, 53%)' },
  { name: 'Rocky', score: 91, fill: 'hsl(262, 83%, 58%)' },
];

const PERIOD_COMPARISON = [
  { metric: 'Recordatorios', actual: 18, anterior: 12 },
  { metric: 'Visitas vet', actual: 5, anterior: 3 },
  { metric: 'Vacunas', actual: 3, anterior: 2 },
  { metric: 'Documentos', actual: 7, anterior: 4 },
];

const HEALTH_TIMELINE = (() => {
  const data = [];
  for (let i = 5; i >= 0; i--) {
    const month = new Date();
    month.setMonth(month.getMonth() - i);
    const monthName = month.toLocaleString('es-CL', { month: 'short' });
    data.push({
      month: monthName,
      salud: 60 + Math.floor(Math.random() * 30),
      actividad: 40 + Math.floor(Math.random() * 40),
      bienestar: 50 + Math.floor(Math.random() * 35),
    });
  }
  return data;
})();

const RECENT_EVENTS = [
  {
    date: 'Hoy',
    pet: 'Luna',
    type: 'Vacuna',
    detail: 'Antirrábica anual',
    badge: 'success' as const,
  },
  {
    date: 'Ayer',
    pet: 'Milo',
    type: 'Control',
    detail: 'Control sano semestral',
    badge: 'default' as const,
  },
  {
    date: 'Hace 3 días',
    pet: 'Rocky',
    type: 'Recordatorio',
    detail: 'Desparasitación completada',
    badge: 'secondary' as const,
  },
  {
    date: 'Hace 5 días',
    pet: 'Luna',
    type: 'Consulta',
    detail: 'Dermatitis leve — tratamiento tópico',
    badge: 'warning' as const,
  },
  {
    date: 'Hace 1 semana',
    pet: 'Milo',
    type: 'Documento',
    detail: 'Examen de sangre subido',
    badge: 'default' as const,
  },
];

const VET_BOOKINGS_TIMELINE = (() => {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: `${date.getDate()}/${date.getMonth() + 1}`,
      reservas: Math.floor(Math.random() * 5) + 1,
      ingresos: (Math.floor(Math.random() * 5) + 1) * 28000,
    });
  }
  return data;
})();

// ============================================================
// CHART CONFIGS
// ============================================================

const activityConfig: ChartConfig = {
  reminders: { label: 'Recordatorios', color: 'hsl(262, 83%, 58%)' },
  visitas: { label: 'Visitas vet', color: 'hsl(173, 80%, 40%)' },
  vacunas: { label: 'Vacunas', color: 'hsl(47, 96%, 53%)' },
};

const serviceConfig: ChartConfig = {
  count: { label: 'Atenciones', color: 'hsl(262, 83%, 58%)' },
};

const comparisonConfig: ChartConfig = {
  actual: { label: 'Este mes', color: 'hsl(262, 83%, 58%)' },
  anterior: { label: 'Mes pasado', color: 'hsl(215, 20%, 65%)' },
};

const healthConfig: ChartConfig = {
  salud: { label: 'Salud', color: 'hsl(142, 71%, 45%)' },
  actividad: { label: 'Actividad', color: 'hsl(262, 83%, 58%)' },
  bienestar: { label: 'Bienestar', color: 'hsl(47, 96%, 53%)' },
};

const wellnessConfig: ChartConfig = {
  score: { label: 'Score', color: 'hsl(262, 83%, 58%)' },
};

const vetConfig: ChartConfig = {
  reservas: { label: 'Reservas', color: 'hsl(173, 80%, 40%)' },
  ingresos: { label: 'Ingresos (CLP)', color: 'hsl(262, 83%, 58%)' },
};

// ============================================================
// HELPER COMPONENTS
// ============================================================

function KPICard({
  icon: Icon,
  iconColor,
  label,
  value,
  change,
  changeLabel,
  prefix,
  suffix,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  prefix?: string;
  suffix?: string;
}) {
  const isPositive = change && change > 0;
  const isNeutral = change === 0;

  return (
    <Card>
      <CardContent className="py-4 px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`rounded-md p-1.5 bg-opacity-10 ${iconColor.replace('text-', 'bg-')}`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {label}
            </span>
          </div>
          {change !== undefined && (
            <div
              className={`flex items-center gap-0.5 text-xs font-medium ${
                isPositive ? 'text-green-600' : isNeutral ? 'text-muted-foreground' : 'text-red-500'
              }`}
            >
              {isPositive ? (
                <ArrowUp className="h-3 w-3" />
              ) : isNeutral ? (
                <Minus className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold">
          {prefix}
          {typeof value === 'number' ? value.toLocaleString('es-CL') : value}
          {suffix}
        </p>
        {changeLabel && <p className="text-[10px] text-muted-foreground mt-1">{changeLabel}</p>}
      </CardContent>
    </Card>
  );
}

// Colors for the service distribution chart
const SERVICE_COLORS = [
  'hsl(262, 83%, 58%)',
  'hsl(173, 80%, 40%)',
  'hsl(47, 96%, 53%)',
  'hsl(142, 71%, 45%)',
  'hsl(0, 84%, 60%)',
  'hsl(215, 90%, 60%)',
  'hsl(330, 80%, 55%)',
  'hsl(30, 90%, 55%)',
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AnalyticsDashboard() {
  const [selectedPet, setSelectedPet] = useState('all');
  const [period, setPeriod] = useState('current_month');

  const handleExport = (fmt: 'pdf' | 'csv') => {
    const periodLabel =
      period === 'current_month'
        ? 'Este mes'
        : period === 'last_month'
          ? 'Mes pasado'
          : 'Últimos 3 meses';
    const petLabel =
      selectedPet === 'all' ? 'Todas' : MOCK_PETS.find((p) => p.id === selectedPet)?.name || '';

    if (fmt === 'csv') {
      const rows: string[][] = [
        ['Métrica', 'Valor'],
        ['Período', periodLabel],
        ['Mascota', petLabel],
        [],
        ['Servicio', 'Cantidad', 'Ingresos'],
        ...SERVICE_DISTRIBUTION.map((s) => [s.service, String(s.count), String(s.revenue)]),
        [],
        ['Mascota', 'Score bienestar'],
        ...WELLNESS_BY_PET.map((w) => [w.name, String(w.score)]),
      ];
      const csv = rows.map((r) => r.join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paw-friend-analytics-demo-${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // PDF via print
    const serviceRows = SERVICE_DISTRIBUTION.map(
      (s) => `<tr><td>${s.service}</td><td>${s.count}</td><td>${formatCLP(s.revenue)}</td></tr>`
    ).join('');
    const wellnessRows = WELLNESS_BY_PET.map(
      (w) => `<tr><td>${w.name}</td><td>${w.score}/100</td></tr>`
    ).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Paw Friend — Analytics Demo</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:40px;color:#1e1b4b;max-width:700px;margin:0 auto}
        h1{color:#7c3aed;font-size:22px;margin-bottom:4px}
        .sub{color:#6b7280;font-size:13px;margin-bottom:24px}
        h2{color:#7c3aed;font-size:16px;margin-top:24px}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}
        th{background:#f3f0ff;color:#7c3aed;font-weight:600}
        .footer{margin-top:32px;font-size:11px;color:#9ca3af;text-align:center}
      </style></head><body>
      <h1>🐾 Paw Friend — Panel Pro (Demo)</h1>
      <p class="sub">Período: ${periodLabel} · ${petLabel} · ${new Date().toLocaleDateString('es-CL')}</p>
      <h2>Distribución de Servicios</h2>
      <table><thead><tr><th>Servicio</th><th>Cantidad</th><th>Ingresos</th></tr></thead><tbody>${serviceRows}</tbody></table>
      <h2>Bienestar por Mascota</h2>
      <table><thead><tr><th>Mascota</th><th>Score</th></tr></thead><tbody>${wellnessRows}</tbody></table>
      <div class="footer">Datos de demostración · Paw Friend · pawfriend.cl</div>
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
      const a = document.createElement('a');
      a.href = url;
      a.download = `paw-friend-analytics-demo-${period}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in bg-slate-50/60 min-h-screen">
      {/* ======== HEADER ======== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            Panel Pro
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-700 text-[10px] font-bold"
            >
              PREMIUM
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analytics completos de tus mascotas y su bienestar
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => handleExport('pdf')}
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => handleExport('csv')}
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
        </div>
      </div>

      {/* ======== FILTERS ======== */}
      <div className="flex gap-3 flex-wrap">
        <Select value={selectedPet} onValueChange={setSelectedPet}>
          <SelectTrigger className="w-[180px] bg-white">
            <PawPrint className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
            <SelectValue placeholder="Mascota" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las mascotas</SelectItem>
            {MOCK_PETS.map((pet) => (
              <SelectItem key={pet.id} value={pet.id}>
                {pet.name} ({pet.species})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px] bg-white">
            <Calendar className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current_month">Este mes</SelectItem>
            <SelectItem value="last_month">Mes pasado</SelectItem>
            <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
            <SelectItem value="last_6_months">Últimos 6 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ======== KPI ROW ======== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          icon={CheckCircle2}
          iconColor="text-purple-500"
          label="Recordatorios"
          value={18}
          change={50}
          changeLabel="vs. mes anterior"
        />
        <KPICard
          icon={Stethoscope}
          iconColor="text-teal-500"
          label="Visitas vet"
          value={5}
          change={67}
          changeLabel="vs. mes anterior"
        />
        <KPICard
          icon={Syringe}
          iconColor="text-amber-500"
          label="Vacunas"
          value={3}
          change={50}
          changeLabel="vs. mes anterior"
        />
        <KPICard
          icon={Heart}
          iconColor="text-green-500"
          label="Bienestar promedio"
          value={80}
          suffix="/100"
          change={8}
          changeLabel="mejora sostenida"
        />
      </div>

      {/* ======== MAIN CHARTS ROW ======== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity chart (2/3 width) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              Actividad del mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={activityConfig} className="h-[240px] w-full aspect-auto">
              <AreaChart data={DAILY_ACTIVITY} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <defs>
                  <linearGradient id="fillR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-reminders)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-reminders)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-visitas)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-visitas)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="reminders"
                  stroke="var(--color-reminders)"
                  strokeWidth={2}
                  fill="url(#fillR)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="visitas"
                  stroke="var(--color-visitas)"
                  strokeWidth={2}
                  fill="url(#fillV)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="vacunas"
                  stroke="var(--color-vacunas)"
                  strokeWidth={2}
                  fill="transparent"
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Wellness by pet (1/3 width) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-green-500" />
              Bienestar por mascota
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            {WELLNESS_BY_PET.map((pet) => (
              <div key={pet.name} className="w-full flex items-center gap-3">
                <ChartContainer
                  config={wellnessConfig}
                  className="h-[56px] w-[56px] aspect-square flex-shrink-0"
                >
                  <RadialBarChart
                    data={[pet]}
                    startAngle={90}
                    endAngle={-270}
                    innerRadius="70%"
                    outerRadius="100%"
                    barSize={6}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} angleAxisId={0} />
                    <RadialBar dataKey="score" cornerRadius={3} background angleAxisId={0} />
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-xs font-bold fill-foreground"
                    >
                      {pet.score}
                    </text>
                  </RadialBarChart>
                </ChartContainer>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{pet.name}</p>
                  <p className="text-xs" style={{ color: pet.fill }}>
                    {pet.score >= 70
                      ? 'Excelente'
                      : pet.score >= 40
                        ? 'Regular'
                        : 'Necesita atención'}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ======== SECOND CHARTS ROW ======== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Service distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              Distribución de servicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={serviceConfig} className="h-[240px] w-full aspect-auto">
              <BarChart
                data={SERVICE_DISTRIBUTION}
                layout="vertical"
                margin={{ top: 5, right: 5, bottom: 0, left: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="service" type="category" tick={{ fontSize: 10 }} width={110} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {SERVICE_DISTRIBUTION.map((_, idx) => (
                    <Cell key={idx} fill={SERVICE_COLORS[idx % SERVICE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Period comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Comparativo mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={comparisonConfig} className="h-[240px] w-full aspect-auto">
              <BarChart
                data={PERIOD_COMPARISON}
                margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="actual" fill="var(--color-actual)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="anterior" fill="var(--color-anterior)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* ======== HEALTH TIMELINE ======== */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500" />
            Evolución de salud (6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={healthConfig} className="h-[200px] w-full aspect-auto">
            <LineChart data={HEALTH_TIMELINE} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="salud"
                stroke="var(--color-salud)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="actividad"
                stroke="var(--color-actividad)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="bienestar"
                stroke="var(--color-bienestar)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ======== RECENT EVENTS TABLE ======== */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            Eventos recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {RECENT_EVENTS.map((event, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge
                    variant={
                      event.badge === 'success'
                        ? 'default'
                        : event.badge === 'warning'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className={`text-[10px] px-2 flex-shrink-0 ${
                      event.badge === 'success'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : ''
                    }`}
                  >
                    {event.type}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{event.detail}</p>
                    <p className="text-xs text-muted-foreground">{event.pet}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {event.date}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ======== VET SECTION ======== */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-bold">Panel Veterinario</h2>
          <Badge variant="outline" className="text-teal-700 border-teal-300">
            Provider
          </Badge>
        </div>

        {/* Vet KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            icon={Activity}
            iconColor="text-teal-500"
            label="Reservas"
            value={45}
            change={12}
            changeLabel="vs. mes anterior"
          />
          <KPICard
            icon={Heart}
            iconColor="text-purple-500"
            label="Clientes únicos"
            value={28}
            change={8}
          />
          <KPICard
            icon={TrendingUp}
            iconColor="text-green-500"
            label="Ingresos netos"
            value={formatCLP(1197000)}
            change={15}
          />
          <KPICard
            icon={CheckCircle2}
            iconColor="text-amber-500"
            label="Rating"
            value="4.8"
            suffix="/5"
            change={0}
            changeLabel="estable"
          />
        </div>

        {/* Vet bookings + revenue chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-600" />
              Reservas e ingresos diarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={vetConfig} className="h-[200px] w-full aspect-auto">
              <BarChart
                data={VET_BOOKINGS_TIMELINE}
                margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="reservas" fill="var(--color-reservas)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Service revenue breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-600" />
              Ingresos por tipo de servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {SERVICE_DISTRIBUTION.sort((a, b) => b.revenue - a.revenue).map((svc, idx) => {
                const maxRevenue = Math.max(...SERVICE_DISTRIBUTION.map((s) => s.revenue));
                const pct = (svc.revenue / maxRevenue) * 100;
                return (
                  <div key={svc.service} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-[120px] flex-shrink-0 truncate">
                      {svc.service}
                    </span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: SERVICE_COLORS[idx % SERVICE_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium w-[80px] text-right flex-shrink-0">
                      {formatCLP(svc.revenue)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ======== FOOTER ======== */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 via-purple-100/50 to-pink-50">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-200 p-2.5">
              <Crown className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <p className="text-sm font-bold text-purple-900">Panel Pro de Paw Friend</p>
              <p className="text-xs text-purple-700/80">
                Datos actualizados en tiempo real. Descarga reportes, compara períodos y monitorea
                el bienestar de tus mascotas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
