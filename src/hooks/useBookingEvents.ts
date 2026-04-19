import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BookingType, BookingEventType, ActorRole } from '@/lib/bookingStateMachine';

export interface BookingEvent {
  id: string;
  event_type: BookingEventType;
  actor_id: string | null;
  actor_role: ActorRole | null;
  previous_status: string | null;
  new_status: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Lee el audit trail de un booking desde `booking_events`.
 * Usar cuando solo necesitas el timeline sin traer el detalle completo
 * (ej: preview en una card). Para el detalle completo usa useBookingDetail
 * que ya incluye events.
 */
export function useBookingEvents(bookingId: string | undefined, bookingType: BookingType = 'vet') {
  return useQuery({
    queryKey: ['booking-events', bookingType, bookingId],
    queryFn: async (): Promise<BookingEvent[]> => {
      if (!bookingId) return [];

      const { data, error } = await supabase
        .from('booking_events')
        .select(
          'id, event_type, actor_id, actor_role, previous_status, new_status, metadata, created_at'
        )
        .eq('booking_type', bookingType)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as BookingEvent[];
    },
    enabled: !!bookingId,
    staleTime: 30_000,
  });
}
