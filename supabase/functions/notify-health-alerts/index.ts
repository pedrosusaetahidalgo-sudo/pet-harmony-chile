// ==========================================================================
// notify-health-alerts — email a dueño cuando hay alerta severity='high'
//
// Refactor Maestro §2.8.3 (cascadas) + §2.8 (ambient computing).
//
// Cuando una alerta urgente se crea (vacuna >90d vencida o peso baja >=20%
// o condicion cronica grave), el banner in-app no es suficiente — el dueño
// quiza no abra la app en dias. Email cierra el loop.
//
// Cron diario 9am Chile:
//   SELECT cron.schedule(
//     'notify-health-alerts-daily',
//     '0 13 * * *',  -- 9am Chile
//     $$ SELECT net.http_post(
//       url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/notify-health-alerts',
//       headers := jsonb_build_object(
//         'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
//         'Content-Type', 'application/json'
//       )
//     ); $$
//   );
//
// Idempotencia: marca email_sent_at tras enviar. Si la mig 20260902500000
// no esta aplicada todavia, el query falla y la fn responde 500 (no envia
// emails duplicados, pero tampoco loguea ruido — log line interno).
// ==========================================================================
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { requireCronAuth } from '../_shared/cron-auth.ts';

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

function escapeHtml(s: string): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface AlertRow {
  id: string;
  pet_id: string;
  owner_id: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
  pet_name: string;
  owner_email: string;
  owner_display_name: string | null;
}

const ALERT_TYPE_COPY: Record<string, { subject: string; ctaLabel: string; ctaPath: string }> = {
  vaccine_overdue: {
    subject: 'Vacuna vencida — necesita tu atencion',
    ctaLabel: 'Agendar vacuna',
    ctaPath: '/home',
  },
  weight_loss_30d: {
    subject: 'Peso bajo significativo — chequeo recomendado',
    ctaLabel: 'Ver ficha',
    ctaPath: '/home',
  },
  antiparasitic_overdue: {
    subject: 'Antiparasitario vencido',
    ctaLabel: 'Aplicar antiparasitario',
    ctaPath: '/home',
  },
  no_activity_7d: {
    subject: 'Hace una semana que no abris la app',
    ctaLabel: 'Volver',
    ctaPath: '/home',
  },
  birthday_window: {
    subject: 'Esta semana cumple tu peludo',
    ctaLabel: 'Ver detalle',
    ctaPath: '/home',
  },
};

function buildEmailHtml(opts: {
  petName: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
  ownerName: string | null;
}): string {
  const { petName, message, ctaLabel, ctaUrl, ownerName } = opts;
  const safePet = escapeHtml(petName);
  const safeMsg = escapeHtml(message);
  const greeting = ownerName ? `Hola ${escapeHtml(ownerName)},` : 'Hola,';

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#fef2f2;font-family:system-ui,Arial,sans-serif;color:#1f2937">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.08)">
  <tr><td style="background:linear-gradient(135deg,#dc2626 0%,#f87171 100%);padding:28px 24px;color:#fff;text-align:center">
    <div style="font-size:40px;margin-bottom:8px">⚠️</div>
    <div style="font-size:22px;font-weight:800">${safePet} necesita atencion</div>
    <div style="font-size:13px;opacity:0.9;margin-top:4px">Alerta automatica · Paw Friend</div>
  </td></tr>
  <tr><td style="padding:28px 24px">
    <p style="margin:0 0 16px;font-size:16px;line-height:1.55">
      ${greeting}
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;border-radius:4px">
      ${safeMsg}
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.55">
      Esta alerta se gatillo automaticamente al revisar la ficha de tu mascota. Te recomendamos
      consultar con tu veterinario lo antes posible.
    </p>
    <div style="text-align:center;margin:24px 0">
      <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 6px 20px rgba(220,38,38,.3)">
        ${escapeHtml(ctaLabel)}
      </a>
    </div>
    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.5">
      Si ya resolviste esto, podes marcar la alerta como revisada en la app y dejara de aparecer.
      Esta es la unica vez que te avisamos por email para esta alerta especifica.
    </p>
  </td></tr>
  <tr><td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af">
    Enviado por Paw Friend · pawfriend.cl
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.warn('[notify-health-alerts] RESEND_API_KEY not set');
    return false;
  }
  const from = Deno.env.get('RESEND_FROM_EMAIL') || 'Paw Friend <onboarding@resend.dev>';
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        reply_to: 'hola@pawfriend.cl',
      }),
    });
    if (!resp.ok) {
      console.error('[notify-health-alerts] Resend error:', resp.status, await resp.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[notify-health-alerts] fetch error:', err);
    return false;
  }
}

