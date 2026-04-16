import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  type BookingType,
  type BookingStatus,
  type ActorRole,
  getBookingTable,
  canTransition,
  statusToEventType,
} from '@/lib/bookingStateMachine';

// ── Create Booking ──────────────────────────────────────────

interface CreateBookingInput {
  providerId: string;
  serviceType: string;
  bookingType: BookingType;
  petId: string;
  scheduledDate: string; // ISO date
  startTime?: string; // "HH:mm"
  endTime?: string;
  notes?: string;
  isEmergency?: boolean;
  confirmationMode?: 'auto' | 'manual';
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      if (!user) throw new Error('No autenticado');

      const table = getBookingTable(input.bookingType);

      // Build insert payload based on booking type
      const basePayload: Record<string, unknown> = {
        owner_id: user.id,
        scheduled_date: input.scheduledDate,
        service_type: input.serviceType,
        status: 'pendiente',
        payment_status: 'pendiente',
      };

      if (input.startTime) basePayload.start_time = input.startTime;
      if (input.endTime) basePayload.end_time = input.endTime;
      if (input.notes) basePayload.symptoms = input.notes; // vet_bookings uses 'symptoms'

      switch (input.bookingType) {
        case 'vet':
          basePayload.service_provider_id = input.providerId;
          basePayload.pet_id = input.petId;
          basePayload.is_emergency = input.isEmergency ?? false;
          basePayload.confirmation_mode = input.confirmationMode ?? 'auto';
          break;
        case 'walk':
          basePayload.walker_id = input.providerId;
          basePayload.pet_ids = [input.petId];
          break;
        case 'dogsitter':
          basePayload.dogsitter_id = input.providerId;
          basePayload.pet_ids = [input.petId];
          basePayload.start_date = input.scheduledDate;
          basePayload.end_date = input.scheduledDate;
          break;
        case 'training':
          basePayload.trainer_id = input.providerId;
          basePayload.pet_id = input.petId;
          basePayload.training_type = input.serviceType;
          break;
        default:
          basePayload.provider_id = input.providerId;
          basePayload.pet_id = input.petId;
      }

      const { data, error } = await supabase.from(table).insert(basePayload).select().single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este horario ya fue reservado por alguien mas. Elige otro.');
        }
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['provider-inbox'] });
      toast.success(
        data.status === 'confirmado' ? 'Hora confirmada' : 'Solicitud de reserva enviada'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la reserva');
    },
  });
}

// ── Cancel Booking ──────────────────────────────────────────

interface CancelBookingInput {
  bookingId: string;
  bookingType: BookingType;
  currentStatus: BookingStatus;
  reason?: string;
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CancelBookingInput) => {
      if (!user) throw new Error('No autenticado');

      const actor: ActorRole = 'owner'; // UI-side cancel is always owner
      if (!canTransition(input.currentStatus, 'cancelado', actor)) {
        throw new Error('No puedes cancelar esta reserva en su estado actual');
      }

      const table = getBookingTable(input.bookingType);
      const { error } = await supabase
        .from(table)
        .update({
          status: 'cancelado',
          canceled_by: user.id,
          canceled_at: new Date().toISOString(),
          cancellation_reason: input.reason || null,
        })
        .eq('id', input.bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      toast.success('Reserva cancelada');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al cancelar');
    },
  });
}

// ── Reschedule Booking ──────────────────────────────────────

interface RescheduleBookingInput {
  bookingId: string;
  bookingType: BookingType;
  newDate: string;
  newStartTime?: string;
  newEndTime?: string;
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: RescheduleBookingInput) => {
      if (!user) throw new Error('No autenticado');

      const table = getBookingTable(input.bookingType);
      const updatePayload: Record<string, unknown> = {
        scheduled_date: input.newDate,
        rescheduled_from: input.bookingId,
      };
      if (input.newStartTime) updatePayload.start_time = input.newStartTime;
      if (input.newEndTime) updatePayload.end_time = input.newEndTime;

      // For dogsitter, use start_date
      if (input.bookingType === 'dogsitter') {
        updatePayload.start_date = input.newDate;
      }

      const { error } = await supabase.from(table).update(updatePayload).eq('id', input.bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      toast.success('Reserva reprogramada');
    },
    onError: () => {
      toast.error('Error al reprogramar');
    },
  });
}

// ── Provider: Confirm ───────────────────────────────────────

interface ConfirmBookingInput {
  bookingId: string;
  bookingType: BookingType;
}

export function useConfirmBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ConfirmBookingInput) => {
      const table = getBookingTable(input.bookingType);
      const { error } = await supabase
        .from(table)
        .update({
          status: 'confirmado',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', input.bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      toast.success('Reserva confirmada');
    },
    onError: () => {
      toast.error('Error al confirmar');
    },
  });
}

// ── Provider: Mark Completed ────────────────────────────────

export function useMarkCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ConfirmBookingInput) => {
      const table = getBookingTable(input.bookingType);
      const { error } = await supabase
        .from(table)
        .update({ status: 'completado' })
        .eq('id', input.bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      toast.success('Atencion completada');
    },
    onError: () => {
      toast.error('Error al completar');
    },
  });
}

// ── Provider: Mark No-Show ──────────────────────────────────

export function useMarkNoShow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ConfirmBookingInput) => {
      const table = getBookingTable(input.bookingType);
      const { error } = await supabase
        .from(table)
        .update({ status: 'no_show' })
        .eq('id', input.bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      toast.success('Marcado como no presentado');
    },
    onError: () => {
      toast.error('Error al marcar no-show');
    },
  });
}

// ── Provider: Start In Progress ─────────────────────────────

export function useStartBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ConfirmBookingInput) => {
      const table = getBookingTable(input.bookingType);
      const { error } = await supabase
        .from(table)
        .update({ status: 'en_curso' })
        .eq('id', input.bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      toast.success('Atencion iniciada');
    },
    onError: () => {
      toast.error('Error al iniciar');
    },
  });
}
