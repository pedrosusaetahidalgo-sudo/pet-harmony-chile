import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

/**
 * Procesa el query param ?co_owner=TOKEN al montar /home o /my-pets.
 *
 * Flujo:
 *  1. User recibe un link con ?co_owner=<token> (ej. via WhatsApp del dialog
 *     post-AddPet o action_url de una notificacion in-app).
 *  2. Si no esta logueado → ProtectedRoute lo manda a /auth con returnTo.
 *  3. Una vez dentro, este hook detecta el token y llama al RPC
 *     accept_co_owner_invitation (mig 20260523000000).
 *  4. Muestra toast OK + invalida caches + limpia el query param.
 *
 * Separado de useClaimPetInvitation (que es para transferir ownership
 * cuando el vet crea la mascota). Aqui NO cambia el owner — se agrega
 * un co-owner al pet_co_owners.
 */
export function useAutoAcceptCoOwnerInvitation() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    const token = searchParams.get('co_owner');
    if (!token || !user || processed.current) return;
    processed.current = true;

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).rpc('accept_co_owner_invitation', {
          p_token: token,
          p_user_id: user.id,
        });

        if (error) {
          logger.error('[co_owner_invite] RPC error:', error);
          toast.error('No pudimos procesar la invitacion', {
            description: 'El link puede haber expirado. Pedi uno nuevo.',
          });
          // Limpiar el token para no reintentar infinito
          searchParams.delete('co_owner');
          setSearchParams(searchParams, { replace: true });
          return;
        }

        const result = data as {
          success: boolean;
          error?: string;
          pet_id?: string;
          role?: string;
        };

        if (!result?.success) {
          const msg =
            result?.error === 'invalid_or_expired_token'
              ? 'Este link ya fue usado o expiro'
              : result?.error === 'invitation_for_another_user'
                ? 'Esta invitacion es para otra cuenta. Iniciá sesión con el email correcto.'
                : 'No pudimos aceptar la invitacion';
          toast.error(msg);
          searchParams.delete('co_owner');
          setSearchParams(searchParams, { replace: true });
          return;
        }

        toast.success('Invitacion aceptada', {
          description: 'Ya podes ver esta mascota en tus mascotas compartidas.',
        });

        // Refrescar caches relacionadas
        queryClient.invalidateQueries({ queryKey: ['shared-pets', user.id] });
        queryClient.invalidateQueries({ queryKey: ['co-owners'] });
        queryClient.invalidateQueries({ queryKey: ['pets'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });

        // Limpiar el token de la URL + navegar a la ficha si tenemos pet_id
        searchParams.delete('co_owner');
        setSearchParams(searchParams, { replace: true });
        if (result.pet_id) {
          navigate(`/ficha/${result.pet_id}`, { replace: true });
        }
      } catch (e) {
        logger.error('[co_owner_invite] unexpected error:', e);
        toast.error('Error inesperado al procesar la invitacion');
      }
    })();
  }, [searchParams, user, queryClient, navigate, setSearchParams]);
}
