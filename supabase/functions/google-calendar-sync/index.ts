/**
 * Edge Function: google-calendar-sync
 *
 * Sincroniza los pet_reminders y appointments del user con el calendario
 * "Paw Friend" en su Google. Una vía: app -> Google.
 *
 * (La sincronización inversa Google -> app requiere watch channels +
 * webhook publico, queda para una próxima iteración.)
 *
 * Body: { user_id?: string }  (si no viene, lo saca del Bearer token)
 *
 * Auth: Bearer token del user (manual)
 *
 * Estrategia:
 *   1. Refresca access_token si está vencido
 *   2. Lista todos los pet_reminders no completados + appointments futuros
 *   3. Por cada uno, busca en external_calendar_events si ya existe
 *   4. Si existe -> PATCH (update); si no -> INSERT (create)
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { withTelemetry } from '../_shared/telemetry.ts';

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(`Refresh failed: ${JSON.stringify(json)}`);
  return json as { access_token: string; expires_in: number };
}

interface CalendarEventInput {
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
}

async function upsertGoogleEvent(
  accessToken: string,
  calendarId: string,
  event: CalendarEventInput,
  existingEventId: string | null
): Promise<string> {
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const url = existingEventId ? `${baseUrl}/${existingEventId}` : baseUrl;
  const method = existingEventId ? 'PATCH' : 'POST';

  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(`Event ${method} failed: ${JSON.stringify(json)}`);
  return json.id;
}

serve(
  withTelemetry('google-calendar-sync', async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET');
      if (!clientId || !clientSecret) {
        throw new Error('Google OAuth not configured');
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { persistSession: false } }
      );

      // Auth
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('No authorization header');
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !userData.user) throw new Error('User not authenticated');
      const userId = userData.user.id;

      // ── Rate limit (10 req/min) ──
      const quota = await checkAiQuota(userId, { limit: 10, windowSeconds: 60 });
      if (!quota.allowed) {
        return rateLimitResponse(quota, corsHeaders);
      }

      // Tokens del user
      const { data: tokenRow, error: tokErr } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (tokErr || !tokenRow) {
        return new Response(JSON.stringify({ error: 'Google Calendar not connected' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Refrescar si está vencido
      let accessToken = tokenRow.access_token;
      if (new Date(tokenRow.expires_at).getTime() < Date.now() + 60_000) {
        const refreshed = await refreshAccessToken(tokenRow.refresh_token, clientId, clientSecret);
        accessToken = refreshed.access_token;
        const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
        await supabase
          .from('google_calendar_tokens')
          .update({
            access_token: accessToken,
            expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }

      const calendarId = tokenRow.calendar_id || 'primary';

      // Fetch reminders + appointments del user
      const { data: reminders } = await supabase
        .from('pet_reminders')
        .select('id, title, type, due_date, pet_id, pets(name)')
        .eq('owner_id', userId)
        .eq('is_completed', false);

      const { data: appointments } = await supabase
        .from('appointments')
        .select(
          'id, title, description, scheduled_date, duration_minutes, pet_id, pets!inner(name, owner_id)'
        )
        .eq('pets.owner_id', userId)
        .neq('status', 'cancelada');

      // Mappings existentes
      const { data: existingMappings } = await supabase
        .from('external_calendar_events')
        .select('source_type, source_id, google_event_id')
        .eq('user_id', userId);

      const mappingByKey = new Map<string, string>();
      for (const m of existingMappings ?? []) {
        mappingByKey.set(`${m.source_type}:${m.source_id}`, m.google_event_id);
      }

      let synced = 0;
      let failed = 0;

      // Sync reminders (all-day events)
      for (const r of reminders ?? []) {
        try {
          const existingId = mappingByKey.get(`pet_reminder:${r.id}`) || null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const petName = (r as any).pets?.name ?? 'tu mascota';
          const event: CalendarEventInput = {
            summary: `🐾 ${r.title || r.type} — ${petName}`,
            description: `Recordatorio de Paw Friend\nTipo: ${r.type}\nMascota: ${petName}`,
            start: { date: r.due_date, timeZone: 'America/Santiago' },
            end: { date: r.due_date, timeZone: 'America/Santiago' },
          };

          const eventId = await upsertGoogleEvent(accessToken, calendarId, event, existingId);

          if (!existingId) {
            await supabase.from('external_calendar_events').insert({
              user_id: userId,
              source_type: 'pet_reminder',
              source_id: r.id,
              google_event_id: eventId,
              google_calendar_id: calendarId,
            });
          } else {
            await supabase
              .from('external_calendar_events')
              .update({ last_synced_at: new Date().toISOString() })
              .eq('source_type', 'pet_reminder')
              .eq('source_id', r.id);
          }
          synced++;
        } catch (err) {
          console.warn('[google-calendar-sync] reminder failed', r.id, err);
          failed++;
        }
      }

      // Sync appointments (timed events)
      for (const a of appointments ?? []) {
        try {
          const existingId = mappingByKey.get(`appointment:${a.id}`) || null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const petName = (a as any).pets?.name ?? 'tu mascota';
          const start = new Date(a.scheduled_date);
          const end = new Date(start.getTime() + (a.duration_minutes || 60) * 60_000);

          const event: CalendarEventInput = {
            summary: `🐾 ${a.title} — ${petName}`,
            description: `${a.description || 'Cita veterinaria'}\n\nGestionada desde Paw Friend`,
            start: { dateTime: start.toISOString(), timeZone: 'America/Santiago' },
            end: { dateTime: end.toISOString(), timeZone: 'America/Santiago' },
          };

          const eventId = await upsertGoogleEvent(accessToken, calendarId, event, existingId);

          if (!existingId) {
            await supabase.from('external_calendar_events').insert({
              user_id: userId,
              source_type: 'appointment',
              source_id: a.id,
              google_event_id: eventId,
              google_calendar_id: calendarId,
            });
          } else {
            await supabase
              .from('external_calendar_events')
              .update({ last_synced_at: new Date().toISOString() })
              .eq('source_type', 'appointment')
              .eq('source_id', a.id);
          }
          synced++;
        } catch (err) {
          console.warn('[google-calendar-sync] appointment failed', a.id, err);
          failed++;
        }
      }

      // ── Sync vet_bookings (confirmed/en_curso) ──
      const { data: bookings } = await supabase
        .from('vet_bookings')
        .select(
          'id, scheduled_date, start_time, end_time, service_type, status, pet_id, pets!pet_id(name), service_provider_id, service_providers!service_provider_id(display_name)'
        )
        .eq('owner_id', userId)
        .in('status', ['confirmado', 'en_curso', 'en_camino'])
        .gte('scheduled_date', new Date().toISOString());

      for (const b of bookings ?? []) {
        try {
          const existingId = mappingByKey.get(`vet_booking:${b.id}`) || null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const petName = (b as Record<string, any>).pets?.name ?? 'tu mascota';
          const provName =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (b as Record<string, any>).service_providers?.display_name ?? 'Veterinario';
          const start = new Date(b.scheduled_date);
          // If we have start_time, set exact hour; otherwise use the date as-is
          if (b.start_time) {
            const [hh, mm] = b.start_time.split(':');
            start.setHours(parseInt(hh), parseInt(mm), 0, 0);
          }
          const durationMs = 30 * 60_000; // default 30min
          const end = b.end_time
            ? (() => {
                const e = new Date(b.scheduled_date);
                const [hh, mm] = b.end_time.split(':');
                e.setHours(parseInt(hh), parseInt(mm), 0, 0);
                return e;
              })()
            : new Date(start.getTime() + durationMs);

          const event: CalendarEventInput = {
            summary: `🐾 ${b.service_type} — ${petName} con ${provName}`,
            description: `Reserva en Paw Friend\nServicio: ${b.service_type}\nMascota: ${petName}\nProfesional: ${provName}\nEstado: ${b.status}`,
            start: { dateTime: start.toISOString(), timeZone: 'America/Santiago' },
            end: { dateTime: end.toISOString(), timeZone: 'America/Santiago' },
          };

          const eventId = await upsertGoogleEvent(accessToken, calendarId, event, existingId);

          if (!existingId) {
            await supabase.from('external_calendar_events').insert({
              user_id: userId,
              source_type: 'vet_booking',
              source_id: b.id,
              google_event_id: eventId,
              google_calendar_id: calendarId,
            });
            // Also store event ID in booking for quick lookup
            await supabase.from('vet_bookings').update({ google_event_id: eventId }).eq('id', b.id);
          } else {
            await supabase
              .from('external_calendar_events')
              .update({ last_synced_at: new Date().toISOString() })
              .eq('source_type', 'vet_booking')
              .eq('source_id', b.id);
          }
          synced++;
        } catch (err) {
          console.warn('[google-calendar-sync] booking failed', b.id, err);
          failed++;
        }
      }

      return new Response(JSON.stringify({ synced, failed, calendar_id: calendarId }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      // Enriquecido: incluye nombre del error + stack parcial para que el
      // audit pueda diagnosticar sin abrir Sentry. Antes solo reportaba el
      // message generico y no se podia saber que operacion fallo.
      const name = error instanceof Error ? error.name : 'UnknownError';
      const msg = error instanceof Error ? error.message : String(error);
      const stack =
        error instanceof Error && error.stack ? error.stack.split('\n').slice(0, 5).join('\n') : '';
      console.error('[google-calendar-sync]', name, msg, stack);
      return new Response(
        JSON.stringify({
          error: msg,
          error_type: name,
          hint: msg.includes('Refresh failed')
            ? 'El refresh token de Google expiro o fue revocado. El usuario debe reconectar Google Calendar.'
            : msg.includes('Event POST failed') || msg.includes('Event PATCH failed')
              ? 'Google Calendar API rechazo el evento. Verificar scopes y calendar_id.'
              : 'Revisar logs de Supabase para stack completo.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  })
);
