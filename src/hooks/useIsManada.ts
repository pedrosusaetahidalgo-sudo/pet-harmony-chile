/**
 * useIsManada — detecta si el user tiene una suscripcion activa al plan
 * Manada (`paw_manada`).
 *
 * Creado 2026-04-29 (Plan v5 Opcion 3, pivot freemium 3 tiers).
 *
 * La tabla `subscriptions` usa la columna `plan_type` (no `plan_id`) y vive
 * actualmente sin tipos generados — usamos `as any` igual que `AdminUsers.tsx`
 * y `AdminFinance.tsx` para no romper el flow tipado.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useIsManada(userId?: string | null) {
  return useQuery({
    queryKey: ['is-manada', userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async (): Promise<boolean> => {
      if (!userId) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('subscriptions') as any)
        .select('plan_type, status')
        .eq('user_id', userId)
        .eq('plan_type', 'paw_manada')
        .eq('status', 'active')
        .maybeSingle();
      if (error) {
        // No tirar — solo retorna false si hay error de read
        return false;
      }
      return !!data;
    },
  });
}
