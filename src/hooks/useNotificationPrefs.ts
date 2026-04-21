import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * useNotificationPrefs — CRUD de preferencias granulares de notifs.
 *
 * Usa la tabla user_notification_prefs (mig 20260723000000). Si el user
 * no tiene row, el hook devuelve los defaults del schema. El first
 * setPref() upsertea la row.
 */

export interface NotificationPrefs {
  // Transaccionales (defaults: push=true, email=true)
  transactional_push: boolean;
  transactional_email: boolean;
  // Reminders (defaults: push=true, email=false)
  pet_reminders_push: boolean;
  pet_reminders_email: boolean;
  // Daily digest (defaults: in_app=true, push=false, email=false)
  daily_digest_push: boolean;
  daily_digest_email: boolean;
  daily_digest_in_app: boolean;
  // Weekly (defaults: email=true, push=false)
  weekly_digest_email: boolean;
  weekly_digest_push: boolean;
  // Marketing (defaults: false)
  marketing_email: boolean;
  marketing_push: boolean;
  // Social (defaults: in_app=true, push=false)
  social_push: boolean;
  social_in_app: boolean;
  // Gamification (defaults: in_app=true, push=false)
  gamification_push: boolean;
  gamification_in_app: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  transactional_push: true,
  transactional_email: true,
  pet_reminders_push: true,
  pet_reminders_email: false,
  daily_digest_push: false,
  daily_digest_email: false,
  daily_digest_in_app: true,
  weekly_digest_email: true,
  weekly_digest_push: false,
  marketing_email: false,
  marketing_push: false,
  social_push: false,
  social_in_app: true,
  gamification_push: false,
  gamification_in_app: true,
};

export function useNotificationPrefs() {
  const { user } = useAuth();

  return useQuery<NotificationPrefs>({
    queryKey: ['notification-prefs', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!user?.id) return DEFAULT_PREFS;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('user_notification_prefs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data) return DEFAULT_PREFS;
      return { ...DEFAULT_PREFS, ...(data as Partial<NotificationPrefs>) };
    },
  });
}

export function useSetNotificationPref() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: keyof NotificationPrefs; value: boolean }) => {
      if (!user?.id) throw new Error('No autenticado');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('user_notification_prefs')
        .upsert({ user_id: user.id, [key]: value }, { onConflict: 'user_id' });
      if (error) throw error;
      return { key, value };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-prefs', user?.id] });
    },
    onError: (err: Error) => {
      toast.error('No pudimos guardar la preferencia', { description: err.message });
    },
  });
}
