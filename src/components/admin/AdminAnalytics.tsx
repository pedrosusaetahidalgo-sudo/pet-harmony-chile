import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Eye,
  Clock,
  Users,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  ArrowUpRight,
  MousePointer,
  Zap,
  Route,
} from '@/lib/icons';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

const PIE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export default function AdminAnalytics() {
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const monthAgo = subDays(now, 30);

  // ── Traffic KPIs ──
  const { data: trafficKpis, isLoading: l1 } = useQuery({
    queryKey: ['admin-analytics-kpis'],
    staleTime: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('analytics_events') as any)
        .select('event_type, user_id, session_id, created_at')
        .gte('created_at', weekAgo.toISOString());

      const events = (data as AnyRow[]) ?? [];
      const today = format(now, 'yyyy-MM-dd');

      const pageViews = events.filter((e) => e.event_type === 'page_view');
      const sessions = new Set(events.map((e) => e.session_id).filter(Boolean));
      const uniqueUsers = new Set(events.map((e) => e.user_id).filter(Boolean));
      const todayViews = pageViews.filter((e) => e.created_at?.startsWith(today));

      return {
        pageViewsWeek: pageViews.length,
        pageViewsToday: todayViews.length,
        sessionsWeek: sessions.size,
        uniqueUsersWeek: uniqueUsers.size,
      };
    },
  });

  // ── Page views by day (7 days) ──
  const { data: viewsByDay } = useQuery({
    queryKey: ['admin-analytics-views-day'],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('analytics_events') as any)
        .select('created_at')
        .eq('event_type', 'page_view')
        .gte('created_at', weekAgo.toISOString());

      const byDay: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        byDay[format(subDays(now, 6 - i), 'yyyy-MM-dd')] = 0;
      }
      ((data as AnyRow[]) ?? []).forEach((e) => {
        const d = format(new Date(e.created_at), 'yyyy-MM-dd');
        if (byDay[d] !== undefined) byDay[d]++;
      });

      return Object.entries(byDay).map(([date, views]) => ({
        date: format(new Date(date), 'EEE dd', { locale: es }),
        vistas: views,
      }));
    },
  });

  // ── Top pages (most viewed) ──
  const { data: topPages } = useQuery({
    queryKey: ['admin-analytics-top-pages'],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('analytics_events') as any)
        .select('event_name')
        .eq('event_type', 'page_view')
        .gte('created_at', weekAgo.toISOString());

      const counts: Record<string, number> = {};
      ((data as AnyRow[]) ?? []).forEach((e) => {
        const page = e.event_name || '/unknown';
        counts[page] = (counts[page] || 0) + 1;
      });

      return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([page, views]) => ({ page, views }));
    },
  });

  // ── Dwell time by page ──
  const { data: dwellByPage } = useQuery({
    queryKey: ['admin-analytics-dwell'],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('analytics_events') as any)
        .select('event_name, duration_ms')
        .eq('event_type', 'page_leave')
        .gte('created_at', weekAgo.toISOString())
        .not('duration_ms', 'is', null);

      const totals: Record<string, { sum: number; count: number }> = {};
      ((data as AnyRow[]) ?? []).forEach((e) => {
        const page = e.event_name || '/unknown';
        if (!totals[page]) totals[page] = { sum: 0, count: 0 };
        totals[page].sum += e.duration_ms || 0;
        totals[page].count++;
      });

      return Object.entries(totals)
        .map(([page, { sum, count }]) => ({
          page,
          avgSeconds: Math.round(sum / count / 1000),
          visits: count,
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 15);
    },
  });

  // ── Device distribution ──
  const { data: deviceData } = useQuery({
    queryKey: ['admin-analytics-devices'],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('analytics_events') as any)
        .select('metadata')
        .eq('event_type', 'session_start')
        .gte('created_at', monthAgo.toISOString());

      const counts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
      ((data as AnyRow[]) ?? []).forEach((e) => {
        const device = (e.metadata as AnyRow)?.device || 'desktop';
        counts[device] = (counts[device] || 0) + 1;
      });

      return Object.entries(counts)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }));
    },
  });

  // ── Feature usage ──
  const { data: featureUsage } = useQuery({
    queryKey: ['admin-analytics-features'],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('analytics_events') as any)
        .select('event_name')
        .eq('event_type', 'feature_use')
        .gte('created_at', weekAgo.toISOString());

      const counts: Record<string, number> = {};
      ((data as AnyRow[]) ?? []).forEach((e) => {
        counts[e.event_name] = (counts[e.event_name] || 0) + 1;
      });

      return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([feature, count]) => ({ feature, count }));
    },
  });

  // ── Edge function calls ──
  const { data: edgeFnCalls } = useQuery({
    queryKey: ['admin-analytics-edge-fns'],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('analytics_events') as any)
        .select('event_name, duration_ms, metadata')
        .eq('event_type', 'edge_function_call')
        .gte('created_at', weekAgo.toISOString());

      const fns: Record<string, { calls: number; totalMs: number; errors: number }> = {};
      ((data as AnyRow[]) ?? []).forEach((e) => {
        const fn = e.event_name;
        if (!fns[fn]) fns[fn] = { calls: 0, totalMs: 0, errors: 0 };
        fns[fn].calls++;
        fns[fn].totalMs += e.duration_ms || 0;
        if ((e.metadata as AnyRow)?.status === 'error') fns[fn].errors++;
      });

      return Object.entries(fns)
        .map(([name, stats]) => ({
          name,
          calls: stats.calls,
          avgMs: stats.calls > 0 ? Math.round(stats.totalMs / stats.calls) : 0,
          errors: stats.errors,
        }))
        .sort((a, b) => b.calls - a.calls);
    },
  });

  // ── Conversion funnel ──
  const { data: funnel } = useQuery({
    queryKey: ['admin-analytics-funnel'],
    staleTime: 120_000,
    queryFn: async () => {
      const [profiles, withPets, withRecords, withPdf] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('pets').select('owner_id', { count: 'exact', head: true }),
        supabase.from('medical_records').select('*', { count: 'exact', head: true }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('analytics_events') as any)
          .select('*', { count: 'exact', head: true })
          .eq('event_name', 'pdf_download'),
      ]);

      const total = profiles.count ?? 0;
      return [
        { step: 'Registro', count: total, pct: 100 },
        {
          step: 'Agrega mascota',
          count: withPets.count ?? 0,
          pct: total > 0 ? Math.round(((withPets.count ?? 0) / total) * 100) : 0,
        },
        {
          step: 'Ficha medica',
          count: withRecords.count ?? 0,
          pct: total > 0 ? Math.round(((withRecords.count ?? 0) / total) * 100) : 0,
        },
        {
          step: 'Descarga PDF',
          count: (withPdf.count as number | null) ?? 0,
          pct: total > 0 ? Math.round((((withPdf.count as number | null) ?? 0) / total) * 100) : 0,
        },
      ];
    },
  });

  const DeviceIcon = ({ device }: { device: string }) => {
    if (device === 'mobile') return <Smartphone className="h-4 w-4" />;
    if (device === 'tablet') return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const formatDwell = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6">
      {/* Traffic KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-medium">Vistas hoy</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1">
              {l1 ? '...' : (trafficKpis?.pageViewsToday ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium">Vistas (7d)</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1">{trafficKpis?.pageViewsWeek ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium">Sesiones (7d)</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1">{trafficKpis?.sessionsWeek ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium">Usuarios unicos (7d)</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1">{trafficKpis?.uniqueUsersWeek ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Page views trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Trafico diario (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={viewsByDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="vistas" stroke="#6366f1" fill="#6366f180" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dispositivos</CardTitle>
          </CardHeader>
          <CardContent>
            {(deviceData ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={55}
                      label
                    >
                      {(deviceData ?? []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {(deviceData ?? []).map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i] }}
                      />
                      <DeviceIcon device={d.name} />
                      <span>
                        {d.name}: {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Embudo de conversion</CardTitle>
          <CardDescription>Registro → Mascota → Ficha → PDF</CardDescription>
        </CardHeader>
        <CardContent>
          {!funnel ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="flex items-end gap-2">
              {funnel.map((step, i) => (
                <div key={step.step} className="flex-1 text-center">
                  <div
                    className="mx-auto rounded-t-md bg-indigo-500/80 transition-all"
                    style={{ height: `${Math.max(step.pct * 1.2, 8)}px`, maxHeight: 120 }}
                  />
                  <p className="text-xs font-medium mt-2">{step.step}</p>
                  <p className="text-lg font-bold font-mono">{step.count}</p>
                  <p className="text-xs text-muted-foreground">{step.pct}%</p>
                  {i < funnel.length - 1 && (
                    <ArrowUpRight className="h-3 w-3 mx-auto text-muted-foreground mt-1 rotate-90" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Paginas mas visitadas (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!topPages ? (
              <Skeleton className="h-40 w-full" />
            ) : topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {topPages.map((p, i) => (
                  <div key={p.page} className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                    <span className="flex-1 font-mono text-xs truncate">{p.page}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {p.views}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dwell time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tiempo promedio por pagina (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!dwellByPage ? (
              <Skeleton className="h-40 w-full" />
            ) : dwellByPage.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {dwellByPage.map((p) => (
                  <div key={p.page} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 font-mono text-xs truncate">{p.page}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {formatDwell(p.avgSeconds)}
                    </Badge>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {p.visits} vis
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature usage + Edge functions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Uso de features (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!featureUsage || featureUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin datos. Los features se trackean con trackEvent().
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={featureUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="feature" type="category" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Edge Functions (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!edgeFnCalls || edgeFnCalls.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin invocaciones registradas
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 text-xs font-medium">Funcion</th>
                      <th className="pb-2 text-xs font-medium text-right">Calls</th>
                      <th className="pb-2 text-xs font-medium text-right">Avg ms</th>
                      <th className="pb-2 text-xs font-medium text-right">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edgeFnCalls.map((fn) => (
                      <tr key={fn.name} className="border-b last:border-0">
                        <td className="py-1.5 font-mono text-xs">{fn.name}</td>
                        <td className="py-1.5 text-right font-mono text-xs">{fn.calls}</td>
                        <td className="py-1.5 text-right font-mono text-xs">{fn.avgMs}ms</td>
                        <td className="py-1.5 text-right">
                          {fn.errors > 0 ? (
                            <Badge variant="destructive" className="text-[10px]">
                              {fn.errors}
                            </Badge>
                          ) : (
                            <span className="text-xs text-emerald-400">0</span>
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
    </div>
  );
}
