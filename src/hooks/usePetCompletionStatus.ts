/**
 * usePetCompletionStatus — owner-side del North Star §14.bis.6.
 *
 * Devuelve el progreso de la mascota individual hacia "ficha completa":
 *   - >=10 eventos timeline
 *   - en >=3 categorías distintas
 *   - Pet ID Card generada
 *
 * Sirve para motivar al dueño con un mini-dashboard en /home o ficha.
 * NO es métrica B2B — es feedback de progreso al usuario individual.
 *
 * Threshold del proyecto §14.bis.6 dice ">=50% de pets nuevas alcanzan
 * ficha completa en 90d". Cada dueño viendo su progreso ayuda a mover
 * esa aguja agregada.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  COMPLETION_CATEGORY_TARGET,
  COMPLETION_EVENT_TARGET,
  computeCompletionStatus,
} from '@/lib/completion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export interface PetCompletionStatus {
  // Conteos actuales
  event_count: number;
  category_count: number;
  has_id_card: boolean;
  // Targets
  event_target: number; // 10
  category_target: number; // 3
  // Estado consolidado
  is_complete: boolean;
  // Progreso 0-100 (3 dimensiones promediadas)
  progress_pct: number;
  // Categorías que faltan (para sugerencias)
  missing_categories: number;
  // Categorías que ya tiene
  categories_present: string[];
}

export function usePetCompletionStatus(petId: string | undefined) {
  return useQuery<PetCompletionStatus | null>({
    queryKey: ['pet-completion-status', petId],
    enabled: !!petId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!petId) return null;

      const [eventsRes, idCardRes] = await Promise.all([
        sb.from('pet_timeline_events').select('category').eq('pet_id', petId),
        sb.from('pet_id_cards').select('id', { count: 'exact', head: true }).eq('pet_id', petId),
      ]);

      const events = (eventsRes.data ?? []) as Array<{ category: string }>;
      const eventCount = events.length;
      const categoriesPresent = [...new Set(events.map((e) => e.category))];
      const categoryCount = categoriesPresent.length;
      const hasIdCard = (idCardRes.count ?? 0) > 0;

      // Lógica pura extraída a src/lib/completion.ts para test isolation
      const status = computeCompletionStatus({ eventCount, categoryCount, hasIdCard });

      return {
        event_count: eventCount,
        category_count: categoryCount,
        has_id_card: hasIdCard,
        event_target: COMPLETION_EVENT_TARGET,
        category_target: COMPLETION_CATEGORY_TARGET,
        is_complete: status.isComplete,
        progress_pct: status.progressPct,
        missing_categories: status.missingCategories,
        categories_present: categoriesPresent,
      };
    },
  });
}
