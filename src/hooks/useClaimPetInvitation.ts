import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * Hook que procesa el query param ?invitation=TOKEN
 * al montar MyPets o /home.
 *
 * Busca la mascota con ese owner_invitation_token,
 * la asigna al usuario actual (owner_id) y crea el pet_vet_link.
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any;

        // 1. Buscar mascota por invitation token
        const { data: pet, error: petErr } = await sb
          .from('pets')
          .select('id, name, owner_id, created_by_vet_id, owner_invitation_accepted_at')
          .eq('owner_invitation_token', invitationToken)
          .maybeSingle();

        if (petErr || !pet) {
          toast.error('El enlace de invitación no es válido o ya expiró');
          return;
        }

        // 2. Si ya fue reclamada, solo notificar
        if (pet.owner_invitation_accepted_at) {
          if (pet.owner_id === user.id) {
            toast.info(`${pet.name} ya está en tu lista de mascotas`);
          } else {
            toast.error('Esta mascota ya fue reclamada por otro usuario');
          }
          return;
        }

        // 3. Asignar owner_id al usuario actual
        const { error: updateErr } = await sb
          .from('pets')
          .update({
            owner_id: user.id,
            owner_invitation_accepted_at: new Date().toISOString(),
          })
          .eq('id', pet.id);

        if (updateErr) {
          toast.error('Error al reclamar la mascota. Intenta de nuevo.');
          console.error('Claim pet error:', updateErr);
          return;
        }

        // 4. Si hay un vet que creó el registro, crear/activar el pet_vet_link
        if (pet.created_by_vet_id) {
          try {
            const { data: vetProvider } = await supabase
              .from('service_providers')
              .select('id')
              .eq('user_id', pet.created_by_vet_id)
              .maybeSingle();

            if (vetProvider?.id) {
              const { error: linkErr } = await sb.from('pet_vet_links').upsert(
                {
                  pet_id: pet.id,
                  owner_id: user.id,
                  provider_id: vetProvider.id,
                  status: 'active',
                  responded_at: new Date().toISOString(),
                },
                { onConflict: 'pet_id,provider_id' }
              );
              if (linkErr) console.error('pet_vet_link upsert failed:', linkErr);
            }
          } catch (linkErr) {
            console.error('pet_vet_link creation failed:', linkErr);
          }
        }

        // 5. Create default reminders for the claimed pet (same as AddPet flow)
        try {
          const today = new Date();
          const in30days = new Date(today);
          in30days.setDate(today.getDate() + 30);
          const in90days = new Date(today);
          in90days.setDate(today.getDate() + 90);

          const { error: remErr } = await supabase.from('pet_reminders').insert([
            {
              pet_id: pet.id,
              owner_id: user.id,
              type: 'checkup',
              title: `Control veterinario de ${pet.name}`,
              due_date: in90days.toISOString().split('T')[0],
            },
            {
              pet_id: pet.id,
              owner_id: user.id,
              type: 'grooming',
              title: `Baño y peluquería de ${pet.name}`,
              due_date: in30days.toISOString().split('T')[0],
              is_recurring: true,
              recurrence_interval: 'monthly',
            },
          ]);
          if (remErr) {
            console.error('Auto-reminders on claim failed:', remErr);
            toast.warning(
              'Mascota reclamada, pero los recordatorios no se pudieron crear. Puedes agregarlos manualmente.'
            );
          }
        } catch (remErr) {
          console.error('Auto-reminders on claim failed:', remErr);
        }

        toast.success(`¡${pet.name} ahora es tuya! Tu veterinario ya tiene acceso a la ficha.`);
      } catch (err) {
        console.error('useClaimPetInvitation error:', err);
        toast.error('Error al procesar la invitación');
      } finally {
        // Limpiar el param de la URL
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('invitation');
        setSearchParams(newParams, { replace: true });
      }
    })();
  }, [user, searchParams, setSearchParams]);
}
