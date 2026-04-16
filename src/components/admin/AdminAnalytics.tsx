import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCLP } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Download,
  DollarSign,
  Percent,
  Activity,
  Calendar,
} from '@/lib/icons';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, subMonths, startOfMonth, differenceInMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const FUNNEL_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#06b6d4', '#22d3ee', '#67e8f9'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

type RangeKey = '7d' | '30d' | '90d' | 'custom';

const RANGE_OPTIONS: { key: RangeKey; label: string; days: number }[] = [
  { key: '7d', label: '7 dias', days: 7 },
  { key: '30d', label: '30 dias', days: 30 },
  { key: '90d', label: '90 dias', days: 90 },
];

export default function AdminAnalytics() {
  const [rangeKey, setRangeKey] = useState<RangeKey>('7d');
  const [customDays, setCustomDays] = useState(14);

  const rangeDays =
    rangeKey === 'custom' ? customDays : (RANGE_OPTIONS.find((r) => r.key === rangeKey)?.days ?? 7);

  const now = new Date();
  const rangeStart = subDays(now, rangeDays);
  const monthAgo = subDays(now, 30);

  // ── Traffic KPIs ──
  const { data: trafficKpis, isLoading: l1 } = useQuery({
    queryKey: ['admin-analytics-kpis', rangeDays],
    staleTime: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('analytics_events') as any)
        .select('event_type, user_id, session_id, created_at')
        .gte('created_at', rangeStart.toISOString());

      const events = (data as AnyRow[]) ?? [];
      const today = format(now, 'yyyy-MM-dd');

      const pageViews = events.filter((e) => e.event_type === 'page_view');
      const sessions = new Set(events.map((e) => e.session_id).filter(Boolean));
      const uniqueUsers = new Set(events.map((e) => e.user_id).filter(Boolean));
      const todayViews = pageViews.filter((e) => e.created_at?.startsWith(today));

      return {
        pageViewsRange: pageViews.length,
        pageViewsToday: todayViews.length,
        sessionsRange: sessions.size,
        uniqueUsersRange: uniqueUsers.size,
      };
    },
  });

  // ── DAU / MAU / Bounce ──
  const { data: engagementKpis } = useQuery({
    queryKey: ['admin-analytics-engagement'],
    staleTime: 60_000,
    queryFn: async () => {
      const thirtyAgo = subDays(now, 30).toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('analytics_events') as any)
        .select('event_type, user_id, session_id, created_at')
        .eq('event_type', 'page_view')
        .gte('created_at', thirtyAgo);

      const events = (data as AnyRow[]) ?? [];
      const today = format(now, 'yyyy-MM-dd');

      const dauUsers = new Set(
        events
          .filter((e) => e.created_at?.startsWith(today))
          .map((e) => e.user_id)
          .filter(Boolean)
      );
      const mauUsers = new Set(events.map((e) => e.user_id).filter(Boolean));

      // Bounce rate: sessions with only 1 page_view
      const sessionCounts: Record<string, number> = {};
      events.forEach((e) => {
        if (e.session_id) {
          sessionCounts[e.session_id] = (sessionCounts[e.session_id] || 0) + 1;
        }
      });
      const totalSessions = Object.keys(sessionCounts).length;
      const bounceSessions = Object.values(sessionCounts).filter((c) => c === 1).length;

      const dau = dauUsers.size;
      const mau = mauUsers.size;
      const dauMauRatio = mau > 0 ? Math.round((dau / mau) * 100) : 0;
      const bounceRate = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100) : 0;

      return { dau, mau, dauMauRatio, bounceRate };
    },
  });

  // ── Page views by day ──
  const { data: viewsByDay } = useQuery({
    queryKey: ['admin-analytics-views-day', rangeDays],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('analytics_events') as any)
        .select('created_at')
        .eq('event_type', 'page_view')
        .gte('created_at', rangeStart.toISOString());

      const byDay: Record<string, number> = {};
      for (let i = 0; i < rangeDays; i++) {
        byDay[format(subDays(now, rangeDays - 1 - i), 'yyyy-MM-dd')] = 0;
      }
      ((data as AnyRow[]) ?? []).forEach((e) => {
        const d = format(new Date(e.created_at), 'yyyy-MM-dd');
        if (byDay[d] !== undefined) byDay[d]++;
      });

      return Object.entries(byDay).map(([date, views]) => ({
        date: format(new Date(date), rangeDays <= 14 ? 'EEE dd' : 'dd MMM', { locale: es }),
        vistas: views,
      }));
    },
  });

  // ── Top pages ──
  const { data: topPages } = useQuery({
    queryKey: ['admin-analytics-top-pages', rangeDays],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('analytics_events') as any)
        .select('event_name')
        .eq('event_type', 'page_view')
        .gte('created_at', rangeStart.toISOString());

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
    queryKey: ['admin-analytics-dwell', rangeDays],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('analytics_events') as any)
        .select('event_name, duration_ms')
        .eq('event_type', 'page_leave')
        .gte('created_at', rangeStart.toISOString())
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
    queryKey: ['admin-analytics-devices', rangeDays],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('analytics_events') as any)
        .select('metadata')
        .eq('event_type', 'session_start')
        .gte('created_at', rangeStart.toISOString());

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
    queryKey: ['admin-analytics-features', rangeDays],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('analytics_events') as any)
        .select('event_name')
        .eq('event_type', 'feature_use')
        .gte('created_at', rangeStart.toISOString());

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
    queryKey: ['admin-analytics-edge-fns', rangeDays],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('analytics_events') as any)
        .select('event_name, duration_ms, metadata')
        .eq('event_type', 'edge_function_call')
        .gte('created_at', rangeStart.toISOString());

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

  // ── Extended Conversion funnel ──
  const { data: funnel } = useQuery({
    queryKey: ['admin-analytics-funnel'],
    staleTime: 120_000,
    queryFn: async () => {
      const [profiles, withPets, withRecords, withPdf, withBookings, withPremium] =
        await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('pets').select('owner_id', { count: 'exact', head: true }),
          supabase.from('medical_records').select('*', { count: 'exact', head: true }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from('analytics_events') as any)
            .select('*', { count: 'exact', head: true })
            .eq('event_name', 'pdf_download'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          supabase.from('bookings' as any).select('*', { count: 'exact', head: true }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from('subscriptions' as any) as any)
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active'),
        ]);

      const total = profiles.count ?? 0;
      const steps = [
        { step: 'Registro', count: total },
        { step: 'Agrega mascota', count: withPets.count ?? 0 },
        { step: 'Ficha medica', count: withRecords.count ?? 0 },
        { step: 'Descarga PDF', count: (withPdf.count as number | null) ?? 0 },
        { step: 'Primera reserva', count: (withBookings.count as number | null) ?? 0 },
        { step: 'Premium', count: (withPremium.count as number | null) ?? 0 },
      ];

      return steps.map((s) => ({
        ...s,
        pct: total > 0 ? Math.round((s.count / total) * 100) : 0,
      }));
    },
  });

  // ── Revenue Analytics ──
  const { data: revenue } = useQuery({
    queryKey: ['admin-analytics-revenue'],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: activeSubs } = await (supabase.from('subscriptions' as any) as any)
        .select('payment_amount_clp, created_at')
        .eq('status', 'active');

      const subs = (activeSubs as AnyRow[]) ?? [];
      const mrr = subs.reduce((sum: number, s: AnyRow) => sum + (s.payment_amount_clp || 0), 0);
      const arpu = subs.length > 0 ? Math.round(mrr / subs.length) : 0;

      // MRR trend last 6 months
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allSubs } = await (supabase.from('subscriptions' as any) as any)
        .select('payment_amount_clp, status, created_at')
        .gte('created_at', subMonths(now, 6).toISOString());

      const monthlyMrr: { month: string; mrr: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthLabel = format(monthStart, 'MMM yy', { locale: es });
        const monthSubs = ((allSubs as AnyRow[]) ?? []).filter((s) => {
          const created = new Date(s.created_at);
          return created <= startOfMonth(subMonths(now, i - 1)) && s.status === 'active';
        });
        // Simplified: count subs created before this month end that are still active
        const monthMrr = monthSubs.reduce(
          (sum: number, s: AnyRow) => sum + (s.payment_amount_clp || 0),
          0
        );
        monthlyMrr.push({ month: monthLabel, mrr: monthMrr });
      }

      return { mrr, arpu, activeCount: subs.length, trend: monthlyMrr };
    },
  });

  // ── Cohort Retention ──
  const { data: cohortData } = useQuery({
    queryKey: ['admin-analytics-cohort'],
    staleTime: 300_000,
    queryFn: async () => {
      const sixMonthsAgo = subMonths(now, 6).toISOString();

      const { data: users } = await supabase
        .from('profiles')
        .select('id, created_at, updated_at')
        .gte('created_at', sixMonthsAgo)
        .order('created_at', { ascending: true })
        .limit(1200);

      const profiles = (users ?? []) as AnyRow[];

      // Group by registration month
      const cohorts: Record<string, { users: AnyRow[]; label: string }> = {};
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const key = format(monthStart, 'yyyy-MM');
        const label = format(monthStart, 'MMM yy', { locale: es });
        cohorts[key] = { users: [], label };
      }

      profiles.forEach((u) => {
        const key = format(new Date(u.created_at), 'yyyy-MM');
        if (cohorts[key]) {
          cohorts[key].users.push(u);
        }
      });

      // For each cohort, compute retention at M0..M5
      const rows = Object.entries(cohorts).map(([cohortMonth, { users: cohortUsers, label }]) => {
        const cohortStart = new Date(cohortMonth + '-01');
        const totalUsers = cohortUsers.length;
        const retention: number[] = [];

        for (let m = 0; m < 6; m++) {
          const targetMonth = startOfMonth(subMonths(now, 0));
          const relativeMonth = startOfMonth(
            new Date(cohortStart.getFullYear(), cohortStart.getMonth() + m, 1)
          );

          if (relativeMonth > targetMonth) {
            retention.push(-1); // future month
            continue;
          }

          if (totalUsers === 0) {
            retention.push(0);
            continue;
          }

          // Check activity: updated_at falls within this relative month
          const monthKey = format(relativeMonth, 'yyyy-MM');
          const activeCount = cohortUsers.filter((u) => {
            if (!u.updated_at) return false;
            const updatedMonth = format(new Date(u.updated_at), 'yyyy-MM');
            // User was active if their updated_at is >= this month
            const updatedDate = new Date(u.updated_at);
            const monthEnd = new Date(relativeMonth.getFullYear(), relativeMonth.getMonth() + 1, 0);
            return updatedDate >= relativeMonth && format(updatedDate, 'yyyy-MM') === monthKey;
          }).length;

          retention.push(totalUsers > 0 ? Math.round((activeCount / totalUsers) * 100) : 0);
        }

        return { label, totalUsers, retention, cohortMonth };
      });

      return rows;
    },
  });

  // ── CSV Export ──
  const handleExportCSV = () => {
    const lines: string[] = [];

    // KPIs
    lines.push('=== KPIs de Trafico ===');
    lines.push('Metrica,Valor');
    lines.push(`Vistas hoy,${trafficKpis?.pageViewsToday ?? 0}`);
    lines.push(`Vistas (${rangeDays}d),${trafficKpis?.pageViewsRange ?? 0}`);
    lines.push(`Sesiones (${rangeDays}d),${trafficKpis?.sessionsRange ?? 0}`);
    lines.push(`Usuarios unicos (${rangeDays}d),${trafficKpis?.uniqueUsersRange ?? 0}`);
    lines.push(`DAU,${engagementKpis?.dau ?? 0}`);
    lines.push(`MAU,${engagementKpis?.mau ?? 0}`);
    lines.push(`DAU/MAU %,${engagementKpis?.dauMauRatio ?? 0}`);
    lines.push(`Bounce Rate %,${engagementKpis?.bounceRate ?? 0}`);
    lines.push('');

    // Views by day
    if (viewsByDay?.length) {
      lines.push('=== Trafico Diario ===');
      lines.push('Dia,Vistas');
      viewsByDay.forEach((d) => lines.push(`${d.date},${d.vistas}`));
      lines.push('');
    }

    // Top pages
    if (topPages?.length) {
      lines.push('=== Paginas Mas Visitadas ===');
      lines.push('Pagina,Vistas');
      topPages.forEach((p) => lines.push(`"${p.page}",${p.views}`));
      lines.push('');
    }

    // Funnel
    if (funnel?.length) {
      lines.push('=== Embudo de Conversion ===');
      lines.push('Paso,Cantidad,%');
      funnel.forEach((s) => lines.push(`${s.step},${s.count},${s.pct}%`));
      lines.push('');
    }

    // Revenue
    if (revenue) {
      lines.push('=== Revenue ===');
      lines.push(`MRR,$${revenue.mrr.toLocaleString('es-CL')}`);
      lines.push(`ARPU,$${revenue.arpu.toLocaleString('es-CL')}`);
      lines.push(`Suscripciones activas,${revenue.activeCount}`);
      lines.push('');
    }

    // Edge functions
    if (edgeFnCalls?.length) {
      lines.push('=== Edge Functions ===');
      lines.push('Funcion,Calls,Avg ms,Errors');
      edgeFnCalls.forEach((fn) => lines.push(`${fn.name},${fn.calls},${fn.avgMs},${fn.errors}`));
      lines.push('');
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paw-friend-analytics-${format(now, 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const DeviceIcon = ({ device }: { device: string }) => {
    if (device === 'mobile') return <Smartphone className="h-4 w-4" />;
    if (device === 'tablet') return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const formatDwell = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  // formatCLP imported from @/lib/format

  const retentionColor = (pct: number) => {
    if (pct < 0) return 'bg-slate-800 text-slate-600';
    if (pct === 0) return 'bg-slate-800/50 text-slate-500';
    if (pct < 10) return 'bg-indigo-950 text-indigo-300';
    if (pct < 25) return 'bg-indigo-900 text-indigo-200';
    if (pct < 50) return 'bg-indigo-800 text-indigo-100';
    if (pct < 75) return 'bg-indigo-700 text-white';
    return 'bg-indigo-600 text-white font-semibold';
  };

  return (
    <div className="space-y-6">
      {/* ── Header: Date Range + Export ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-400" />
          <span className="text-sm font-medium text-slate-300">Rango:</span>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <Button
                key={opt.key}
                size="sm"
                variant={rangeKey === opt.key ? 'default' : 'outline'}
                className={cn(
                  'h-7 px-3 text-xs',
                  rangeKey === opt.key
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
                    : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 bg-transparent'
                )}
                onClick={() => setRangeKey(opt.key)}
              >
                {opt.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant={rangeKey === 'custom' ? 'default' : 'outline'}
              className={cn(
                'h-7 px-3 text-xs',
                rangeKey === 'custom'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
                  : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 bg-transparent'
              )}
              onClick={() => setRangeKey('custom')}
            >
              Custom
            </Button>
          </div>
          {rangeKey === 'custom' && (
            <input
              type="number"
              min={1}
              max={365}
              value={customDays}
              onChange={(e) => setCustomDays(Math.max(1, Math.min(365, Number(e.target.value))))}
              className="w-16 h-7 px-2 text-xs rounded border border-slate-700 bg-slate-900 text-white"
            />
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 bg-transparent"
          onClick={handleExportCSV}
        >
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </Button>
      </div>

      {/* ── Traffic KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-medium text-slate-300">Vistas hoy</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1 text-white">
              {l1 ? '...' : (trafficKpis?.pageViewsToday ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">Vistas ({rangeDays}d)</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1 text-white">
              {trafficKpis?.pageViewsRange ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-slate-300">Sesiones ({rangeDays}d)</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1 text-white">
              {trafficKpis?.sessionsRange ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-slate-300">
                Usuarios unicos ({rangeDays}d)
              </span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1 text-white">
              {trafficKpis?.uniqueUsersRange ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Engagement KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-medium text-slate-300">DAU</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1 text-white">
              {engagementKpis?.dau ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Usuarios activos hoy</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-slate-300">MAU</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1 text-white">
              {engagementKpis?.mau ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Usuarios activos (30d)</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">DAU/MAU</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1 text-white">
              {engagementKpis?.dauMauRatio ?? 0}%
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Stickiness</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-slate-300">Bounce Rate</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1 text-white">
              {engagementKpis?.bounceRate ?? 0}%
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Sesiones de 1 pagina (30d)</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-white">
              Trafico diario ({rangeDays} dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={viewsByDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#a5b4fc' }}
                />
                <Area
                  type="monotone"
                  dataKey="vistas"
                  stroke="#6366f1"
                  fill="#6366f140"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-white">Dispositivos</CardTitle>
          </CardHeader>
          <CardContent>
            {(deviceData ?? []).length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Sin datos</p>
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
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 8,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {(deviceData ?? []).map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-300">
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

      {/* ── Extended Conversion Funnel ── */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base text-white">Embudo de conversion</CardTitle>
          <CardDescription className="text-slate-400">
            Registro &rarr; Mascota &rarr; Ficha &rarr; PDF &rarr; Reserva &rarr; Premium
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!funnel ? (
            <Skeleton className="h-24 w-full bg-slate-800" />
          ) : (
            <div className="space-y-3">
              {funnel.map((step, i) => {
                const maxCount = funnel[0]?.count || 1;
                const barWidth = Math.max((step.count / maxCount) * 100, 4);
                const dropPct =
                  i > 0 && funnel[i - 1].count > 0
                    ? Math.round(((funnel[i - 1].count - step.count) / funnel[i - 1].count) * 100)
                    : 0;

                return (
                  <div key={step.step}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-300 w-28 shrink-0 text-right">
                        {step.step}
                      </span>
                      <div className="flex-1 relative">
                        <div
                          className="h-8 rounded-md flex items-center px-3 transition-all"
                          style={{
                            width: `${barWidth}%`,
                            background: `linear-gradient(90deg, ${FUNNEL_COLORS[i % FUNNEL_COLORS.length]}, ${FUNNEL_COLORS[(i + 1) % FUNNEL_COLORS.length]})`,
                          }}
                        >
                          <span className="text-xs font-bold text-white font-mono">
                            {step.count.toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-400 w-12 text-right">
                        {step.pct}%
                      </span>
                      {i > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-red-800 text-red-400 w-14 justify-center"
                        >
                          -{dropPct}%
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Revenue Analytics ── */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base text-white flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            Revenue Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* MRR / ARPU KPIs */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider">MRR</p>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {revenue ? formatCLP(revenue.mrr) : '...'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider">ARPU</p>
                <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                  {revenue ? formatCLP(revenue.arpu) : '...'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider">
                  Suscripciones activas
                </p>
                <p className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                  {revenue?.activeCount ?? '...'}
                </p>
              </div>
            </div>

            {/* MRR Trend Chart */}
            <div className="lg:col-span-2">
              <p className="text-xs text-slate-400 mb-3">Tendencia MRR (6 meses)</p>
              {revenue?.trend && revenue.trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={revenue.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 8,
                      }}
                      labelStyle={{ color: '#e2e8f0' }}
                      formatter={(value: number) => [formatCLP(value), 'MRR']}
                    />
                    <Line
                      type="monotone"
                      dataKey="mrr"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-sm text-slate-500">
                  Sin datos de suscripciones
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Cohort Retention Table ── */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base text-white">Retencion por cohorte</CardTitle>
          <CardDescription className="text-slate-400">
            % de usuarios activos por mes relativo a su registro (basado en updated_at)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!cohortData ? (
            <Skeleton className="h-40 w-full bg-slate-800" />
          ) : cohortData.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Sin datos de cohortes</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-slate-400 pb-2 pr-4">
                      Cohorte
                    </th>
                    <th className="text-center text-xs font-medium text-slate-400 pb-2 w-12">N</th>
                    {[0, 1, 2, 3, 4, 5].map((m) => (
                      <th
                        key={m}
                        className="text-center text-xs font-medium text-slate-400 pb-2 w-16"
                      >
                        M{m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohortData.map((row) => (
                    <tr key={row.cohortMonth}>
                      <td className="py-1 pr-4 text-xs font-medium text-slate-300 capitalize">
                        {row.label}
                      </td>
                      <td className="py-1 text-center text-xs font-mono text-slate-400">
                        {row.totalUsers}
                      </td>
                      {row.retention.map((pct, m) => (
                        <td key={m} className="py-1 px-1">
                          <div
                            className={cn(
                              'text-center text-xs font-mono rounded py-1.5',
                              retentionColor(pct)
                            )}
                          >
                            {pct < 0 ? '-' : `${pct}%`}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Tables row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Eye className="h-4 w-4" />
              Paginas mas visitadas ({rangeDays}d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!topPages ? (
              <Skeleton className="h-40 w-full bg-slate-800" />
            ) : topPages.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {topPages.map((p, i) => (
                  <div key={p.page} className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-slate-500 w-5 text-right">{i + 1}</span>
                    <span className="flex-1 font-mono text-xs truncate text-slate-300">
                      {p.page}
                    </span>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs border-slate-700 text-slate-300"
                    >
                      {p.views}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Clock className="h-4 w-4" />
              Tiempo promedio por pagina ({rangeDays}d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!dwellByPage ? (
              <Skeleton className="h-40 w-full bg-slate-800" />
            ) : dwellByPage.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {dwellByPage.map((p) => (
                  <div key={p.page} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 font-mono text-xs truncate text-slate-300">
                      {p.page}
                    </span>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs border-slate-700 text-slate-300"
                    >
                      {formatDwell(p.avgSeconds)}
                    </Badge>
                    <span className="text-xs text-slate-500 w-12 text-right">{p.visits} vis</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Feature usage + Edge functions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <MousePointer className="h-4 w-4" />
              Uso de features ({rangeDays}d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!featureUsage || featureUsage.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                Sin datos. Los features se trackean con trackEvent().
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={featureUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis
                    dataKey="feature"
                    type="category"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Zap className="h-4 w-4" />
              Edge Functions ({rangeDays}d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!edgeFnCalls || edgeFnCalls.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                Sin invocaciones registradas
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-left">
                      <th className="pb-2 text-xs font-medium text-slate-400">Funcion</th>
                      <th className="pb-2 text-xs font-medium text-slate-400 text-right">Calls</th>
                      <th className="pb-2 text-xs font-medium text-slate-400 text-right">Avg ms</th>
                      <th className="pb-2 text-xs font-medium text-slate-400 text-right">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edgeFnCalls.map((fn) => (
                      <tr key={fn.name} className="border-b border-slate-800 last:border-0">
                        <td className="py-1.5 font-mono text-xs text-slate-300">{fn.name}</td>
                        <td className="py-1.5 text-right font-mono text-xs text-slate-300">
                          {fn.calls}
                        </td>
                        <td className="py-1.5 text-right font-mono text-xs text-slate-300">
                          {fn.avgMs}ms
                        </td>
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
