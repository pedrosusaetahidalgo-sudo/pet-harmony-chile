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

type ActiveRole = 'owner' | 'provider';

interface ActiveRoleCtx {
  role: ActiveRole;
  isProvider: boolean;
  isProviderLoading: boolean;
  isProviderError: Error | null;
  toggle: () => void;
  setRole: (r: ActiveRole) => void;
}

const Ctx = createContext<ActiveRoleCtx>({
  role: 'owner',
  isProvider: false,
  isProviderLoading: true,
  isProviderError: null,
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

  const [role, setRoleState] = useState<ActiveRole>(() => {
    try {
      return (localStorage.getItem('pf_active_role') as ActiveRole) || 'owner';
    } catch {
      return 'owner';
    }
  });

  // If not a provider, force owner mode
  useEffect(() => {
    if (isProvider === false && role === 'provider') {
      setRoleState('owner');
    }
  }, [isProvider, role]);

  const setRole = useCallback((r: ActiveRole) => {
    setRoleState(r);
    try {
      localStorage.setItem('pf_active_role', r);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

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
      toggle,
      setRole,
    }),
    [role, isProvider, user?.id, isProviderLoading, isProviderError, toggle, setRole]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useActiveRole() {
  return useContext(Ctx);
}
