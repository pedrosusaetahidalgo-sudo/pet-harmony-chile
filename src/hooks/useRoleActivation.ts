/**
 * useRoleActivation — hook para finalizar la activación de un rol nuevo.
 *
 * Sprint 1 P2 ARCH-003 (2026-04-28): patrón duplicado en BecomeProviderDialog
 * y BecomeShelterDialog. El "post-submit" de ambos hace exactamente lo mismo:
 *   1. Invalidar queries del rol (`is-provider-role`, `is-shelter-role`).
 *   2. Setear `activeRole` en el contexto local.
 *   3. Cerrar el dialog (callback opcional `onClose`).
 *   4. Mostrar toast.success.
 *   5. Navegar al dashboard del rol.
 *
 * Encapsular esto en un hook hace que un Dialog futuro (vet partner / shelter
 * v2 / paw voice activación) lo reuse en una línea.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useActiveRole, type ActiveRole } from '@/hooks/useActiveRole';

export interface ActivateRoleOptions {
  /** Toast.success mensaje al finalizar. */
  successMessage: string;
  /** Path al que navegamos tras activar (ej `/provider/dashboard`). */
  navigateTo: string;
  /** Query keys de react-query a invalidar. Default: la convencion `is-{role}-role`. */
  invalidateQueryKeys?: ReadonlyArray<readonly unknown[]>;
  /** Callback opcional (ej `onOpenChange(false)` para cerrar el Dialog). */
  onClose?: () => void;
}

/**
 * Devuelve una función `activate(role, options)` que ejecuta el flujo
 * post-submit. Llamar después del INSERT/UPSERT exitoso.
 *
 * @example
 *   const activate = useRoleActivation();
 *   // dentro del handleSubmit:
 *   await supabase.from('service_providers').insert(...)
 *   await activate('provider', {
 *     successMessage: '¡Bienvenido! Tu perfil profesional está activo.',
 *     navigateTo: '/provider/dashboard',
 *     invalidateQueryKeys: [['is-provider-role'], ['my-provider-profile']],
 *     onClose: () => onOpenChange(false),
 *   });
 */
export function useRoleActivation() {
  const queryClient = useQueryClient();
  const { setRole } = useActiveRole();
  const navigate = useNavigate();

  return async function activate(role: ActiveRole, options: ActivateRoleOptions): Promise<void> {
    const { successMessage, navigateTo, invalidateQueryKeys, onClose } = options;

    // Default: invalidar la query de detección de rol. Suficiente para
    // que `useIsProvider`/`useIsShelter` re-fetch al volver al dashboard.
    const keysToInvalidate = invalidateQueryKeys ?? [[`is-${role}-role`]];

    await Promise.all(
      keysToInvalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
    );

    setRole(role);
    onClose?.();
    toast.success(successMessage);
    navigate(navigateTo);
  };
}
