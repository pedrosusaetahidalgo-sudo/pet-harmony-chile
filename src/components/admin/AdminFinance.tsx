import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  DollarSign,
  CreditCard,
  TrendingDown,
  AlertTriangle,
  Users,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Target,
  User,
} from '@/lib/icons';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays, subMonths, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  expired: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
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
      const monthlyChurnDecimal = churnRate / 100;

      // ARPU & LTV
      const arpu = activeSubs.length > 0 ? mrr / activeSubs.length : 0;
      const ltv =
        monthlyChurnDecimal > 0 ? Math.min(arpu * (1 / monthlyChurnDecimal), arpu * 24) : arpu * 24;

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
        arpu,
        ltv,
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

  // ── Tabla de ordenes recientes ──
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

  // ── Chart: revenue por dia ──
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

  // ── Chart: MRR trend (last 12 months) ──
  const { data: mrrTrend } = useQuery({
    queryKey: ['admin-finance-mrr-trend'],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('subscriptions') as any)
        .select('status, payment_amount_clp, created_at, cancelled_at')
        .in('status', ['active', 'cancelled']);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subs = (data as Array<Record<string, any>>) ?? [];
      const months: Array<{ label: string; mrr: number }> = [];

      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = startOfMonth(subMonths(now, i - 1));

        // Subs active as of end of this month: created before monthEnd and either still active or cancelled after monthEnd
        const activeAtMonth = subs.filter((s) => {
          const created = new Date(s.created_at);
          if (created >= monthEnd) return false;
          if (s.status === 'active') return true;
          if (s.cancelled_at && new Date(s.cancelled_at) >= monthEnd) return true;
          return false;
        });

        const mrr = activeAtMonth.reduce((sum, s) => sum + (s.payment_amount_clp || 0), 0);

        months.push({
          label: format(monthStart, 'MMM yy', { locale: es }),
          mrr,
        });
      }

      return months;
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

  // ── CSV Export ──
  const handleExportCSV = () => {
    if (!recentOrders || recentOrders.length === 0) {
      toast.error('No hay ordenes para exportar');
      return;
    }

    const header = 'Usuario,Monto,Comision,Estado,Fecha';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = recentOrders.map((o: Record<string, any>) =>
      [
        `"${o.userName}"`,
        o.total_clp || 0,
        o.platform_fee || 0,
        o.payment_status,
        format(new Date(o.created_at), 'yyyy-MM-dd HH:mm'),
      ].join(',')
    );

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ordenes_pawfriend_${format(now, 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV descargado');
  };

  const handleRetry = () => {
    toast.info('Reintento no disponible aun');
  };

  return (
    <div className="space-y-6">
      {/* Alerta pagos fallidos */}
      {(financeKpis?.failedOrders ?? 0) > 0 && (
        <Card className="border-red-500/30 bg-red-950/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-300">
              <strong>{financeKpis?.failedOrders}</strong> pagos fallidos en los ultimos 7 dias
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <Skeleton className="h-10 w-24 bg-slate-800" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">MRR</CardTitle>
                <DollarSign className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatClp(financeKpis?.mrr ?? 0)}
                </div>
                <p className="text-xs text-slate-500">
                  {financeKpis?.activeSubs ?? 0} suscripciones activas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Revenue (mes)</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatClp(financeKpis?.monthRevenue ?? 0)}
                </div>
                <p className="text-xs text-slate-500">
                  Comisiones: {formatClp(financeKpis?.monthFees ?? 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Churn (30d)</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {(financeKpis?.churnRate ?? 0).toFixed(1)}%
                </div>
                <p className="text-xs text-slate-500">Cancelaciones vs activas</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">ARPU</CardTitle>
                <User className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatClp(Math.round(financeKpis?.arpu ?? 0))}
                </div>
                <p className="text-xs text-slate-500">Ingreso promedio por usuario</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">LTV</CardTitle>
                <Target className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatClp(Math.round(financeKpis?.ltv ?? 0))}
                </div>
                <p className="text-xs text-slate-500">Valor de vida del cliente</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-slate-200">Revenue diario (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueChart ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(v: number) => formatClp(v)}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-slate-200">Suscripciones por plan</CardTitle>
          </CardHeader>
          <CardContent>
            {(planDistribution ?? []).length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Sin suscripciones activas</p>
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MRR Trend Chart */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base text-slate-200">Tendencia MRR (12 meses)</CardTitle>
          <CardDescription className="text-slate-500">
            Ingresos recurrentes mensuales estimados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!mrrTrend ? (
            <Skeleton className="h-[200px] w-full bg-slate-800" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={mrrTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(v: number) => formatClp(v)}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Line
                  type="monotone"
                  dataKey="mrr"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabla suscripciones */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-slate-200">
            <CreditCard className="h-4 w-4" />
            Suscripciones recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!subscriptions ? (
            <Skeleton className="h-40 w-full bg-slate-800" />
          ) : subscriptions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Sin suscripciones</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Usuario
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Plan
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Estado
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Monto
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Auto-renew
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {subscriptions.map((sub: Record<string, any>) => (
                    <tr
                      key={sub.id}
                      className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 text-slate-300">{sub.userName}</td>
                      <td className="py-3">
                        <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">
                          {sub.plan_type}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[sub.status] || 'bg-slate-500/20 text-slate-400'}`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-slate-200">
                        {formatClp(sub.payment_amount_clp || 0)}
                      </td>
                      <td className="py-3 text-slate-400">{sub.auto_renew ? 'Si' : 'No'}</td>
                      <td className="py-3 text-slate-500">
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

      {/* Tabla ordenes */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-slate-200">
            <DollarSign className="h-4 w-4" />
            Ordenes recientes
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          {!recentOrders ? (
            <Skeleton className="h-40 w-full bg-slate-800" />
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Sin ordenes</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Usuario
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Monto
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Fee
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Estado
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Fecha
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400"></th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {recentOrders.map((order: Record<string, any>) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 text-slate-300">{order.userName}</td>
                      <td className="py-3 font-mono text-slate-200">
                        {formatClp(order.total_clp || 0)}
                      </td>
                      <td className="py-3 font-mono text-slate-200">
                        {formatClp(order.platform_fee || 0)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                            order.payment_status === 'paid'
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : order.payment_status === 'failed'
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">
                        {format(new Date(order.created_at), 'dd-MM-yyyy HH:mm')}
                      </td>
                      <td className="py-3">
                        {order.payment_status === 'failed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={handleRetry}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reintentar
                          </Button>
                        )}
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
