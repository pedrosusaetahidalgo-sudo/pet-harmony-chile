import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
} from '@/lib/icons';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

// ── KPI Card ─────────────────────────────────────────────
interface KpiProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  alert?: boolean;
  loading?: boolean;
}

function KpiCard({ title, value, icon: Icon, description, alert, loading }: KpiProps) {
  return (
    <Card
      className={
        alert ? 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950' : ''
      }
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${alert ? 'text-orange-500' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Activity item ────────────────────────────────────────
interface ActivityItem {
  type: string;
  label: string;
  time: string;
  icon: React.ElementType;
  color: string;
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`p-1.5 rounded-full ${item.color}`}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{item.label}</p>
        <p className="text-xs text-muted-foreground">{item.time}</p>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────
export default function AdminDashboard() {
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const monthAgo = subDays(now, 30);

  // ── KPI queries ──
  const { data: activeUsers, isLoading: l1 } = useQuery({
    queryKey: ['admin-kpi-active-users'],
    staleTime: 60_000,
    queryFn: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', weekAgo.toISOString());
      return count ?? 0;
    },
  });

  const { data: totalUsers } = useQuery({
    queryKey: ['admin-kpi-total-users'],
    staleTime: 60_000,
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: revenue, isLoading: l2 } = useQuery({
    queryKey: ['admin-kpi-revenue'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('total_clp, payment_status')
        .eq('payment_status', 'paid');
      return (data ?? []).reduce((s, o) => s + (o.total_clp || 0), 0);
    },
  });

  const { data: pendingProviders, isLoading: l3 } = useQuery({
    queryKey: ['admin-kpi-pending-providers'],
    staleTime: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase.from('service_providers') as any)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      return (count as number | null) ?? 0;
    },
  });

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

  // ── Chart: registros 30 días ──
  const { data: registrationData } = useQuery({
    queryKey: ['admin-chart-registrations'],
    staleTime: 120_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', monthAgo.toISOString())
        .order('created_at');

      const byDay: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const d = format(subDays(now, 29 - i), 'yyyy-MM-dd');
        byDay[d] = 0;
      }
      (data ?? []).forEach((p) => {
        const d = format(new Date(p.created_at), 'yyyy-MM-dd');
        if (byDay[d] !== undefined) byDay[d]++;
      });

      return Object.entries(byDay).map(([date, count]) => ({
        date: format(new Date(date), 'dd MMM', { locale: es }),
        usuarios: count,
      }));
    },
  });

  // ── Chart: mascotas 30 días ──
  const { data: petData } = useQuery({
    queryKey: ['admin-chart-pets'],
    staleTime: 120_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('pets')
        .select('created_at')
        .gte('created_at', monthAgo.toISOString())
        .order('created_at');

      const byDay: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const d = format(subDays(now, 29 - i), 'yyyy-MM-dd');
        byDay[d] = 0;
      }
      (data ?? []).forEach((p) => {
        const d = format(new Date(p.created_at), 'yyyy-MM-dd');
        if (byDay[d] !== undefined) byDay[d]++;
      });

      return Object.entries(byDay).map(([date, count]) => ({
        date: format(new Date(date), 'dd MMM', { locale: es }),
        mascotas: count,
      }));
    },
  });

  // ── Extra metrics ──
  const { data: extraMetrics } = useQuery({
    queryKey: ['admin-extra-metrics'],
    staleTime: 60_000,
    queryFn: async () => {
      const [pets, bookings, providers, reviews, posts] = await Promise.all([
        supabase
          .from('pets')
          .select('*', { count: 'exact', head: true })
          .eq('lifecycle_status', 'active'),
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString()),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('service_providers') as any)
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved'),
        supabase.from('service_reviews').select('*', { count: 'exact', head: true }),
        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString()),
      ]);
      return {
        activePets: (pets.count as number | null) ?? 0,
        weekBookings: bookings.count ?? 0,
        approvedProviders: (providers.count as number | null) ?? 0,
        totalReviews: reviews.count ?? 0,
        weekPosts: posts.count ?? 0,
      };
    },
  });

  // ── Activity feed ──
  const { data: activityFeed } = useQuery({
    queryKey: ['admin-activity-feed'],
    staleTime: 30_000,
    queryFn: async () => {
      const items: ActivityItem[] = [];

      // Recent users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('display_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      (recentUsers ?? []).forEach((u) =>
        items.push({
          type: 'user',
          label: `Nuevo usuario: ${u.display_name || 'Sin nombre'}`,
          time: format(new Date(u.created_at), 'dd MMM HH:mm', { locale: es }),
          icon: UserPlus,
          color: 'bg-blue-500',
        })
      );

      // Recent providers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: recentProviders } = await (supabase.from('service_providers') as any)
        .select('display_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      ((recentProviders as Array<Record<string, string>>) ?? []).forEach((p) =>
        items.push({
          type: 'provider',
          label: `Provider: ${p.display_name || 'Sin nombre'} (${p.status})`,
          time: format(new Date(p.created_at), 'dd MMM HH:mm', { locale: es }),
          icon: Briefcase,
          color: p.status === 'approved' ? 'bg-green-500' : 'bg-orange-500',
        })
      );

      // Recent bookings
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select('service_type, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      (recentBookings ?? []).forEach((b) =>
        items.push({
          type: 'booking',
          label: `Reserva: ${b.service_type || 'servicio'}`,
          time: format(new Date(b.created_at), 'dd MMM HH:mm', { locale: es }),
          icon: Clock,
          color: 'bg-purple-500',
        })
      );

      // Recent reviews
      const { data: recentReviews } = await supabase
        .from('service_reviews')
        .select('rating, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      (recentReviews ?? []).forEach((r) =>
        items.push({
          type: 'review',
          label: `Nueva reseña: ${r.rating} estrellas`,
          time: format(new Date(r.created_at), 'dd MMM HH:mm', { locale: es }),
          icon: Star,
          color: 'bg-yellow-500',
        })
      );

      // Sort by time desc
      items.sort((a, b) => b.time.localeCompare(a.time));
      return items.slice(0, 15);
    },
  });

  return (
    <div className="space-y-6">
      {/* Alertas activas */}
      {((pendingProviders ?? 0) > 0 || (pendingReview ?? 0) > 0) && (
        <Card className="border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div className="flex flex-wrap gap-2">
              {(pendingProviders ?? 0) > 0 && (
                <Badge variant="outline" className="border-orange-400 text-orange-700">
                  {pendingProviders} proveedores pendientes
                </Badge>
              )}
              {(pendingReview ?? 0) > 0 && (
                <Badge variant="outline" className="border-orange-400 text-orange-700">
                  {pendingReview} items por revisar
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Usuarios activos (7d)"
          value={activeUsers ?? 0}
          icon={Users}
          description={`${totalUsers ?? 0} totales`}
          loading={l1}
        />
        <KpiCard
          title="Revenue total"
          value={`$${((revenue ?? 0) / 1000).toFixed(0)}k`}
          icon={DollarSign}
          description="Pagos completados"
          loading={l2}
        />
        <KpiCard
          title="Proveedores pendientes"
          value={pendingProviders ?? 0}
          icon={FileCheck}
          alert={(pendingProviders ?? 0) > 0}
          loading={l3}
        />
        <KpiCard
          title="Por revisar"
          value={pendingReview ?? 0}
          icon={Flag}
          description="Verificaciones + reportes + promos"
          alert={(pendingReview ?? 0) > 0}
          loading={l4}
        />
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard title="Mascotas activas" value={extraMetrics?.activePets ?? 0} icon={PawPrint} />
        <KpiCard title="Reservas (7d)" value={extraMetrics?.weekBookings ?? 0} icon={Clock} />
        <KpiCard
          title="Proveedores aprobados"
          value={extraMetrics?.approvedProviders ?? 0}
          icon={Briefcase}
        />
        <KpiCard title="Reseñas totales" value={extraMetrics?.totalReviews ?? 0} icon={Star} />
        <KpiCard title="Posts (7d)" value={extraMetrics?.weekPosts ?? 0} icon={TrendingUp} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registros de usuarios (30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={registrationData ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="usuarios" stroke="#8b5cf6" fill="#8b5cf680" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mascotas registradas (30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={petData ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="mascotas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Actividad reciente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad reciente</CardTitle>
          <CardDescription>Últimos eventos en la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          {!activityFeed ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : activityFeed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin actividad reciente</p>
          ) : (
            <div className="divide-y">
              {activityFeed.map((item, i) => (
                <ActivityRow key={i} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
