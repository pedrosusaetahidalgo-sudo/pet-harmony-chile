import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubmitFeedback, useMyFeedback, useSubmitFeedbackRating } from '@/hooks/useFeedback';
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
  Star,
  Sparkles,
  PawPrint,
  HelpCircle,
  Ban,
  PartyPopper,
  CreditCard,
} from '@/lib/icons';
import type { LucideIcon } from 'lucide-react';
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

const WOULD_PAY_OPTIONS: {
  value: 'yes' | 'maybe' | 'no';
  icon: LucideIcon;
  iconColor: string;
  label: string;
  sub: string;
  bg: string;
  ring: string;
}[] = [
  {
    value: 'yes',
    icon: Heart,
    iconColor: 'text-emerald-600 fill-emerald-500',
    label: 'Sí, la pagaría',
    sub: 'La encuentro imprescindible',
    bg: 'from-emerald-50 to-emerald-100 border-emerald-200',
    ring: 'ring-emerald-400',
  },
  {
    value: 'maybe',
    icon: HelpCircle,
    iconColor: 'text-amber-600',
    label: 'Tal vez',
    sub: 'Depende del precio o las features',
    bg: 'from-amber-50 to-amber-100 border-amber-200',
    ring: 'ring-amber-400',
  },
  {
    value: 'no',
    icon: Ban,
    iconColor: 'text-rose-600',
    label: 'No por ahora',
    sub: 'Prefiero que siga gratis',
    bg: 'from-rose-50 to-rose-100 border-rose-200',
    ring: 'ring-rose-400',
  },
];

