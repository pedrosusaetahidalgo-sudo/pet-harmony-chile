import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
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

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingType: BookingType;
  providerId: string;
  serviceType?: string;
  onSuccess?: () => void;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  bookingId,
  bookingType,
  providerId,
  serviceType,
  onSuccess,
}: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<ComputedSlot | null>(null);
  const reschedule = useRescheduleBooking();

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
            <CalendarClock className="h-5 w-5" />
            Reprogramar reserva
          </DialogTitle>
          <DialogDescription>Elige una nueva fecha y hora para tu reserva.</DialogDescription>
        </DialogHeader>

        <AvailabilityCalendar
          providerId={providerId}
          serviceType={serviceType}
          onSlotSelect={handleSlotSelect}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot?.start}
        />

        {selectedSlot && selectedDate && (
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={handleConfirm}
            disabled={reschedule.isPending}
          >
            Confirmar nueva fecha
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
