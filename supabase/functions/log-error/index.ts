import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple in-memory rate limit (per IP, resets on cold start)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_PER_MINUTE = 10;

serve(async (req) => {
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
});
