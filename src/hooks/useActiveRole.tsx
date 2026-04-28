/**
 * Context + localStorage para persistir el rol activo (dueño vs profesional).
 */
/* eslint-disable react-refresh/only-export-components -- Provider + hook custom conviven (patron estandar de React Context) */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ActiveRole = 'owner' | 'provider' | 'shelter';

interface ActiveRoleCtx {
  role: ActiveRole;
  isProvider: boolean;
  isProviderLoading: boolean;
  isProviderError: Error | null;
  isShelter: boolean;
  isShelterLoading: boolean;
  isShelterError: Error | null;
  toggle: () => void;
  setRole: (r: ActiveRole) => void;
}

const Ctx = createContext<ActiveRoleCtx>({
  role: 'owner',
  isProvider: false,
  isProviderLoading: true,
  isProviderError: null,
  isShelter: false,
  isShelterLoading: true,
  isShelterError: null,
  toggle: () => {},
  setRole: () => {},
});

export function ActiveRoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Check if user is a provider
  const {
    data: isProvider,
    isLoading: isProviderLoading,
    error: isProviderError,
  } = useQuery({
    queryKey: ['is-provider-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
  });

  // Check if user runs an adoption center (refugio/hogar de adopcion).
  // Tabla adoption_centers se crea en migracion 20260620000000 — mientras
  // no este aplicada, la query devuelve false gracefully (PGRST204 / 42P01).
  const {
    data: isShelter,
    isLoading: isShelterLoading,
    error: isShelterError,
  } = useQuery({
    queryKey: ['is-shelter-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('adoption_centers' as any) as any)
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return false;
        return !!data;
      } catch {
        return false;
      }
    },
    enabled: !!user?.id,
    retry: false,
  });

  const [role, setRoleState] = useState<ActiveRole>(() => {
    try {
      return (localStorage.getItem('pf_active_role') as ActiveRole) || 'owner';
    } catch {
      return 'owner';
    }
  });

  // If not a provider, force owner mode (fallback desde provider).
  useEffect(() => {
    if (isProvider === false && role === 'provider') {
      setRoleState('owner');
    }
  }, [isProvider, role]);

  // If not a shelter, force owner mode (fallback desde shelter).
  useEffect(() => {
    if (isShelter === false && role === 'shelter') {
      setRoleState('owner');
    }
  }, [isShelter, role]);

  const setRole = useCallback((r: ActiveRole) => {
    setRoleState(r);
    try {
      localStorage.setItem('pf_active_role', r);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  // Toggle ciclico: owner <-> provider es el comportamiento historico.
  // Si el user ademas es shelter, el toggle sigue alternando solo
  // owner/provider y el shelter se accede via setRole explicito desde la UI.
  const toggle = useCallback(
    () =>
      setRoleState((prev) => {
        const next = prev === 'owner' ? 'provider' : 'owner';
        try {
          localStorage.setItem('pf_active_role', next);
        } catch {
          /* localStorage unavailable */
        }
        return next;
      }),
    []
  );

  const value = useMemo(
    () => ({
      role,
      isProvider: !!isProvider,
      isProviderLoading: !!user?.id && isProviderLoading,
      isProviderError: isProviderError as Error | null,
      isShelter: !!isShelter,
      isShelterLoading: !!user?.id && isShelterLoading,
      isShelterError: isShelterError as Error | null,
      toggle,
      setRole,
    }),
    [
      role,
      isProvider,
      user?.id,
      isProviderLoading,
      isProviderError,
      isShelter,
      isShelterLoading,
      isShelterError,
      toggle,
      setRole,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useActiveRole() {
  return useContext(Ctx);
}
