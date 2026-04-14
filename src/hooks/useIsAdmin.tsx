import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AdminAccess {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  permissions: Record<string, boolean>;
  loading: boolean;
}

export const useIsAdmin = (): AdminAccess => {
  const { user } = useAuth();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin-access', user?.id],
    enabled: !!user,
    staleTime: 600000, // 10 min
    queryFn: async () => {
      // Primero intentar admin_access (nuevo sistema)
      const { data: access, error } = await supabase
        .from('admin_access')
        .select('role, permissions, is_active')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && access) {
        return {
          isAdmin: true,
          isSuperAdmin: access.role === 'super_admin',
          permissions: (access.permissions as Record<string, boolean>) ?? {},
        };
      }

      // Fallback: si admin_access no existe aun (pre-migracion), usar has_role
      const { data: hasRole, error: roleError } = await supabase.rpc('has_role', {
        _user_id: user!.id,
        _role: 'admin',
      });

      if (!roleError && hasRole === true) {
        return {
          isAdmin: true,
          isSuperAdmin: false,
          permissions: {},
        };
      }

      return { isAdmin: false, isSuperAdmin: false, permissions: {} };
    },
  });

  return {
    isAdmin: data?.isAdmin ?? false,
    isSuperAdmin: data?.isSuperAdmin ?? false,
    permissions: data?.permissions ?? {},
    loading,
  };
};
