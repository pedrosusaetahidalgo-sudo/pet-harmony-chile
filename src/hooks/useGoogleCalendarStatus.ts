import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type GoogleCalendarStatus =
  | { state: 'disconnected' }
  | { state: 'connected'; email: string | null; expiresAt: string }
  | { state: 'revoked'; email: string | null; revokedAt: string };

/**
 * Lee el estado de conexion de Google Calendar del usuario actual.
 *
 * La tabla `google_calendar_tokens` tiene RLS que permite al owner ver su
 * propia fila. La columna `revoked_at` se agrego en la migracion
 * 20260601000000; los tipos TS pueden no tenerla aun (requiere regenerar
 * types.ts), por eso el cast.
 */
export function useGoogleCalendarStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['google-calendar-status', user?.id],
    queryFn: async (): Promise<GoogleCalendarStatus> => {
      if (!user) return { state: 'disconnected' };

      const { data } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- revoked_at agregada en migracion 20260601, tipos sin regenerar
        .from('google_calendar_tokens' as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select('google_email, expires_at, revoked_at' as any)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data) return { state: 'disconnected' };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = data as any;

      if (row.revoked_at) {
        return {
          state: 'revoked',
          email: row.google_email ?? null,
          revokedAt: row.revoked_at,
        };
      }

      return {
        state: 'connected',
        email: row.google_email ?? null,
        expiresAt: row.expires_at,
      };
    },
    enabled: !!user,
    staleTime: 60_000 * 5,
  });
}
