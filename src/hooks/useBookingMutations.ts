import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Sentry } from '@/lib/sentry';
import { track, EVENTS } from '@/lib/analytics';
import {
  type BookingType,
  type BookingStatus,
  type ActorRole,
  getBookingTable,
  canTransition,
} from '@/lib/bookingStateMachine';

// ── Optimistic helpers ──────────────────────────────────────
//
// Plan PRODUCT_SYSTEM_COHERENCE §33.8 y §42 Fase 4.
// Reducen el lag 500ms-2s perceived en mobile al confirmar/cancelar/
// reprogramar bookings. Patron: onMutate snapshot + setQueriesData con
// cambio optimista, onError rollback, onSettled invalidate para traer
// la verdad del server.

const BOOKING_CACHE_KEYS = ['my-bookings', 'provider-inbox', 'booking-detail'] as const;

type CacheSnapshot = Array<[readonly unknown[], unknown]>;

/**
 * Toma snapshots de todas las queries que listan bookings, para poder
 * rollback si la mutation falla.
 */
function snapshotBookingQueries(qc: QueryClient): CacheSnapshot {
  const snapshots: CacheSnapshot = [];
  for (const key of BOOKING_CACHE_KEYS) {
    const entries = qc.getQueriesData({ queryKey: [key] });
    for (const [qk, data] of entries) {
      snapshots.push([qk, data]);
    }
  }
  return snapshots;
}

/**
 * Restaura snapshots de booking queries tras un error.
 */
function rollbackBookingQueries(qc: QueryClient, snapshot: CacheSnapshot): void {
  for (const [qk, data] of snapshot) {
    qc.setQueryData(qk, data);
  }
}

/**
 * Aplica un patch a todos los bookings con `id === bookingId` en cualquier
 * query cacheada bajo las claves de booking. Maneja listas arrays y el
 * shape { pages: [] } de useInfiniteQuery.
 */
function optimisticPatchBooking(
  qc: QueryClient,
  bookingId: string,
  patch: Record<string, unknown>
): void {
  for (const key of BOOKING_CACHE_KEYS) {
    qc.setQueriesData({ queryKey: [key] }, (old: unknown) => {
      if (!old) return old;
      if (Array.isArray(old)) {
        return (old as Array<Record<string, unknown>>).map((b) =>
          b && b.id === bookingId ? { ...b, ...patch } : b
        );
      }
      if (typeof old === 'object' && old !== null && 'id' in old) {
        const item = old as Record<string, unknown>;
        return item.id === bookingId ? { ...item, ...patch } : old;
      }
      if (
        typeof old === 'object' &&
        old !== null &&
        'pages' in old &&
        Array.isArray((old as { pages: unknown[] }).pages)
      ) {
        const infinite = old as { pages: unknown[] };
        return {
          ...infinite,
          pages: infinite.pages.map((page) =>
            Array.isArray(page)
              ? (page as Array<Record<string, unknown>>).map((b) =>
                  b && b.id === bookingId ? { ...b, ...patch } : b
                )
              : page
          ),
        };
      }
      return old;
    });
  }
}

/**
 * Invalida todas las queries de booking tras settle (onSettled).
 */
function invalidateBookingQueries(qc: QueryClient): void {
  for (const key of BOOKING_CACHE_KEYS) {
    qc.invalidateQueries({ queryKey: [key] });
  }
  qc.invalidateQueries({ queryKey: ['available-slots'] });
}

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

/**
 * Error lanzado cuando el slot ya fue reservado por otra persona (error 23505
 * de Postgres al intentar insert). El consumidor puede detectarlo y mostrar
 * sugerencias de slots alternativos.
 */
export class BookingConflictError extends Error {
  readonly code = 'BOOKING_CONFLICT';
  constructor(message = 'Este horario ya fue reservado por alguien mas.') {
    super(message);
    this.name = 'BookingConflictError';
  }
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      if (!user) throw new Error('No autenticado');

