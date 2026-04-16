import { useState, useMemo } from 'react';
import {
  useAdminFeedback,
  useUpdateFeedbackStatus,
  useRespondFeedback,
  useToggleFeedbackLike,
  useAwardFeedbackPoints,
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
} from '@/lib/icons';
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

export default function AdminFeedback() {
  const [statusFilter, setStatusFilter] = useState('new');
  const [searchText, setSearchText] = useState('');
  const { data: feedback = [], isLoading } = useAdminFeedback(statusFilter);

  // For the chart, fetch ALL feedback (ignore status filter)
  const { data: allFeedback = [] } = useAdminFeedback('all');

  const updateStatus = useUpdateFeedbackStatus();
  const respondFeedback = useRespondFeedback();
  const toggleLike = useToggleFeedbackLike();
  const awardPoints = useAwardFeedbackPoints();

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-100">
          <MessageSquare className="h-5 w-5" /> Feedback de usuarios
        </h2>
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
                    formatter={(
                      value: number,
                      _name: string,
                      props: { payload: { count: number } }
                    ) => [`${value} (${props.payload.count} ratings)`, 'Promedio']}
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
              {searchText ? 'Sin resultados para tu busqueda' : 'Sin feedback en esta categoria'}
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
