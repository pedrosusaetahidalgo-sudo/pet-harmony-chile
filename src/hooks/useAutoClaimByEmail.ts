import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

/**
 * Auto-claims orphaned pets whose `pending_owner_email` matches
 * the current user's verified email.
 *
 * Uses the RPC `auto_claim_pets_by_email` that handles everything
 * in a single atomic transaction (assign owner + create vet links).
 *
 * Runs once per session on mount.
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
        const { data, error } = await supabase.rpc('auto_claim_pets_by_email', {
          p_user_id: user.id,
          p_email: user.email!,
        });

        if (error) {
          logger.error('auto_claim_pets_by_email RPC error:', error);
          return;
        }

        const result = data as {
          success: boolean;
          claimed_count: number;
          claimed_names: string[];
        };

        if (result.claimed_count > 0) {
          queryClient.invalidateQueries({ queryKey: ['pets'] });
          if (result.claimed_count === 1) {
            toast.success(
              `¡${result.claimed_names[0]} te estaba esperando! Tu veterinario ya la registró para ti.`
            );
          } else {
            toast.success(
              `¡${result.claimed_count} mascotas te estaban esperando! Tus veterinarios ya las registraron para ti.`
            );
          }
        }
      } catch (err) {
        logger.error('useAutoClaimByEmail error:', err);
      }
    })();
  }, [user, queryClient]);
}
