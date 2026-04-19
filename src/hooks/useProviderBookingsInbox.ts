import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { BookingStatus } from '@/lib/bookingStateMachine';

export interface InboxBooking {
  id: string;
  booking_type: 'vet' | 'walk' | 'dogsitter' | 'training';
  owner_id: string;
  pet_id: string | null;
  pet_ids: string[] | null;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  service_type: string;
  status: BookingStatus;
  total_price: number | null;
  is_emergency: boolean;
  symptoms: string | null;
  confirmed_at: string | null;
  created_at: string;
  // Joined
  owner_name: string | null;
  owner_avatar: string | null;
  owner_phone: string | null;
  pet_name: string | null;
  pet_species: string | null;
  pet_photo: string | null;
}

interface InboxFilter {
  status?: BookingStatus | BookingStatus[];
  date?: string; // "YYYY-MM-DD" exacto
  fromDate?: string; // "YYYY-MM-DD" desde (inclusive)
  toDate?: string; // "YYYY-MM-DD" hasta (inclusive)
  serviceType?: string; // filtra por service_type exacto
  petId?: string; // filtra por pet_id exacto
  searchQuery?: string; // matchea en pet_name u owner_name (client-side)
}

export function useProviderBookingsInbox(providerId: string | undefined, filter: InboxFilter = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['provider-inbox', providerId, filter],
    queryFn: async (): Promise<InboxBooking[]> => {
      if (!providerId || !user) return [];

      // Vet bookings for this provider
      let query = supabase
        .from('vet_bookings')
        .select(
          `
          *,
          pet:pets!pet_id(name, species, photo_url),
          owner:profiles!owner_id(display_name, avatar_url, whatsapp_number)
        `
        )
        .eq('service_provider_id', providerId)
        .order('scheduled_date', { ascending: true });

      if (filter.status) {
        const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
        query = query.in('status', statuses);
      }

      if (filter.date) {
        query = query
          .gte('scheduled_date', filter.date + 'T00:00:00')
          .lt('scheduled_date', filter.date + 'T23:59:59');
      } else {
        if (filter.fromDate) {
          query = query.gte('scheduled_date', filter.fromDate);
        }
        if (filter.toDate) {
          query = query.lte('scheduled_date', filter.toDate + 'T23:59:59');
        }
      }

      if (filter.serviceType) {
        query = query.eq('service_type', filter.serviceType);
      }

      if (filter.petId) {
        query = query.eq('pet_id', filter.petId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = data ?? [];

      // Client-side search (pet_name OR owner_name contains the query, case-insensitive)
      const normalizedQuery = filter.searchQuery?.trim().toLowerCase() ?? '';
      const filtered = normalizedQuery
        ? rows.filter((row) => {
            const petName = (row.pet?.name ?? '').toLowerCase();
            const ownerName = (row.owner?.display_name ?? '').toLowerCase();
            return petName.includes(normalizedQuery) || ownerName.includes(normalizedQuery);
          })
        : rows;

      return filtered.map(
        (row): InboxBooking => ({
          id: row.id,
          booking_type: 'vet',
          owner_id: row.owner_id,
          pet_id: row.pet_id,
          pet_ids: [row.pet_id],
          scheduled_date: row.scheduled_date,
          start_time: row.start_time ?? null,
          end_time: row.end_time ?? null,
          service_type: row.service_type,
          status: row.status,
          total_price: row.total_price,
          is_emergency: row.is_emergency ?? false,
          symptoms: row.symptoms ?? null,
          confirmed_at: row.confirmed_at ?? null,
          created_at: row.created_at,
          owner_name: row.owner?.display_name ?? null,
          owner_avatar: row.owner?.avatar_url ?? null,
          owner_phone: row.owner?.whatsapp_number ?? null,
          pet_name: row.pet?.name ?? null,
          pet_species: row.pet?.species ?? null,
          pet_photo: row.pet?.photo_url ?? null,
        })
      );
    },
    enabled: !!providerId && !!user,
    staleTime: 30_000,
  });
}
