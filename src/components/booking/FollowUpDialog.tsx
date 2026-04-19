import { useState } from 'react';
import { CalendarClock, X, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { formatBookingDate } from '@/lib/format';
import { addDays } from 'date-fns';

interface FollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Booking original que se acaba de completar. El nuevo booking creado
   * quedara linkeado via original.follow_up_booking_id = nuevo.id.
   */
  originalBookingId: string;
  providerId: string;
  ownerId: string;
  petId: string;
  serviceType: string;
  defaultStartTime?: string; // "HH:mm", default 10:00
}

const SUGGESTED_DAYS = [7, 14, 30, 60, 90];

/**
 * Dialog que se muestra post-completar cita. Ofrece crear booking de
 * seguimiento con fecha relativa + linkear via follow_up_booking_id.
 *
 * Riesgo bajo: no bloquea flujo principal (el user puede cerrar sin agendar).
 */
export function FollowUpDialog({
  open,
  onOpenChange,
  originalBookingId,
  providerId,
  ownerId,
  petId,
  serviceType,
  defaultStartTime = '10:00',
}: FollowUpDialogProps) {
  const [daysOffset, setDaysOffset] = useState<number>(30);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const targetDate = addDays(new Date(), daysOffset);
  const targetDateISO = targetDate.toISOString().slice(0, 10);

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      // 1. Crea el nuevo booking con status='pendiente' (el vet lo confirma manual
      //    o el duelo despues). Importante: confirmation_mode='auto' para que
      //    auto-confirme si el duelo es del paciente.
      const { data: newBooking, error: createErr } = await supabase
        .from('vet_bookings')
        .insert({
          owner_id: ownerId,
          service_provider_id: providerId,
          pet_id: petId,
          scheduled_date: targetDateISO,
          start_time: defaultStartTime,
          service_type: serviceType,
          status: 'pendiente',
          payment_status: 'pendiente',
          confirmation_mode: 'auto',
          symptoms: reason.trim() || 'Control de seguimiento',
          is_emergency: false,
        })
        .select('id')
        .single();

      if (createErr || !newBooking) {
        throw createErr ?? new Error('No se pudo crear la cita de seguimiento.');
      }

      // 2. Link bidireccional: original.follow_up_booking_id = nuevo.id.
      //    Columna agregada en mig 20260612000000. Si falla, no abortamos
      //    el flujo porque el nuevo booking ya quedo creado.
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- follow_up_booking_id agregada en mig 20260612000000
        await (supabase.from('vet_bookings') as any)
          .update({ follow_up_booking_id: newBooking.id })
          .eq('id', originalBookingId);
      } catch (linkErr) {
        console.warn('[FollowUpDialog] link follow_up_booking_id failed:', linkErr);
      }

      // 3. Log en booking_events para trazabilidad
      await supabase.from('booking_events').insert({
        booking_type: 'vet',
        booking_id: originalBookingId,
        event_type: 'rescheduled',
        actor_role: 'provider',
        metadata: {
          action: 'follow_up_created',
          follow_up_booking_id: newBooking.id,
          days_offset: daysOffset,
        },
      });

      toast.success('Seguimiento agendado', {
        description: `Cita programada para ${formatBookingDate(targetDateISO)}`,
      });

      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      queryClient.invalidateQueries({ queryKey: ['provider-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });

      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear seguimiento';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            Agendar control de seguimiento
          </DialogTitle>
          <DialogDescription>
            Opcional. Crea una cita de seguimiento preliminar. Quedara en pendiente y puedes
            ajustarla despues.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">¿En cuantos dias?</Label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDaysOffset(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    daysOffset === d
                      ? 'bg-indigo-600 text-white'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {d < 30 ? `${d} dias` : `${Math.round(d / 30)} ${d / 30 === 1 ? 'mes' : 'meses'}`}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Fecha sugerida:{' '}
              <span className="capitalize font-medium">{formatBookingDate(targetDateISO)}</span>
              {' a las '}
              <span className="font-medium">{defaultStartTime}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="followup-reason" className="text-xs font-medium">
              Motivo del seguimiento (opcional)
            </Label>
            <Textarea
              id="followup-reason"
              placeholder="Ej: Revisar evolucion de la herida, control post-cirugia..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            <X className="h-4 w-4 mr-1" aria-hidden="true" />
            Ahora no
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Check className="h-4 w-4 mr-1" aria-hidden="true" />
            {isSubmitting ? 'Agendando...' : 'Agendar seguimiento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
