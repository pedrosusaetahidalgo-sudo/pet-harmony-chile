import { useState } from 'react';
import { MessageSquarePlus, Bug, Lightbulb, Heart, Star } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useFeedbackInApp, type FeedbackType } from '@/hooks/useFeedbackInApp';

const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: typeof Bug; color: string }[] = [
  { value: 'bug', label: 'Reportar problema', icon: Bug, color: 'text-red-500' },
  { value: 'idea', label: 'Sugerir mejora', icon: Lightbulb, color: 'text-amber-500' },
  { value: 'experience', label: 'Compartir experiencia', icon: Heart, color: 'text-pink-500' },
];

type Step = 'form' | 'rating';

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [type, setType] = useState<FeedbackType>('bug');
  const [description, setDescription] = useState('');
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const { submit, submitRating } = useFeedbackInApp();

  const handleSubmit = () => {
    if (!description.trim()) return;
    submit.mutate(
      { type, description },
      {
        onSuccess: (data) => {
          setFeedbackId(data.id);
          setStep('rating');
        },
      }
    );
  };

  const handleRate = (rating: number) => {
    setSelectedRating(rating);
    if (!feedbackId) return;
    submitRating.mutate({ feedbackId, rating }, { onSuccess: () => resetAndClose() });
  };

  const handleSkipRating = () => {
    resetAndClose();
  };

  const resetAndClose = () => {
    setOpen(false);
    setDescription('');
    setType('bug');
    setStep('form');
    setFeedbackId(null);
    setHoveredStar(0);
    setSelectedRating(0);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        Feedback
      </Button>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : resetAndClose())}>
        <DialogContent>
          {step === 'form' ? (
            <>
              <DialogHeader>
                <DialogTitle>Enviar feedback</DialogTitle>
                <DialogDescription>Tu opinion nos ayuda a mejorar Paw Friend</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {FEEDBACK_TYPES.map((ft) => (
                    <button
                      key={ft.value}
                      onClick={() => setType(ft.value)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all touch-manipulation',
                        type === ft.value
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:bg-muted/50'
                      )}
                    >
                      <ft.icon className={cn('h-5 w-5', ft.color)} />
                      <span className="text-[11px] font-medium leading-tight">{ft.label}</span>
                    </button>
                  ))}
                </div>

                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    type === 'bug'
                      ? 'Describe el problema que encontraste...'
                      : type === 'idea'
                        ? 'Describe tu idea o sugerencia...'
                        : 'Cuentanos tu experiencia...'
                  }
                  className="min-h-[100px]"
                  maxLength={2000}
                />

                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground">
                    {description.length}/2000
                  </span>
                  <Button onClick={handleSubmit} disabled={!description.trim() || submit.isPending}>
                    {submit.isPending ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">Gracias por tu feedback</DialogTitle>
                <DialogDescription className="text-center">
                  ¿Como calificarias tu experiencia con Paw Friend?
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center gap-5 py-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= (hoveredStar || selectedRating);
                    return (
                      <button
                        key={star}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => handleRate(star)}
                        disabled={submitRating.isPending}
                        className="transition-transform hover:scale-110 disabled:opacity-50"
                        aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={cn(
                            'h-10 w-10 transition-colors',
                            filled ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'
                          )}
                        />
                      </button>
                    );
                  })}
                </div>

                <p className="text-sm text-muted-foreground h-5">
                  {hoveredStar === 1 && 'Muy mala'}
                  {hoveredStar === 2 && 'Mala'}
                  {hoveredStar === 3 && 'Regular'}
                  {hoveredStar === 4 && 'Buena'}
                  {hoveredStar === 5 && 'Excelente'}
                </p>

                <button
                  onClick={handleSkipRating}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Omitir
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
