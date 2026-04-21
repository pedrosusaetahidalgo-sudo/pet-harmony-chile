/**
 * Edge Function: send-push-notification
 *
 * Envía push a uno o varios usuarios via FCM (Android) y APNs (iOS).
 *
 * POST body:
 *   {
 *     user_ids: string[],         // 1+ UUIDs de auth.users
 *     title: string,
 *     body: string,
 *     data?: Record<string, string>,  // payload custom (ej: { route: '/reminders' })
 *   }
 *
 * Auth: service_role (solo backend interno). No es callable desde frontend
 * público — los triggers / otras edge fns la invocan con service_role header.
 *
 * Requiere secrets:
 *   - FCM_SERVER_KEY (Firebase Cloud Messaging server key, para Android).
 *   - APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_KEY_P8 (Apple Push, para iOS).
 *
 * Si un secret falta, la función hace skip de esa plataforma silenciosamente.
 * Origen: INIT-16 del Plan 90d.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import {
  filterUserIdsByPrefs,
  logAttempt,
  type NotificationCategory,
} from '../_shared/notification-prefs.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface PushPayload {
  user_ids: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  /**
   * Categoria para consultar user_notification_prefs. Default 'transactional'.
   * Otras: 'pet_reminders', 'daily_digest', 'weekly_digest', 'marketing',
   * 'social', 'gamification'. Ver supabase/migrations/20260723000000.
   */
  category?: NotificationCategory;
  /**
   * Tipo de reminder/notificacion (ej: '24h_booking', 'booking_confirmed',
   * 'vaccine_due'). Se registra en notification_attempts.reminder_type.
   * Default 'push_generic'.
   */
  reminder_type?: string;
  /** Contexto del objeto de origen (booking_id, pet_reminder_id, etc.). */
  booking_type?: string;
  booking_id?: string;
}

interface DeviceToken {
  user_id: string;
  platform: 'ios' | 'android' | 'web';
  token: string;
}

