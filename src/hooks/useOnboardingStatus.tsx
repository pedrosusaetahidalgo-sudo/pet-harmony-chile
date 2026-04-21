import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * useOnboardingStatus — fuente de verdad del gate post-signup.
 *
 * Auditoría top-tier 2026-04-20 (épica B.1).
 *
 * Lee `profiles.onboarding_completed_at`. Si es NULL y el user tiene rol
 * `owner`, el gate en ProtectedRoute lo redirige a `/onboarding-mascota`.
 *
 * Fast path — localStorage `pf_onboarding_complete`:
 *   OnboardingDuenoMinimal venía seteando esta key como bandera local.
 *   La conservamos como optimización: evita un flash de "loading" para
 *   users que ya completaron. Se sincroniza con DB cuando la query
 *   resuelve.
 *
 * Regla 9.7 (proteger users existentes): la migración
 * `20260714000000_onboarding_completed_at.sql` backfillea todos los
 * profiles existentes con created_at. Ningún user actual cae en el gate.
 */

const LOCAL_KEY = 'pf_onboarding_complete';

function readLocalFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(LOCAL_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeLocalFlag(value: boolean) {
  if (typeof window === 'undefined') return;
  try {
    if (value) localStorage.setItem(LOCAL_KEY, 'true');
    else localStorage.removeItem(LOCAL_KEY);
  } catch {
    // quota, private mode, etc. — silent
  }
}

export interface OnboardingStatus {
  completed: boolean;
  /** null = aún no determinado (query en curso). Solo uso en gate para
   *  diferenciar "aún no sé" de "sé que no lo completó". */
  completedAt: string | null;
}

export function useOnboardingStatus() {
  const { user } = useAuth();

  return useQuery<OnboardingStatus>({
    queryKey: ['onboarding-status', user?.id],
    enabled: !!user?.id,
    staleTime: 60 * 60 * 1000, // 1 hora: el flag solo cambia al completar
    gcTime: 24 * 60 * 60 * 1000,
    // initialData da una respuesta sincrónica si el user ya completó en
    // esta máquina. Cuando la query real resuelve, la reemplaza.
    initialData: readLocalFlag() ? { completed: true, completedAt: null } : undefined,
    queryFn: async () => {
      if (!user?.id) {
        return { completed: false, completedAt: null };
      }

      const { data, error } = await supabase
        .from('profiles')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select('onboarding_completed_at' as any)
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        // Fail-open: si la columna aún no existe (migración no aplicada) o
        // RLS falla, NO bloqueamos al user. Preferimos false negative (no
        // redirigir) sobre crear un loop.
        return { completed: true, completedAt: null };
      }

      const completedAt =
        (data as unknown as { onboarding_completed_at: string | null } | null)
          ?.onboarding_completed_at ?? null;
      const completed = !!completedAt;

      // Mantener localStorage sincronizado como fast path.
      if (completed) writeLocalFlag(true);

      return { completed, completedAt };
    },
  });
}

/**
 * Marca el onboarding como completado: actualiza localStorage + DB e
 * invalida la query. Llamar al final de cada flow (o en "Omitir").
 */
export async function markOnboardingComplete(
  userId: string,
  queryClient?: ReturnType<typeof useQueryClient>
) {
  writeLocalFlag(true);

  try {
    await supabase
      .from('profiles')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ onboarding_completed_at: new Date().toISOString() } as any)
      .eq('id', userId);
  } catch {
    // DB falla: el localStorage todavía se setea, así que el user no
    // queda atrapado. La próxima vez que inicie sesión y la DB responda,
    // se volverá a sincronizar.
  }

  queryClient?.invalidateQueries({ queryKey: ['onboarding-status', userId] });
}
