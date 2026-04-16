import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { BookingType, BookingStatus } from '@/lib/bookingStateMachine';

export interface BookingView {
  id: string;
  booking_type: BookingType;
  owner_id: string;
  provider_id: string | null;
  pet_id: string | null;
  pet_ids: string[] | null;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  service_type: string;
  status: BookingStatus;
  total_price: number | null;
  payment_status: string | null;
  is_emergency: boolean;
  confirmed_at: string | null;
  canceled_at: string | null;
  cancellation_reason: string | null;
  reminder_24h_sent: boolean | null;
  reminder_2h_sent: boolean | null;
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  provider_name?: string;
  provider_avatar?: string;
  pet_name?: string;
  pet_species?: string;
  pet_photo?: string;
}

interface UseMyBookingsOptions {
  status?: BookingStatus | BookingStatus[];
  bookingType?: BookingType;
  from?: string;
  to?: string;
}

export function useMyBookingsV2(options: UseMyBookingsOptions = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-bookings', user?.id, options],
    queryFn: async (): Promise<BookingView[]> => {
      if (!user) return [];

      // Query each booking table and merge results
      const results: BookingView[] = [];

      // Vet bookings
      if (!options.bookingType || options.bookingType === 'vet') {
        let query = supabase
          .from('vet_bookings')
          .select(
            `
            *,
            pet:pets!pet_id(name, species, photo_url),
            provider:service_providers!service_provider_id(display_name, avatar_url)
          `
          )
          .eq('owner_id', user.id)
          .order('scheduled_date', { ascending: false });

        if (options.status) {
          const statuses = Array.isArray(options.status) ? options.status : [options.status];
          query = query.in('status', statuses);
        }
        if (options.from) query = query.gte('scheduled_date', options.from);
        if (options.to) query = query.lte('scheduled_date', options.to);

        const { data } = await query;
        for (const row of data ?? []) {
          results.push({
            id: row.id,
            booking_type: 'vet',
            owner_id: row.owner_id,
            provider_id: row.service_provider_id ?? row.vet_id,
            pet_id: row.pet_id,
            pet_ids: [row.pet_id],
            scheduled_date: row.scheduled_date,
            start_time: row.start_time ?? null,
            end_time: row.end_time ?? null,
            service_type: row.service_type,
            status: row.status,
            total_price: row.total_price,
            payment_status: row.payment_status,
            is_emergency: row.is_emergency ?? false,
            confirmed_at: row.confirmed_at ?? null,
            canceled_at: row.canceled_at ?? null,
            cancellation_reason: row.cancellation_reason ?? null,
            reminder_24h_sent: row.reminder_24h_sent ?? null,
            reminder_2h_sent: row.reminder_2h_sent ?? null,
            google_event_id: row.google_event_id ?? null,
            created_at: row.created_at,
            updated_at: row.updated_at,
            provider_name: row.provider?.display_name ?? undefined,
            provider_avatar: row.provider?.avatar_url ?? undefined,
            pet_name: row.pet?.name ?? undefined,
            pet_species: row.pet?.species ?? undefined,
            pet_photo: row.pet?.photo_url ?? undefined,
          });
        }
      }

      // Walk bookings
      if (!options.bookingType || options.bookingType === 'walk') {
        let query = supabase
          .from('walk_bookings')
          .select('*')
          .eq('owner_id', user.id)
          .order('scheduled_date', { ascending: false });

        if (options.status) {
          const statuses = Array.isArray(options.status) ? options.status : [options.status];
          query = query.in('status', statuses);
        }

        const { data } = await query;
        for (const row of data ?? []) {
          results.push({
            id: row.id,
            booking_type: 'walk',
            owner_id: row.owner_id,
            provider_id: row.walker_id,
            pet_id: null,
            pet_ids: row.pet_ids ?? [],
            scheduled_date: row.scheduled_date,
            start_time: row.start_time ?? null,
            end_time: row.end_time ?? null,
            service_type: row.service_type ?? 'walk',
            status: row.status,
            total_price: row.total_price,
            payment_status: row.payment_status,
            is_emergency: false,
            confirmed_at: row.confirmed_at ?? null,
            canceled_at: row.canceled_at ?? null,
            cancellation_reason: row.cancellation_reason ?? null,
            reminder_24h_sent: row.reminder_24h_sent ?? null,
            reminder_2h_sent: row.reminder_2h_sent ?? null,
            google_event_id: row.google_event_id ?? null,
            created_at: row.created_at,
            updated_at: row.updated_at,
          });
        }
      }

      // Training bookings
      if (!options.bookingType || options.bookingType === 'training') {
        let query = supabase
          .from('training_bookings')
          .select('*')
          .eq('owner_id', user.id)
          .order('scheduled_date', { ascending: false });

        if (options.status) {
          const statuses = Array.isArray(options.status) ? options.status : [options.status];
          query = query.in('status', statuses);
        }

        const { data } = await query;
        for (const row of data ?? []) {
          results.push({
            id: row.id,
            booking_type: 'training',
            owner_id: row.owner_id,
            provider_id: row.trainer_id,
            pet_id: row.pet_id,
            pet_ids: [row.pet_id],
            scheduled_date: row.scheduled_date,
            start_time: row.start_time ?? null,
            end_time: row.end_time ?? null,
            service_type: row.training_type ?? 'training',
            status: row.status,
            total_price: row.total_price,
            payment_status: row.payment_status,
            is_emergency: false,
            confirmed_at: row.confirmed_at ?? null,
            canceled_at: row.canceled_at ?? null,
            cancellation_reason: row.cancellation_reason ?? null,
            reminder_24h_sent: row.reminder_24h_sent ?? null,
            reminder_2h_sent: row.reminder_2h_sent ?? null,
            google_event_id: row.google_event_id ?? null,
            created_at: row.created_at,
            updated_at: row.updated_at,
          });
        }
      }

      // Dogsitter bookings
      if (!options.bookingType || options.bookingType === 'dogsitter') {
        let query = supabase
          .from('dogsitter_bookings')
          .select('*')
          .eq('owner_id', user.id)
          .order('start_date', { ascending: false });

        if (options.status) {
          const statuses = Array.isArray(options.status) ? options.status : [options.status];
          query = query.in('status', statuses);
        }

        const { data } = await query;
        for (const row of data ?? []) {
          results.push({
            id: row.id,
            booking_type: 'dogsitter',
            owner_id: row.owner_id,
            provider_id: row.dogsitter_id,
            pet_id: null,
            pet_ids: row.pet_ids ?? [],
            scheduled_date: row.start_date,
            start_time: null,
            end_time: null,
            service_type: row.service_type ?? 'dogsitter',
            status: row.status,
            total_price: row.total_price,
            payment_status: row.payment_status,
            is_emergency: false,
            confirmed_at: row.confirmed_at ?? null,
            canceled_at: row.canceled_at ?? null,
            cancellation_reason: row.cancellation_reason ?? null,
            reminder_24h_sent: row.reminder_24h_sent ?? null,
            reminder_2h_sent: row.reminder_2h_sent ?? null,
            google_event_id: row.google_event_id ?? null,
            created_at: row.created_at,
            updated_at: row.updated_at,
          });
        }
      }

      // Sort all results by scheduled_date descending
      return results.sort(
        (a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
      );
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}
