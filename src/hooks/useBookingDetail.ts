import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  BookingType,
  BookingStatus,
  BookingEventType,
  ActorRole,
} from '@/lib/bookingStateMachine';
import { getBookingTable } from '@/lib/bookingStateMachine';

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

export interface BookingDetail {
  id: string;
  booking_type: BookingType;
  owner_id: string;
  provider_id: string | null;
  pet_id: string | null;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  service_type: string;
  status: BookingStatus;
  total_price: number | null;
  is_emergency: boolean;
  symptoms: string | null;
  confirmed_at: string | null;
  canceled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  // Joined
  owner_name: string | null;
  owner_avatar: string | null;
  provider_name: string | null;
  provider_avatar: string | null;
  pet_name: string | null;
  pet_species: string | null;
  pet_photo: string | null;
  // Events
  events: BookingEvent[];
}

export function useBookingDetail(bookingId: string | undefined, bookingType: BookingType = 'vet') {
  return useQuery({
    queryKey: ['booking-detail', bookingType, bookingId],
    queryFn: async (): Promise<BookingDetail | null> => {
      if (!bookingId) return null;

      const table = getBookingTable(bookingType);

      // Fetch booking
      const { data: booking, error } = await supabase
        .from(table)
        .select(
          `
          *,
          pet:pets!pet_id(name, species, photo_url),
          owner:profiles!owner_id(display_name, avatar_url),
          provider:service_providers!service_provider_id(display_name, avatar_url)
        `
        )
        .eq('id', bookingId)
        .single();

      if (error || !booking) return null;

      // Fetch events
      const { data: events } = await supabase
        .from('booking_events')
        .select('*')
        .eq('booking_type', bookingType)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      return {
        id: booking.id,
        booking_type: bookingType,
        owner_id: booking.owner_id,
        provider_id: booking.service_provider_id ?? booking.vet_id ?? null,
        pet_id: booking.pet_id ?? null,
        scheduled_date: booking.scheduled_date,
        start_time: booking.start_time ?? null,
        end_time: booking.end_time ?? null,
        service_type: booking.service_type ?? booking.training_type ?? '',
        status: booking.status,
        total_price: booking.total_price ?? null,
        is_emergency: booking.is_emergency ?? false,
        symptoms: booking.symptoms ?? null,
        confirmed_at: booking.confirmed_at ?? null,
        canceled_at: booking.canceled_at ?? null,
        cancellation_reason: booking.cancellation_reason ?? null,
        created_at: booking.created_at,
        owner_name: booking.owner?.display_name ?? null,
        owner_avatar: booking.owner?.avatar_url ?? null,
        provider_name: booking.provider?.display_name ?? null,
        provider_avatar: booking.provider?.avatar_url ?? null,
        pet_name: booking.pet?.name ?? null,
        pet_species: booking.pet?.species ?? null,
        pet_photo: booking.pet?.photo_url ?? null,
        events: (events ?? []) as BookingEvent[],
      };
    },
    enabled: !!bookingId,
    staleTime: 30_000,
  });
}
