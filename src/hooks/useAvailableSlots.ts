import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  computeSlotsForRange,
  type AvailabilityRule,
  type AvailabilityException,
  type ExistingBooking,
} from '@/lib/availabilitySlots';
import { format, addDays } from 'date-fns';

interface UseAvailableSlotsOptions {
  providerId: string | undefined;
  serviceType?: string;
  fromDate?: Date;
  days?: number;
}

export function useAvailableSlots({
  providerId,
  serviceType,
  fromDate = new Date(),
  days = 30,
}: UseAvailableSlotsOptions) {
  return useQuery({
    queryKey: ['available-slots', providerId, serviceType, format(fromDate, 'yyyy-MM-dd'), days],
    queryFn: async () => {
      if (!providerId) return [];

      const dateFrom = format(fromDate, 'yyyy-MM-dd');
      const dateTo = format(addDays(fromDate, days), 'yyyy-MM-dd');

      // Fetch rules, exceptions, and existing bookings in parallel
      const [rulesRes, exceptionsRes, bookingsRes] = await Promise.all([
        supabase
          .from('provider_availability_rules')
          .select('*')
          .eq('provider_id', providerId)
          .eq('is_active', true),

        supabase
          .from('provider_availability_exceptions')
          .select('*')
          .eq('provider_id', providerId)
          .gte('exception_date', dateFrom)
          .lte('exception_date', dateTo),

        supabase
          .from('vet_bookings')
          .select('scheduled_date, start_time, end_time, status')
          .eq('service_provider_id', providerId)
          .gte('scheduled_date', dateFrom)
          .lte('scheduled_date', dateTo)
          .not('status', 'in', '("cancelado","no_show")'),
      ]);

      const rules: AvailabilityRule[] = rulesRes.data ?? [];
      const exceptions: AvailabilityException[] = exceptionsRes.data ?? [];
      const bookings: ExistingBooking[] = (bookingsRes.data ?? []).map((b) => ({
        scheduled_date: typeof b.scheduled_date === 'string' ? b.scheduled_date.split('T')[0] : '',
        start_time: b.start_time,
        end_time: b.end_time,
        status: b.status,
      }));

      return computeSlotsForRange(fromDate, days, rules, exceptions, bookings, serviceType);
    },
    enabled: !!providerId,
    staleTime: 60_000, // 1 min
  });
}
