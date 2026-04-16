import { useState } from 'react';
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
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FeedbackItem } from '@/hooks/useFeedback';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'new', label: 'Nuevos' },
  { value: 'reviewed', label: 'Revisados' },
  { value: 'resolved', label: 'Resueltos' },
  { value: 'dismissed', label: 'Descartados' },
];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700',
  dismissed: 'bg-slate-100 text-slate-600',
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

export default function AdminFeedback() {
  const [statusFilter, setStatusFilter] = useState('new');
  const { data: feedback = [], isLoading } = useAdminFeedback(statusFilter);
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
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> Feedback de usuarios
        </h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
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

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
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
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      ) : feedback.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
            <p className="font-medium">Sin feedback en esta categoria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {feedback.map((fb) => {
            const typeConf = TYPE_CONFIG[fb.type] || TYPE_CONFIG.experience;
            const TypeIcon = typeConf.icon;
            return (
              <Card key={fb.id} className={cn(fb.admin_liked && 'ring-1 ring-amber-400/40')}>
                <CardContent className="p-4 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <TypeIcon className={cn('h-4 w-4 shrink-0', typeConf.color)} />
                      <Badge variant="outline" className="text-xs capitalize">
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
                          className="text-xs text-amber-600 border-amber-400"
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
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(fb.created_at), 'd MMM yyyy HH:mm', { locale: es })}
                    </span>
                  </div>

                  {/* User info */}
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">
                      {fb.user_display_name || 'Usuario'}
                    </span>
                    {fb.role && <span className="ml-2">({fb.role})</span>}
                    {fb.route && (
                      <span className="ml-2 font-mono text-[10px] bg-muted px-1 rounded">
                        {fb.route}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm">{fb.description}</p>

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
                      className={cn('h-8', fb.admin_liked && 'text-amber-400')}
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
                      className="h-8"
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
                      className="h-8 text-amber-500"
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
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Responder feedback</DialogTitle>
            <DialogDescription>
              {respondingTo?.user_display_name} — {respondingTo?.type}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted rounded-md p-3 text-sm max-h-32 overflow-y-auto">
              {respondingTo?.description}
            </div>
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Escribe tu respuesta al usuario..."
              rows={3}
              className="resize-none"
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
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-500" />
              Regalar Paw Points
            </DialogTitle>
            <DialogDescription>
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
                    'flex flex-col items-center p-3 rounded-lg border-2 border-border transition-all',
                    'hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                  )}
                >
                  <span className="text-lg font-bold text-amber-500">{preset.label}</span>
                  <span className="text-xs text-muted-foreground">{preset.description}</span>
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
                className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm"
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
