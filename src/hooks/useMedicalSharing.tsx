/**
 * Hook for managing medical record sharing with vets
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface ShareToken {
  id: string;
  pet_id: string;
  owner_id: string;
  token: string;
  expires_at: string;
  is_revoked: boolean;
  created_at: string;
  last_accessed_at: string | null;
}

const DEFAULT_EXPIRY_DAYS = 30;

/**
 * Hook for managing medical record sharing
 */
export const useMedicalSharing = (petId?: string) => {
  const { user } = useAuth();
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
    mutationFn: async (expiryDays: number = DEFAULT_EXPIRY_DAYS) => {
      if (!user || !petId) throw new Error('Usuario o mascota no especificada');

      // Generate token (simple random string)
      const tokenData = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
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
        })
        .select()
        .single();

      if (error) throw error;
      return data as ShareToken;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['medical-share-tokens', petId] });
      toast.success('Enlace de compartir creado');
      return data;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear enlace de compartir');
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
    onError: (error: any) => {
      toast.error(error.message || 'Error al revocar enlace');
    },
  });

  // Get share URL
  const getShareUrl = (token: string): string => {
    return `${window.location.origin}/medical-share/${token}`;
  };

  return {
    tokens,
    isLoading,
    createShareToken: createShareToken.mutateAsync,
    isCreating: createShareToken.isPending,
    revokeToken: revokeToken.mutateAsync,
    isRevoking: revokeToken.isPending,
    getShareUrl,
  };
};

