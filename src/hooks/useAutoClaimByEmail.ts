import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

/**
 * Auto-claims orphaned pets whose `pending_owner_email` matches
 * the current user's verified email.
 *
 * Runs once per session on mount. Covers the case where:
 * - A vet created the pet with the owner's email
 * - The owner lost the invitation email
 * - The owner later creates an account with the same email
 *
 * For each unclaimed pet found, assigns owner_id and creates
 * the pet_vet_link (same logic as useClaimPetInvitation).
 */
export function useAutoClaimByEmail() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const processed = useRef(false);

  useEffect(() => {
    if (!user?.email || processed.current) return;
    processed.current = true;

    (async () => {
      try {
        // Find unclaimed pets matching this user's email
        const { data: pendingPets, error } = await sb
          .from('pets')
          .select('id, name, created_by_vet_id, owner_invitation_accepted_at')
          .eq('pending_owner_email', user.email!.toLowerCase())
          .is('owner_id', null)
          .is('owner_invitation_accepted_at', null);

        if (error || !pendingPets || pendingPets.length === 0) return;

        let claimedCount = 0;

        for (const pet of pendingPets) {
          // Claim: set owner_id
          const { error: updateErr } = await sb
            .from('pets')
            .update({
              owner_id: user.id,
              owner_invitation_accepted_at: new Date().toISOString(),
            })
            .eq('id', pet.id);

          if (updateErr) {
            console.error(`Auto-claim failed for pet ${pet.id}:`, updateErr);
            continue;
          }

          claimedCount++;

          // Create pet_vet_link if vet exists
          if (pet.created_by_vet_id) {
            try {
              const { data: vetProvider } = await supabase
                .from('service_providers')
                .select('id')
                .eq('user_id', pet.created_by_vet_id)
                .maybeSingle();

              if (vetProvider?.id) {
                await sb.from('pet_vet_links').upsert(
                  {
                    pet_id: pet.id,
                    owner_id: user.id,
                    provider_id: vetProvider.id,
                    status: 'active',
                    responded_at: new Date().toISOString(),
                  },
                  { onConflict: 'pet_id,provider_id' }
                );
              }
            } catch (linkErr) {
              console.error('pet_vet_link creation failed:', linkErr);
            }
          }
        }

        if (claimedCount > 0) {
          queryClient.invalidateQueries({ queryKey: ['pets'] });
          if (claimedCount === 1) {
            toast.success(
              `¡${pendingPets[0].name} te estaba esperando! Tu veterinario ya la registró para ti.`
            );
          } else {
            toast.success(
              `¡${claimedCount} mascotas te estaban esperando! Tus veterinarios ya las registraron para ti.`
            );
          }
        }
      } catch (err) {
        console.error('useAutoClaimByEmail error:', err);
      }
    })();
  }, [user, queryClient]);
}
