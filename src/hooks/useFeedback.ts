import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRole } from '@/hooks/useActiveRole';
import { toast } from 'sonner';
export interface FeedbackItem {
  id: string;
  user_id: string;
  type: 'bug' | 'idea' | 'experience';
  description: string;
  route: string | null;
  role: string | null;
  status: 'new' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes: string | null;
  admin_response: string | null;
  admin_responded_at: string | null;
  admin_liked: boolean;
  paw_points_awarded: number;
  user_display_name: string | null;
  app_rating: number | null;
  would_pay: 'yes' | 'maybe' | 'no' | null;
  created_at: string;
  updated_at: string;
  // AI classification fields
  ai_category?: string | null;
  ai_sentiment?: string | null;
  ai_urgency?: string | null;
  ai_summary?: string | null;
  ai_suggested_response?: string | null;
  ai_tags?: string[] | null;
  ai_classified_at?: string | null;
}

// ── Helper: call feedback-admin edge function ──
async function callFeedbackAdmin(action: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('feedback-admin', {
    body: { action, ...payload },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

// ── User-facing hook: submit feedback ──
export function useSubmitFeedback() {
  const { user } = useAuth();
  const { role: activeRole } = useActiveRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      description,
      route,
    }: {
      type: 'bug' | 'idea' | 'experience';
      description: string;
      route: string;
    }) => {
      if (!user) throw new Error('No autenticado');

      // Fetch display_name for denormalization
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('feedback_in_app' as any)
        .insert({
          user_id: user.id,
          type,
          description,
          route,
          role: activeRole,
          user_display_name: profile?.display_name || user.email?.split('@')[0] || 'Usuario',
        })
        .select('id')
        .single();

      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => {
      toast('Feedback enviado', { description: 'Gracias por ayudarnos a mejorar Paw Friend' });
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
    },
    onError: () => {
      toast.error('Error al enviar feedback');
    },
  });
}

// ── User-facing hook: submit star rating + willingness-to-pay ──
export function useSubmitFeedbackRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      feedbackId,
      rating,
      wouldPay,
    }: {
      feedbackId: string;
      rating?: number | null;
      wouldPay?: 'yes' | 'maybe' | 'no' | null;
    }) => {
      const { error } = await supabase.rpc('submit_feedback_rating', {
        p_feedback_id: feedbackId,
        p_rating: rating ?? null,
        p_would_pay: wouldPay ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
    onError: () => {
      toast.error('No pudimos guardar tu evaluacion');
    },
  });
}

// ── User: my own feedback ──
export function useMyFeedback() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-feedback', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('feedback_in_app' as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as unknown as FeedbackItem[];
    },
  });
}

// ── Admin: all feedback (via edge function) ──
export function useAdminFeedback(statusFilter?: string) {
  return useQuery({
    queryKey: ['admin-feedback', statusFilter],
    queryFn: async () => {
      const result = await callFeedbackAdmin('list', {
        status: statusFilter || 'new',
      });
      return (result.data ?? []) as FeedbackItem[];
    },
  });
}

// ── Admin: update feedback status ──
export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await callFeedbackAdmin('update_status', { id, status });
    },
    onSuccess: () => {
      toast('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });
}

// ── Admin: respond to feedback ──
export function useRespondFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      await callFeedbackAdmin('respond', { id, response });
    },
    onSuccess: () => {
      toast('Respuesta enviada');
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });
}

// ── Admin: toggle like ──
export function useToggleFeedbackLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, liked }: { id: string; liked: boolean }) => {
      await callFeedbackAdmin('toggle_like', { id, liked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });
}

// ── Admin: AI classify feedback ──
export function useClassifyFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return await callFeedbackAdmin('classify', { id });
    },
    onSuccess: () => {
      toast('Feedback clasificado por IA');
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
    onError: () => {
      toast.error('Error al clasificar');
    },
  });
}

// ── Admin: batch classify all unclassified feedback ──
export function useClassifyFeedbackBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return await callFeedbackAdmin('classify_batch', {});
    },
    onSuccess: (data) => {
      toast(`${data?.classified ?? 0} feedbacks clasificados por IA`);
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
    onError: () => {
      toast.error('Error en clasificación batch');
    },
  });
}

// ── Admin: donations monitoring (read-only) ──
export interface DonationRow {
  id: string;
  user_id: string | null;
  amount_clp: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  payment_provider: string;
  payment_provider_id: string | null;
  commerce_order: string | null;
  source: string | null;
  feedback_id: string | null;
  donor_name: string | null;
  message: string | null;
  is_public: boolean;
  email_contact: string | null;
  thanked_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export function useAdminDonations() {
  return useQuery({
    queryKey: ['admin-donations'],
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('donations' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as DonationRow[];
    },
  });
}

// ── Admin: award paw points for feedback ──
export function useAwardFeedbackPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      feedbackId,
      userId,
      points,
    }: {
      feedbackId: string;
      userId: string;
      points: number;
    }) => {
      await callFeedbackAdmin('award_points', { feedbackId, userId, points });
    },
    onSuccess: (_, variables) => {
      toast(`+${variables.points} Paw Points otorgados`, {
        description: 'El usuario recibirá los puntos en su cuenta',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
    onError: () => {
      toast.error('Error al otorgar puntos');
    },
  });
}
