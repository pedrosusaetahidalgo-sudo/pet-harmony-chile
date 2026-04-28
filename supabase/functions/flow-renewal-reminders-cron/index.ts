/**
 * Edge Function: flow-renewal-reminders-cron
 *
 * Sprint 1 P1 BIZ-006 (2026-04-28).
 *
 * Contexto: Flow.cl Plus (la integracion actual) NO tiene auto-renewal
 * nativo en el modelo de "pago unico". Las subscriptions hoy expiran y el
 * usuario tiene que volver a pagar manualmente. Sin recordatorio, churn
 * silencioso garantizado.
 *
 * Esta fn corre 1x/dia y manda email "Tu plan vence en X dias" a usuarios
 * con `auto_renew = true` + `end_date BETWEEN now() y now() + 7 days` y
 * que NO recibieron este recordatorio en los ultimos 7 dias (idempotencia).
 *
 * NO cobra. Solo notifica. Cuando Pedro integre Flow Oneclick Mall en
 * Sprint 2+, este mismo cron extiende a auto-cobro: leer customer_id +
 * disparar charge + actualizar subscription.
 *
 * Auth: requireCronAuth (Sprint 1 P1 SEC-007).
 *
 * Schedule sugerido (Supabase Dashboard > Database > Cron Jobs):
 *   0 14 * * *   -> 1x/dia 11am Chile (14 UTC)
 *
 *   SELECT cron.schedule(
 *     'flow-renewal-reminders-daily',
 *     '0 14 * * *',
 *     $$ SELECT net.http_post(
 *       url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/flow-renewal-reminders-cron',
 *       headers := jsonb_build_object(
 *         'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
 *         'Content-Type', 'application/json'
 *       )
 *     ); $$
 *   );
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { requireCronAuth } from '../_shared/cron-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_type: string;
  end_date: string;
  payment_amount_clp: number;
  last_renewal_reminder_at: string | null;
}

const REMINDER_WINDOW_DAYS = 7;
const COOLDOWN_DAYS = 7;

async function sendReminderEmail(opts: {
  email: string;
  displayName: string;
  planName: string;
  endDate: string;
  amountClp: number;
}): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    console.warn('[flow-renewal-reminders] RESEND_API_KEY missing — skipping send');
    return false;
  }
  const FROM = Deno.env.get('RESEND_FROM_EMAIL') || 'Paw Friend <no-reply@pawfriend.cl>';
  const dueText = new Date(opts.endDate).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const amount = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
    opts.amountClp
  );
  const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;background:#f9fafb;padding:24px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
    <tr><td style="background:#7c3aed;color:#fff;padding:18px 24px;font-weight:bold">🐾 Paw Friend</td></tr>
    <tr><td style="padding:28px 24px;color:#0f172a">
      <h1 style="font-size:18px;margin:0 0 12px">Tu plan ${opts.planName} vence pronto</h1>
      <p style="font-size:14px;line-height:1.55;margin:0 0 12px">
        Hola ${opts.displayName}, tu plan vence el <strong>${dueText}</strong>.
        Si quieres mantenerlo, renueva con un solo click.
      </p>
      <p style="font-size:14px;line-height:1.55;margin:0 0 20px">
        Renovación: <strong>${amount}</strong>
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="https://pawfriend.cl/paw-member" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:600;font-size:14px">Renovar plan</a>
      </div>
      <p style="font-size:12px;color:#6b7280;margin:16px 0 0">
        Si prefieres dar de baja, simplemente no renueves. Tus datos se mantienen.
      </p>
    </td></tr>
    <tr><td style="background:#f9fafb;padding:14px 24px;text-align:center;font-size:11px;color:#6b7280;border-top:1px solid #e5e7eb">
      Paw Friend · pawfriend.cl
    </td></tr>
  </table>
  </body></html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [opts.email],
        subject: `Tu plan ${opts.planName} vence el ${dueText}`,
        html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn('[flow-renewal-reminders] Resend error', res.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[flow-renewal-reminders] send failed', err);
    return false;
  }
}

serve(
  withTelemetry('flow-renewal-reminders-cron', async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Sprint 1 P1 SEC-007: solo cron interno o secret valido.
    const authError = requireCronAuth(req);
    if (authError) return authError;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    // Subscriptions activas con auto_renew=true que vencen en la ventana
    // y NO recibieron recordatorio en los ultimos 7 dias.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subs, error: subsErr } = await (supabase as any)
      .from('subscriptions')
      .select('id, user_id, plan_type, end_date, payment_amount_clp, last_renewal_reminder_at')
      .eq('status', 'active')
      .eq('auto_renew', true)
      .gte('end_date', now.toISOString())
      .lte('end_date', windowEnd.toISOString());

    if (subsErr) {
      console.error('[flow-renewal-reminders] query subscriptions failed', subsErr);
      return new Response(JSON.stringify({ error: 'subscriptions query failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const candidates = ((subs as SubscriptionRow[]) ?? []).filter((s) => {
      if (!s.last_renewal_reminder_at) return true;
      const lastSentAge =
        (now.getTime() - new Date(s.last_renewal_reminder_at).getTime()) / 86_400_000;
      return lastSentAge > COOLDOWN_DAYS;
    });

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const sub of candidates) {
      // Resolver email + display_name del user.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userData } = await (supabase.auth.admin as any).getUserById(sub.user_id);
      const email = userData?.user?.email;
      if (!email) {
        skipped++;
        continue;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('display_name')
        .eq('id', sub.user_id)
        .maybeSingle();
      const displayName = (profile?.display_name as string | undefined) ?? 'tu';

      const ok = await sendReminderEmail({
        email,
        displayName,
        planName: sub.plan_type,
        endDate: sub.end_date,
        amountClp: sub.payment_amount_clp ?? 0,
      });
      if (!ok) {
        errors.push(sub.id);
        continue;
      }

      // Marcar idempotencia. Si la columna no existe (mig pendiente), el
      // update fallara silencioso y la fn re-enviara. Pedro debe correr la
      // mig que agrega last_renewal_reminder_at antes de scheduling.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('subscriptions')
        .update({ last_renewal_reminder_at: now.toISOString() })
        .eq('id', sub.id);
      sent++;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        candidates: candidates.length,
        sent,
        skipped,
        errors: errors.length,
        window_days: REMINDER_WINDOW_DAYS,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  })
);
