import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRole } from '@/hooks/useActiveRole';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export type FeedbackType = 'bug' | 'idea' | 'experience';

export function useFeedbackInApp() {
  const { user } = useAuth();
  const { role } = useActiveRole();
  const location = useLocation();

  const submit = useMutation({
    mutationFn: async ({ type, description }: { type: FeedbackType; description: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase
        .from('feedback_in_app' as any)
        .insert({
          user_id: user.id,
          type,
          description: description.trim(),
          route: location.pathname,
          role,
        })
        .select('id')
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onError: () => toast.error('No se pudo enviar el feedback'),
  });

  const submitRating = useMutation({
    mutationFn: async ({ feedbackId, rating }: { feedbackId: string; rating: number }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from('feedback_in_app' as any)
        .update({ app_rating: rating })
        .eq('id', feedbackId);
      if (error) throw error;
    },
    onSuccess: () => toast.success('Gracias por tu valoracion'),
    onError: () => toast.error('No se pudo guardar la valoracion'),
  });

  return { submit, submitRating };
}
