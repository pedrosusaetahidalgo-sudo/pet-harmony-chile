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
      const { error } = await supabase.from('feedback_in_app').insert({
        user_id: user.id,
        type,
        description: description.trim(),
        route: location.pathname,
        role,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success('Gracias por tu feedback'),
    onError: () => toast.error('No se pudo enviar el feedback'),
  });

  return { submit };
}
