/**
 * completion — Helpers puros para calcular el progreso de "ficha completa"
 * (Refactor Maestro §14.bis.6 owner-side).
 *
 * Definición canónica de ficha completa:
 *   - >=10 eventos timeline
 *   - en >=3 categorías distintas
 *   - Pet ID Card generada
 *
 * Estos helpers son funciones puras (no dependen de React ni Supabase) para
 * que sean testeables en isolation. El hook `usePetCompletionStatus` los
 * usa para computar `progress_pct` y `is_complete` desde data raw.
 */

export const COMPLETION_EVENT_TARGET = 10;
export const COMPLETION_CATEGORY_TARGET = 3;

export interface CompletionInputs {
  eventCount: number;
  categoryCount: number;
  hasIdCard: boolean;
}

export interface CompletionOutput {
  isComplete: boolean;
  progressPct: number;
  missingCategories: number;
  missingEvents: number;
}

/**
 * Calcula el progreso 0-100 hacia ficha completa promediando 3 dimensiones:
 *   - eventos hacia eventTarget (cap 100%)
 *   - categorias hacia categoryTarget (cap 100%)
 *   - has_id_card (0% o 100%)
 */
export function computeCompletionStatus(input: CompletionInputs): CompletionOutput {
  const isComplete =
    input.eventCount >= COMPLETION_EVENT_TARGET &&
    input.categoryCount >= COMPLETION_CATEGORY_TARGET &&
    input.hasIdCard;

  const eventPct = Math.min(100, (input.eventCount / COMPLETION_EVENT_TARGET) * 100);
  const categoryPct = Math.min(100, (input.categoryCount / COMPLETION_CATEGORY_TARGET) * 100);
  const idCardPct = input.hasIdCard ? 100 : 0;

  return {
    isComplete,
    progressPct: Math.round((eventPct + categoryPct + idCardPct) / 3),
    missingCategories: Math.max(0, COMPLETION_CATEGORY_TARGET - input.categoryCount),
    missingEvents: Math.max(0, COMPLETION_EVENT_TARGET - input.eventCount),
  };
}

/**
 * Determina el tone visual segun progreso.
 * Usado por PetCompletionProgress para color/copy.
 */
export type CompletionTone = 'complete' | 'near' | 'progress' | 'starting';

export function pickCompletionTone(isComplete: boolean, progressPct: number): CompletionTone {
  if (isComplete) return 'complete';
  if (progressPct >= 80) return 'near';
  if (progressPct >= 30) return 'progress';
  return 'starting';
}
