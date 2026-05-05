/**
 * Edge Function: flow-create-subscription
 *
 * Crea un pago en Flow.cl. Soporta 3 tracks:
 *  - B2C Paw Member: plan 'monthly' ($3.990) o 'yearly' ($39.900).
 *  - B2C Manada: plan 'paw_manada_monthly' ($9.990) o 'paw_manada_yearly'
 *    ($99.900). De cada cobro, $2.000 (o $24.000 anual) se destinan al
 *    Fondo Paw Friend Refugios (procesado en flow-webhook). Plan v5
 *    Opcion 3 ejecutado 2026-04-29.
 *  - B2B (Vet providers): plan 'provider_premium' ($9.900),
 *    'provider_clinic_starter' ($19.900) o 'provider_pro_max' ($29.900).
 *
 * Body: { plan: '<plan_id_alguno_de_los_anteriores>' }
 * Resp: { url: string, token: string } | { error }
 *
 * Al confirmar pago, flow-webhook actualiza:
 *  - B2C Paw Member → donations.status='paid' (Paw Member badge) +
 *    subscriptions.plan_type='premium'
 *  - B2C Manada → subscriptions.plan_type='paw_manada' + INSERT
 *    en manada_aportes_log con amount_clp=2000 y flow_charge_id
 *  - B2B → service_providers.provider_plan + plan_started_at + plan_expires_at
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

const FLOW_BASE_URL = Deno.env.get('FLOW_BASE_URL') ?? 'https://www.flow.cl/api';
const SITE_URL = 'https://pawfriend.cl';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

const PRICES: Record<string, number> = {
  // B2C Paw Member
  monthly: 3990,
  yearly: 39900,
  // B2C Manada (Plan v5 Opcion 3, 2026-04-29)
  paw_manada_monthly: 9990,
  paw_manada_yearly: 99900,
  // B2B Vet providers (mensual)
  provider_premium: 9900,
  provider_clinic_starter: 19900,
  provider_pro_max: 29900,
};

const B2B_PLANS = new Set(['provider_premium', 'provider_clinic_starter', 'provider_pro_max']);
const MANADA_PLANS = new Set(['paw_manada_monthly', 'paw_manada_yearly']);

/**
 * Mapea el plan request al plan_type que se guarda en `subscriptions`.
 * Manada en cualquier ciclo (mensual/anual) se guarda como 'paw_manada'
 * para que las RPCs como get_manada_aporte_summary y useIsManada filtren
 * sin LIKE. El monto distingue ciclo (payment_amount_clp).
 */
function getDbPlanType(plan: string): string {
  if (MANADA_PLANS.has(plan)) return 'paw_manada';
  return plan;
}

const PLAN_SUBJECTS: Record<string, string> = {
  monthly: 'Paw Friend — Paw Member mensual',
  yearly: 'Paw Friend — Paw Member anual',
  paw_manada_monthly: 'Paw Friend — Plan Manada mensual',
  paw_manada_yearly: 'Paw Friend — Plan Manada anual',
  provider_premium: 'Paw Friend — Plan Premium vet',
  provider_clinic_starter: 'Paw Friend — Plan Clínica',
  provider_pro_max: 'Paw Friend — Plan Pro Max',
};

