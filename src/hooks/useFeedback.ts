import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRole } from '@/hooks/useActiveRole';
import { useToast } from '@/hooks/use-toast';

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
  created_at: string;
  updated_at: string;
}

// ── User-facing hook: submit feedback ──
export function useSubmitFeedback() {
  const { user } = useAuth();
  const { role: activeRole } = useActiveRole();
  const { toast } = useToast();
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

      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('feedback_in_app' as any)
        .insert({
          user_id: user.id,
          type,
          description,
          route,
          role: activeRole,
          user_display_name: profile?.display_name || user.email?.split('@')[0] || 'Usuario',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Feedback enviado',
        description: 'Gracias por ayudarnos a mejorar Paw Friend',
      });
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
    },
    onError: () => {
      toast({ title: 'Error al enviar feedback', variant: 'destructive' });
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

// ── Admin: all feedback ──
export function useAdminFeedback(statusFilter?: string) {
  return useQuery({
    queryKey: ['admin-feedback', statusFilter],
    queryFn: async () => {
      let query = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('feedback_in_app' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as FeedbackItem[];
    },
  });
}

// ── Admin: update feedback status ──
export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('feedback_in_app' as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Estado actualizado' });
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });
}

// ── Admin: respond to feedback ──
export function useRespondFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('feedback_in_app' as any)
        .update({
          admin_response: response,
          admin_responded_at: new Date().toISOString(),
          status: 'reviewed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Respuesta enviada' });
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });
}

// ── Admin: toggle like ──
export function useToggleFeedbackLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, liked }: { id: string; liked: boolean }) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('feedback_in_app' as any)
        .update({ admin_liked: liked, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });
}

// ── Admin: award paw points for feedback ──
export function useAwardFeedbackPoints() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      const { error } = await supabase.rpc('admin_award_feedback_points', {
        p_feedback_id: feedbackId,
        p_user_id: userId,
        p_points: points,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({
        title: `+${variables.points} Paw Points otorgados`,
        description: 'El usuario recibirá los puntos en su cuenta',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
    onError: () => {
      toast({ title: 'Error al otorgar puntos', variant: 'destructive' });
    },
  });
}