export function FeedbackWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'new' | 'rating' | 'donate-invite' | 'history'>('new');
  const [type, setType] = useState<'bug' | 'idea' | 'experience' | null>(null);
  const [description, setDescription] = useState('');
  const [lastFeedbackId, setLastFeedbackId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState<number | null>(null);
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  const [wouldPayValue, setWouldPayValue] = useState<'yes' | 'maybe' | 'no' | null>(null);

  const submitFeedback = useSubmitFeedback();
  const submitRating = useSubmitFeedbackRating();
  const { data: myFeedback = [] } = useMyFeedback();

  if (!user) return null;

  const handleSubmit = () => {
    if (!type || !description.trim()) return;
    submitFeedback.mutate(
      { type, description: description.trim(), route: location.pathname },
      {
        onSuccess: (id) => {
          setDescription('');
          setType(null);
          setLastFeedbackId(id);
          setRatingValue(null);
          setRatingHover(null);
          setWouldPayValue(null);
          setTab('rating');
        },
      }
    );
  };

  const handleRatingSubmit = () => {
    // 2026-04-19: pedro pide que despues de completar las 3 respuestas
    // (feedback, rating, wouldPay) SIEMPRE derivemos al popup "y si la
    // dejamos gratis" con CTA a /donaciones. Antes solo aparecia si
    // wouldPay='yes' — ahora aplica para yes/maybe/no. Respeta que si
    // saltaron sin responder nada, van directo a history.
    const respondioAlgo = ratingValue != null || wouldPayValue != null;
    const nextTab: 'donate-invite' | 'history' = respondioAlgo ? 'donate-invite' : 'history';

    if (!lastFeedbackId) {
      setTab(nextTab);
      return;
    }
    if (!respondioAlgo) {
      setTab(nextTab);
      return;
    }
    submitRating.mutate(
      { feedbackId: lastFeedbackId, rating: ratingValue, wouldPay: wouldPayValue },
      {
        onSuccess: () => {
          setTab(nextTab);
        },
      }
    );
  };

  const goToDonations = () => {
    resetAndClose();
    navigate('/donaciones');
  };

  const resetAndClose = () => {
    setOpen(false);
    setDescription('');
    setType(null);
    setTab('new');
    setLastFeedbackId(null);
    setRatingValue(null);
    setRatingHover(null);
    setWouldPayValue(null);
  };

  return (
    <>
      {/* Floating button.
          Nota: habia un mini-pill "¿Y si la dejamos gratis?" encima del FAB,
          pero era redundante con el boton "Apoyar Paw Friend" del sidebar, el
          item Donaciones del subgrupo Causas y la invitacion a donar que ya
          aparece dentro del flujo del modal cuando el usuario marca wouldPay=yes. */}
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

          {/* Tabs: Nuevo / Historial (ocultos durante pasos intermedios) */}
          {tab !== 'rating' && tab !== 'donate-invite' && (
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
          )}

          {tab === 'donate-invite' ? (
            <div className="space-y-5">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 p-5 text-white text-center">
                <PawPrint
                  className="absolute -bottom-2 -left-2 h-16 w-16 text-white/20"
                  aria-hidden
                />
                <Sparkles
                  className="absolute -top-2 -right-2 h-14 w-14 text-white/20"
                  aria-hidden
                />
                <p className="text-xs uppercase tracking-wide text-white/80 mb-1">
                  Pregunta amistosa
                </p>
                <p className="text-lg font-bold leading-tight">
                  ¿Y si la dejamos <span className="underline">gratis</span>?
                </p>
                <p className="text-xs text-white/85 mt-1">
                  Gracias por responder. Paw Friend sigue gratis para todos — si quieres, puedes
                  aportar <b>una sola vez</b> lo que sientas justo y listo, sin suscripciones ni
                  compromisos.
                </p>
              </div>

              <div className="text-sm text-foreground/80 space-y-2 px-1">
                <p>
                  Paw Friend es un proyecto{' '}
                  <span className="font-semibold">home-made en Chile</span>, hecho por una sola
                  persona que ama a los peludos. Tu aporte nos ayuda a mantener los servidores, la
                  seguridad de tus datos y a seguir mejorando la app para toda la comunidad.
                </p>
                <p className="text-xs text-muted-foreground italic">
                  Sin presion: solo te mostramos esto una vez, aqui en tu feedback.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={goToDonations}
                  className="w-full h-11 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:via-rose-600 hover:to-amber-600 text-white font-semibold"
                >
                  <Heart className="h-4 w-4 mr-2 fill-current" />
                  Conocer como ayudar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setTab('history')}
                  className="w-full text-muted-foreground"
                >
                  Ahora no, gracias
                </Button>
              </div>
            </div>
          ) : tab === 'rating' ? (
            <div className="space-y-5">
              {/* Header celebratorio */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5 text-white text-center">
                <Sparkles
                  className="absolute -top-2 -right-2 h-16 w-16 text-white/15"
                  aria-hidden
                />
                <CheckCircle className="h-10 w-10 mx-auto mb-2 drop-shadow" />
                <p className="text-base font-semibold">¡Gracias por tu feedback!</p>
                <p className="text-xs text-white/80 mt-0.5">
                  Antes de cerrar, cuentanos algo rapido
                </p>
              </div>

              {/* Star rating */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-center">¿Como evaluarias Paw Friend hoy?</p>
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <div
                  role="group"
                  aria-label="Evaluacion de 1 a 5 estrellas"
                  className="flex justify-center gap-1"
                  onMouseLeave={() => setRatingHover(null)}
                >
                  {[1, 2, 3, 4, 5].map((s) => {
                    const active = (ratingHover ?? ratingValue ?? 0) >= s;
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-label={`${s} estrella${s > 1 ? 's' : ''}`}
                        onClick={() => setRatingValue(s)}
                        onMouseEnter={() => setRatingHover(s)}
                        className={cn(
                          'p-1.5 rounded-full transition-transform',
                          active ? 'scale-110' : 'hover:scale-110'
                        )}
                      >
                        <Star
                          className={cn(
                            'h-9 w-9 transition-colors',
                            active
                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                              : 'text-slate-300'
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
                {ratingValue != null && (
                  <p className="text-xs text-center text-muted-foreground inline-flex items-center justify-center gap-1.5 w-full">
                    {ratingValue === 5 && (
                      <>
                        <PartyPopper className="h-3.5 w-3.5 text-amber-500" />
                        ¡Nos encanta!
                      </>
                    )}
                    {ratingValue === 4 && (
                      <>
                        <Heart className="h-3.5 w-3.5 text-violet-500 fill-violet-500" />
                        Nos alegra que te guste
                      </>
                    )}
                    {ratingValue === 3 && 'Vamos a seguir mejorando'}
                    {ratingValue === 2 && 'Gracias por la honestidad'}
                    {ratingValue === 1 && 'Perdón, queremos mejorar'}
                  </p>
                )}
              </div>

              {/* Would pay question */}
              <div className="space-y-2">
                <div className="rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 dark:from-indigo-950/40 dark:to-purple-950/40 p-3">
                  <p className="text-sm font-semibold text-center text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-1.5">
                    <CreditCard className="h-4 w-4" />
                    ¿Pagarías por esta app?
                  </p>
                  <p className="text-[11px] text-center text-muted-foreground mt-0.5">
                    Tu respuesta nos ayuda a decidir qué features priorizar
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {WOULD_PAY_OPTIONS.map((opt) => {
                    const selected = wouldPayValue === opt.value;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setWouldPayValue(opt.value)}
                        className={cn(
                          'flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg border-2 bg-gradient-to-br transition-all text-center',
                          opt.bg,
                          selected
                            ? `ring-2 ring-offset-1 ${opt.ring} scale-[1.02]`
                            : 'hover:scale-[1.02] opacity-90 hover:opacity-100'
                        )}
                      >
                        <Icon className={cn('h-6 w-6', opt.iconColor)} aria-hidden />
                        <span className="text-xs font-semibold text-foreground">{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">
                          {opt.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setTab('history')}
                  disabled={submitRating.isPending}
                >
                  Saltar
                </Button>
                <Button
                  onClick={handleRatingSubmit}
                  disabled={
                    submitRating.isPending || (ratingValue == null && wouldPayValue == null)
                  }
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                >
                  {submitRating.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar evaluacion
                </Button>
              </div>
            </div>
          ) : tab === 'new' ? (
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
