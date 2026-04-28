import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, CheckCircle2, Lightbulb } from '@/lib/icons';
import { cn } from '@/lib/utils';
import type { SectionTutorial } from '@/lib/sidebarTutorialContent';

interface Props {
  tutorial: SectionTutorial;
  open: boolean;
  onComplete: () => void;
  onClose: () => void;
}

export function SidebarTutorialDialog({ tutorial, open, onComplete, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = tutorial.steps[currentStep];
  const isLast = currentStep === tutorial.steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      setCurrentStep(0);
      onComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setCurrentStep(0);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Header con gradiente */}
        <div className={`bg-gradient-to-br ${tutorial.color} p-6 pb-5 text-white`}>
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">
                {tutorial.sectionLabel}
              </Badge>
              <span className="text-xs text-white/70">
                {currentStep + 1} de {tutorial.steps.length}
              </span>
            </div>
            <DialogTitle className="text-xl font-bold text-white pt-2">{step.title}</DialogTitle>
            <DialogDescription className="text-white/90 text-sm leading-relaxed sr-only">
              Tutorial de la sección {tutorial.sectionLabel}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

          {step.tip && (
            <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">{step.tip}</p>
            </div>
          )}

          {/* Progreso visual */}
          <div className="flex gap-1.5 justify-center pt-1">
            {tutorial.steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === currentStep
                    ? 'w-8 bg-purple-600'
                    : i < currentStep
                      ? 'w-3 bg-purple-300'
                      : 'w-3 bg-gray-200'
                )}
              />
            ))}
          </div>

          {/* Navegación */}
          <div className="flex gap-2 pt-1">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrev} className="flex-1" size="sm">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Anterior
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={cn(
                'flex-1 text-white',
                `bg-gradient-to-r ${tutorial.color} hover:opacity-90`
              )}
              size="sm"
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Completar
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
