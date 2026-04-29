import { useMemo, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
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
  /**
   * Fecha y hora programada de la cita (opcional).
   * Si se provee, se muestra la politica de cancelacion con el tiempo restante.
   * Puede ser Date, "yyyy-MM-dd" + "HH:mm" concatenado, o ISO string.
   */
  scheduledAt?: string | Date | null;
  onSuccess?: () => void;
}

const OWNER_GRACE_HOURS = 2;
const PROVIDER_GRACE_HOURS = 24;

function hoursUntil(target: Date): number {
  const diffMs = target.getTime() - Date.now();
  return diffMs / (1000 * 60 * 60);
}

function parseScheduled(scheduledAt: string | Date | null | undefined): Date | null {
  if (!scheduledAt) return null;
  if (scheduledAt instanceof Date) return isNaN(scheduledAt.getTime()) ? null : scheduledAt;
  // Si es 'yyyy-MM-dd HH:mm' o 'yyyy-MM-ddTHH:mm...'
  const d = new Date(scheduledAt.includes('T') ? scheduledAt : scheduledAt.replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  bookingId,
  bookingType,
  currentStatus,
  role,
  scheduledAt,
  onSuccess,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState('');
  const cancelBooking = useCancelBooking();

  const scheduledDate = useMemo(() => parseScheduled(scheduledAt), [scheduledAt]);

  const policy = useMemo(() => {
    if (!scheduledDate) return null;
    const remainingHours = hoursUntil(scheduledDate);
    const graceHours = role === 'owner' ? OWNER_GRACE_HOURS : PROVIDER_GRACE_HOURS;
    const withinGrace = remainingHours >= graceHours;
    return {
      remainingHours,
      graceHours,
      withinGrace,
      isPast: remainingHours < 0,
    };
  }, [scheduledDate, role]);

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

  const reasonRequired = role === 'provider' || (policy && !policy.withinGrace && !policy.isPast);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            Cancelar reserva
          </AlertDialogTitle>
          <AlertDialogDescription>
            {role === 'owner'
              ? 'Estas seguro de que quieres cancelar esta reserva? El profesional sera notificado.'
              : 'Estas seguro de que quieres cancelar esta reserva? El dueno sera notificado.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Politica de cancelacion */}
        {policy && !policy.isPast && (
          <div
            role="note"
            className={`rounded-md border p-3 text-xs space-y-1 ${
              policy.withinGrace
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-amber-300 bg-amber-50 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {policy.withinGrace ? (
                <span>Cancelacion sin cargo</span>
              ) : (
                <span>Cancelacion fuera de ventana</span>
              )}
            </div>
            <p className="leading-relaxed">
              {role === 'owner'
                ? policy.withinGrace
                  ? `Aun quedan ${Math.floor(policy.remainingHours)} horas para la cita. Puedes cancelar sin problema.`
                  : `Faltan menos de ${OWNER_GRACE_HOURS} horas para la cita. El profesional podria aplicar cargo por cancelacion tardia.`
                : policy.withinGrace
                  ? `Quedan ${Math.floor(policy.remainingHours)} horas para la cita. Estas cancelando dentro de la ventana recomendada.`
                  : `Faltan menos de ${PROVIDER_GRACE_HOURS} horas para la cita. Al cancelar tan cerca, el dueno recibira una disculpa automatica; agrega un motivo claro.`}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="cancel-reason">
            {reasonRequired ? 'Motivo (obligatorio)' : 'Motivo (opcional)'}
          </Label>
          <Textarea
            id="cancel-reason"
            placeholder={
              role === 'owner'
                ? 'Ej: surgio un imprevisto, mi mascota no puede viajar...'
                : 'Ej: emergencia con otro paciente, imprevisto personal...'
            }
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
            disabled={cancelBooking.isPending || !!(reasonRequired && !reason.trim())}
          >
            {cancelBooking.isPending ? 'Cancelando...' : 'Confirmar cancelacion'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
