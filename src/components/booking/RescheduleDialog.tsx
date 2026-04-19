import { useMemo, useState } from 'react';
import { CalendarClock, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { useRescheduleBooking } from '@/hooks/useBookingMutations';
import type { BookingType } from '@/lib/bookingStateMachine';
import type { ComputedSlot } from '@/lib/availabilitySlots';
import { formatBookingDate, formatTimeRange } from '@/lib/format';

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingType: BookingType;
  providerId: string;
  serviceType?: string;
  /**
   * Fecha y hora actual de la cita para mostrar el "antes".
   * Puede ser Date, string ISO, o `yyyy-MM-ddTHH:mm`.
   */
  currentScheduledAt?: string | Date | null;
  /** Rol desde el cual se reprograma. Default 'owner'. */
  role?: 'owner' | 'provider';
  onSuccess?: () => void;
}

const OWNER_GRACE_HOURS = 24;
const PROVIDER_GRACE_HOURS = 12;

function parseScheduled(scheduledAt: string | Date | null | undefined): Date | null {
  if (!scheduledAt) return null;
  if (scheduledAt instanceof Date) return isNaN(scheduledAt.getTime()) ? null : scheduledAt;
  const d = new Date(scheduledAt.includes('T') ? scheduledAt : scheduledAt.replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}

function hoursUntil(target: Date): number {
  return (target.getTime() - Date.now()) / (1000 * 60 * 60);
}

export function RescheduleDialog({
  open,
  onOpenChange,
  bookingId,
  bookingType,
  providerId,
  serviceType,
  currentScheduledAt,
  role = 'owner',
  onSuccess,
}: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<ComputedSlot | null>(null);
  const reschedule = useRescheduleBooking();

  const current = useMemo(() => parseScheduled(currentScheduledAt), [currentScheduledAt]);

  const policy = useMemo(() => {
    if (!current) return null;
    const remainingHours = hoursUntil(current);
    const graceHours = role === 'owner' ? OWNER_GRACE_HOURS : PROVIDER_GRACE_HOURS;
    return {
      remainingHours,
      graceHours,
      withinGrace: remainingHours >= graceHours,
      isPast: remainingHours < 0,
    };
  }, [current, role]);

  const handleSlotSelect = (date: string, slot: ComputedSlot) => {
    setSelectedDate(date);
    setSelectedSlot(slot);
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot) return;
    await reschedule.mutateAsync({
      bookingId,
      bookingType,
      newDate: selectedDate,
      newStartTime: selectedSlot.start,
      newEndTime: selectedSlot.end,
    });
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" aria-hidden="true" />
            Reprogramar reserva
          </DialogTitle>
          <DialogDescription>
            Elige una nueva fecha y hora.{' '}
            {role === 'owner'
              ? 'El profesional sera notificado del cambio.'
              : 'El dueno sera notificado del cambio.'}
          </DialogDescription>
        </DialogHeader>

        {/* Actual */}
        {current && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs space-y-0.5">
            <p className="font-semibold text-slate-700">Cita actual</p>
            <p className="text-slate-900 capitalize">
              {formatBookingDate(current)}
              {' · '}
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {current.getHours().toString().padStart(2, '0')}:
                {current.getMinutes().toString().padStart(2, '0')}
              </span>
            </p>
          </div>
        )}

        {/* Politica */}
        {policy && !policy.isPast && !policy.withinGrace && (
          <div
            role="note"
            className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900"
          >
            {role === 'owner'
              ? `Faltan menos de ${OWNER_GRACE_HOURS}h para la cita. Reprogramar tan cerca puede incomodar al profesional. Avisa tambien por chat si es urgente.`
              : `Faltan menos de ${PROVIDER_GRACE_HOURS}h para la cita. Al reprogramar tan cerca, avisale al dueno por WhatsApp ademas.`}
          </div>
        )}

        <AvailabilityCalendar
          providerId={providerId}
          serviceType={serviceType}
          onSlotSelect={handleSlotSelect}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot?.start}
        />

        {/* Preview del cambio */}
        {selectedSlot && selectedDate && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs space-y-0.5">
            <p className="font-semibold text-emerald-900">Nueva fecha seleccionada</p>
            <p className="text-emerald-900 capitalize">
              {formatBookingDate(selectedDate)}
              {' · '}
              {formatTimeRange(selectedSlot.start, selectedSlot.end)}
            </p>
          </div>
        )}

        {selectedSlot && selectedDate && (
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={handleConfirm}
            disabled={reschedule.isPending}
          >
            {reschedule.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
            ) : null}
            {reschedule.isPending ? 'Reprogramando...' : 'Confirmar nueva fecha'}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
