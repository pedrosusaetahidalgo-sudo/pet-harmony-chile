import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useCancelBooking } from '@/hooks/useBookingMutations';
import type { BookingType, BookingStatus } from '@/lib/bookingStateMachine';

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingType: BookingType;
  currentStatus: BookingStatus;
  role: 'owner' | 'provider';
  onSuccess?: () => void;
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  bookingId,
  bookingType,
  currentStatus,
  role,
  onSuccess,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState('');
  const cancelBooking = useCancelBooking();

  const handleCancel = async () => {
    await cancelBooking.mutateAsync({
      bookingId,
      bookingType,
      currentStatus,
      reason: reason || undefined,
    });
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancelar reserva
          </AlertDialogTitle>
          <AlertDialogDescription>
            {role === 'owner'
              ? 'Estas seguro de que quieres cancelar esta reserva? El profesional sera notificado.'
              : 'Estas seguro de que quieres cancelar esta reserva? El dueno sera notificado.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cancel-reason">
            {role === 'provider' ? 'Motivo (obligatorio)' : 'Motivo (opcional)'}
          </Label>
          <Textarea
            id="cancel-reason"
            placeholder="Ej: No puedo asistir, cambio de planes..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Volver</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelBooking.isPending || (role === 'provider' && !reason.trim())}
          >
            Confirmar cancelacion
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
