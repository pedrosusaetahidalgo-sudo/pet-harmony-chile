/**
 * useManadaAporteSummary — invoca la RPC `get_manada_aporte_summary` que
 * devuelve el resumen del aporte del user Manada al Fondo Paw Friend
 * Refugios (total CLP, count, refugio elegido, etc).
 *
 * Creado 2026-04-29 (Plan v5 Opcion 3).
 *
 * RPC retorna SETOF con 1 fila. Tomamos el primer elemento o null si vacio.
 * Tipos vienen sin generar — usamos shape explicito basado en la mig
 * `20260929000000_manada_fondo_refugios.sql`.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ManadaAporteSummary {
  user_id: string;
  total_aportado_clp: number;
  aportes_count: number;
  current_monthly_clp: number;
  preferred_shelter_id: string | null;
  preferred_shelter_name: string | null;
  preferred_shelter_slug: string | null;
  first_aporte_at: string | null;
  last_aporte_at: string | null;
}

export function useManadaAporteSummary(enabled: boolean) {
  return useQuery({
    queryKey: ['manada-aporte-summary'],
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async (): Promise<ManadaAporteSummary | null> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_manada_aporte_summary');
      if (error) throw error;
      const arr = Array.isArray(data) ? data : data ? [data] : [];
      return (arr[0] as ManadaAporteSummary | undefined) ?? null;
    },
  });
}
