/**
 * Helper centralizado de tracking para los flags del Refactor Maestro 2026-04-23.
 *
 * Todos los eventos se prefijan `refactor.fase_0.*` para poder filtrar fácilmente
 * en PostHog/Firebase y medir adopción real de cada feature flag.
 *
 * Uso:
 *   import { trackRefactor } from '@/lib/refactorAnalytics';
 *   trackRefactor('home_pet_focus.viewed', { pet_count: 2 });
 *
 * Eventos canónicos definidos en este archivo. NO usar strings ad-hoc en
 * callsites: agregar acá la constante para que el catálogo quede en un solo lugar.
 */
import { track } from './analytics';

/** Eventos del refactor agrupados por feature flag. */
export const RefactorEvent = {
  // BOTTOM_TAB_V2
  bottomTabV2Shown: 'bottom_tab_v2.shown',
  bottomTabV2Tapped: 'bottom_tab_v2.tapped',

  // HOME_PET_FOCUS
  homePetFocusViewed: 'home_pet_focus.viewed',
  homePetFocusEmptyState: 'home_pet_focus.empty_state',

  // QUICK_ACTIONS_HUB
  quickActionTapped: 'quick_action.tapped',
  quickActionWeightSaved: 'quick_action.weight.saved',
  quickActionSymptomSaved: 'quick_action.symptom.saved',

  // OWNER_AUDIO_NOTES
  audioNoteOpened: 'audio_note.opened',
  audioNoteRecorded: 'audio_note.recorded',
  audioNoteSaved: 'audio_note.saved',

  // FICHA_HISTORIA_TAB
  fichaTabViewed: 'ficha.tab.viewed',

  // PET_ID_CARD_V1
  petIdCardOpened: 'pet_id_card.opened',
  petIdCardGenerated: 'pet_id_card.generated',
  petIdCardShared: 'pet_id_card.shared',

  // ADOPTION_UNIFIED_FEED
  adoptionFeedViewed: 'adoption.feed.viewed',
  adoptionFiltersApplied: 'adoption.filters.applied',
  adoptionInterestExpressed: 'adoption.interest.expressed',

  // ADOPTION_PROCESSES_V1
  shelterKanbanViewed: 'shelter.kanban.viewed',
  adoptionProcessStatusChanged: 'adoption.process.status_changed',
  adoptionProcessTransferred: 'adoption.process.transferred',
  shelterOnboardingCompleted: 'shelter.onboarding.completed',
  myAdoptionsViewed: 'my_adoptions.viewed',

  // PAW_POINTS_CANONICAL
  pawPointsAwarded: 'paw_points.canonical.awarded',
  pawPointsActionDeprecated: 'paw_points.deprecated_action.skipped',

  // ONBOARDING_V2_MINIMAL
  onboardingV2Started: 'onboarding_v2.started',
  onboardingV2StepCompleted: 'onboarding_v2.step_completed',
  onboardingV2Completed: 'onboarding_v2.completed',
} as const;

export type RefactorEventName = (typeof RefactorEvent)[keyof typeof RefactorEvent];

/**
 * Dispara un evento del refactor con prefijo `refactor.fase_0.*` y metadata
 * estándar. Las propiedades son opcionales; el helper inyecta `phase` para
 * que sea fácil filtrar en dashboards.
 */
export function trackRefactor(
  event: RefactorEventName,
  properties?: Record<string, unknown>
): void {
  track({
    event: `refactor.fase_0.${event}`,
    properties: {
      ...properties,
      refactor_phase: 'fase_0',
    },
  });
}
