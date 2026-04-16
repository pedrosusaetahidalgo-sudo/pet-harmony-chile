import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AdminKpiCard from '@/components/admin/ui/AdminKpiCard';
import AdminStatCard from '@/components/admin/ui/AdminStatCard';
import AdminEmptyState from '@/components/admin/ui/AdminEmptyState';
import { cn } from '@/lib/utils';
import { formatCLPCompact } from '@/lib/format';
import {
  Users,
  DollarSign,
  AlertTriangle,
  Clock,
  PawPrint,
  TrendingUp,
  UserPlus,
  CreditCard,
  FileCheck,
  Flag,
  Briefcase,
  Star,
  Activity,
  ShieldAlert,
  Server,
  Database,
  Zap,
  CheckCircle,
} from '@/lib/icons';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Label,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, subDays, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Helpers ──────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Compact CLP formatting for dashboard cards
const formatCLP = formatCLPCompact;

// ── Activity item ────────────────────────────────────────
interface ActivityItem {
  type: string;
  label: string;
  detail: string;
  time: string;
  icon: React.ElementType;
  color: string;
}

const ACTIVITY_COLORS: Record<string, string> = {
  user: 'bg-blue-500',
  provider: 'bg-emerald-500',
  booking: 'bg-purple-500',
  review: 'bg-amber-500',
  payment: 'bg-cyan-500',
};

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', item.color)}
      >
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.label}</p>
        <p className="text-xs text-slate-500">{item.detail}</p>
      </div>
      <span className="shrink-0 text-xs text-slate-600">{item.time}</span>
    </div>
  );
}

// ── Chart custom tooltip ─────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-slate-300">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── Donut center label ───────────────────────────────────
function DonutLabel({ viewBox, total }: { viewBox?: { cx: number; cy: number }; total: number }) {
  if (!viewBox) return null;
  return (
    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={viewBox.cx} dy="-0.3em" className="fill-white text-2xl font-bold">
        {total}
      </tspan>
      <tspan x={viewBox.cx} dy="1.4em" className="fill-slate-500 text-xs">
        usuarios
      </tspan>
    </text>
  );
}