serve(
  withTelemetry('notify-health-alerts', async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Sprint 1 P1 SEC-007: bloquea spam emails desde caller no autorizado.
    const authError = requireCronAuth(req);
    if (authError) return authError;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar alertas pendientes (sin joins — los hago en paso 2/3)
    const { data: alertsRaw, error: fetchErr } = await supabase
      .from('pet_health_alerts')
      .select('id, pet_id, owner_id, alert_type, severity, message, created_at')
      .eq('severity', 'high')
      .is('email_sent_at', null)
      .is('dismissed_at', null)
      .limit(100);

    if (fetchErr) {
      return jsonResponse({ success: false, error: fetchErr.message }, 500);
    }

    if (!alertsRaw || alertsRaw.length === 0) {
      return jsonResponse({ success: true, processed: 0, message: 'No alerts pending email' });
    }

    const alerts = alertsRaw as Array<{
      id: string;
      pet_id: string;
      owner_id: string;
      alert_type: string;
      severity: string;
      message: string;
      created_at: string;
    }>;

    // 2. Resolver pets (batch query por ids)
    const petIds = [...new Set(alerts.map((a) => a.pet_id))];
    const { data: petsData } = await supabase.from('pets').select('id, name').in('id', petIds);
    const petNameMap = new Map<string, string>();
    for (const p of (petsData as Array<{ id: string; name: string }> | null) ?? []) {
      petNameMap.set(p.id, p.name);
    }

    // 3. Resolver display_name de owners (profiles, batch)
    const ownerIds = [...new Set(alerts.map((a) => a.owner_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', ownerIds);
    const ownerNameMap = new Map<string, string | null>();
    for (const p of (profilesData as Array<{ id: string; display_name: string | null }> | null) ??
      []) {
      ownerNameMap.set(p.id, p.display_name);
    }

    // 4. Resolver emails via auth admin API (1 call por owner — no hay batch)
    const ownerEmailMap = new Map<string, string>();
    for (const ownerId of ownerIds) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(ownerId);
        if (userData?.user?.email) {
          ownerEmailMap.set(ownerId, userData.user.email);
        }
      } catch (err) {
        console.warn(`[notify-health-alerts] no email for owner ${ownerId}`, err);
      }
    }

    // 5. Construir AlertRow filtrando los que tienen toda la data
    const rows: AlertRow[] = alerts
      .map((a): AlertRow | null => {
        const petName = petNameMap.get(a.pet_id);
        const email = ownerEmailMap.get(a.owner_id);
        if (!petName || !email) return null;
        return {
          id: a.id,
          pet_id: a.pet_id,
          owner_id: a.owner_id,
          alert_type: a.alert_type,
          severity: a.severity,
          message: a.message,
          created_at: a.created_at,
          pet_name: petName,
          owner_email: email,
          owner_display_name: ownerNameMap.get(a.owner_id) ?? null,
        };
      })
      .filter((r): r is AlertRow => r !== null);

    const results = { sent: 0, failed: 0 };
    const SITE = 'https://pawfriend.cl';

    for (const alert of rows) {
      const copy = ALERT_TYPE_COPY[alert.alert_type] ?? {
        subject: 'Tu mascota necesita atencion',
        ctaLabel: 'Ver ficha',
        ctaPath: '/home',
      };

      const html = buildEmailHtml({
        petName: alert.pet_name,
        message: alert.message,
        ctaLabel: copy.ctaLabel,
        ctaUrl: `${SITE}${copy.ctaPath}`,
        ownerName: alert.owner_display_name,
      });

      const ok = await sendEmail({
        to: alert.owner_email,
        subject: `${copy.subject} · ${alert.pet_name}`,
        html,
      });

      if (ok) {
        results.sent++;
        // Marcar email_sent_at para idempotencia
        await supabase
          .from('pet_health_alerts')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', alert.id);
      } else {
        results.failed++;
      }
    }

    return jsonResponse({
      success: true,
      processed: rows.length,
      ...results,
    });
  })
);