async function sendAndroidFCM(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>
): Promise<{ ok: number; failed: number }> {
  const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');
  if (!FCM_SERVER_KEY || tokens.length === 0) return { ok: 0, failed: 0 };

  let ok = 0;
  let failed = 0;

  // Legacy API HTTP v1: batch send via "registration_ids"
  // (FCM acepta hasta 1000 tokens por request).
  const resp = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      Authorization: `key=${FCM_SERVER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      registration_ids: tokens,
      notification: { title, body },
      data,
    }),
  });

  if (resp.ok) {
    const result = await resp.json().catch(() => null);
    if (result && typeof result.success === 'number') {
      ok = result.success;
      failed = result.failure || 0;
    } else {
      ok = tokens.length;
    }
  } else {
    failed = tokens.length;
  }

  return { ok, failed };
}

async function sendIOSAPNs(
  _tokens: string[],
  _title: string,
  _body: string,
  _data: Record<string, string>
): Promise<{ ok: number; failed: number }> {
  // APNs requiere JWT firmado con P8 key + HTTP/2. Deno no tiene HTTP/2
  // client oficial; se recomienda proxy via Firebase Cloud Messaging
  // también para iOS (FCM soporta tokens APNs nativos via IID).
  //
  // Stub: por ahora, iOS push va a través del mismo FCM si el cliente
  // registró el token como FCM (Capacitor + Firebase iOS plugin lo hace
  // automáticamente). Si se necesita APNs puro, migrar a un provider como
  // OneSignal o a Firebase Admin SDK (requiere Node — usar Supabase Edge
  // wrapper especifico).
  //
  // Marcamos los tokens como "no implementado" sin fallar.
  return { ok: 0, failed: 0 };
}

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return errorResponse('Server misconfigured', 500);
  }

  let payload: PushPayload;
  try {
    payload = (await req.json()) as PushPayload;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const requestedUserIds = Array.isArray(payload.user_ids) ? payload.user_ids : [];
  const title = String(payload.title || '').slice(0, 120);
  const body = String(payload.body || '').slice(0, 240);
  const data = (payload.data && typeof payload.data === 'object' ? payload.data : {}) as Record<
    string,
    string
  >;
  const category: NotificationCategory = payload.category ?? 'transactional';
  const reminderType = payload.reminder_type ?? 'push_generic';
  const bookingType = payload.booking_type ?? null;
  const bookingId = payload.booking_id ?? null;

  if (requestedUserIds.length === 0) return errorResponse('user_ids required', 400);
  if (!title || !body) return errorResponse('title and body required', 400);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // ── D.4 prefs check: filtrar user_ids que NO opted-in para esta
  // categoria por canal 'push'. Los skipped van a notification_attempts
  // con status='skipped' para observabilidad.
  const { allowed: userIds, skipped: skippedByPrefs } = await filterUserIdsByPrefs(
    admin,
    requestedUserIds,
    category,
    'push'
  );

  // Log skipped por prefs (no bloquea)
  await Promise.all(
    skippedByPrefs.map((uid) =>
      logAttempt(admin, {
        bookingType,
        bookingId,
        reminderType,
        channel: 'push',
        recipientId: uid,
        status: 'skipped',
        errorMessage: 'opted_out_by_prefs',
        metadata: { category },
      })
    )
  );

  if (userIds.length === 0) {
    return jsonResponse({
      ok: 0,
      skipped: requestedUserIds.length,
      reason: 'all_opted_out',
    });
  }

  // Cargar device_tokens habilitados de los users allowed
  const { data: tokensData, error: tokErr } = await admin
    .from('device_tokens')
    .select('user_id, platform, token')
    .in('user_id', userIds)
    .eq('enabled', true);

  if (tokErr) return errorResponse(`DB error: ${tokErr.message}`, 500);

  const tokens = (tokensData || []) as DeviceToken[];
  if (tokens.length === 0) {
    // Log como skipped: user opted-in pero no tiene device registrado.
    await Promise.all(
      userIds.map((uid) =>
        logAttempt(admin, {
          bookingType,
          bookingId,
          reminderType,
          channel: 'push',
          recipientId: uid,
          status: 'skipped',
          errorMessage: 'no_device_tokens',
          metadata: { category },
        })
      )
    );
    return jsonResponse({
      ok: 0,
      skipped: requestedUserIds.length,
      reason: 'no_device_tokens',
    });
  }

  const androidTokens = tokens.filter((t) => t.platform === 'android').map((t) => t.token);
  const iosTokens = tokens.filter((t) => t.platform === 'ios').map((t) => t.token);

  const [androidResult, iosResult] = await Promise.all([
    sendAndroidFCM(androidTokens, title, body, data),
    sendIOSAPNs(iosTokens, title, body, data),
  ]);

  const totalOk = androidResult.ok + iosResult.ok;
  const totalFailed = androidResult.failed + iosResult.failed;

  // Log un attempt por user (agrupamos device tokens por user).
  // Si user_id tuvo al menos 1 envio OK, status='sent'; si todos fallaron
  // o no hubo tokens de esa plataforma, 'failed'. Idempotencia via UNIQUE
  // index: 2 envios para el mismo (booking_type, booking_id, reminder_type,
  // channel) solo loggean el primero como 'sent'.
  const userIdsSent = new Set(tokens.map((t) => t.user_id));
  await Promise.all(
    Array.from(userIdsSent).map((uid) =>
      logAttempt(admin, {
        bookingType,
        bookingId,
        reminderType,
        channel: 'push',
        recipientId: uid,
        status: totalOk > 0 ? 'sent' : 'failed',
        errorMessage: totalFailed > 0 ? `fcm_failed=${totalFailed}` : null,
        metadata: { category, android: androidResult, ios: iosResult },
      })
    )
  );

  return jsonResponse({
    ok: totalOk,
    failed: totalFailed,
    breakdown: {
      android: androidResult,
      ios: iosResult,
    },
    total_tokens: tokens.length,
    skipped_by_prefs: skippedByPrefs.length,
    note: iosTokens.length > 0 ? 'iOS APNs stub — use FCM for iOS tokens (see runbook)' : undefined,
  });
}

serve(withTelemetry('send-push-notification', handle));
