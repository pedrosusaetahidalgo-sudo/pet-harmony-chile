/**
 * Edge Function: risk-signals-alert-cron
 *
 * Cron diario que llama compute_risk_signals() y envia email al admin
 * SOLO si hay 1+ signals con severity='critical'. Las warn no envian
 * email (evita ruido — el admin ya las ve en AdminRiskMonitor banner).
 *
 * Cierra hallazgo amarillo del production readiness doc:
 * "No hay alertas push (email/SMS/Slack) si signal cruza threshold
 * critical. Pedro debe abrir admin manualmente."
 *
 * Schedule sugerido (Supabase Dashboard > Database > Cron Jobs):
 *   0 12 * * *   -> 1x/dia a las 12 UTC (9am Chile, post-audit-cron)
 *
 * Auth: cron-auth shared secret. verify_jwt=false en config.toml.
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { requireCronAuth } from '../_shared/cron-auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import {
  bulletList,
  emailFooter,
  emailHeader,
  paragraph,
  section,
} from '../_shared/email-blocks.ts';
import { renderEmail } from '../_shared/email-layout.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Email destino: admin que recibe las alertas. Hard-coded a Pedro
// porque es el unico admin operacional. Si en algun futuro hay equipo,
// leer de admin_access where alert_email_opt_in = true.
const ALERT_EMAIL = Deno.env.get('ALERT_EMAIL') || 'pedrosusaeta@pawfriend.cl';

interface RiskSignal {
  signal_id: string;
  name: string;
  severity: 'critical' | 'warn';
  value: number;
  threshold: number;
  message: string;
  linked_risk: string;
  computed_at: string;
}

function buildAlertEmail(criticals: RiskSignal[]): string {
  const body = [
    emailHeader({
      variant: 'logo',
      tagline: 'Alerta operacional · Paw Friend',
    }),
    paragraph(
      `<strong>Hola Pedro,</strong> el cron de risk monitor detecto ${criticals.length} signal${criticals.length === 1 ? '' : 's'} <strong>critical</strong> en las ultimas 24 horas.`
    ),
    paragraph('Resumen:'),
    bulletList({
      items: criticals.map((s) => ({
        icon: '🔴',
        text: `<strong>${s.name}:</strong> ${s.message} (linked: ${s.linked_risk})`,
      })),
    }),
    section(
      `<p style="margin:0;color:#1f2937;font-size:14px;line-height:1.6;">Abrir <a href="https://pawfriend.cl/admin" style="color:#9333ea;text-decoration:underline;">Admin Dashboard</a> para revisar el banner AdminRiskMonitor con detalles + actions sugeridas.</p>`,
      '16px 24px'
    ),
    paragraph(
      'Si las signals son falso positivo o ya las atendiste, los criterios de threshold estan en mig 20260903100000_risk_monitor.sql + 20260921000000_b2b_risk_signals.sql. Ajustar ahi.'
    ),
    emailFooter({
      note: 'Recibes este correo porque eres admin de Paw Friend. Para opt-out, set ALERT_EMAIL="" en Supabase secrets.',
      secondary: 'Cron diario risk-signals-alert-cron · 12 UTC',
    }),
  ].join('');

  return renderEmail({
    title: `${criticals.length} alerta${criticals.length === 1 ? '' : 's'} critical · Paw Friend`,
    preheader: criticals.map((s) => s.name).join(' · '),
    body,
    width: 'wide',
  });
}

serve(
  withTelemetry('risk-signals-alert-cron', async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const authError = requireCronAuth(req);
    if (authError) return authError;

    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // 1. Llamar compute_risk_signals
      const { data: signals, error: signalsError } = await supabase.rpc('compute_risk_signals');

      if (signalsError) {
        console.error('Error computing signals:', signalsError);
        return new Response(JSON.stringify({ ok: false, error: signalsError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const allSignals = (signals as RiskSignal[]) || [];
      const criticals = allSignals.filter((s) => s.severity === 'critical');

      // 2. Si no hay criticals, no enviar email (evita ruido)
      if (criticals.length === 0) {
        console.log(
          `risk-signals-alert: ${allSignals.length} signals total, 0 criticals. Skipping email.`
        );
        return new Response(
          JSON.stringify({
            ok: true,
            total_signals: allSignals.length,
            criticals: 0,
            email_sent: false,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 3. Si no hay RESEND_API_KEY o ALERT_EMAIL, log warning y salir
      if (!RESEND_API_KEY || !ALERT_EMAIL) {
        console.warn(
          'risk-signals-alert: criticals detected but RESEND_API_KEY/ALERT_EMAIL missing. Skipping email.'
        );
        return new Response(
          JSON.stringify({
            ok: true,
            total_signals: allSignals.length,
            criticals: criticals.length,
            email_sent: false,
            reason: 'config_missing',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 4. Enviar email via Resend
      const html = buildAlertEmail(criticals);
      const subject = `🔴 ${criticals.length} alerta${criticals.length === 1 ? '' : 's'} critical · Paw Friend`;

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Paw Friend Alertas <hola@pawfriend.cl>',
          to: [ALERT_EMAIL],
          subject,
          html,
          text: criticals.map((s) => `${s.name}: ${s.message}`).join('\n\n'),
        }),
      });

      if (!emailRes.ok) {
        const errDetail = await emailRes.text();
        console.error('Resend error:', errDetail);
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'email_failed',
            detail: errDetail,
            criticals: criticals.length,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(
        `risk-signals-alert: email sent to ${ALERT_EMAIL} with ${criticals.length} criticals`
      );

      return new Response(
        JSON.stringify({
          ok: true,
          total_signals: allSignals.length,
          criticals: criticals.length,
          email_sent: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (e) {
      console.error('Unexpected error:', e);
      return new Response(JSON.stringify({ ok: false, error: String(e) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  })
);
