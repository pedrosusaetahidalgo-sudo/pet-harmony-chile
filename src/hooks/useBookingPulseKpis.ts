import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BookingPulseKpis {
  // Tasa de confirmacion: confirmados / (confirmados + cancelados + pendientes expirados) ultimos 7d
  confirmationRate7d: number; // 0-1
  // Tasa de no-show: no_show / (completados + no_show) ultimos 30d
  noShowRate30d: number;
  // Tasa de cancelacion: cancelados / total ultimos 7d
  cancelRate7d: number;
  // Pendientes mayores a 24h sin confirmar
  stalePending: number;
  // Citas hoy por status
  todayTotals: Record<string, number>;
  // Total de bookings ultimos 7d
  total7d: number;
  // Total de bookings ultimos 30d
  total30d: number;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function hoursAgoISO(n: number): string {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * KPIs para el widget "Pulso de reservas" del admin.
 * Lee de `all_bookings_view` (union de vet/walk/dogsitter/training bookings).
 * Si la vista no existe para algun tenant, cada query falla silencioso a 0.
 */
export function useBookingPulseKpis() {
  return useQuery({
    queryKey: ['admin-booking-pulse-kpis'],
    queryFn: async (): Promise<BookingPulseKpis> => {
      const d7 = daysAgo(7);
      const d30 = daysAgo(30);
      const staleThreshold = hoursAgoISO(24);
      const today = todayStr();

      const [last7dRes, last30dRes, staleRes, todayRes] = await Promise.all([
        supabase
          .from('all_bookings_view')
          .select('status', { count: 'exact' })
          .gte('created_at', d7),
        supabase
          .from('all_bookings_view')
          .select('status')
          .gte('created_at', d30)
          .in('status', ['completado', 'no_show']),
        supabase
          .from('all_bookings_view')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pendiente')
          .lt('created_at', staleThreshold),
        supabase.from('all_bookings_view').select('status').eq('scheduled_date', today),
      ]);

      // Calculo tasa de confirmacion (ultimos 7d)
      const last7d = last7dRes.data ?? [];
      const total7d = last7d.length;
      const confirmed7 = last7d.filter(
        (r) => r.status === 'confirmado' || r.status === 'completado' || r.status === 'en_curso'
      ).length;
      const confirmationRate7d = total7d === 0 ? 0 : confirmed7 / total7d;

      const cancelled7 = last7d.filter((r) => r.status === 'cancelado').length;
      const cancelRate7d = total7d === 0 ? 0 : cancelled7 / total7d;

      // Calculo no-show rate (ultimos 30d)
      const last30d = last30dRes.data ?? [];
      const completed30 = last30d.filter((r) => r.status === 'completado').length;
      const noShow30 = last30d.filter((r) => r.status === 'no_show').length;
      const denom30 = completed30 + noShow30;
      const noShowRate30d = denom30 === 0 ? 0 : noShow30 / denom30;

      const stalePending = staleRes.count ?? 0;

      // Totals hoy por status
      const todayTotals: Record<string, number> = {};
      for (const row of todayRes.data ?? []) {
        todayTotals[row.status] = (todayTotals[row.status] ?? 0) + 1;
      }

      return {
        confirmationRate7d,
        noShowRate30d,
        cancelRate7d,
        stalePending,
        todayTotals,
        total7d,
        total30d: last30d.length,
      };
    },
    staleTime: 60_000 * 5,
  });
}
