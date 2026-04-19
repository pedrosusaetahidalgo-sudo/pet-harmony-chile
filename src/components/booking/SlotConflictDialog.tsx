import { AlertCircle, Clock, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatBookingDate, formatTime } from '@/lib/format';
import type { ComputedSlot } from '@/lib/availabilitySlots';

interface SlotConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alternatives: ComputedSlot[];
  onPickAlternative: (slot: ComputedSlot) => void;
  onCancel?: () => void;
}

/**
 * Se muestra cuando un booking falla por colision (otro usuario reservo
 * el mismo slot al mismo tiempo). Ofrece hasta 3 slots alternativos cercanos
 * para que el usuario elija uno sin tener que volver al calendario.
 */
export function SlotConflictDialog({
  open,
  onOpenChange,
  alternatives,
  onPickAlternative,
  onCancel,
}: SlotConflictDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" aria-hidden="true" />
            Ese horario se acaba de tomar
          </DialogTitle>
          <DialogDescription>
            Alguien mas reservo ese horario segundos antes. No te preocupes, aca tienes otras
            opciones disponibles:
          </DialogDescription>
        </DialogHeader>

        {alternatives.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No encontramos otros horarios disponibles cerca. Elige un dia distinto desde el
            calendario.
          </p>
        ) : (
          <div className="space-y-2">
            {alternatives.map((slot) => (
              <button
                key={`${slot.date}-${slot.start}`}
                onClick={() => onPickAlternative(slot)}
                className="w-full flex items-center justify-between gap-3 rounded-lg border p-3 text-left hover:border-purple-400 hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-700">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{formatBookingDate(slot.date)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {formatTime(slot.start)}
                      {slot.end && ` – ${formatTime(slot.end)}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-purple-700">Elegir</span>
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onCancel?.();
            }}
          >
            Volver al calendario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
