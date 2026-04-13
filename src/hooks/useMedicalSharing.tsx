/**
 * Hook for managing medical record sharing with vets
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePlan } from './usePlan';
import { toast } from 'sonner';
import { describeSupabaseError } from '@/lib/supabaseErrors';

export interface ShareToken {
  id: string;
  pet_id: string;
  owner_id: string;
  token: string;
  expires_at: string;
  is_revoked: boolean;
  created_at: string;
  last_accessed_at: string | null;
  target_provider_id: string | null;
}

interface CreateTokenArgs {
  expiryDays?: number;
  targetProviderId?: string | null;
}

const DEFAULT_EXPIRY_DAYS = 30;

/**
 * Hook for managing medical record sharing
 */
export const useMedicalSharing = (petId?: string) => {
  const { user } = useAuth();
  const { checkAccess } = usePlan();
  const queryClient = useQueryClient();

  // List share tokens for a pet
  const { data: tokens, isLoading } = useQuery({
    queryKey: ['medical-share-tokens', petId],
    queryFn: async () => {
      if (!petId) return [];

      const { data, error } = await supabase
        .from('medical_share_tokens')
        .select('*')
        .eq('pet_id', petId)
        .eq('is_revoked', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShareToken[];
    },
    enabled: !!petId,
  });

  // Create share token
  const createShareToken = useMutation({
    mutationFn: async (args: CreateTokenArgs | number = {}) => {
      if (!user || !petId) throw new Error('Usuario o mascota no especificada');

      // Enforce share_clinical plan limit
      const activeTokens = (tokens || []).length;
      const access = checkAccess('share_clinical', activeTokens);
      if (!access.allowed) {
        throw new Error(access.reason || 'Llegaste al límite de fichas compartidas de tu plan');
      }

      // Back-compat: algunos callers pasaban `expiryDays` directo como numero.
      const { expiryDays = DEFAULT_EXPIRY_DAYS, targetProviderId = null } =
        typeof args === 'number' ? { expiryDays: args } : args;

      // Generate token (simple random string)
      const tokenData = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 32);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const { data, error } = await supabase
        .from('medical_share_tokens')
        .insert({
          pet_id: petId,
          owner_id: user.id,
          token: tokenData,
          expires_at: expiresAt.toISOString(),
          target_provider_id: targetProviderId,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as ShareToken;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['medical-share-tokens', petId] });
      toast.success('Enlace de compartir creado');
      return data;
    },
    onError: (error: unknown) => {
      toast.error('Error al crear enlace de compartir', {
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
      });
    },
  });

  // Revoke share token
  const revokeToken = useMutation({
    mutationFn: async (tokenId: string) => {
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('medical_share_tokens')
        .update({ is_revoked: true })
        .eq('id', tokenId)
        .eq('owner_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-share-tokens', petId] });
      toast.success('Enlace revocado');
    },
    onError: (error: unknown) => {
      toast.error('Error al revocar enlace', {
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
      });
    },
  });

  // Get share URL
  const getShareUrl = (token: string): string => {
    return `${window.location.origin}/medical-share/${token}`;
  };

  const activeTokens = (tokens || []).length;
  const shareAccess = checkAccess('share_clinical', activeTokens);

  return {
    tokens,
    isLoading,
    createShareToken: createShareToken.mutateAsync,
    isCreating: createShareToken.isPending,
    revokeToken: revokeToken.mutateAsync,
    isRevoking: revokeToken.isPending,
    getShareUrl,
    shareLimitReached: !shareAccess.allowed,
    shareLimitReason: shareAccess.reason,
  };
};
