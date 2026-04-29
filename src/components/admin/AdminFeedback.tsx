import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useAdminFeedback,
  useUpdateFeedbackStatus,
  useRespondFeedback,
  useToggleFeedbackLike,
  useAwardFeedbackPoints,
  useClassifyFeedback,
  useClassifyFeedbackBatch,
  useAdminDonations,
} from '@/hooks/useFeedback';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  ThumbsUp,
  Gift,
  Loader2,
  CheckCircle,
  Bug,
  Lightbulb,
  Heart,
  Send,
  Star,
  Search,
  TrendingUp,
  Sparkles,
  Zap,
  DollarSign,
  BarChart3,
  Mail,
  HelpCircle,
  Ban,
} from '@/lib/icons';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfWeek, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { FeedbackItem } from '@/hooks/useFeedback';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'new', label: 'Nuevos' },
  { value: 'reviewed', label: 'Revisados' },
  { value: 'resolved', label: 'Resueltos' },
  { value: 'dismissed', label: 'Descartados' },
];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-300',
  reviewed: 'bg-purple-500/20 text-purple-300',
  resolved: 'bg-green-500/20 text-green-300',
  dismissed: 'bg-slate-700/50 text-slate-400',
};

const TYPE_CONFIG = {
  bug: { icon: Bug, color: 'text-red-500', label: 'Bug' },
  idea: { icon: Lightbulb, color: 'text-amber-500', label: 'Idea' },
  experience: { icon: Heart, color: 'text-pink-500', label: 'Experiencia' },
};

const POINT_PRESETS = [
  { points: 5, label: '5 pts', description: 'Feedback basico' },
  { points: 15, label: '15 pts', description: 'Feedback util' },
  { points: 30, label: '30 pts', description: 'Feedback excelente' },
  { points: 50, label: '50 pts', description: 'Feedback excepcional' },
];

const WOULD_PAY_META: Record<
  'yes' | 'maybe' | 'no',
  { label: string; icon: LucideIcon; iconColor: string; color: string; bar: string }
> = {
  yes: {
    label: 'Sí pagaría',
    icon: Heart,
    iconColor: 'text-emerald-400 fill-emerald-400',
    color: 'text-emerald-300 border-emerald-500/40',
    bar: 'bg-emerald-400',
  },
  maybe: {
    label: 'Tal vez',
    icon: HelpCircle,
    iconColor: 'text-amber-400',
    color: 'text-amber-300 border-amber-500/40',
    bar: 'bg-amber-400',
  },
  no: {
    label: 'No pagaría',
    icon: Ban,
    iconColor: 'text-rose-400',
    color: 'text-rose-300 border-rose-500/40',
    bar: 'bg-rose-400',
  },
};

/** Build weekly average rating data for the last 8 weeks from all feedback */
function buildWeeklyRatingData(items: FeedbackItem[]) {
  const now = new Date();
  const weeks: { weekStart: Date; label: string }[] = [];
  for (let i = 7; i >= 0; i--) {
    const ws = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    weeks.push({ weekStart: ws, label: format(ws, 'd MMM', { locale: es }) });
  }

  return weeks.map(({ weekStart, label }) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const inWeek = items.filter((f) => {
      if (f.app_rating == null) return false;
      const d = new Date(f.created_at);
      return d >= weekStart && d < weekEnd;
    });
    const avg =
      inWeek.length > 0
        ? Number((inWeek.reduce((s, f) => s + (f.app_rating ?? 0), 0) / inWeek.length).toFixed(2))
        : null;
    return { name: label, rating: avg, count: inWeek.length };
  });
}

const VALID_TABS = ['buzon', 'recepcion', 'donaciones'] as const;
type FeedbackTab = (typeof VALID_TABS)[number];