/** Firma HMAC-SHA256 sobre params alfabéticamente concatenados (key1value1key2value2…) */
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
  withTelemetry('flow-create-subscription', async (req) => {
    const corsHeaders = getCorsHeaders(req);
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

      // Auth
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('No authorization header');
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) throw new Error('User not authenticated');

      const userId = userData.user.id;
      const userEmail = userData.user.email;
      if (!userEmail) throw new Error('User has no email');

      // Rate limit: 10 req/h por user (suficiente para retries legítimos)
      const { data: quotaData, error: quotaError } = await supabase.rpc(
        'check_and_increment_payment_quota',
        { p_user_id: userId, p_limit: 10, p_window_seconds: 3600 }
      );
      if (quotaError) {
        console.error('[flow-create-subscription] quota check failed', quotaError);
        throw new Error('No se pudo verificar el cupo de pagos');
      }
      const quotaRow = Array.isArray(quotaData) ? quotaData[0] : quotaData;
      if (quotaRow && quotaRow.allowed === false) {
        return new Response(
          JSON.stringify({
            error: 'Demasiados intentos de pago. Espera unos minutos e intenta de nuevo.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }

      // Body
      const body = await req.json();
      const plan = body?.plan as string | undefined;
      if (!plan || !(plan in PRICES)) {
        throw new Error(
          "Invalid plan: must be 'monthly', 'yearly', 'paw_manada_monthly', 'paw_manada_yearly', 'provider_premium', 'provider_clinic_starter' or 'provider_pro_max'"
        );
      }
      const amount = PRICES[plan];
      const isB2B = B2B_PLANS.has(plan);
      const isManada = MANADA_PLANS.has(plan);
      const dbPlanType = getDbPlanType(plan);
      const orderType = isB2B ? 'b2b_vet' : isManada ? 'b2c_manada' : 'b2c_paw_member';

      // Para B2B verificamos que el user tenga un service_providers row activo
      if (isB2B) {
        const { data: sp, error: spErr } = await supabase
          .from('service_providers')
          .select('id, provider_plan')
          .eq('user_id', userId)
          .maybeSingle();
        if (spErr || !sp) {
          throw new Error('Debes registrarte como veterinario antes de contratar un plan B2B');
        }
      }

      // Idempotencia: si ya existe una subscription pendiente reciente (<5 min), reutilizar.
      // Para Manada matcheamos por dbPlanType ('paw_manada') porque las subs
      // de Manada tanto mensual como anual se guardan con plan_type='paw_manada'
      // (ciclo se distingue por payment_amount_clp). Para los demas planes,
      // plan_type === plan request.
      const { data: existingPending } = await supabase
        .from('subscriptions')
        .select('payment_provider_id, payment_amount_clp')
        .eq('user_id', userId)
        .eq('plan_type', dbPlanType)
        .eq('status', 'pending')
        .gt('start_date', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Solo reusar si el pending matchea el monto exacto (Manada mensual vs anual
      // usan el mismo plan_type pero distinto payment_amount_clp).
      if (existingPending?.payment_provider_id && existingPending.payment_amount_clp === amount) {
        console.log(
          '[flow-create-subscription] reusing pending subscription',
          existingPending.payment_provider_id
        );
        return new Response(
          JSON.stringify({
            url: `https://www.flow.cl/app/web/pay.php?token=${existingPending.payment_provider_id}`,
            token: existingPending.payment_provider_id,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      const orderPrefix = isB2B ? 'PFB2B' : isManada ? 'PFMAN' : 'PF';
      const commerceOrder = `${orderPrefix}-${userId.slice(0, 8)}-${Date.now()}`;

      // Optional contexto que se nos devuelve en el callback (Flow lo pasa al webhook).
      // Incluye db_plan_type para que el webhook sepa si es Manada y dispare
      // el INSERT en manada_aportes_log.
      const optional = JSON.stringify({
        user_id: userId,
        plan,
        order_type: orderType,
        db_plan_type: dbPlanType,
        is_manada: isManada,
      });

      // URLs de retorno limpias (Lote D auditoría pre-launch 2026-04-20, Opción B).
      // Legacy /upgrade/success y /upgrade/cancel redirigen via 301 a /paw-member/*
      // en App.tsx por si Flow siguiera redirigiendo a ellas.
      const urlReturn = isB2B
        ? `${SITE_URL}/provider/upgrade/success`
        : `${SITE_URL}/paw-member/success`;

      const params: Record<string, string> = {
        apiKey: FLOW_API_KEY,
        commerceOrder,
        subject: PLAN_SUBJECTS[plan] ?? 'Paw Friend',
        currency: 'CLP',
        amount: String(amount),
        email: userEmail,
        paymentMethod: '9', // 9 = todas las opciones
        urlConfirmation: `${SUPABASE_URL}/functions/v1/flow-webhook`,
        urlReturn,
        optional,
      };

      const signature = await signFlowParams(params, FLOW_SECRET_KEY);
      params.s = signature;

      // POST x-www-form-urlencoded (con timeout de 15s)
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
        console.error('[flow-create-subscription] Flow API error', {
          status: resp.status,
          flowJson,
        });
        throw new Error('Flow API rejected the request');
      }

      // Registramos un subscription pendiente para tener trazabilidad.
      // Tanto B2C como B2B usan la misma tabla con order_type como discriminador.
      // Manada (paw_manada_monthly/yearly) se guarda con plan_type='paw_manada'
      // (sin sufijo) — el ciclo se distingue por payment_amount_clp ($9.990 vs
      // $99.900). Asi las RPCs y useIsManada filtran por plan_type='paw_manada'
      // sin LIKE.
      await supabase.from('subscriptions').insert({
        user_id: userId,
        plan_type: dbPlanType,
        order_type: orderType,
        status: 'pending',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5).toISOString(), // placeholder; el webhook lo corrige
        payment_amount_clp: amount,
        payment_provider_id: flowJson.token,
        auto_renew: true,
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
      console.error('[flow-create-subscription] error', msg);
      return new Response(
        JSON.stringify({ error: 'No se pudo iniciar el pago. Intenta de nuevo en unos minutos.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  })
);
