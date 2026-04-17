/**
 * Edge Function: flow-webhook
 * Callback server-to-server de Flow.cl.
 * Flow llama acá vía POST x-www-form-urlencoded con `token`.
 * Confirmamos el pago consultando getStatus, validamos firma, y aplicamos premium.
 *
 * NUNCA confiamos en el body del webhook sin verificar contra Flow primero.
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { withTelemetry } from '../_shared/telemetry.ts';

const FLOW_BASE_URL = Deno.env.get('FLOW_BASE_URL') ?? 'https://www.flow.cl/api';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

async function signFlowParams(params: Record<string, string>, secret: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map((k) => `${k}${params[k]}`).join('');
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(toSign));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(
  withTelemetry('flow-webhook', async (req) => {
    // Flow no manda CORS preflight, pero igual respondemos por las dudas
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200 });
    }
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const FLOW_API_KEY = Deno.env.get('FLOW_API_KEY');
      const FLOW_SECRET_KEY = Deno.env.get('FLOW_SECRET_KEY');
      if (!FLOW_API_KEY || !FLOW_SECRET_KEY) {
        throw new Error('Flow credentials not configured');
      }

      // Flow envía form-urlencoded
      const formData = await req.formData();
      const token = formData.get('token');
      if (!token || typeof token !== 'string') {
        console.warn('[flow-webhook] missing token');
        return new Response('missing token', { status: 400 });
      }

      // Consultar getStatus a Flow (ESTA es la verdad, no el payload del webhook)
      const statusParams: Record<string, string> = {
        apiKey: FLOW_API_KEY,
        token,
      };
      const statusSig = await signFlowParams(statusParams, FLOW_SECRET_KEY);
      const url = `${FLOW_BASE_URL}/payment/getStatus?apiKey=${encodeURIComponent(FLOW_API_KEY)}&token=${encodeURIComponent(token)}&s=${statusSig}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      let statusResp: Response;
      try {
        statusResp = await fetch(url, { method: 'GET', signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      const statusJson = await statusResp.json();

      if (!statusResp.ok) {
        console.error('[flow-webhook] getStatus failed', { status: statusResp.status, statusJson });
        return new Response('flow status error', { status: 500 });
      }

      // status: 1=pendiente, 2=pagada, 3=rechazada, 4=anulada
      if (statusJson.status !== 2) {
        console.log('[flow-webhook] payment not completed', { token, status: statusJson.status });
        // Marcar subscription como failed si existe
        const supabaseAnon = createClient(
          SUPABASE_URL,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          {
            auth: { persistSession: false },
          }
        );
        await supabaseAnon
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('payment_provider_id', token)
          .eq('status', 'pending');
        return new Response('ok', { status: 200 });
      }

      // Pagado. Sacar contexto del optional
      let userId: string | null = null;
      let plan: string | null = null;
      try {
        const optional = JSON.parse(statusJson.optional ?? '{}');
        userId = optional.user_id ?? null;
        plan = optional.plan ?? null;
      } catch {
        // ignorar
      }

      if (!userId || !plan || (plan !== 'monthly' && plan !== 'yearly')) {
        console.error('[flow-webhook] missing user_id/plan in optional', statusJson.optional);
        return new Response('invalid optional', { status: 400 });
      }

      const amount = Number(statusJson.amount ?? 0);
      if (!amount || amount <= 0) {
        console.error('[flow-webhook] invalid amount', statusJson.amount);
        return new Response('invalid amount', { status: 400 });
      }

      const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
        auth: { persistSession: false },
      });

      // Borrar el subscription pending placeholder antes de aplicar (apply_premium hace insert)
      await supabase
        .from('subscriptions')
        .delete()
        .eq('payment_provider_id', token)
        .eq('status', 'pending');

      const { error: rpcError } = await supabase.rpc('apply_premium', {
        p_user_id: userId,
        p_plan: plan,
        p_amount_clp: amount,
        p_provider_id: token,
      });

      if (rpcError) {
        console.error('[flow-webhook] apply_premium failed', rpcError);
        return new Response('apply_premium failed', { status: 500 });
      }

      console.log('[flow-webhook] premium applied', { userId, plan, amount, token });
      return new Response('ok', { status: 200 });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[flow-webhook] error', msg);
      return new Response('error', { status: 500 });
    }
  })
);
