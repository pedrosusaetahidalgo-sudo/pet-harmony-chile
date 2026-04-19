import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BookingType, BookingStatus } from '@/lib/bookingStateMachine';
import { getBookingTable } from '@/lib/bookingStateMachine';
import type { BookingEvent } from '@/hooks/useBookingEvents';

export type { BookingEvent };

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
  started_at: string | null;
  canceled_at: string | null;
  cancellation_reason: string | null;
  private_notes: string | null;
  follow_up_booking_id: string | null;
  created_at: string;
  // Joined
  owner_name: string | null;
  owner_avatar: string | null;
  provider_name: string | null;
  provider_avatar: string | null;
  pet_name: string | null;
  pet_species: string | null;
  pet_photo: string | null;
  // Notas clinicas linkeadas (via mig 20260612000000/004).
  // null si no hay nota linkeada todavia; { id } si ya fue creada.
  linked_medical_record_id: string | null;
  linked_vet_clinical_note_id: string | null;
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

      // Fetch events + linked clinical notes en paralelo.
      // Las notas linkeadas usan columnas agregadas en migs 20260612000000/004
      // (tipos TS sin regenerar -> cast via any).
      const [eventsRes, medicalRes, vetNoteRes] = await Promise.all([
        supabase
          .from('booking_events')
          .select('*')
          .eq('booking_type', bookingType)
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: true }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- booking_id agregada en mig 20260612000000
        (supabase.from('medical_records') as any)
          .select('id')
          .eq('booking_id', bookingId)
          .maybeSingle(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- booking_id agregada en mig 20260612000004
        (supabase.from('vet_clinical_notes') as any)
          .select('id')
          .eq('booking_id', bookingId)
          .maybeSingle(),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b = booking as any;

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
        started_at: b.started_at ?? null,
        canceled_at: booking.canceled_at ?? null,
        cancellation_reason: booking.cancellation_reason ?? null,
        private_notes: b.private_notes ?? null,
        follow_up_booking_id: b.follow_up_booking_id ?? null,
        created_at: booking.created_at,
        owner_name: booking.owner?.display_name ?? null,
        owner_avatar: booking.owner?.avatar_url ?? null,
        provider_name: booking.provider?.display_name ?? null,
        provider_avatar: booking.provider?.avatar_url ?? null,
        pet_name: booking.pet?.name ?? null,
        pet_species: booking.pet?.species ?? null,
        pet_photo: booking.pet?.photo_url ?? null,
        linked_medical_record_id: medicalRes.data?.id ?? null,
        linked_vet_clinical_note_id: vetNoteRes.data?.id ?? null,
        events: (eventsRes.data ?? []) as BookingEvent[],
      };
    },
    enabled: !!bookingId,
    staleTime: 30_000,
  });
}
