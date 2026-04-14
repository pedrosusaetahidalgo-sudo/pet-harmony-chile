import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  CreditCard,
  TrendingDown,
  AlertTriangle,
  Users,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from '@/lib/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
};

const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981'];

export default function AdminFinance() {
  const now = new Date();
  const monthAgo = subDays(now, 30);
  const weekAgo = subDays(now, 7);

  // ── KPIs financieros ──
  const { data: financeKpis, isLoading } = useQuery({
    queryKey: ['admin-finance-kpis'],
    staleTime: 60_000,
    queryFn: async () => {
      const [subs, orders] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('subscriptions') as any).select(
          'status, plan_type, payment_amount_clp, cancelled_at, created_at'
        ),
        supabase.from('orders').select('total_clp, platform_fee, payment_status, created_at'),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subsData = (subs.data as Array<Record<string, any>>) ?? [];
      const ordersData = orders.data ?? [];

      const activeSubs = subsData.filter((s) => s.status === 'active');
      const mrr = activeSubs.reduce((sum, s) => sum + (s.payment_amount_clp || 0), 0);

      const cancelledThisMonth = subsData.filter(
        (s) => s.cancelled_at && new Date(s.cancelled_at) >= monthAgo
      ).length;
      const totalActiveStart = activeSubs.length + cancelledThisMonth;
      const churnRate = totalActiveStart > 0 ? (cancelledThisMonth / totalActiveStart) * 100 : 0;

      const paidOrders = ordersData.filter((o) => o.payment_status === 'paid');
      const monthRevenue = paidOrders
        .filter((o) => new Date(o.created_at) >= monthAgo)
        .reduce((sum, o) => sum + (o.total_clp || 0), 0);

      const monthFees = paidOrders
        .filter((o) => new Date(o.created_at) >= monthAgo)
        .reduce((sum, o) => sum + (o.platform_fee || 0), 0);

      const failedOrders = ordersData.filter(
        (o) => o.payment_status === 'failed' && new Date(o.created_at) >= weekAgo
      ).length;

      return {
        mrr,
        activeSubs: activeSubs.length,
        churnRate,
        monthRevenue,
        monthFees,
        failedOrders,
      };
    },
  });

  // ── Tabla de suscripciones ──
  const { data: subscriptions } = useQuery({
    queryKey: ['admin-finance-subs-table'],
    staleTime: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('subscriptions') as any)
        .select(
          'id, user_id, plan_type, status, payment_amount_clp, start_date, end_date, auto_renew, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(20);

      // Enrich with user names
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subs = (data as Array<Record<string, any>>) ?? [];
      if (subs.length === 0) return [];

      const userIds = [...new Set(subs.map((s) => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
      return subs.map((s) => ({ ...s, userName: nameMap.get(s.user_id) || 'Usuario' }));
    },
  });

  // ── Tabla de órdenes recientes ──
  const { data: recentOrders } = useQuery({
    queryKey: ['admin-finance-orders'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, user_id, total_clp, platform_fee, payment_status, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      const orders = data ?? [];
      if (orders.length === 0) return [];

      const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
      return orders.map((o) => ({ ...o, userName: nameMap.get(o.user_id ?? '') || 'Usuario' }));
    },
  });

  // ── Chart: revenue por día ──
  const { data: revenueChart } = useQuery({
    queryKey: ['admin-finance-revenue-chart'],
    staleTime: 120_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('total_clp, created_at')
        .eq('payment_status', 'paid')
        .gte('created_at', monthAgo.toISOString())
        .order('created_at');

      const byDay: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        byDay[format(subDays(now, 29 - i), 'yyyy-MM-dd')] = 0;
      }
      (data ?? []).forEach((o) => {
        const d = format(new Date(o.created_at), 'yyyy-MM-dd');
        if (byDay[d] !== undefined) byDay[d] += o.total_clp || 0;
      });

      return Object.entries(byDay).map(([date, amount]) => ({
        date: format(new Date(date), 'dd MMM', { locale: es }),
        revenue: amount,
      }));
    },
  });

  // ── Chart: subs por plan ──
  const { data: planDistribution } = useQuery({
    queryKey: ['admin-finance-plan-dist'],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('subscriptions') as any)
        .select('plan_type')
        .eq('status', 'active');

      const counts: Record<string, number> = {};

      ((data as Array<Record<string, string>>) ?? []).forEach((s) => {
        const plan = s.plan_type || 'otro';
        counts[plan] = (counts[plan] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  const formatClp = (n: number) => `$${n.toLocaleString('es-CL')}`;

  return (
    <div className="space-y-6">
      {/* Alerta pagos fallidos */}
      {(financeKpis?.failedOrders ?? 0) > 0 && (
        <Card className="border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>{financeKpis?.failedOrders}</strong> pagos fallidos en los últimos 7 días
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-10 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatClp(financeKpis?.mrr ?? 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {financeKpis?.activeSubs ?? 0} suscripciones activas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue (mes)</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatClp(financeKpis?.monthRevenue ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Comisiones: {formatClp(financeKpis?.monthFees ?? 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn rate (30d)</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(financeKpis?.churnRate ?? 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Cancelaciones vs activas al inicio</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue diario (30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueChart ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatClp(v)} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suscripciones por plan</CardTitle>
          </CardHeader>
          <CardContent>
            {(planDistribution ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin suscripciones activas
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {(planDistribution ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla suscripciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Suscripciones recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!subscriptions ? (
            <Skeleton className="h-40 w-full" />
          ) : subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin suscripciones</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Usuario</th>
                    <th className="pb-2 font-medium">Plan</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 font-medium">Monto</th>
                    <th className="pb-2 font-medium">Auto-renew</th>
                    <th className="pb-2 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {subscriptions.map((sub: Record<string, any>) => (
                    <tr key={sub.id} className="border-b last:border-0">
                      <td className="py-2">{sub.userName}</td>
                      <td className="py-2">
                        <Badge variant="outline">{sub.plan_type}</Badge>
                      </td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sub.status] || 'bg-gray-100'}`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-2">{formatClp(sub.payment_amount_clp || 0)}</td>
                      <td className="py-2">{sub.auto_renew ? 'Si' : 'No'}</td>
                      <td className="py-2 text-muted-foreground">
                        {format(new Date(sub.created_at), 'dd-MM-yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla órdenes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Órdenes recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recentOrders ? (
            <Skeleton className="h-40 w-full" />
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin órdenes</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Usuario</th>
                    <th className="pb-2 font-medium">Monto</th>
                    <th className="pb-2 font-medium">Fee</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {recentOrders.map((order: Record<string, any>) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-2">{order.userName}</td>
                      <td className="py-2">{formatClp(order.total_clp || 0)}</td>
                      <td className="py-2">{formatClp(order.platform_fee || 0)}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.payment_status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : order.payment_status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {format(new Date(order.created_at), 'dd-MM-yyyy HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
