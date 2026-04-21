import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  computeSlotsForRange,
  type AvailabilityRule,
  type AvailabilityException,
  type ExistingBooking,
  type ComputedSlot,
} from '@/lib/availabilitySlots';
import { format, addDays } from 'date-fns';
import { logger } from '@/lib/logger';

interface UseAvailableSlotsOptions {
  providerId: string | undefined;
  serviceType?: string;
  fromDate?: Date;
  days?: number;
  isEmergency?: boolean;
}

/**
 * Fila devuelta por rpc_get_available_slots_range (CC-17).
 * Postgres serializa TIME como "HH:mm:ss" — recortamos a "HH:mm".
 */
interface RpcSlotRow {
  slot_date: string; // "YYYY-MM-DD"
  slot_start: string; // "HH:mm:ss"
  slot_end: string;
  capacity: number;
  booked: number;
  available: boolean;
}

function trimTime(t: string | null | undefined): string {
  if (!t) return '';
  // "14:00:00" → "14:00"
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function groupRpcRowsByDate(rows: RpcSlotRow[]): { date: string; slots: ComputedSlot[] }[] {
  const byDate = new Map<string, ComputedSlot[]>();
  for (const r of rows) {
    const date = r.slot_date;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push({
      date,
      start: trimTime(r.slot_start),
      end: trimTime(r.slot_end),
      capacity: r.capacity,
      booked: Number(r.booked), // bigint llega como string en algunos drivers
      available: r.available,
    });
  }
  return Array.from(byDate.entries())
    .map(([date, slots]) => ({ date, slots }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Hook que expone slots disponibles del provider.
 *
 * Fase 2 Booking V3 (CC-20): intenta rpc_get_available_slots_range
 * (server-authoritative, respeta min_lead_time + emergency flag +
 * cuenta real de bookings via v_all_bookings). Si la RPC no está
 * desplegada aún o falla, cae al path client-side anterior.
 *
 * Esto respeta la regla de rollout incremental (memoria
 * feedback_no_global_jwt_flip): la migración a RPC es gradual y
 * no rompe la app si Pedro aún no aplicó las migraciones SQL.
 */
export function useAvailableSlots({
  providerId,
  serviceType,
  fromDate = new Date(),
  days = 30,
  isEmergency = false,
}: UseAvailableSlotsOptions) {
  return useQuery({
    queryKey: [
      'available-slots',
      providerId,
      serviceType,
      format(fromDate, 'yyyy-MM-dd'),
      days,
      isEmergency,
    ],
    queryFn: async () => {
      if (!providerId) return [];

      const dateFrom = format(fromDate, 'yyyy-MM-dd');
      const dateTo = format(addDays(fromDate, days), 'yyyy-MM-dd');

      // ─── Path A: RPC server-authoritative (preferido) ───
      try {
        const { data: rpcRows, error: rpcErr } = await supabase.rpc(
          'rpc_get_available_slots_range',
          {
            p_provider_id: providerId,
            p_date_from: dateFrom,
            p_date_to: dateTo,
            p_service_type: serviceType ?? null,
            p_is_emergency: isEmergency,
          }
        );

        if (!rpcErr && Array.isArray(rpcRows)) {
          return groupRpcRowsByDate(rpcRows as RpcSlotRow[]);
        }

        // Si la RPC no existe (migración pendiente) o falla con error
        // de permisos/firma, caemos al path cliente. Logueamos debug
        // pero NO error (esperado durante ventana de deploy).
        if (rpcErr) {
          logger.debug('[useAvailableSlots] RPC fallback:', rpcErr.message);
        }
      } catch (err) {
        logger.debug('[useAvailableSlots] RPC threw, fallback to client:', err);
      }

      // ─── Path B: Fallback client-side (comportamiento previo) ───
      // Se mantiene para que la app funcione mientras Pedro despliega
      // las migraciones 20260725000003 + 20260725000004.
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

      const firstError = rulesRes.error ?? exceptionsRes.error ?? bookingsRes.error;
      if (firstError) {
        throw firstError;
      }

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
