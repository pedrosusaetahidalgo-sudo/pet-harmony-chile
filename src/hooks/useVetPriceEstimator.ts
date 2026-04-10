import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type VetServiceType =
  | 'consulta_general'
  | 'vacuna'
  | 'desparasitacion'
  | 'cirugia_menor'
  | 'peluqueria'
  | 'urgencia'
  | 'teleconsulta'
  | 'control_sano'
  | 'esterilizacion'
  | 'limpieza_dental';

export interface VetPriceStats {
  comuna: string;
  service_type: VetServiceType;
  sample_size: number;
  min_price: number;
  max_price: number;
  p25_price: number;
  median_price: number;
  p75_price: number;
}

export const VET_SERVICE_LABELS: Record<VetServiceType, string> = {
  consulta_general: 'Consulta general',
  vacuna: 'Vacuna',
  desparasitacion: 'Desparasitación',
  cirugia_menor: 'Cirugía menor',
  peluqueria: 'Peluquería',
  urgencia: 'Urgencia',
  teleconsulta: 'Teleconsulta',
  control_sano: 'Control sano',
  esterilizacion: 'Esterilización',
  limpieza_dental: 'Limpieza dental',
};

export const VET_SERVICE_ORDER: VetServiceType[] = [
  'consulta_general',
  'control_sano',
  'vacuna',
  'desparasitacion',
  'teleconsulta',
  'peluqueria',
  'cirugia_menor',
  'urgencia',
  'esterilizacion',
  'limpieza_dental',
];

/**
 * Hook que consulta la vista vet_prices_by_comuna.
 * Si recibe `comuna` filtra por esa comuna; si no, devuelve todas
 * las filas (util para una vista comparativa global).
 *
 * Cache react-query 10 min.
 */
export function useVetPriceEstimator(comuna?: string) {
  const query = useQuery({
    queryKey: ['vet-price-estimator', comuna ?? 'all'],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<VetPriceStats[]> => {
      let q = supabase.from('vet_prices_by_comuna').select('*');
      if (comuna) q = q.eq('comuna', comuna);
      const { data, error } = await q;
      if (error) {
        // Si la vista todavia no existe (migracion sin aplicar), no
        // rompemos la UI: devolvemos lista vacia.
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return [];
        }
        throw error;
      }
      return (data ?? []) as VetPriceStats[];
    },
  });

  const byService = new Map<VetServiceType, VetPriceStats>();
  for (const row of query.data ?? []) {
    // Si vino sin filtro de comuna y hay duplicados por servicio,
    // priorizamos el de la comuna actual; sino se queda el primero.
    if (!byService.has(row.service_type)) {
      byService.set(row.service_type, row);
    }
  }

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    byService,
  };
}
