/**
 * Edge Function: google-calendar-sync
 *
 * Sincroniza los pet_reminders y appointments del user con el calendario
 * "Paw Friend" en su Google. Una vía: app -> Google.
 *
 * (La sincronización inversa Google -> app requiere watch channels +
 * webhook publico, queda para una próxima iteración.)
 *
 * Body:
 *   - { action?: 'sync' }  — default: sync full del user (reminders + appointments + bookings)
 *   - { action: 'delete', source_type, source_id }  — borra un evento puntual
 *     (ej. al cancelar un booking). Idempotente: 404 en Google no es error.
 *
 * Auth: Bearer token del user (manual)
 *
 * Estrategia (sync):
 *   1. Refresca access_token si está vencido
 *   2. Lista todos los pet_reminders no completados + appointments futuros
 *   3. Por cada uno, busca en external_calendar_events si ya existe
 *   4. Si existe -> PATCH (update); si no -> INSERT (create)
 *
 * Estrategia (delete):
 *   1. Busca google_event_id en external_calendar_events por (source_type, source_id)
 *   2. Si existe, DELETE el evento en Google (ignorando 404)
 *   3. Borra el mapping en external_calendar_events
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { withTelemetry } from '../_shared/telemetry.ts';

// Error custom para senalar que el refresh token fue revocado/expirado.
// El handler lo captura y devuelve 400 con hint de reconectar (no 500).
class GoogleTokenRevokedError extends Error {
  constructor(public detail: string) {
    super('google_calendar_revoked');
    this.name = 'GoogleTokenRevokedError';
  }
}

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
  if (!resp.ok) {
    // invalid_grant = refresh token revocado/expirado o scope cambio.
    // No es un fallo del servidor: el usuario tiene que reconectar.
    if (json?.error === 'invalid_grant') {
      throw new GoogleTokenRevokedError(json.error_description || 'Token revocado');
    }
    throw new Error(`Refresh failed: ${JSON.stringify(json)}`);
  }
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

/**
 * Borra un evento de Google Calendar. Idempotente: si el evento ya no existe
 * (404 o 410 Gone), lo tratamos como éxito — el objetivo era que NO estuviera.
 */
async function deleteGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
  const resp = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (resp.ok) return;
  // 404 Not Found / 410 Gone → evento ya no existe en Google: idempotente.
  if (resp.status === 404 || resp.status === 410) return;
  const text = await resp.text().catch(() => '');
  throw new Error(`Event DELETE failed (${resp.status}): ${text}`);
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

      // Parse body para soportar action: 'delete'.
      // Si no hay body o action != 'delete', seguimos con sync completo (default).
      let requestedAction: 'sync' | 'delete' = 'sync';
      let deleteSourceType: string | null = null;
      let deleteSourceId: string | null = null;
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          if (body?.action === 'delete') {
            requestedAction = 'delete';
            deleteSourceType = String(body.source_type ?? '');
            deleteSourceId = String(body.source_id ?? '');
            if (!deleteSourceType || !deleteSourceId) {
              throw new Error('delete action requires source_type and source_id');
            }
          }
        } catch {
          // body no-JSON o vacío: caer a sync por default (comportamiento previo)
        }
      }

      // Tokens del user
      const { data: tokenRow, error: tokErr } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (tokErr || !tokenRow) {
        // Para delete: si el user nunca conectó Google, no hay nada que hacer.
        // Respondemos 200 para que el caller (cancelBooking) no vea error.
        if (requestedAction === 'delete') {
          return new Response(JSON.stringify({ deleted: false, reason: 'not_connected' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
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

      // ── Action: DELETE (cancel on Google + remove mapping) ──
      // Llamado desde useCancelBooking para eliminar el evento en Google
      // cuando el tutor o provider cancela una reserva.
      if (requestedAction === 'delete' && deleteSourceType && deleteSourceId) {
        const { data: mapping } = await supabase
          .from('external_calendar_events')
          .select('google_event_id, google_calendar_id')
          .eq('user_id', userId)
          .eq('source_type', deleteSourceType)
          .eq('source_id', deleteSourceId)
          .maybeSingle();

        if (!mapping) {
          // No hay mapping: nunca se sincronizó. Respuesta idempotente.
          return new Response(JSON.stringify({ deleted: false, reason: 'no_mapping' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        try {
          await deleteGoogleEvent(
            accessToken,
            mapping.google_calendar_id || calendarId,
            mapping.google_event_id
          );
        } catch (err) {
          console.warn('[google-calendar-sync] delete failed', err);
          // Seguimos adelante: queremos dejar la DB limpia aunque Google falle,
          // para no dejar mappings huérfanos. El user puede re-sincronizar.
        }

        await supabase
          .from('external_calendar_events')
          .delete()
          .eq('user_id', userId)
          .eq('source_type', deleteSourceType)
          .eq('source_id', deleteSourceId);

        return new Response(JSON.stringify({ deleted: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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
      // Token revocado → marcar en DB y devolver 400 (no 500).
      // Evita inflar error_logs con errores recurrentes y da al frontend
      // una razon accionable ("reconecta tu cuenta").
      if (error instanceof GoogleTokenRevokedError) {
        try {
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
            { auth: { persistSession: false } }
          );
          const authHeader = req.headers.get('Authorization');
          if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: userData } = await supabase.auth.getUser(token);
            if (userData?.user?.id) {
              await supabase
                .from('google_calendar_tokens')
                .update({ revoked_at: new Date().toISOString() })
                .eq('user_id', userData.user.id);
            }
          }
        } catch (markErr) {
          console.warn('[google-calendar-sync] no se pudo marcar revoked_at', markErr);
        }
        return new Response(
          JSON.stringify({
            error: 'google_calendar_revoked',
            detail: error.detail,
            hint: 'Reconecta tu cuenta de Google Calendar desde Ajustes > Integraciones.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const name = error instanceof Error ? error.name : 'UnknownError';
      const msg = error instanceof Error ? error.message : String(error);
      const stack =
        error instanceof Error && error.stack ? error.stack.split('\n').slice(0, 5).join('\n') : '';
      console.error('[google-calendar-sync]', name, msg, stack);
      return new Response(
        JSON.stringify({
          error: msg,
          error_type: name,
          hint:
            msg.includes('Event POST failed') || msg.includes('Event PATCH failed')
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
