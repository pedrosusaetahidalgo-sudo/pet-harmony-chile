import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useAdminAudit() {
  const { user } = useAuth();

  const logAction = async (
    action: string,
    targetType: string,
    targetId: string,
    details?: Record<string, unknown>
  ) => {
    if (!user) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('admin_audit_log') as any).insert({
        admin_user_id: user.id,
        action,
        target_type: targetType,
        target_id: targetId,
        details: details ?? {},
      });
    } catch {
      // Best-effort logging — don't block admin actions if audit fails
    }
  };

  return { logAction };
}
