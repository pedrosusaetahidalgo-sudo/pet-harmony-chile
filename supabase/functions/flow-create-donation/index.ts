/**
 * Edge Function: flow-create-donation
 * Crea un pago Flow de tipo DONACION (no subscription, no otorga Premium).
 *
 * Body: { amount: number, feedback_id?: string, message?: string }
 * Resp: { url: string, token: string } | { error }
 *
 * Flujo:
 *  1. Auth user via bearer.
 *  2. Valida monto (rango 500 - 500000 CLP).
 *  3. Reuso de rate limit de pagos existente.
 *  4. Inserta donations (status pending), crea orden Flow, retorna URL.
 *  5. El webhook marca paid al confirmar con Flow.
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { withTelemetry } from '../_shared/telemetry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pawfriend.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FLOW_BASE_URL = Deno.env.get('FLOW_BASE_URL') ?? 'https://www.flow.cl/api';
const SITE_URL = 'https://pawfriend.cl';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

const MIN_AMOUNT = 500;
const MAX_AMOUNT = 500000;

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
  withTelemetry('flow-create-donation', async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const FLOW_API_KEY = Deno.env.get('FLOW_API_KEY');
      const FLOW_SECRET_KEY = Deno.env.get('FLOW_SECRET_KEY');
      if (!FLOW_API_KEY || !FLOW_SECRET_KEY) {
        throw new Error('Flow credentials not configured');
      }

      const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
        auth: { persistSession: false },
      });

      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('No authorization header');
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) throw new Error('User not authenticated');

      const userId = userData.user.id;
      const userEmail = userData.user.email;
      if (!userEmail) throw new Error('User has no email');

      // Rate limit reutilizando el mismo quota de Premium
      const { data: quotaData } = await supabase.rpc('check_and_increment_payment_quota', {
        p_user_id: userId,
        p_limit: 10,
        p_window_seconds: 3600,
      });
      const quotaRow = Array.isArray(quotaData) ? quotaData[0] : quotaData;
      if (quotaRow && quotaRow.allowed === false) {
        return new Response(
          JSON.stringify({
            error: 'Demasiados intentos de pago. Espera unos minutos e intenta de nuevo.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }

      const body = await req.json();
      const amount = Math.floor(Number(body?.amount));
      if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
        return new Response(
          JSON.stringify({
            error: `Monto invalido. Debe estar entre ${MIN_AMOUNT} y ${MAX_AMOUNT} CLP.`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const feedbackId =
        typeof body?.feedback_id === 'string' && body.feedback_id.length > 0
          ? body.feedback_id
          : null;
      const message = typeof body?.message === 'string' ? String(body.message).slice(0, 500) : null;
      const donorName =
        typeof body?.donor_name === 'string' ? String(body.donor_name).trim().slice(0, 80) : null;
      const emailContact =
        typeof body?.email_contact === 'string' && body.email_contact.includes('@')
          ? String(body.email_contact).trim().slice(0, 120)
          : null;
      const isPublic = body?.is_public === true;
      const source =
        typeof body?.source === 'string' ? String(body.source).slice(0, 40) : 'feedback_widget';

      const commerceOrder = `PFDON-${userId.slice(0, 8)}-${Date.now()}`;

      const optional = JSON.stringify({ type: 'donation', user_id: userId, amount });

      const params: Record<string, string> = {
        apiKey: FLOW_API_KEY,
        commerceOrder,
        subject: 'Donacion a Paw Friend',
        currency: 'CLP',
        amount: String(amount),
        email: userEmail,
        paymentMethod: '9',
        urlConfirmation: `${SUPABASE_URL}/functions/v1/flow-webhook`,
        urlReturn: `${SITE_URL}/donaciones?status=success`,
        optional,
      };

      const signature = await signFlowParams(params, FLOW_SECRET_KEY);
      params.s = signature;

      const formBody = new URLSearchParams(params).toString();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      let resp: Response;
      try {
        resp = await fetch(`${FLOW_BASE_URL}/payment/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formBody,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      const flowJson = await resp.json();
      if (!resp.ok || !flowJson?.url || !flowJson?.token) {
        console.error('[flow-create-donation] Flow API error', {
          status: resp.status,
          flowJson,
        });
        throw new Error('Flow API rejected the request');
      }

      await supabase.from('donations').insert({
        user_id: userId,
        amount_clp: amount,
        status: 'pending',
        payment_provider: 'flow',
        payment_provider_id: flowJson.token,
        commerce_order: commerceOrder,
        source,
        feedback_id: feedbackId,
        message,
        donor_name: donorName,
        email_contact: emailContact,
        is_public: isPublic,
      });

      return new Response(
        JSON.stringify({
          url: `${flowJson.url}?token=${flowJson.token}`,
          token: flowJson.token,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[flow-create-donation] error', msg);
      return new Response(
        JSON.stringify({ error: 'No se pudo iniciar la donacion. Intenta en unos minutos.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  })
);
