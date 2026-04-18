import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple in-memory rate limit (per IP, resets on cold start)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_PER_MINUTE = 10;

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
];

function isBenignNoise(message: string): boolean {
  if (!message) return true;
  return BENIGN_MESSAGE_PATTERNS.some((p) => p.test(message));
}

serve(
  withTelemetry('log-error', async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      // Rate limit by IP
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      const now = Date.now();
      const limit = rateLimits.get(ip);

      if (limit && limit.resetAt > now && limit.count >= MAX_PER_MINUTE) {
        return new Response(JSON.stringify({ error: 'Rate limited' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!limit || limit.resetAt <= now) {
        rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
      } else {
        limit.count++;
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

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

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
