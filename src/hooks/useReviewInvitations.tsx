import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ReviewInvitation {
  id: string;
  provider_id: string;
  invitation_token: string;
  client_email: string | null;
  client_name: string | null;
  is_used: boolean;
  expires_at: string;
  created_at: string;
}

/** Lista las invitaciones del provider del usuario logueado. */
export function useMyInvitations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-review-invitations', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ReviewInvitation[]> => {
      // Buscar provider_id del usuario
      const { data: prov, error: provErr } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (provErr) throw provErr;
      if (!prov) return [];

      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('review_invitations' as any)
        .select('*')
        .eq('provider_id', prov.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as ReviewInvitation[]) ?? [];
    },
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

  return useMutation({
    mutationFn: async (input: { client_name?: string; client_email?: string }) => {
      if (!user) throw new Error('No autenticado');

      const { data: prov, error: provErr } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (provErr) throw provErr;
      if (!prov) throw new Error('No tienes un perfil profesional');

      const token = crypto.randomUUID().replace(/-/g, '');

      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('review_invitations' as any)
        .insert({
          provider_id: prov.id,
          invitation_token: token,
          client_name: input.client_name?.trim() || null,
          client_email: input.client_email?.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ReviewInvitation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-review-invitations', user?.id] });
    },
  });
}

/** Para la página pública /resena/:token */
export function useInvitationByToken(token: string | undefined) {
  return useQuery({
    queryKey: ['invitation-by-token', token],
    enabled: !!token,
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('review_invitations' as any)
        .select('*, service_providers(id, slug, display_name, avatar_url)')
        .eq('invitation_token', token!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as
        | (ReviewInvitation & {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            service_providers: any;
          })
        | null;
    },
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
  return useMutation({
    mutationFn: async (input: SubmitReviewInput) => {
      if (!user) throw new Error('Debes iniciar sesión para dejar una reseña');

      // Insertar reseña con verification_type='invitation'
      const { error: revErr } = await supabase
        .from('service_reviews')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({
          provider_id: input.provider_id,
          reviewer_id: user.id,
          rating: input.rating,
          title: input.title || null,
          comment: input.comment || null,
          service_type: 'veterinarian',
          is_visible: true,
          verification_type: 'invitation',
          invitation_id: input.invitation_id,
        } as any);
      if (revErr) throw revErr;

      // Marcar invitación como usada
      await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('review_invitations' as any)
        .update({ is_used: true })
        .eq('id', input.invitation_id);
    },
  });
}
