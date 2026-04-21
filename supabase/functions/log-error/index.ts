import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

/**
 * P0-3 — Rate limit persistente (auditoría top-tier 2026-04-20).
 *
 * Antes: Map<IP, count> en memoria. Se reseteaba en cada cold start,
 *        ofrecía protección casi nula ante un flood distribuido.
 *
 * Ahora: RPC `check_and_increment_ip_quota(ip, scope, limit, window)`
 *        (ver migración 20260713000001_log_error_rate_limit.sql).
 *        Atómica, security definer, persistente.
 *
 * Límite: 30 requests/60s por IP para scope `log_error`.
 *         Suficiente para burst legítimos (ErrorBoundary disparando
 *         múltiples, pantallas con muchos assets fallando, etc.).
 *
 * Fail-open: si la RPC falla (DB caída, rol mal configurado) permitimos
 *           la request y logueamos el error en consola. Preferible a
 *           dejar de aceptar errores del cliente, que es justamente lo
 *           que queremos visibilidad.
 */
const MAX_PER_MINUTE = 30;
const WINDOW_SECONDS = 60;

// Filtro de origen: ruido benigno no se inserta en error_logs. Causa raiz
// del viejo auto_fix_benign_errors que BORRABA despues de insertar.
// Fix escalable: rechazar en el pipeline, no purgar.
const BENIGN_MESSAGE_PATTERNS: RegExp[] = [
  /lock was stolen/i,
  /^script error\.?$/i,
  /resizeobserver loop (limit exceeded|completed with undelivered notifications)/i,
  /non-error promise rejection captured/i,
  /the operation was aborted/i,
  /^aborterror/i,
  /network request failed/i,
  /^warning:/i, // React dev warnings
  /\bvite:\b/i, // Vite HMR
  /\[hmr\]/i,
  /downloadable font/i,
  // Google Calendar: usuario revoco acceso. google-calendar-sync ya marca
  // revoked_at y devuelve 400 con reconnect hint. No es falla del sistema.
  /invalid_grant/i,
  /Refresh failed.*invalid_grant/i,
  /google_calendar_revoked/i,
];

function isBenignNoise(message: string): boolean {
  if (!message) return true;
  return BENIGN_MESSAGE_PATTERNS.some((p) => p.test(message));
}

serve(
  withTelemetry('log-error', async (req) => {
    const corsHeaders = getCorsHeaders(req);
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    try {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

      // Rate limit persistente via RPC (P0-3).
      const { data: quotaRows, error: quotaErr } = await supabase.rpc(
        'check_and_increment_ip_quota',
        {
          p_ip: ip,
          p_scope: 'log_error',
          p_limit: MAX_PER_MINUTE,
          p_window_seconds: WINDOW_SECONDS,
        }
      );

      if (quotaErr) {
        // Fail-open: permitimos seguir pero dejamos rastro para Sentry.
        console.warn('[log-error] rate limit RPC failed, allowing request', quotaErr);
      } else {
        const row = Array.isArray(quotaRows) ? quotaRows[0] : quotaRows;
        if (row && row.allowed === false) {
          return new Response(
            JSON.stringify({
              error: 'Rate limited',
              reset_in_seconds: row.reset_in_seconds ?? WINDOW_SECONDS,
            }),
            {
              status: 429,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Retry-After': String(row.reset_in_seconds ?? WINDOW_SECONDS),
              },
            }
          );
        }
      }

      const body = await req.json();
      const { source, severity, message, stack_trace, context, user_id } = body;

      if (!message || typeof message !== 'string') {
        return new Response(JSON.stringify({ error: 'message required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Ruido benigno: devolver 200 sin insertar. Evita inflar error_logs
      // con cosas como "Lock was stolen" o "ResizeObserver loop".
      if (isBenignNoise(message)) {
        return new Response(JSON.stringify({ ok: true, filtered: 'benign_noise' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('error_logs').insert({
        source: source || 'frontend',
        severity: severity || 'error',
        message: String(message).slice(0, 2000),
        stack_trace: stack_trace ? String(stack_trace).slice(0, 5000) : null,
        context: context || {},
        user_id: user_id || null,
      });

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  })
);
