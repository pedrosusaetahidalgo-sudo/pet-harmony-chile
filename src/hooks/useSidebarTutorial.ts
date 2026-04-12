import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SECTION_ORDER, type SectionKey } from '@/lib/sidebarTutorialContent';

const STORAGE_KEY = 'pf_sidebar_tutorial';

interface TutorialState {
  completedSections: SectionKey[];
  dismissed: boolean;
}

function readLocal(): TutorialState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { completedSections: [], dismissed: false };
}

function writeLocal(state: TutorialState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/**
 * Hook que gestiona el progreso del tutorial guiado del sidebar.
 *
 * Persistencia dual: localStorage (instantáneo) + columna JSONB en profiles
 * (cross-device). El write a Supabase es fire-and-forget — si falla, el
 * localStorage ya tiene el estado correcto.
 */
export function useSidebarTutorial() {
  const { user } = useAuth();
  const [state, setState] = useState<TutorialState>(readLocal);
  const [loaded, setLoaded] = useState(false);

  // Hidratar desde Supabase al montar (merge con localStorage)
  useEffect(() => {
    if (!user?.id) {
      setLoaded(true);
      return;
    }

    supabase
      .from('profiles')
      .select('sidebar_tutorial_progress')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const remote = data?.sidebar_tutorial_progress as unknown as TutorialState | null;
        if (remote) {
          // Merge: si cualquiera de los dos tiene una sección completa, la mantenemos
          const merged: TutorialState = {
            completedSections: Array.from(
              new Set([...state.completedSections, ...remote.completedSections])
            ) as SectionKey[],
            dismissed: state.dismissed || remote.dismissed,
          };
          setState(merged);
          writeLocal(merged);
        }
        setLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const persist = useCallback(
    (next: TutorialState) => {
      setState(next);
      writeLocal(next);
      if (user?.id) {
        supabase
          .from('profiles')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ sidebar_tutorial_progress: next as any })
          .eq('id', user.id)
          .then(() => {});
      }
    },
    [user?.id]
  );

  /** Marcar una sección como completada */
  const completeSection = useCallback(
    (key: SectionKey) => {
      if (state.completedSections.includes(key)) return;
      const next: TutorialState = {
        ...state,
        completedSections: [...state.completedSections, key],
      };
      persist(next);
    },
    [state, persist]
  );

  /** Saltar todo el tutorial (dismiss) */
  const dismissAll = useCallback(() => {
    const next: TutorialState = {
      completedSections: [...SECTION_ORDER],
      dismissed: true,
    };
    persist(next);
  }, [persist]);

  /** ¿Esta sección está desbloqueada (tutorial completado)? */
  const isSectionUnlocked = useCallback(
    (key: SectionKey) => state.completedSections.includes(key) || state.dismissed,
    [state]
  );

  /** ¿El tutorial completo ya terminó? */
  const isAllComplete =
    state.dismissed || SECTION_ORDER.every((k) => state.completedSections.includes(k));

  /** Siguiente sección pendiente (para sugerir) */
  const nextPendingSection = SECTION_ORDER.find((k) => !state.completedSections.includes(k));

  return {
    loaded,
    completedSections: state.completedSections,
    isAllComplete,
    nextPendingSection,
    isSectionUnlocked,
    completeSection,
    dismissAll,
  };
}
