import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubmitFeedback, useMyFeedback } from '@/hooks/useFeedback';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  MessageSquarePlus,
  Bug,
  Lightbulb,
  Heart,
  Send,
  Loader2,
  CheckCircle,
  MessageCircle,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const FEEDBACK_TYPES = [
  {
    value: 'bug' as const,
    label: 'Bug',
    icon: Bug,
    color: 'text-red-500',
    bg: 'bg-red-50 border-red-200 hover:bg-red-100',
  },
  {
    value: 'idea' as const,
    label: 'Idea',
    icon: Lightbulb,
    color: 'text-amber-500',
    bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
  },
  {
    value: 'experience' as const,
    label: 'Experiencia',
    icon: Heart,
    color: 'text-pink-500',
    bg: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
  reviewed: { label: 'Revisado', color: 'bg-purple-100 text-purple-700' },
  resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-700' },
  dismissed: { label: 'Descartado', color: 'bg-slate-100 text-slate-600' },
};

export function FeedbackWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [type, setType] = useState<'bug' | 'idea' | 'experience' | null>(null);
  const [description, setDescription] = useState('');

  const submitFeedback = useSubmitFeedback();
  const { data: myFeedback = [] } = useMyFeedback();

  if (!user) return null;

  const handleSubmit = () => {
    if (!type || !description.trim()) return;
    submitFeedback.mutate(
      { type, description: description.trim(), route: location.pathname },
      {
        onSuccess: () => {
          setDescription('');
          setType(null);
          setTab('history');
        },
      }
    );
  };

  const resetAndClose = () => {
    setOpen(false);
    setDescription('');
    setType(null);
    setTab('new');
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed z-50 bottom-20 right-4 md:bottom-6 md:right-6',
          'flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg',
          'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
          'hover:from-indigo-600 hover:to-purple-600 transition-all hover:scale-105',
          'text-sm font-medium'
        )}
        aria-label="Enviar feedback"
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : resetAndClose())}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-indigo-500" />
              Tu feedback importa
            </DialogTitle>
            <DialogDescription>
              Ayudanos a mejorar Paw Friend. Puedes ganar Paw Points por feedback de calidad.
            </DialogDescription>
          </DialogHeader>

          {/* Tabs: Nuevo / Historial */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setTab('new')}
              className={cn(
                'flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors',
                tab === 'new'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Nuevo
            </button>
            <button
              onClick={() => setTab('history')}
              className={cn(
                'flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors relative',
                tab === 'history'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mi historial
              {myFeedback.length > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">({myFeedback.length})</span>
              )}
            </button>
          </div>

          {tab === 'new' ? (
            <div className="space-y-4">
              {/* Type selector */}
              <div>
                <p className="text-sm font-medium mb-2">Tipo de feedback</p>
                <div className="grid grid-cols-3 gap-2">
                  {FEEDBACK_TYPES.map((ft) => {
                    const Icon = ft.icon;
                    const selected = type === ft.value;
                    return (
                      <button
                        key={ft.value}
                        onClick={() => setType(ft.value)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-sm',
                          selected
                            ? `${ft.bg} border-current ${ft.color} ring-2 ring-offset-1 ring-current/20`
                            : 'border-border hover:border-muted-foreground/30 text-muted-foreground'
                        )}
                      >
                        <Icon className={cn('h-5 w-5', selected ? ft.color : '')} />
                        {ft.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-medium mb-2">
                  {type === 'bug' && 'Describe el problema'}
                  {type === 'idea' && 'Cuenta tu idea'}
                  {type === 'experience' && 'Comparte tu experiencia'}
                  {!type && 'Descripcion'}
                </p>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                  placeholder={
                    type === 'bug'
                      ? 'Cuando hago X, pasa Y en vez de Z...'
                      : type === 'idea'
                        ? 'Seria genial si la app pudiera...'
                        : 'Lo que mas me gusta de Paw Friend es...'
                  }
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {description.length}/2000
                </p>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={!type || !description.trim() || submitFeedback.isPending}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                {submitFeedback.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar feedback
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {myFeedback.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aun no has enviado feedback</p>
                </div>
              ) : (
                myFeedback.map((fb) => {
                  const st = STATUS_LABELS[fb.status] || STATUS_LABELS.new;
                  const typeInfo = FEEDBACK_TYPES.find((ft) => ft.value === fb.type);
                  const TypeIcon = typeInfo?.icon || MessageCircle;
                  return (
                    <div key={fb.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <TypeIcon className={cn('h-4 w-4', typeInfo?.color)} />
                        <span className="text-xs font-medium capitalize">{fb.type}</span>
                        <Badge className={cn('text-xs', st.color)}>{st.label}</Badge>
                        {fb.paw_points_awarded > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs text-amber-600 border-amber-300"
                          >
                            +{fb.paw_points_awarded} pts
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(fb.created_at), 'd MMM', { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-3">{fb.description}</p>

                      {/* Admin response */}
                      {fb.admin_response && (
                        <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-md p-2.5 border border-indigo-100 dark:border-indigo-900">
                          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Respuesta del equipo
                          </p>
                          <p className="text-sm text-foreground/80">{fb.admin_response}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