      // ─── Path A: RPC server-authoritative (CC-18, solo vet por ahora) ───
      // La RPC valida pet ownership, provider activo, slot disponible,
      // min_lead_time antes de insertar. Si no está desplegada aún,
      // caemos al path legacy (insert directo) sin romper la app.
      if (input.bookingType === 'vet' && input.startTime && input.endTime) {
        try {
          const { data: newBookingId, error: rpcErr } = await supabase.rpc('rpc_create_booking', {
            p_provider_id: input.providerId,
            p_service_type: input.serviceType,
            p_pet_id: input.petId,
            p_scheduled_date: input.scheduledDate,
            p_start_time: input.startTime,
            p_end_time: input.endTime,
            p_notes: input.notes ?? null,
            p_is_emergency: input.isEmergency ?? false,
            p_confirmation_mode: input.confirmationMode ?? 'auto',
          });

          if (!rpcErr && newBookingId) {
            // Trae el booking creado para que onSuccess tenga el shape esperado.
            const { data: created, error: fetchErr } = await supabase
              .from('vet_bookings')
              .select('*')
              .eq('id', newBookingId)
              .single();

            if (!fetchErr && created) {
              return created;
            }
          }

          // Traducir errores típicos del RPC a errores tipados.
          if (rpcErr) {
            const msg = rpcErr.message ?? '';
            if (rpcErr.code === '23505' || msg.includes('slot_not_available')) {
              throw new BookingConflictError();
            }
            if (msg.includes('pet_not_owned')) {
              throw new Error('No puedes reservar con una mascota que no es tuya.');
            }
            if (msg.includes('scheduled_in_past')) {
              throw new Error('La fecha/hora seleccionada ya pasó.');
            }
            if (msg.includes('provider_not_found')) {
              throw new Error('El veterinario no está disponible.');
            }
            // Cualquier otro error del RPC (función no existe, etc.) →
            // fallback al insert directo más abajo.
          }
        } catch (err) {
          // Si es BookingConflictError, propagar. Otros errores → fallback.
          if (err instanceof BookingConflictError) throw err;
          // Continua al path B.
        }
      }

