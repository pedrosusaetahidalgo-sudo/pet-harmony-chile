import { useState } from 'react';
import { MessageSquarePlus, Bug, Lightbulb, Heart } from '@/lib/icons';
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

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [description, setDescription] = useState('');
  const { submit } = useFeedbackInApp();

  const handleSubmit = () => {
    if (!description.trim()) return;
    submit.mutate(
      { type, description },
      {
        onSuccess: () => {
          setOpen(false);
          setDescription('');
          setType('bug');
        },
      }
    );
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar feedback</DialogTitle>
            <DialogDescription>Tu opinión nos ayuda a mejorar Paw Friend</DialogDescription>
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
                    : 'Cuéntanos tu experiencia...'
              }
              className="min-h-[100px]"
              maxLength={2000}
            />

            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground">{description.length}/2000</span>
              <Button onClick={handleSubmit} disabled={!description.trim() || submit.isPending}>
                {submit.isPending ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
