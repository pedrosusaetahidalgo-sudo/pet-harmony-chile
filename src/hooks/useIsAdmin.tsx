import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useIsAdmin = () => {
  const { user } = useAuth();

  const { data: isAdmin = false, isLoading: loading } = useQuery({
    queryKey: ['is-admin', user?.id],
    enabled: !!user,
    staleTime: 600000, // 10 min — admin status rarely changes
    queryFn: async () => {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user!.id,
        _role: 'admin',
      });

      if (error) return false;
      return data === true;
    },
  });

  return { isAdmin, loading };
};
