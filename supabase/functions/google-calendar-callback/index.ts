/**
 * Edge Function: google-calendar-callback
 *
 * Callback que Google llama después del consentimiento OAuth.
 * Intercambia el `code` por access_token + refresh_token, crea un
 * calendario "Paw Friend" en el Google del user, y guarda los tokens.
 *
 * GET /functions/v1/google-calendar-callback?code=XXX&state=YYY
 *
 * Al final redirige al user a /settings?google=connected (o ?google=error)
 *
 * Secrets requeridos:
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REDIRECT_URI
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { withTelemetry } from '../_shared/telemetry.ts';

const SETTINGS_URL = 'https://pawfriend.cl/settings';

async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
) {
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const json = await resp.json();
  if (!resp.ok) throw new Error(`Google token exchange failed: ${JSON.stringify(json)}`);
  return json as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  };
}

async function findOrCreatePawFriendCalendar(accessToken: string) {
  // 1. Buscar si ya existe un calendario "Paw Friend"
  const listResp = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (listResp.ok) {
    const list = await listResp.json();
    const existing = (list.items ?? []).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cal: any) => cal.summary === 'Paw Friend' && cal.accessRole === 'owner'
    );
    if (existing) return existing.id as string;
  }

  // 2. No existe, crear uno nuevo
  const resp = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: 'Paw Friend',
      description: 'Recordatorios de tus mascotas — sincronizado desde pawfriend.cl',
      timeZone: 'America/Santiago',
    }),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(`Create calendar failed: ${JSON.stringify(json)}`);
  return json.id as string;
}

async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  try {
    const resp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    return json.email || null;
  } catch {
    return null;
  }
}

serve(
  withTelemetry('google-calendar-callback', async (req) => {
    try {
      const url = new URL(req.url);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const errorParam = url.searchParams.get('error');

      if (errorParam) {
        return Response.redirect(`${SETTINGS_URL}?google=error&reason=${errorParam}`, 302);
      }
      if (!code || !state) {
        return Response.redirect(`${SETTINGS_URL}?google=error&reason=missing_code`, 302);
      }

      let userId: string;
      try {
        const decoded = JSON.parse(atob(state));
        userId = decoded.user_id;
        if (!userId) throw new Error('no user_id in state');
      } catch {
        return Response.redirect(`${SETTINGS_URL}?google=error&reason=invalid_state`, 302);
      }

      const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET');
      const redirectUri = Deno.env.get('GOOGLE_OAUTH_REDIRECT_URI');
      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Google OAuth not configured');
      }

      const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Buscar o crear el calendario "Paw Friend" dentro del Google del user
      // (reusa el existente para no crear duplicados al reconectar)
      let calendarId: string | null = null;
      try {
        calendarId = await findOrCreatePawFriendCalendar(tokens.access_token);
      } catch (err) {
        console.warn('[google-calendar-callback] find/create calendar failed:', err);
      }

      // Email del user de Google (para mostrar en Settings)
      const googleEmail = await fetchGoogleEmail(tokens.access_token);

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { persistSession: false } }
      );

      await supabase.from('google_calendar_tokens').upsert(
        {
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          calendar_id: calendarId,
          scope: tokens.scope,
          google_email: googleEmail,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      return Response.redirect(`${SETTINGS_URL}?google=connected`, 302);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[google-calendar-callback] error', msg);
      return Response.redirect(`${SETTINGS_URL}?google=error&reason=server`, 302);
    }
  })
);