      // ─── Path B: Insert directo legacy (comportamiento previo) ───
      // Se mantiene para walk/dogsitter/training (no cubiertos por RPC aún)
      // y como fallback cuando la migración 20260725000005 aún no se aplicó.
      const table = getBookingTable(input.bookingType);

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
          throw new BookingConflictError();
        }
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['provider-inbox'] });

      // CC-12: evento de funnel. booking_confirmed se dispara al crear
      // SIEMPRE que el booking quede en 'confirmado' (auto-confirm del
      // provider). Si queda pendiente, igual queremos trackear el created
      // flow: ya emite BOOKING_COMPLETED el wizard (legacy rename pending).
      track({
        event: EVENTS.BOOKING_CONFIRMED,
        properties: {
          booking_id: data.id,
          booking_type: variables.bookingType,
          service_type: variables.serviceType,
          provider_id: variables.providerId,
          confirmation_mode: variables.confirmationMode ?? 'auto',
          is_emergency: variables.isEmergency ?? false,
          auto_confirmed: data.status === 'confirmado',
        },
      });

      if (data.status === 'confirmado') {
        toast.success('Cita confirmada', {
          description: 'Te avisaremos con un recordatorio antes de la hora.',
        });
      } else {
        toast.success('Enviada al veterinario', {
          description: 'Te avisaremos cuando confirme tu hora.',
        });
      }
    },
    onError: (error: Error) => {
      // BookingConflictError lo maneja el componente con UI de sugerencias;
      // no mostramos toast generico para no duplicar feedback.
      if (error instanceof BookingConflictError) return;
      Sentry.captureException(error, { tags: { op: 'booking_mutation', action: 'create' } });
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

      // ─── Path A: RPC server-side (CC-19) ───
      // Solo para vet bookings por ahora. Valida grace window server-side
      // y registra booking_event mediante trigger.
      if (input.bookingType === 'vet') {
        try {
          const { error: rpcErr } = await supabase.rpc('rpc_cancel_booking', {
            p_booking_id: input.bookingId,
            p_reason: input.reason ?? null,
          });

          if (!rpcErr) {
            // Success: google calendar delete + toast (onSuccess se encarga).
            if (input.bookingType === 'vet') {
              void supabase.functions
                .invoke('google-calendar-sync', {
                  body: {
                    action: 'delete',
                    source_type: 'vet_booking',
                    source_id: input.bookingId,
                  },
                })
                .catch((err: unknown) => {
                  Sentry.captureException(err, {
                    tags: { op: 'booking_mutation', action: 'google_calendar_delete_on_cancel' },
                  });
                });
            }
            return;
          }

          // Mapear errores del RPC a mensajes usuario-friendly.
          const msg = rpcErr.message ?? '';
          if (msg.includes('reason_required_outside_grace')) {
            throw new Error(
              'Estás fuera del plazo de cancelación sin costo. Por favor indica un motivo.'
            );
          }
          if (msg.includes('cannot_cancel_terminal_status')) {
            throw new Error('Esta reserva ya no se puede cancelar.');
          }
          if (msg.includes('not_authorized')) {
            throw new Error('No tienes permiso para cancelar esta reserva.');
          }
          // Otro error → caer a fallback.
        } catch (err) {
          // Propagar si es Error tipado; otros errores → fallback.
          if (err instanceof Error && err.message.startsWith('Estás fuera')) throw err;
          if (err instanceof Error && err.message.startsWith('Esta reserva')) throw err;
          if (err instanceof Error && err.message.startsWith('No tienes')) throw err;
        }
      }

      // ─── Path B: UPDATE directo (fallback) ───
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

      // Borrar evento asociado en Google Calendar (best-effort, no bloquea UX).
      // CC-02 del master plan: evita que queden eventos fantasma en el Google
      // del tutor tras cancelar. La edge fn es idempotente si no hay mapping.
      if (input.bookingType === 'vet') {
        void supabase.functions
          .invoke('google-calendar-sync', {
            body: { action: 'delete', source_type: 'vet_booking', source_id: input.bookingId },
          })
          .catch((err: unknown) => {
            Sentry.captureException(err, {
              tags: { op: 'booking_mutation', action: 'google_calendar_delete_on_cancel' },
            });
          });
      }
    },
    // ── Optimistic update: marcar inmediatamente como cancelado en cache ──
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['my-bookings'] });
      await queryClient.cancelQueries({ queryKey: ['provider-inbox'] });
      const snapshot = snapshotBookingQueries(queryClient);
      optimisticPatchBooking(queryClient, input.bookingId, {
        status: 'cancelado',
        canceled_at: new Date().toISOString(),
        cancellation_reason: input.reason ?? null,
      });
      return { snapshot };
    },
    onSuccess: (_data, variables) => {
      track({
        event: EVENTS.BOOKING_CANCELLED,
        properties: {
          booking_id: variables.bookingId,
          booking_type: variables.bookingType,
          actor: 'owner',
          had_reason: !!variables.reason,
        },
      });
      toast.success('Reserva cancelada');
    },
    onError: (error: Error, _vars, context) => {
      if (context?.snapshot) rollbackBookingQueries(queryClient, context.snapshot);
      Sentry.captureException(error, { tags: { op: 'booking_mutation', action: 'cancel' } });
      toast.error(error.message || 'Error al cancelar');
    },
    onSettled: () => invalidateBookingQueries(queryClient),
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

      // ─── Path A: RPC server-side (CC-19) ───
      // Valida grace window, state machine y slot nuevo disponible.
      if (input.bookingType === 'vet' && input.newStartTime && input.newEndTime) {
        try {
          const { error: rpcErr } = await supabase.rpc('rpc_reschedule_booking', {
            p_booking_id: input.bookingId,
            p_new_date: input.newDate,
            p_new_start_time: input.newStartTime,
            p_new_end_time: input.newEndTime,
          });

          if (!rpcErr) return;

          const msg = rpcErr.message ?? '';
          if (rpcErr.code === '23505' || msg.includes('new_slot_not_available')) {
            throw new BookingConflictError('El nuevo horario ya fue reservado por alguien más.');
          }
          if (msg.includes('outside_reschedule_grace')) {
            throw new Error('Estás fuera del plazo para reprogramar sin costo.');
          }
          if (msg.includes('cannot_reschedule_in_current_status')) {
            throw new Error('Esta reserva ya no se puede reprogramar.');
          }
          // Otro error → fallback.
        } catch (err) {
          if (err instanceof BookingConflictError) throw err;
          if (
            err instanceof Error &&
            (err.message.startsWith('Estás fuera') || err.message.startsWith('Esta reserva'))
          )
            throw err;
        }
      }

      // ─── Path B: UPDATE directo (fallback) ───
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
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['my-bookings'] });
      await queryClient.cancelQueries({ queryKey: ['provider-inbox'] });
      const snapshot = snapshotBookingQueries(queryClient);
      const patch: Record<string, unknown> = { scheduled_date: input.newDate };
      if (input.newStartTime) patch.start_time = input.newStartTime;
      if (input.newEndTime) patch.end_time = input.newEndTime;
      optimisticPatchBooking(queryClient, input.bookingId, patch);
      return { snapshot };
    },
    onSuccess: (_data, variables) => {
      track({
        event: EVENTS.BOOKING_RESCHEDULED,
        properties: {
          booking_id: variables.bookingId,
          booking_type: variables.bookingType,
          actor: 'owner',
        },
      });
      toast.success('Reserva reprogramada');
    },
    onError: (error: Error, _vars, context) => {
      if (context?.snapshot) rollbackBookingQueries(queryClient, context.snapshot);
      Sentry.captureException(error, { tags: { op: 'booking_mutation', action: 'reschedule' } });
      toast.error('Error al reprogramar');
    },
    onSettled: () => invalidateBookingQueries(queryClient),
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
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['provider-inbox'] });
      const snapshot = snapshotBookingQueries(queryClient);
      optimisticPatchBooking(queryClient, input.bookingId, {
        status: 'confirmado',
        confirmed_at: new Date().toISOString(),
      });
      return { snapshot };
    },
    onSuccess: (_data, variables) => {
      track({
        event: EVENTS.BOOKING_CONFIRMED,
        properties: {
          booking_id: variables.bookingId,
          booking_type: variables.bookingType,
          actor: 'provider',
          auto_confirmed: false,
        },
      });
      toast.success('Reserva confirmada');
    },
    onError: (error: Error, _vars, context) => {
      if (context?.snapshot) rollbackBookingQueries(queryClient, context.snapshot);
      Sentry.captureException(error, { tags: { op: 'booking_mutation', action: 'confirm' } });
      toast.error('Error al confirmar');
    },
    onSettled: () => invalidateBookingQueries(queryClient),
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
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['provider-inbox'] });
      const snapshot = snapshotBookingQueries(queryClient);
      optimisticPatchBooking(queryClient, input.bookingId, { status: 'completado' });
      return { snapshot };
    },
    onSuccess: (_data, variables) => {
      if (variables.bookingType === 'vet') {
        track({
          event: EVENTS.BOOKING_COMPLETED_VET,
          properties: {
            booking_id: variables.bookingId,
          },
        });
      }
      toast.success('Atencion completada');
    },
    onError: (error: Error, _vars, context) => {
      if (context?.snapshot) rollbackBookingQueries(queryClient, context.snapshot);
      Sentry.captureException(error, { tags: { op: 'booking_mutation', action: 'complete' } });
      toast.error('Error al completar');
    },
    onSettled: () => invalidateBookingQueries(queryClient),
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
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['provider-inbox'] });
      const snapshot = snapshotBookingQueries(queryClient);
      optimisticPatchBooking(queryClient, input.bookingId, { status: 'no_show' });
      return { snapshot };
    },
    onSuccess: (_data, variables) => {
      track({
        event: EVENTS.BOOKING_NO_SHOW,
        properties: {
          booking_id: variables.bookingId,
          booking_type: variables.bookingType,
        },
      });
      toast.success('Marcado como no presentado');
    },
    onError: (error: Error, _vars, context) => {
      if (context?.snapshot) rollbackBookingQueries(queryClient, context.snapshot);
      Sentry.captureException(error, { tags: { op: 'booking_mutation', action: 'no_show' } });
      toast.error('Error al marcar no-show');
    },
    onSettled: () => invalidateBookingQueries(queryClient),
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
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['provider-inbox'] });
      const snapshot = snapshotBookingQueries(queryClient);
      optimisticPatchBooking(queryClient, input.bookingId, { status: 'en_curso' });
      return { snapshot };
    },
    onSuccess: () => {
      toast.success('Atencion iniciada');
    },
    onError: (error: Error, _vars, context) => {
      if (context?.snapshot) rollbackBookingQueries(queryClient, context.snapshot);
      Sentry.captureException(error, { tags: { op: 'booking_mutation', action: 'start' } });
      toast.error('Error al iniciar');
    },
    onSettled: () => invalidateBookingQueries(queryClient),
  });
}