export default function AdminFeedback() {
  // Deeplink via ?tab=donaciones (usado por KPI cards de Dashboard y Finance)
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: FeedbackTab = (VALID_TABS as readonly string[]).includes(rawTab ?? '')
    ? (rawTab as FeedbackTab)
    : 'buzon';
  const [statusFilter, setStatusFilter] = useState('new');
  const [searchText, setSearchText] = useState('');
  const { data: feedback = [], isLoading } = useAdminFeedback(statusFilter);

  // For the chart, fetch ALL feedback (ignore status filter)
  const { data: allFeedback = [] } = useAdminFeedback('all');

  const updateStatus = useUpdateFeedbackStatus();
  const respondFeedback = useRespondFeedback();
  const toggleLike = useToggleFeedbackLike();
  const awardPoints = useAwardFeedbackPoints();
  const classifyFeedback = useClassifyFeedback();
  const classifyBatch = useClassifyFeedbackBatch();

  // Dialog state
  const [respondingTo, setRespondingTo] = useState<FeedbackItem | null>(null);
  const [responseText, setResponseText] = useState('');
  const [awardingTo, setAwardingTo] = useState<FeedbackItem | null>(null);
  const [customPoints, setCustomPoints] = useState('');

  const handleRespond = () => {
    if (!respondingTo || !responseText.trim()) return;
    respondFeedback.mutate(
      { id: respondingTo.id, response: responseText.trim() },
      {
        onSuccess: () => {
          setRespondingTo(null);
          setResponseText('');
        },
      }
    );
  };

  const handleAwardPoints = (points: number) => {
    if (!awardingTo) return;
    awardPoints.mutate(
      { feedbackId: awardingTo.id, userId: awardingTo.user_id, points },
      { onSuccess: () => setAwardingTo(null) }
    );
  };

  // Search filter
  const filteredFeedback = useMemo(() => {
    if (!searchText.trim()) return feedback;
    const q = searchText.toLowerCase();
    return feedback.filter(
      (f) =>
        f.description.toLowerCase().includes(q) ||
        (f.user_display_name && f.user_display_name.toLowerCase().includes(q))
    );
  }, [feedback, searchText]);

  const weeklyData = useMemo(() => buildWeeklyRatingData(allFeedback), [allFeedback]);

  const rated = feedback.filter((f) => f.app_rating != null);
  const avgRating =
    rated.length > 0
      ? (rated.reduce((sum, f) => sum + (f.app_rating ?? 0), 0) / rated.length).toFixed(1)
      : null;

  const counts = {
    total: feedback.length,
    liked: feedback.filter((f) => f.admin_liked).length,
    rewarded: feedback.filter((f) => f.paw_points_awarded > 0).length,
    rated: rated.length,
    avgRating,
  };

  // ── Reception analytics (sobre TODO el feedback, no sólo el filtro actual) ──
  const receptionStats = useMemo(() => {
    const ratedAll = allFeedback.filter((f) => f.app_rating != null);
    const avg =
      ratedAll.length > 0
        ? ratedAll.reduce((s, f) => s + (f.app_rating ?? 0), 0) / ratedAll.length
        : 0;

    const distribution = [1, 2, 3, 4, 5].map((n) => {
      const count = ratedAll.filter((f) => f.app_rating === n).length;
      const pct = ratedAll.length > 0 ? Math.round((count / ratedAll.length) * 100) : 0;
      return { stars: n, count, pct };
    });

    const wpAll = allFeedback.filter((f) => f.would_pay != null);
    const wpCounts = {
      yes: wpAll.filter((f) => f.would_pay === 'yes').length,
      maybe: wpAll.filter((f) => f.would_pay === 'maybe').length,
      no: wpAll.filter((f) => f.would_pay === 'no').length,
    };
    const wpBreakdown = (['yes', 'maybe', 'no'] as const).map((k) => ({
      key: k,
      count: wpCounts[k],
      pct: wpAll.length > 0 ? Math.round((wpCounts[k] / wpAll.length) * 100) : 0,
    }));

    // Conversion proxy: % de ratings 4-5 + % de "yes" en voluntad de pago
    const promoters = ratedAll.filter((f) => (f.app_rating ?? 0) >= 4).length;
    const promoterPct = ratedAll.length > 0 ? Math.round((promoters / ratedAll.length) * 100) : 0;

    return {
      total: allFeedback.length,
      ratedCount: ratedAll.length,
      avg: Number(avg.toFixed(2)),
      distribution,
      wpTotal: wpAll.length,
      wpBreakdown,
      promoterPct,
    };
  }, [allFeedback]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-100">
            <MessageSquare className="h-5 w-5" /> Feedback de usuarios
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-indigo-500/30 text-indigo-400 hover:bg-indigo-950/30"
            onClick={() => classifyBatch.mutate()}
            disabled={classifyBatch.isPending}
          >
            {classifyBatch.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Zap className="h-3 w-3 mr-1" />
            )}
            Clasificar todo con IA
          </Button>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{counts.total} total</span>
          <span>{counts.liked} destacados</span>
          <span>{counts.rewarded} recompensados</span>
          {counts.avgRating && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              {counts.avgRating} ({counts.rated})
            </span>
          )}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })}
        className="w-full"
      >
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger
            value="buzon"
            className="data-[state=active]:bg-indigo-600/20 data-[state=active]:text-indigo-200"
          >
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Buzon ({counts.total})
          </TabsTrigger>
          <TabsTrigger
            value="recepcion"
            className="data-[state=active]:bg-indigo-600/20 data-[state=active]:text-indigo-200"
          >
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Recepcion
            {receptionStats.ratedCount > 0 && (
              <span className="ml-1 text-xs text-slate-400">({receptionStats.ratedCount})</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="donaciones"
            className="data-[state=active]:bg-pink-600/20 data-[state=active]:text-pink-200"
          >
            <Heart className="h-4 w-4 mr-1.5" />
            Donaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="donaciones" className="space-y-4 mt-4">
          <DonationsPanel />
        </TabsContent>

        {/* ───────────────── Recepcion ───────────────── */}
        <TabsContent value="recepcion" className="space-y-4 mt-4">
          {receptionStats.ratedCount === 0 && receptionStats.wpTotal === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="py-10 text-center">
                <Star className="h-12 w-12 mx-auto mb-3 text-slate-700" />
                <p className="font-medium text-slate-300">Sin evaluaciones aun</p>
                <p className="text-xs text-slate-500 mt-1">
                  Los usuarios veran el paso de estrellas + voluntad de pago al enviar feedback.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Rating distribution */}
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Rating promedio
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-bold text-slate-100">
                          {receptionStats.avg > 0 ? receptionStats.avg.toFixed(2) : '—'}
                        </span>
                        <span className="text-xs text-slate-500">
                          sobre 5 · {receptionStats.ratedCount} evaluaciones
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              'h-4 w-4',
                              s <= Math.round(receptionStats.avg)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-700'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-indigo-500/40 text-indigo-300 text-xs"
                    >
                      {receptionStats.promoterPct}% promotores
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    {[...receptionStats.distribution].reverse().map((d) => (
                      <div key={d.stars} className="flex items-center gap-2 text-xs">
                        <span className="w-10 text-slate-400 flex items-center gap-0.5">
                          {d.stars}
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        </span>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                            style={{ width: `${d.pct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-slate-400">
                          {d.count} · {d.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Would pay breakdown */}
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Voluntad de pago
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl font-bold text-slate-100">
                        {receptionStats.wpTotal > 0 ? `${receptionStats.wpBreakdown[0].pct}%` : '—'}
                      </span>
                      <span className="text-xs text-slate-500">
                        dirian que si · {receptionStats.wpTotal} respuestas
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {receptionStats.wpBreakdown.map((item) => {
                      const meta = WOULD_PAY_META[item.key];
                      const MetaIcon = meta.icon;
                      return (
                        <div key={item.key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 flex items-center gap-1.5">
                              <MetaIcon className={cn('h-3.5 w-3.5', meta.iconColor)} aria-hidden />
                              {meta.label}
                            </span>
                            <span className="text-slate-400">
                              {item.count} · {item.pct}%
                            </span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all', meta.bar)}
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {receptionStats.wpTotal === 0 && (
                    <p className="text-[11px] text-slate-500 text-center italic">
                      Aun nadie ha respondido la pregunta.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reuse existing weekly chart if any rating */}
          {weeklyData.some((d) => d.rating != null) && (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">
                    Rating promedio semanal (ultimas 8 semanas)
                  </span>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: 8,
                          color: '#e2e8f0',
                          fontSize: 12,
                        }}
                        formatter={(value, _name, props) => {
                          const count = (props as { payload?: { count?: number } })?.payload?.count;
                          return [`${value} (${count ?? 0} ratings)`, 'Promedio'];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rating"
                        stroke="#818cf8"
                        strokeWidth={2}
                        dot={{ fill: '#818cf8', r: 4 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ───────────────── Buzon ───────────────── */}
        <TabsContent value="buzon" className="space-y-4 mt-4">
          {/* NPS / Rating Trend Chart */}
          {weeklyData.some((d) => d.rating != null) && (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">
                    Rating promedio semanal (ultimas 8 semanas)
                  </span>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: 8,
                          color: '#e2e8f0',
                          fontSize: 12,
                        }}
                        formatter={(value, _name, props) => {
                          const count = (props as { payload?: { count?: number } })?.payload?.count;
                          return [`${value} (${count ?? 0} ratings)`, 'Promedio'];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rating"
                        stroke="#818cf8"
                        strokeWidth={2}
                        dot={{ fill: '#818cf8', r: 4 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters + Search */}
          <div className="flex gap-2 flex-wrap items-center">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  statusFilter === opt.value
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800/80 border-transparent'
                )}
              >
                {opt.label}
              </button>
            ))}
            <div className="relative ml-auto min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar en feedback..."
                className="h-8 pl-8 text-xs bg-slate-900 border-slate-800 text-slate-300 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
            </div>
          ) : filteredFeedback.length === 0 ? (
            <Card className="border-dashed bg-slate-900 border-slate-800">
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
                <p className="font-medium text-slate-300">
                  {searchText
                    ? 'Sin resultados para tu busqueda'
                    : 'Sin feedback en esta categoria'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredFeedback.map((fb) => {
                const typeConf = TYPE_CONFIG[fb.type] || TYPE_CONFIG.experience;
                const TypeIcon = typeConf.icon;
                return (
                  <Card
                    key={fb.id}
                    className={cn(
                      'bg-slate-900 border-slate-800',
                      fb.admin_liked && 'ring-1 ring-amber-400/40'
                    )}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <TypeIcon className={cn('h-4 w-4 shrink-0', typeConf.color)} />
                          <Badge
                            variant="outline"
                            className="text-xs capitalize border-slate-700 text-slate-300"
                          >
                            {typeConf.label}
                          </Badge>
                          <Badge className={cn('text-xs', STATUS_COLORS[fb.status] || '')}>
                            {fb.status}
                          </Badge>
                          {fb.admin_liked && (
                            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          )}
                          {fb.paw_points_awarded > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs text-amber-400 border-amber-500/40"
                            >
                              +{fb.paw_points_awarded} pts
                            </Badge>
                          )}
                          {fb.app_rating != null && (
                            <span className="flex items-center gap-0.5 ml-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={cn(
                                    'h-3 w-3',
                                    s <= fb.app_rating!
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-600'
                                  )}
                                />
                              ))}
                            </span>
                          )}
                          {fb.would_pay &&
                            (() => {
                              const wpMeta = WOULD_PAY_META[fb.would_pay];
                              const WPIcon = wpMeta.icon;
                              return (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[10px] ml-1 inline-flex items-center gap-1',
                                    wpMeta.color
                                  )}
                                >
                                  <WPIcon
                                    className={cn('h-2.5 w-2.5', wpMeta.iconColor)}
                                    aria-hidden
                                  />
                                  {wpMeta.label}
                                </Badge>
                              );
                            })()}
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {format(new Date(fb.created_at), 'd MMM yyyy HH:mm', { locale: es })}
                        </span>
                      </div>

                      {/* User info */}
                      <div className="text-xs text-slate-400">
                        <span className="font-medium text-slate-300">
                          {fb.user_display_name || 'Usuario'}
                        </span>
                        {fb.role && <span className="ml-2">({fb.role})</span>}
                        {fb.route && (
                          <span className="ml-2 font-mono text-[10px] bg-slate-800 text-slate-400 px-1 rounded">
                            {fb.route}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-200">{fb.description}</p>

                      {/* AI Classification */}
                      {fb.ai_category ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Sparkles className="h-3 w-3 text-indigo-400" />
                          <Badge
                            variant="outline"
                            className="text-[10px] border-indigo-500/40 text-indigo-300"
                          >
                            {fb.ai_category}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px]',
                              fb.ai_sentiment === 'positive'
                                ? 'border-green-500/40 text-green-300'
                                : fb.ai_sentiment === 'negative'
                                  ? 'border-red-500/40 text-red-300'
                                  : 'border-slate-600 text-slate-400'
                            )}
                          >
                            {fb.ai_sentiment}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px]',
                              fb.ai_urgency === 'critical'
                                ? 'border-red-500/40 text-red-300'
                                : fb.ai_urgency === 'high'
                                  ? 'border-orange-500/40 text-orange-300'
                                  : fb.ai_urgency === 'medium'
                                    ? 'border-amber-500/40 text-amber-300'
                                    : 'border-slate-600 text-slate-400'
                            )}
                          >
                            {fb.ai_urgency}
                          </Badge>
                          {fb.ai_summary && (
                            <span className="text-[10px] text-slate-500 italic ml-1">
                              {fb.ai_summary}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-indigo-400 hover:text-indigo-300 px-2"
                          onClick={() => classifyFeedback.mutate({ id: fb.id })}
                          disabled={classifyFeedback.isPending}
                        >
                          {classifyFeedback.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Sparkles className="h-3 w-3 mr-1" />
                          )}
                          Clasificar con IA
                        </Button>
                      )}

                      {/* AI suggested response */}
                      {fb.ai_suggested_response && !fb.admin_response && (
                        <div className="bg-indigo-950/20 rounded-md p-2 border border-indigo-900/30">
                          <p className="text-[10px] font-medium text-indigo-400 mb-0.5">
                            Respuesta sugerida por IA:
                          </p>
                          <p className="text-xs text-slate-400">{fb.ai_suggested_response}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] text-indigo-400 mt-1 px-2"
                            onClick={() => {
                              setRespondingTo(fb);
                              setResponseText(fb.ai_suggested_response || '');
                            }}
                          >
                            Usar como base
                          </Button>
                        </div>
                      )}

                      {/* Admin response */}
                      {fb.admin_response && (
                        <div className="bg-indigo-950/30 rounded-md p-2.5 border border-indigo-900/50">
                          <p className="text-xs font-medium text-indigo-400 mb-1">Tu respuesta:</p>
                          <p className="text-sm text-slate-300">{fb.admin_response}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {/* Like */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'h-8 text-slate-400 hover:text-slate-200',
                            fb.admin_liked && 'text-amber-400'
                          )}
                          onClick={() => toggleLike.mutate({ id: fb.id, liked: !fb.admin_liked })}
                        >
                          <ThumbsUp
                            className={cn('h-3.5 w-3.5 mr-1', fb.admin_liked && 'fill-current')}
                          />
                          {fb.admin_liked ? 'Destacado' : 'Destacar'}
                        </Button>

                        {/* Respond */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-slate-400 hover:text-slate-200"
                          onClick={() => {
                            setRespondingTo(fb);
                            setResponseText(fb.admin_response || '');
                          }}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          {fb.admin_response ? 'Editar respuesta' : 'Responder'}
                        </Button>

                        {/* Award points */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-amber-500 hover:text-amber-400"
                          onClick={() => {
                            setAwardingTo(fb);
                            setCustomPoints('');
                          }}
                        >
                          <Gift className="h-3.5 w-3.5 mr-1" />
                          Regalar puntos
                        </Button>

                        {/* Status change */}
                        <div className="ml-auto">
                          <Select
                            value={fb.status}
                            onValueChange={(val) => updateStatus.mutate({ id: fb.id, status: val })}
                          >
                            <SelectTrigger className="h-8 w-[130px] text-xs bg-slate-900 border-slate-700 text-slate-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700">
                              <SelectItem value="new">Nuevo</SelectItem>
                              <SelectItem value="reviewed">Revisado</SelectItem>
                              <SelectItem value="resolved">Resuelto</SelectItem>
                              <SelectItem value="dismissed">Descartado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Respond dialog */}
      <Dialog open={!!respondingTo} onOpenChange={(v) => !v && setRespondingTo(null)}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Responder feedback</DialogTitle>
            <DialogDescription className="text-slate-400">
              {respondingTo?.user_display_name} — {respondingTo?.type}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-md p-3 text-sm max-h-32 overflow-y-auto text-slate-300">
              {respondingTo?.description}
            </div>
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Escribe tu respuesta al usuario..."
              rows={3}
              className="resize-none bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
            />
            <Button
              onClick={handleRespond}
              disabled={!responseText.trim() || respondFeedback.isPending}
              className="w-full"
            >
              {respondFeedback.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar respuesta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Award points dialog */}
      <Dialog open={!!awardingTo} onOpenChange={(v) => !v && setAwardingTo(null)}>
        <DialogContent className="sm:max-w-sm bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-100">
              <Gift className="h-5 w-5 text-amber-500" />
              Regalar Paw Points
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              A {awardingTo?.user_display_name}
              {awardingTo?.paw_points_awarded
                ? ` (ya tiene +${awardingTo.paw_points_awarded} pts por este feedback)`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Presets */}
            <div className="grid grid-cols-2 gap-2">
              {POINT_PRESETS.map((preset) => (
                <button
                  key={preset.points}
                  onClick={() => handleAwardPoints(preset.points)}
                  disabled={awardPoints.isPending}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-lg border-2 border-slate-700 transition-all',
                    'hover:border-amber-400 hover:bg-amber-950/20'
                  )}
                >
                  <span className="text-lg font-bold text-amber-500">{preset.label}</span>
                  <span className="text-xs text-slate-400">{preset.description}</span>
                </button>
              ))}
            </div>

            {/* Custom */}
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="500"
                value={customPoints}
                onChange={(e) => setCustomPoints(e.target.value)}
                placeholder="Puntos custom"
                aria-label="Puntos custom"
                className="flex-1 h-9 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 placeholder:text-slate-500"
              />
              <Button
                size="sm"
                disabled={!customPoints || Number(customPoints) < 1 || awardPoints.isPending}
                onClick={() => handleAwardPoints(Number(customPoints))}
              >
                {awardPoints.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Otorgar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Donations panel (read-only monitoring) ──────────────────────────
function DonationsPanel() {
  const { data: donations = [], isLoading } = useAdminDonations();

  const stats = useMemo(() => {
    const paid = donations.filter((d) => d.status === 'paid');
    const pending = donations.filter((d) => d.status === 'pending');
    const failed = donations.filter((d) => d.status === 'failed' || d.status === 'cancelled');
    const total = paid.reduce((s, d) => s + (d.amount_clp ?? 0), 0);
    const avg = paid.length > 0 ? Math.round(total / paid.length) : 0;
    const lastPaid = paid[0]?.paid_at ?? null;

    // Breakdown por source
    const bySource: Record<string, { count: number; total: number }> = {};
    for (const d of paid) {
      const k = d.source ?? 'desconocido';
      if (!bySource[k]) bySource[k] = { count: 0, total: 0 };
      bySource[k].count++;
      bySource[k].total += d.amount_clp ?? 0;
    }

    return {
      total,
      avg,
      paidCount: paid.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      lastPaid,
      bySource,
      thanksSent: paid.filter((d) => d.thanked_at).length,
      thanksPending: paid.filter((d) => !d.thanked_at).length,
    };
  }, [donations]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid md:grid-cols-4 gap-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total recaudado</p>
            <p className="text-2xl font-bold text-emerald-300 mt-1">
              ${stats.total.toLocaleString('es-CL')}
            </p>
            <p className="text-[11px] text-slate-500">{stats.paidCount} donaciones pagadas</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Ticket promedio</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">
              ${stats.avg.toLocaleString('es-CL')}
            </p>
            <p className="text-[11px] text-slate-500">
              {stats.lastPaid
                ? `Ultima: ${format(new Date(stats.lastPaid), 'd MMM HH:mm', { locale: es })}`
                : 'Sin pagos aun'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pendientes / fallidas</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">
              {stats.pendingCount}
              <span className="text-slate-500 text-base"> / {stats.failedCount}</span>
            </p>
            <p className="text-[11px] text-slate-500">Pending / failed+cancelled</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1">
              <Mail className="h-3 w-3" /> Mails agradecimiento
            </p>
            <p className="text-2xl font-bold text-slate-100 mt-1">
              {stats.thanksSent}
              <span className="text-slate-500 text-base"> / {stats.paidCount}</span>
            </p>
            <p className="text-[11px] text-slate-500">
              {stats.thanksPending > 0 ? `${stats.thanksPending} sin enviar` : 'Todo al dia'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown por source */}
      {Object.keys(stats.bySource).length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-200 mb-2">Donaciones por origen</p>
            <div className="space-y-1.5">
              {Object.entries(stats.bySource).map(([src, v]) => (
                <div key={src} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-mono">{src}</span>
                  <span className="text-slate-400">
                    {v.count} · ${v.total.toLocaleString('es-CL')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      {donations.length === 0 ? (
        <Card className="border-dashed bg-slate-900 border-slate-800">
          <CardContent className="py-10 text-center space-y-2">
            <Heart className="h-10 w-10 mx-auto text-slate-700" />
            <p className="font-medium text-slate-300">Aun sin donaciones</p>
            <p className="text-xs text-slate-500">
              Los usuarios llegan via widget de feedback y pagina /donaciones.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {donations.map((d) => {
            const statusColor =
              d.status === 'paid'
                ? 'bg-emerald-500/20 text-emerald-300'
                : d.status === 'pending'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-rose-500/20 text-rose-300';
            return (
              <Card key={d.id} className="bg-slate-900 border-slate-800">
                <CardContent className="p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <Heart
                        className={cn(
                          'h-4 w-4 shrink-0',
                          d.status === 'paid'
                            ? 'text-emerald-400 fill-emerald-400'
                            : 'text-slate-500'
                        )}
                      />
                      <span className="font-semibold text-slate-100">
                        ${d.amount_clp.toLocaleString('es-CL')}
                      </span>
                      <Badge className={cn('text-[10px]', statusColor)}>{d.status}</Badge>
                      {d.is_public && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-pink-500/40 text-pink-300"
                        >
                          Publico OK
                        </Badge>
                      )}
                      {d.status === 'paid' && !d.thanked_at && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-amber-500/40 text-amber-300"
                        >
                          Mail pendiente
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">
                      {format(new Date(d.created_at), 'd MMM yyyy HH:mm', { locale: es })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                    <span className="text-slate-300 font-medium">{d.donor_name ?? 'Anonimo'}</span>
                    {d.source && (
                      <span className="font-mono text-[10px] bg-slate-800 px-1 rounded">
                        {d.source}
                      </span>
                    )}
                    {d.commerce_order && (
                      <span className="font-mono text-[10px] text-slate-500">
                        {d.commerce_order}
                      </span>
                    )}
                  </div>
                  {d.message && (
                    <p className="text-xs text-slate-300 italic border-l-2 border-pink-500/40 pl-2">
                      "{d.message}"
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
