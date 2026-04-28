import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { track, EVENTS } from '@/lib/analytics';

/**
 * Hook que procesa el query param ?invitation=TOKEN
 * al montar MyPets o /home.
 *
 * Usa el RPC `claim_pet_by_invitation` que ejecuta los 5 pasos
 * (asignar owner, crear pet_vet_link, crear reminders) en una
 * sola transacción atómica.
 */
export function useClaimPetInvitation() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    const invitationToken = searchParams.get('invitation');
    if (!invitationToken || !user || processed.current) return;
    processed.current = true;

    (async () => {
      try {
        const { data, error } = await supabase.rpc('claim_pet_by_invitation', {
          p_invitation_token: invitationToken,
          p_user_id: user.id,
        });

        if (error) {
          console.error('Claim pet RPC error:', error);
          // Sprint 1 P1 FEAT-010: track failure para medir conversion del loop viral.
          track({
            event: EVENTS.PET_CLAIM_FAILED,
            properties: { error_code: 'rpc_error', message: error.message ?? null },
          });
          toast.error('Error al procesar la invitación');
          return;
        }

        const result = data as {
          success: boolean;
          error?: string;
          pet_name?: string;
          vet_linked?: boolean;
        };

        if (!result.success) {
          // Sprint 1 P1 FEAT-010: track cada modo de fallo. Permite separar
          // tokens expirados (UX issue) de "ya reclamada" (race / duplicado).
          track({
            event: EVENTS.PET_CLAIM_FAILED,
            properties: { error_code: result.error ?? 'unknown' },
          });
          switch (result.error) {
            case 'invalid_token':
              toast.error('El enlace de invitación no es válido o ya expiró');
              break;
            case 'already_yours':
              toast.info(`${result.pet_name} ya está en tu lista de mascotas`);
              break;
            case 'claimed_by_other':
              toast.error('Esta mascota ya fue reclamada por otro usuario');
              break;
            default:
              toast.error('Error al reclamar la mascota');
          }
          return;
        }

        // Sprint 1 P1 FEAT-010: success — track loop viral (vet → dueno → vet).
        // vet_linked flag permite medir que % de invitaciones cierran el loop
        // owner+vet, vs reclamacion solo del dueno.
        track({
          event: EVENTS.PET_CLAIMED,
          properties: { vet_linked: !!result.vet_linked },
        });
        const vetMsg = result.vet_linked ? ' Tu veterinario ya tiene acceso a la ficha.' : '';
        toast.success(`¡${result.pet_name} ahora es tuya!${vetMsg}`);
      } catch (err) {
        console.error('useClaimPetInvitation error:', err);
        track({
          event: EVENTS.PET_CLAIM_FAILED,
          properties: { error_code: 'exception' },
        });
        toast.error('Error al procesar la invitación');
      } finally {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('invitation');
        setSearchParams(newParams, { replace: true });
      }
    })();
  }, [user, searchParams, setSearchParams]);
}
