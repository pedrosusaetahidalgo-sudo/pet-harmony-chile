/**
 * Edge Function: google-calendar-disconnect
 *
 * Desconecta Google Calendar del user:
 *   1. Revoca el token con Google
 *   2. Borra la row de google_calendar_tokens
 *   3. Borra los mappings external_calendar_events del user
 *   (NO borra el calendario "Paw Friend" del Google del user — eso queda
 *   a su criterio en calendar.google.com)
 *
 * Auth: Bearer token del user
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { withTelemetry } from '../_shared/telemetry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pawfriend.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(
  withTelemetry('google-calendar-disconnect', async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { persistSession: false } }
      );

      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('No authorization header');
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !userData.user) throw new Error('User not authenticated');
      const userId = userData.user.id;

      // Fetch token para revocar
      const { data: tokenRow } = await supabase
        .from('google_calendar_tokens')
        .select('refresh_token')
        .eq('user_id', userId)
        .maybeSingle();

      if (tokenRow?.refresh_token) {
        // Revocar con Google (best effort, no falla si Google ya lo invalidó)
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenRow.refresh_token}`, {
            method: 'POST',
          });
        } catch (err) {
          console.warn('[google-calendar-disconnect] revoke failed (non-fatal):', err);
        }
      }

      // Borrar mappings y tokens
      await supabase.from('external_calendar_events').delete().eq('user_id', userId);
      await supabase.from('google_calendar_tokens').delete().eq('user_id', userId);

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[google-calendar-disconnect] error', msg);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  })
);