// ── Main component ───────────────────────────────────────
export default function AdminDashboard() {
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const twoWeeksAgo = subDays(now, 14);
  const monthAgo = subDays(now, 30);
  const twoMonthsAgo = subMonths(now, 2);

  // ── KPI: Active users (7d) with sparkline + delta ──
  const { data: activeUsersData, isLoading: l1 } = useQuery({
    queryKey: ['admin-kpi-active-users-v2'],
    staleTime: 60_000,
    queryFn: async () => {
      // This week
      const { count: thisWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', weekAgo.toISOString());

      // Last week
      const { count: lastWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', twoWeeksAgo.toISOString())
        .lt('updated_at', weekAgo.toISOString());

      // Spark: active users per day last 7 days
      const { data: profiles } = await supabase
        .from('profiles')
        .select('updated_at')
        .gte('updated_at', weekAgo.toISOString());

      const spark: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = subDays(now, i);
        const dayKey = format(dayStart, 'yyyy-MM-dd');
        const count = (profiles ?? []).filter(
          (p) => format(new Date(p.updated_at), 'yyyy-MM-dd') === dayKey
        ).length;
        spark.push(count);
      }

      const { count: total } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      return {
        value: thisWeek ?? 0,
        total: total ?? 0,
        delta: pctChange(thisWeek ?? 0, lastWeek ?? 0),
        spark,
      };
    },
  });

  // ── KPI: Revenue with sparkline + delta ──
  const { data: revenueData, isLoading: l2 } = useQuery({
    queryKey: ['admin-kpi-revenue-v2'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: allPaid } = await supabase
        .from('orders')
        .select('total_clp, payment_status, created_at')
        .eq('payment_status', 'paid');

      const rows = allPaid ?? [];
      const total = rows.reduce((s, o) => s + (o.total_clp || 0), 0);

      // This month vs last month
      const thisMonthStart = subDays(now, 30);
      const lastMonthStart = subDays(now, 60);
      const thisMonth = rows
        .filter((o) => new Date(o.created_at) >= thisMonthStart)
        .reduce((s, o) => s + (o.total_clp || 0), 0);
      const lastMonth = rows
        .filter(
          (o) => new Date(o.created_at) >= lastMonthStart && new Date(o.created_at) < thisMonthStart
        )
        .reduce((s, o) => s + (o.total_clp || 0), 0);

      // Spark: revenue per day last 7 days
      const spark: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayKey = format(subDays(now, i), 'yyyy-MM-dd');
        const dayRevenue = rows
          .filter((o) => format(new Date(o.created_at), 'yyyy-MM-dd') === dayKey)
          .reduce((s, o) => s + (o.total_clp || 0), 0);
        spark.push(dayRevenue);
      }

      return { total, thisMonth, delta: pctChange(thisMonth, lastMonth), spark };
    },
  });

  // ── KPI: Pets with sparkline ──
  const { data: petsKpi, isLoading: l3 } = useQuery({
    queryKey: ['admin-kpi-pets-v2'],
    staleTime: 60_000,
    queryFn: async () => {
      const { count: activePets } = await supabase
        .from('pets')
        .select('*', { count: 'exact', head: true })
        .eq('lifecycle_status', 'active');

      const { data: recentPets } = await supabase
        .from('pets')
        .select('created_at')
        .gte('created_at', weekAgo.toISOString());

      // Spark: pets created per day last 7 days
      const spark: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayKey = format(subDays(now, i), 'yyyy-MM-dd');
        const count = (recentPets ?? []).filter(
          (p) => format(new Date(p.created_at), 'yyyy-MM-dd') === dayKey
        ).length;
        spark.push(count);
      }

      // Compare this week vs last week
      const { count: lastWeekPets } = await supabase
        .from('pets')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twoWeeksAgo.toISOString())
        .lt('created_at', weekAgo.toISOString());

      return {
        activePets: activePets ?? 0,
        thisWeek: (recentPets ?? []).length,
        delta: pctChange((recentPets ?? []).length, lastWeekPets ?? 0),
        spark,
      };
    },
  });

  // ── KPI: Pending review ──
  const { data: pendingReview, isLoading: l4 } = useQuery({
    queryKey: ['admin-kpi-pending-review'],
    staleTime: 60_000,
    queryFn: async () => {
      const [verifs, reports, promos] = await Promise.all([
        supabase
          .from('verification_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('content_reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('service_promotions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);
      return (verifs.count ?? 0) + (reports.count ?? 0) + (promos.count ?? 0);
    },
  });

  // ── Smart Alerts ──
  const { data: alerts } = useQuery({
    queryKey: ['admin-smart-alerts'],
    staleTime: 60_000,
    queryFn: async () => {
      const fortyEightHoursAgo = subDays(now, 2);

      const [staleProviders, failedPayments, criticalErrors] = await Promise.all([
        // Providers pending > 48h
        sb
          .from('service_providers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .lt('created_at', fortyEightHoursAgo.toISOString()),

        // Failed payments last 7d
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', 'failed')
          .gte('created_at', weekAgo.toISOString()),

        // Unresolved critical errors
        sb
          .from('error_logs')
          .select('*', { count: 'exact', head: true })
          .eq('severity', 'critical')
          .eq('resolved', false),
      ]);

      return {
        staleProviders: (staleProviders.count as number | null) ?? 0,
        failedPayments: failedPayments.count ?? 0,
        criticalErrors: (criticalErrors.count as number | null) ?? 0,
      };
    },
  });

  const hasAlerts =
    (alerts?.staleProviders ?? 0) > 0 ||
    (alerts?.failedPayments ?? 0) > 0 ||
    (alerts?.criticalErrors ?? 0) > 0;

  // ── Combined registration chart (users + pets, 30 days) ──
  const { data: combinedChartData } = useQuery({
    queryKey: ['admin-chart-combined-v2'],
    staleTime: 120_000,
    queryFn: async () => {
      const [{ data: users }, { data: pets }] = await Promise.all([
        supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', monthAgo.toISOString())
          .order('created_at'),
        supabase
          .from('pets')
          .select('created_at')
          .gte('created_at', monthAgo.toISOString())
          .order('created_at'),
      ]);

      const byDay: Record<string, { usuarios: number; mascotas: number }> = {};
      for (let i = 0; i < 30; i++) {
        const d = format(subDays(now, 29 - i), 'yyyy-MM-dd');
        byDay[d] = { usuarios: 0, mascotas: 0 };
      }

      (users ?? []).forEach((u) => {
        const d = format(new Date(u.created_at), 'yyyy-MM-dd');
        if (byDay[d]) byDay[d].usuarios++;
      });
      (pets ?? []).forEach((p) => {
        const d = format(new Date(p.created_at), 'yyyy-MM-dd');
        if (byDay[d]) byDay[d].mascotas++;
      });

      return Object.entries(byDay).map(([date, counts]) => ({
        date: format(new Date(date), 'dd MMM', { locale: es }),
        ...counts,
      }));
    },
  });

  // ── Top services chart ──
  const { data: topServicesData } = useQuery({
    queryKey: ['admin-chart-top-services'],
    staleTime: 120_000,
    queryFn: async () => {
      const { data } = await supabase.from('bookings').select('service_type');

      if (!data?.length) return [];

      const counts: Record<string, number> = {};
      data.forEach((b) => {
        const type = b.service_type || 'otro';
        counts[type] = (counts[type] || 0) + 1;
      });

      return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({ type, count }));
    },
  });

  // ── Plan distribution ──
  const { data: planDistribution } = useQuery({
    queryKey: ['admin-chart-plan-dist'],
    staleTime: 120_000,
    queryFn: async () => {
      const [{ count: totalProfiles }, premiumResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
      ]);

      const premium = premiumResult.count ?? 0;
      const total = totalProfiles ?? 0;
      const free = total - premium;

      return { premium, free, total };
    },
  });

  // ── Extra metrics ──
  const { data: extraMetrics } = useQuery({
    queryKey: ['admin-extra-metrics-v2'],
    staleTime: 60_000,
    queryFn: async () => {
      const [bookings, providers, reviews, posts, fichas, pendingPets] = await Promise.all([
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString()),
        sb
          .from('service_providers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved'),
        supabase.from('service_reviews').select('*', { count: 'exact', head: true }),
        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString()),
        supabase.from('medical_records').select('pet_id', { count: 'exact', head: false }),
        sb
          .from('pets')
          .select('*', { count: 'exact', head: true })
          .is('owner_id', null)
          .not('created_by_vet_id', 'is', null)
          .is('owner_invitation_accepted_at', null),
      ]);

      const uniquePetsWithRecords = new Set(
        (fichas.data ?? []).map((r: { pet_id: string }) => r.pet_id)
      ).size;

      return {
        weekBookings: bookings.count ?? 0,
        approvedProviders: (providers.count as number | null) ?? 0,
        totalReviews: reviews.count ?? 0,
        weekPosts: posts.count ?? 0,
        fichasConRegistros: uniquePetsWithRecords,
        mascotasPendientes: (pendingPets.count as number | null) ?? 0,
      };
    },
  });

  // ── System Health ──
  const { data: systemHealth } = useQuery({
    queryKey: ['admin-system-health'],
    staleTime: 30_000,
    queryFn: async () => {
      // DB ping with latency
      const start = performance.now();
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      const latency = Math.round(performance.now() - start);

      // Edge fn status from system_health_log (may not exist)
      let edgeFnStatus: string = 'unknown';
      try {
        const { data } = await sb
          .from('system_health_log')
          .select('status')
          .order('created_at', { ascending: false })
          .limit(1);
        if (data?.[0]?.status) edgeFnStatus = data[0].status;
      } catch {
        edgeFnStatus = 'unknown';
      }

      return {
        db: {
          ok: !dbError,
          latency,
          status: !dbError ? (latency < 500 ? 'healthy' : 'slow') : 'error',
        },
        edgeFn: {
          status: edgeFnStatus,
        },
      };
    },
  });

  // ── Activity feed ──
  const { data: activityFeed } = useQuery({
    queryKey: ['admin-activity-feed-v2'],
    staleTime: 30_000,
    queryFn: async () => {
      const items: ActivityItem[] = [];

      const [
        { data: recentUsers },
        { data: recentProviders },
        { data: recentBookings },
        { data: recentReviews },
        { data: recentPayments },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        sb
          .from('service_providers')
          .select('display_name, status, created_at, provider_type')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('bookings')
          .select('service_type, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('service_reviews')
          .select('rating, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('orders')
          .select('total_clp, payment_status, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      (recentUsers ?? []).forEach((u) =>
        items.push({
          type: 'user',
          label: u.display_name || 'Nuevo usuario',
          detail: 'Se registro en la plataforma',
          time: format(new Date(u.created_at), 'dd MMM HH:mm', { locale: es }),
          icon: UserPlus,
          color: ACTIVITY_COLORS.user,
        })
      );

      ((recentProviders as Array<Record<string, string>>) ?? []).forEach((p) =>
        items.push({
          type: 'provider',
          label: p.display_name || 'Proveedor',
          detail: `${p.provider_type || 'servicio'} — ${p.status}`,
          time: format(new Date(p.created_at), 'dd MMM HH:mm', { locale: es }),
          icon: Briefcase,
          color: p.status === 'approved' ? 'bg-emerald-500' : 'bg-orange-500',
        })
      );

      (recentBookings ?? []).forEach((b) =>
        items.push({
          type: 'booking',
          label: `Reserva: ${b.service_type || 'servicio'}`,
          detail: `Estado: ${b.status || 'pendiente'}`,
          time: format(new Date(b.created_at), 'dd MMM HH:mm', { locale: es }),
          icon: Clock,
          color: ACTIVITY_COLORS.booking,
        })
      );

      (recentReviews ?? []).forEach((r) =>
        items.push({
          type: 'review',
          label: `Resena: ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}`,
          detail: `${r.rating}/5 estrellas`,
          time: format(new Date(r.created_at), 'dd MMM HH:mm', { locale: es }),
          icon: Star,
          color: ACTIVITY_COLORS.review,
        })
      );

      (recentPayments ?? []).forEach((p) =>
        items.push({
          type: 'payment',
          label: `Pago: ${formatCLP(p.total_clp || 0)}`,
          detail: p.payment_status === 'paid' ? 'Completado' : p.payment_status,
          time: format(new Date(p.created_at), 'dd MMM HH:mm', { locale: es }),
          icon: CreditCard,
          color: ACTIVITY_COLORS.payment,
        })
      );

      items.sort((a, b) => b.time.localeCompare(a.time));
      return items.slice(0, 15);
    },
  });

  // ── Health badge helper ──
  function HealthBadge({
    status,
    label,
    latency,
  }: {
    status: string;
    label: string;
    latency?: number;
  }) {
    const color =
      status === 'healthy' || status === 'ok'
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : status === 'slow'
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          : status === 'error'
            ? 'bg-red-500/10 text-red-400 border-red-500/20'
            : 'bg-slate-700/50 text-slate-400 border-slate-600';

    return (
      <div className={cn('inline-flex items-center gap-2 rounded-lg border px-3 py-2', color)}>
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            status === 'healthy' || status === 'ok'
              ? 'bg-emerald-400'
              : status === 'slow'
                ? 'bg-amber-400'
                : status === 'error'
                  ? 'bg-red-400'
                  : 'bg-slate-500'
          )}
        />
        <span className="text-xs font-medium">{label}</span>
        {latency !== undefined && <span className="text-xs opacity-60">{latency}ms</span>}
      </div>
    );
  }

  // ── Donut data ──
  const donutData = planDistribution
    ? [
        { name: 'Premium', value: planDistribution.premium, color: '#6366f1' },
        { name: 'Gratis', value: planDistribution.free, color: '#334155' },
      ]
    : [];

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Smart Alerts Banner ── */}
      {hasAlerts && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
              <ShieldAlert className="h-5 w-5 text-orange-400" />
            </div>
            <div className="flex flex-wrap gap-2">
              {(alerts?.staleProviders ?? 0) > 0 && (
                <Badge className="border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20">
                  <Clock className="mr-1 h-3 w-3" />
                  {alerts!.staleProviders} proveedores &gt;48h
                </Badge>
              )}
              {(alerts?.failedPayments ?? 0) > 0 && (
                <Badge className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20">
                  <CreditCard className="mr-1 h-3 w-3" />
                  {alerts!.failedPayments} pagos fallidos (7d)
                </Badge>
              )}
              {(alerts?.criticalErrors ?? 0) > 0 && (
                <Badge className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {alerts!.criticalErrors} errores criticos
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Sparkline KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          title="Usuarios activos (7d)"
          value={activeUsersData?.value ?? 0}
          icon={Users}
          description={`${activeUsersData?.total ?? 0} totales`}
          delta={activeUsersData?.delta}
          deltaLabel="vs semana ant."
          sparkData={activeUsersData?.spark}
          loading={l1}
        />
        <AdminKpiCard
          title="Revenue total"
          value={formatCLP(revenueData?.total ?? 0)}
          icon={DollarSign}
          description={`${formatCLP(revenueData?.thisMonth ?? 0)} este mes`}
          delta={revenueData?.delta}
          deltaLabel="vs mes ant."
          sparkData={revenueData?.spark}
          loading={l2}
        />
        <AdminKpiCard
          title="Mascotas activas"
          value={petsKpi?.activePets ?? 0}
          icon={PawPrint}
          description={`+${petsKpi?.thisWeek ?? 0} esta semana`}
          delta={petsKpi?.delta}
          deltaLabel="vs semana ant."
          sparkData={petsKpi?.spark}
          loading={l3}
        />
        <AdminKpiCard
          title="Por revisar"
          value={pendingReview ?? 0}
          icon={Flag}
          description="Verificaciones + reportes + promos"
          alert={(pendingReview ?? 0) > 0}
          loading={l4}
        />
      </div>

      {/* ── Secondary stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <AdminStatCard
          label="Fichas con registros"
          value={extraMetrics?.fichasConRegistros ?? 0}
          icon={FileCheck}
        />
        <AdminStatCard
          label="Reservas (7d)"
          value={extraMetrics?.weekBookings ?? 0}
          icon={Clock}
          color="text-purple-400"
        />
        <AdminStatCard
          label="Proveedores aprobados"
          value={extraMetrics?.approvedProviders ?? 0}
          icon={Briefcase}
          color="text-emerald-400"
        />
        <AdminStatCard
          label="Resenas totales"
          value={extraMetrics?.totalReviews ?? 0}
          icon={Star}
          color="text-amber-400"
        />
        <AdminStatCard
          label="Posts (7d)"
          value={extraMetrics?.weekPosts ?? 0}
          icon={TrendingUp}
          color="text-cyan-400"
        />
        <AdminStatCard
          label="Mascotas pendientes"
          value={extraMetrics?.mascotasPendientes ?? 0}
          icon={PawPrint}
          color={
            (extraMetrics?.mascotasPendientes ?? 0) > 0 ? 'text-orange-400' : 'text-indigo-400'
          }
        />
      </div>

      {/* ── Charts Row 1: Combined registrations + Plan distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-slate-800 bg-slate-900 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Registros (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={combinedChartData ?? []}>
                <defs>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval="preserveStartEnd"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Area
                  type="monotone"
                  dataKey="usuarios"
                  name="Usuarios"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#gradUsers)"
                />
                <Area
                  type="monotone"
                  dataKey="mascotas"
                  name="Mascotas"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#gradPets)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Distribucion de planes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {planDistribution ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                    <Label
                      content={<DonutLabel total={planDistribution.total} />}
                      position="center"
                    />
                  </Pie>
                  <Legend
                    wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span className="text-slate-400">{value}</span>}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-[200px] w-full bg-slate-800" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 2: Top services + Activity Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Top servicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topServicesData && topServicesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topServicesData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="type"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    width={90}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Reservas"
                    fill="#6366f1"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <AdminEmptyState
                icon={Clock}
                title="Sin reservas"
                description="Aun no hay datos de servicios reservados"
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Actividad reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!activityFeed ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full bg-slate-800" />
                ))}
              </div>
            ) : activityFeed.length === 0 ? (
              <AdminEmptyState
                icon={Activity}
                title="Sin actividad"
                description="No hay eventos recientes en la plataforma"
              />
            ) : (
              <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto pr-1">
                {activityFeed.map((item, i) => (
                  <ActivityRow key={i} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── System Health ── */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400">
            Estado del sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemHealth ? (
            <div className="flex flex-wrap gap-3">
              <HealthBadge
                status={systemHealth.db.status}
                label="Base de datos"
                latency={systemHealth.db.latency}
              />
              <HealthBadge
                status={
                  systemHealth.edgeFn.status === 'ok' || systemHealth.edgeFn.status === 'healthy'
                    ? 'healthy'
                    : systemHealth.edgeFn.status === 'unknown'
                      ? 'unknown'
                      : 'error'
                }
                label="Edge Functions"
              />
              <HealthBadge status="healthy" label="Frontend" />
              <HealthBadge
                status={import.meta.env.VITE_POSTHOG_KEY ? 'healthy' : 'unknown'}
                label={
                  import.meta.env.VITE_POSTHOG_KEY
                    ? 'PostHog activo'
                    : 'PostHog: configurar VITE_POSTHOG_KEY en .env'
                }
              />
            </div>
          ) : (
            <div className="flex gap-3">
              <Skeleton className="h-9 w-40 bg-slate-800" />
              <Skeleton className="h-9 w-40 bg-slate-800" />
              <Skeleton className="h-9 w-32 bg-slate-800" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
