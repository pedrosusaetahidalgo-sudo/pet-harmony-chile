/**
 * Edge Function: flow-webhook
 * Callback server-to-server de Flow.cl.
 * Flow llama acá vía POST x-www-form-urlencoded con `token`.
 * Confirmamos el pago consultando getStatus, validamos firma, y aplicamos premium.
 *
 * NUNCA confiamos en el body del webhook sin verificar contra Flow primero.
 *
 * Idempotencia (2026-04-20, P0-2):
 *   Flow reenvía el callback si no recibe 200 rápido o por su propio fault
 *   tolerance. Usamos la tabla `payment_events(flow_token, status_code)` como
 *   lock: el primer INSERT ON CONFLICT DO NOTHING decide quién procesa.
 *   Duplicados cortan con 200 sin volver a ejecutar efectos laterales.
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

    // Cliente admin se crea arriba: lo necesitamos para el lock de idempotencia
    // antes de ejecutar cualquier efecto lateral.
    const supabaseAdmin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    });

    // Tracking del evento actual para poder actualizar outcome al final.
    let currentToken: string | null = null;
    let currentStatus: number | null = null;

    async function markOutcome(outcome: 'ok' | 'failed' | 'skipped', errorMessage?: string) {
      if (!currentToken || currentStatus === null) return;
      try {
        await supabaseAdmin
          .from('payment_events')
          .update({
            processed_at: new Date().toISOString(),
            outcome,
            error_message: errorMessage ?? null,
          })
          .eq('flow_token', currentToken)
          .eq('status_code', currentStatus);
      } catch (e) {
        console.warn('[flow-webhook] markOutcome failed', e);
      }
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

      const statusCode = Number(statusJson.status);
      if (!Number.isInteger(statusCode)) {
        console.error('[flow-webhook] non-integer status', statusJson.status);
        return new Response('bad status', { status: 400 });
      }

      // ───────────────────────────────────────────────────────────────
      // LOCK DE IDEMPOTENCIA (P0-2 — auditoría top-tier 2026-04-20)
      //
      // Insertar en payment_events con PK (flow_token, status_code).
      // Si ya existe un row con el mismo par → este webhook es
      // duplicado; devolvemos 200 y salimos SIN ejecutar nada más.
      // ───────────────────────────────────────────────────────────────
      currentToken = token;
      currentStatus = statusCode;

      const { data: lockRow, error: lockErr } = await supabaseAdmin
        .from('payment_events')
        .insert({
          flow_token: token,
          status_code: statusCode,
          payload_summary: {
            amount: statusJson.amount ?? null,
            currency: statusJson.currency ?? null,
            media: statusJson.paymentData?.media ?? null,
          },
        })
        .select('flow_token')
        .maybeSingle();

      if (lockErr) {
        // `maybeSingle()` devuelve error si hay conflicto con PK existente.
        // Tratamos el conflicto (código 23505 en PostgREST mensajes) como
        // "ya procesado" y salimos con 200. Cualquier otro error lo
        // propagamos.
        const isConflict =
          lockErr.code === '23505' ||
          /duplicate key/i.test(lockErr.message ?? '') ||
          /violates unique/i.test(lockErr.message ?? '');

        if (isConflict) {
          console.log('[flow-webhook] duplicate webhook, already processed', {
            token,
            statusCode,
          });
          return new Response('already processed', { status: 200 });
        }

        console.error('[flow-webhook] lock insert failed', lockErr);
        return new Response('lock error', { status: 500 });
      }

      if (!lockRow) {
        // Defensivo: sin fila devuelta significa que hubo conflicto manejado
        // a nivel de política; tratamos como ya procesado.
        console.log('[flow-webhook] lock returned no row, treating as duplicate', {
          token,
          statusCode,
        });
        return new Response('already processed', { status: 200 });
      }

      // ───────────────────────────────────────────────────────────────

      // Parsear optional: necesitamos distinguir donacion/aporte vs subscription
      let userId: string | null = null;
      let plan: string | null = null;
      let paymentType: string | null = null;
      let orderType: string | null = null;
      let dbPlanType: string | null = null;
      try {
        const optional = JSON.parse(statusJson.optional ?? '{}');
        userId = optional.user_id ?? null;
        plan = optional.plan ?? null;
        paymentType = optional.type ?? null;
        orderType = optional.order_type ?? null;
        dbPlanType = optional.db_plan_type ?? null;
      } catch {
        // ignorar
      }

      const isDonation = paymentType === 'donation';
      const isB2B = orderType === 'b2b_vet';
      const isManada =
        orderType === 'b2c_manada' || plan === 'paw_manada_monthly' || plan === 'paw_manada_yearly';

      // status: 1=pendiente, 2=pagada, 3=rechazada, 4=anulada
      if (statusCode !== 2) {
        console.log('[flow-webhook] payment not completed', { token, status: statusCode });
        if (isDonation) {
          await supabaseAdmin
            .from('donations')
            .update({ status: 'failed', updated_at: new Date().toISOString() })
            .eq('payment_provider_id', token)
            .eq('status', 'pending');
        } else {
          await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('payment_provider_id', token)
            .eq('status', 'pending');
        }
        await markOutcome('ok');
        return new Response('ok', { status: 200 });
      }

      // Pago confirmado. Si es donacion, solo marcamos paid.
      if (isDonation) {
        if (!userId) {
          console.error('[flow-webhook] donation missing user_id in optional');
          await markOutcome('skipped', 'missing user_id in optional');
          return new Response('invalid optional', { status: 400 });
        }
        const amount = Number(statusJson.amount ?? 0);
        if (!amount || amount <= 0) {
          console.error('[flow-webhook] donation invalid amount', statusJson.amount);
          await markOutcome('skipped', 'invalid amount');
          return new Response('invalid amount', { status: 400 });
        }
        const { data: donationRow, error: donErr } = await supabaseAdmin
          .from('donations')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('payment_provider_id', token)
          .eq('status', 'pending')
          .select('id')
          .maybeSingle();
        if (donErr) {
          console.error('[flow-webhook] donation update failed', donErr);
          await markOutcome('failed', donErr.message);
          return new Response('donation update failed', { status: 500 });
        }
        console.log('[flow-webhook] donation paid', { userId, amount, token });

        // Fire-and-forget: mail de agradecimiento personalizado
        if (donationRow?.id) {
          try {
            await fetch(`${SUPABASE_URL}/functions/v1/send-donation-thanks`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
              },
              body: JSON.stringify({ donation_id: donationRow.id }),
            });
          } catch (thanksErr) {
            console.warn('[flow-webhook] thanks trigger failed', thanksErr);
          }
        }

        await markOutcome('ok');
        return new Response('ok', { status: 200 });
      }

      if (!userId || !plan) {
        console.error('[flow-webhook] missing user_id/plan in optional', statusJson.optional);
        await markOutcome('skipped', 'missing user_id/plan in optional');
        return new Response('invalid optional', { status: 400 });
      }

      const amount = Number(statusJson.amount ?? 0);
      if (!amount || amount <= 0) {
        console.error('[flow-webhook] invalid amount', statusJson.amount);
        await markOutcome('skipped', 'invalid amount');
        return new Response('invalid amount', { status: 400 });
      }

      // ─────────────────────────────────────────────────────────────────
      // B2B VET: actualiza service_providers.provider_plan + lifecycle
      // ─────────────────────────────────────────────────────────────────
      if (isB2B) {
        const validB2BPlans = ['provider_premium', 'provider_clinic_starter', 'provider_pro_max'];
        if (!validB2BPlans.includes(plan)) {
          console.error('[flow-webhook] invalid B2B plan', plan);
          await markOutcome('skipped', `invalid B2B plan: ${plan}`);
          return new Response('invalid B2B plan', { status: 400 });
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30d
        const nextBillingAt = expiresAt;

        const { error: spErr } = await supabaseAdmin
          .from('service_providers')
          .update({
            provider_plan: plan,
            plan_started_at: now.toISOString(),
            plan_expires_at: expiresAt.toISOString(),
            plan_next_billing_at: nextBillingAt.toISOString(),
            plan_cancelled_at: null,
            plan_billing_cycle: 'monthly',
            featured_until: expiresAt.toISOString(),
          })
          .eq('user_id', userId);

        if (spErr) {
          console.error('[flow-webhook] b2b service_providers update failed', spErr);
          await markOutcome('failed', spErr.message);
          return new Response('b2b update failed', { status: 500 });
        }

        // Marcar subscription pendiente como activa
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            start_date: now.toISOString(),
            end_date: expiresAt.toISOString(),
          })
          .eq('payment_provider_id', token)
          .eq('status', 'pending');

        console.log('[flow-webhook] b2b vet plan activated', { userId, plan, amount, token });
        await markOutcome('ok');
        return new Response('ok', { status: 200 });
      }

      // ─────────────────────────────────────────────────────────────────
      // B2C MANADA (Plan v5 Opcion 3, 2026-04-29)
      // Activa la suscripcion paw_manada + INSERTa en manada_aportes_log
      // con $2.000 al Fondo Paw Friend Refugios (mensual). Para anual,
      // el aporte equivalente se prorratea: $24.000 al cobrar el ano.
      // El cron mensual `close_manada_pool_for_previous_month` (futuro)
      // consolida el pool. Pedro (admin) hace transferencia bancaria a
      // refugios.
      // ─────────────────────────────────────────────────────────────────
      if (isManada) {
        const validManadaPlans = ['paw_manada_monthly', 'paw_manada_yearly'];
        if (!plan || !validManadaPlans.includes(plan)) {
          console.error('[flow-webhook] invalid Manada plan', plan);
          await markOutcome('skipped', `invalid Manada plan: ${plan}`);
          return new Response('invalid Manada plan', { status: 400 });
        }

        const isYearly = plan === 'paw_manada_yearly';
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000);
        // Aporte al fondo: $2.000/mes mensual o $24.000/ano (12 x $2.000) en el cobro anual
        const aporteClp = isYearly ? 24000 : 2000;

        // Activar la subscription (plan_type='paw_manada' setteado al insert)
        const { error: subErr } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            start_date: now.toISOString(),
            end_date: expiresAt.toISOString(),
          })
          .eq('payment_provider_id', token)
          .eq('status', 'pending');

        if (subErr) {
          console.error('[flow-webhook] manada subscription update failed', subErr);
          await markOutcome('failed', subErr.message);
          return new Response('manada update failed', { status: 500 });
        }

        // Buscar el refugio elegido (si tiene preferencia)
        let shelterId: string | null = null;
        try {
          const { data: prefRow } = await supabaseAdmin
            .from('manada_refugio_preferences')
            .select('preferred_shelter_id')
            .eq('user_id', userId)
            .maybeSingle();
          shelterId = prefRow?.preferred_shelter_id ?? null;
        } catch (prefErr) {
          console.warn('[flow-webhook] manada preferred shelter lookup failed', prefErr);
        }

        // INSERT en manada_aportes_log con UNIQUE(flow_charge_id) para idempotencia
        const { error: aporteErr } = await supabaseAdmin.from('manada_aportes_log').insert({
          user_id: userId,
          shelter_id_at_charge: shelterId,
          amount_clp: aporteClp,
          flow_charge_id: token,
          charged_at: now.toISOString(),
        });

        if (aporteErr) {
          // Si conflict UNIQUE, es un duplicate webhook ya procesado a este nivel
          const isConflict =
            aporteErr.code === '23505' || /duplicate key/i.test(aporteErr.message ?? '');
          if (!isConflict) {
            console.error('[flow-webhook] manada_aportes_log insert failed', aporteErr);
            // No fallar el webhook entero — la subscription ya esta activa.
            // Pedro puede backfillear el log manualmente si hace falta.
          }
        }

        console.log('[flow-webhook] manada plan activated + aporte logged', {
          userId,
          plan,
          amount,
          aporteClp,
          shelterId,
          token,
        });
        await markOutcome('ok');
        return new Response('ok', { status: 200 });
      }

      // ─────────────────────────────────────────────────────────────────
      // B2C Paw Member (legacy monthly/yearly)
      // ─────────────────────────────────────────────────────────────────
      if (plan !== 'monthly' && plan !== 'yearly') {
        console.error('[flow-webhook] invalid B2C plan', plan);
        await markOutcome('skipped', `invalid B2C plan: ${plan}`);
        return new Response('invalid plan', { status: 400 });
      }

      // Borrar el subscription pending placeholder antes de aplicar (apply_premium hace insert)
      await supabaseAdmin
        .from('subscriptions')
        .delete()
        .eq('payment_provider_id', token)
        .eq('status', 'pending');

      const { error: rpcError } = await supabaseAdmin.rpc('apply_premium', {
        p_user_id: userId,
        p_plan: plan,
        p_amount_clp: amount,
        p_provider_id: token,
      });

      if (rpcError) {
        console.error('[flow-webhook] apply_premium failed', rpcError);
        await markOutcome('failed', rpcError.message);
        return new Response('apply_premium failed', { status: 500 });
      }

      console.log('[flow-webhook] premium applied', { userId, plan, amount, token });
      await markOutcome('ok');
      return new Response('ok', { status: 200 });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[flow-webhook] error', msg);
      await markOutcome('failed', msg);
      return new Response('error', { status: 500 });
    }
  })
);
