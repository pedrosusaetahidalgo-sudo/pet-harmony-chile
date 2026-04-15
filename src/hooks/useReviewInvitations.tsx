import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
const sb = supabase;
import { useAuth } from '@/hooks/useAuth';
import type { ReviewInvitationRow, ReviewInvitationWithProvider } from '@/types/vetDirectory';

export type ReviewInvitation = ReviewInvitationRow;

/** Lista las invitaciones del provider del usuario logueado. */
export function useMyInvitations() {
  const { user } = useAuth();
  return useQuery<ReviewInvitationRow[]>({
    queryKey: ['my-review-invitations', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: prov, error: provErr } = await sb
        .from('service_providers')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (provErr) throw provErr;
      if (!prov) return [];

      const { data, error } = await sb
        .from('review_invitations')
        .select('*')
        .eq('provider_id', prov.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReviewInvitationRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Cuenta cuántas invitaciones generó el provider este mes. */
export function useMonthInvitationCount() {
  const { data: invitations } = useMyInvitations();
  if (!invitations) return 0;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return invitations.filter((i) => new Date(i.created_at) >= startOfMonth).length;
}

export function useCreateInvitation() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation<ReviewInvitationRow, Error, { client_name?: string; client_email?: string }>({
    mutationFn: async (input) => {
      if (!user) throw new Error('No autenticado');

      const { data: prov, error: provErr } = await sb
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (provErr) throw provErr;
      if (!prov) throw new Error('No tienes un perfil profesional');

      const token = crypto.randomUUID().replace(/-/g, '');

      const { data, error } = await sb
        .from('review_invitations')
        .insert({
          provider_id: prov.id,
          invitation_token: token,
          client_name: input.client_name?.trim() || null,
          client_email: input.client_email?.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ReviewInvitationRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-review-invitations', user?.id] });
    },
  });
}

/** Para la página pública /resena/:token */
export function useInvitationByToken(token: string | undefined) {
  return useQuery<ReviewInvitationWithProvider | null>({
    queryKey: ['invitation-by-token', token],
    enabled: !!token,
    queryFn: async () => {
      const { data, error } = await sb
        .from('review_invitations')
        .select('*, service_providers(id, slug, display_name, avatar_url)')
        .eq('invitation_token', token!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ReviewInvitationWithProvider | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export interface SubmitReviewInput {
  invitation_id: string;
  provider_id: string;
  rating: number;
  title?: string;
  comment?: string;
}

export function useSubmitInvitedReview() {
  const { user } = useAuth();
  return useMutation<void, Error, SubmitReviewInput>({
    mutationFn: async (input) => {
      if (!user) throw new Error('Debes iniciar sesión para dejar una reseña');

      const { error: revErr } = await supabase.from('service_reviews').insert({
        provider_id: input.provider_id,
        reviewer_id: user.id,
        rating: input.rating,
        title: input.title || null,
        comment: input.comment || null,
        service_type: 'veterinarian',
        is_visible: true,
        verification_type: 'invitation',
        invitation_id: input.invitation_id,
      });
      if (revErr) throw revErr;

      await sb.from('review_invitations').update({ is_used: true }).eq('id', input.invitation_id);
    },
  });
}
