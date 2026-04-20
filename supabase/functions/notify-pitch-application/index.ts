/**
 * Edge Function: notify-pitch-application
 *
 * Cuando alguien postula via /aplicar, la app frontend hace INSERT publico
 * en pitch_applications y luego llama a esta edge fn para notificar a
 * Pedro via Resend.
 *
 * POST body: { application_id: string }
 * Auth: no requerida (llamada desde frontend, la data se valida con RLS)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const KIND_LABELS: Record<string, string> = {
  corfo: 'CORFO SSAF-I',
  startup_chile: 'Start-Up Chile',
  paw_companys: 'Paw Companys (Sponsor)',
  angels_vc: 'Angels / VC',
  refugio: 'Hogar de adopcion',
  paw_partners: 'Paw Partner (Tienda/Servicio)',
  vet: 'Veterinario',
  paw_voices: 'Paw Voice (Creador)',
  otro: 'Otro',
};

const NOTIFICATION_EMAIL = Deno.env.get('PITCH_NOTIFICATION_EMAIL') || 'pedrosusaeta@pawfriend.cl';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
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

function buildEmailHtml(app: {
  id: string;
  kind: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  organization_name: string | null;
  website: string | null;
  message: string | null;
  payload: Record<string, unknown> | null;
  source_url: string | null;
  created_at: string;
}): string {
  const label = KIND_LABELS[app.kind] || app.kind;
  const payloadRows = Object.entries(app.payload || {})
    .filter(([, v]) => v !== null && v !== '' && v !== undefined)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.05em">${escapeHtml(k)}</td><td style="padding:6px 12px;color:#111827">${escapeHtml(String(v))}</td></tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#faf5ff;font-family:system-ui,Arial,sans-serif;color:#1f2937">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.08)">
  <tr><td style="background:linear-gradient(135deg,#9333ea 0%,#c084fc 100%);padding:24px;color:#fff">
    <div style="font-size:12px;text-transform:uppercase;letter-spacing:.12em;opacity:.9">Nueva postulacion — Paw Friend</div>
    <div style="font-size:24px;font-weight:800;margin-top:4px">${escapeHtml(label)}</div>
  </td></tr>
  <tr><td style="padding:24px">
    <h2 style="margin:0 0 12px;font-size:18px;color:#111827">${escapeHtml(app.contact_name)}</h2>
    ${app.organization_name ? `<p style="margin:0 0 4px;color:#6b7280;font-size:14px">${escapeHtml(app.organization_name)}</p>` : ''}
    <p style="margin:0;color:#6b7280;font-size:14px">
      <a href="mailto:${escapeHtml(app.contact_email)}" style="color:#7c3aed">${escapeHtml(app.contact_email)}</a>
      ${app.contact_phone ? ` · <a href="tel:${escapeHtml(app.contact_phone)}" style="color:#7c3aed">${escapeHtml(app.contact_phone)}</a>` : ''}
    </p>
    ${app.website ? `<p style="margin:4px 0 0;color:#6b7280;font-size:14px"><a href="${escapeHtml(app.website)}" target="_blank" rel="noopener noreferrer" style="color:#7c3aed">${escapeHtml(app.website)}</a></p>` : ''}
  </td></tr>

  ${
    app.message
      ? `<tr><td style="padding:0 24px 24px">
    <div style="background:#faf5ff;border-left:4px solid #9333ea;border-radius:8px;padding:16px">
      <div style="font-size:12px;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Mensaje</div>
      <p style="margin:0;color:#1f2937;font-size:14px;line-height:1.55;white-space:pre-wrap">${escapeHtml(app.message)}</p>
    </div>
  </td></tr>`
      : ''
  }

  ${
    payloadRows
      ? `<tr><td style="padding:0 24px 24px">
    <div style="font-size:12px;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Datos adicionales</div>
    <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden">${payloadRows}</table>
  </td></tr>`
      : ''
  }

  <tr><td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
    <div>ID: <code style="color:#374151">${escapeHtml(app.id)}</code></div>
    ${app.source_url ? `<div style="margin-top:4px">Origen: ${escapeHtml(app.source_url)}</div>` : ''}
    <div style="margin-top:8px">
      <a href="https://pawfriend.cl/admin?section=system&sub=pitch-applications"
         style="display:inline-block;background:#9333ea;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">
        Revisar en Admin
      </a>
    </div>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

/**
 * Envia notificacion opcional a Slack/Discord si los webhooks estan
 * configurados como secretos. Ambos son "best effort" — si fallan, no
 * bloquean el flujo del email.
 */
async function sendToSlack(opts: {
  kindLabel: string;
  name: string;
  email: string;
  org: string | null;
  message: string | null;
  adminUrl: string;
}): Promise<boolean> {
  const webhook = Deno.env.get('SLACK_PITCH_WEBHOOK_URL');
  if (!webhook) return false;
  try {
    const text = `*Nueva postulacion · ${opts.kindLabel}*\n*${opts.name}*${opts.org ? ` (${opts.org})` : ''}\n📧 ${opts.email}${opts.message ? `\n> ${opts.message.slice(0, 200)}${opts.message.length > 200 ? '…' : ''}` : ''}\n<${opts.adminUrl}|Revisar en Admin>`;
    const resp = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mrkdwn: true }),
    });
    return resp.ok;
  } catch (err) {
    console.error('[notify-pitch-application] Slack error:', err);
    return false;
  }
}

async function sendToDiscord(opts: {
  kindLabel: string;
  name: string;
  email: string;
  org: string | null;
  message: string | null;
  adminUrl: string;
}): Promise<boolean> {
  const webhook = Deno.env.get('DISCORD_PITCH_WEBHOOK_URL');
  if (!webhook) return false;
  try {
    const embed = {
      title: `Nueva postulacion · ${opts.kindLabel}`,
      description: `**${opts.name}**${opts.org ? ` · ${opts.org}` : ''}\n📧 ${opts.email}${opts.message ? `\n\n${opts.message.slice(0, 300)}${opts.message.length > 300 ? '…' : ''}` : ''}`,
      color: 0x9333ea, // purple
      url: opts.adminUrl,
      timestamp: new Date().toISOString(),
    };
    const resp = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
    return resp.ok;
  } catch (err) {
    console.error('[notify-pitch-application] Discord error:', err);
    return false;
  }
}

async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.warn('[notify-pitch-application] RESEND_API_KEY not set, skipping email');
    return false;
  }
  const from = Deno.env.get('RESEND_FROM_EMAIL') || 'Paw Friend <onboarding@resend.dev>';
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        reply_to: 'hola@pawfriend.cl',
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error('[notify-pitch-application] Resend error:', resp.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[notify-pitch-application] fetch error:', err);
    return false;
  }
}

serve(
  withTelemetry('notify-pitch-application', async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      const { application_id } = await req.json();
      if (!application_id || typeof application_id !== 'string') {
        return errorResponse('application_id is required', 400);
      }

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: app, error } = await supabaseAdmin
        .from('pitch_applications')
        .select(
          'id, kind, contact_name, contact_email, contact_phone, organization_name, website, message, payload, source_url, created_at'
        )
        .eq('id', application_id)
        .maybeSingle();

      if (error || !app) {
        return errorResponse('Application not found', 404);
      }

      const label = KIND_LABELS[app.kind] || app.kind;
      const subject = `Nueva postulacion · ${label} · ${app.contact_name}`;

      const html = buildEmailHtml(app as Parameters<typeof buildEmailHtml>[0]);

      const adminUrl = 'https://pawfriend.cl/admin?section=system&sub=pitch-applications';

      const [emailSent, slackSent, discordSent] = await Promise.all([
        sendEmail({ to: NOTIFICATION_EMAIL, subject, html }),
        sendToSlack({
          kindLabel: label,
          name: app.contact_name,
          email: app.contact_email,
          org: app.organization_name,
          message: app.message,
          adminUrl,
        }),
        sendToDiscord({
          kindLabel: label,
          name: app.contact_name,
          email: app.contact_email,
          org: app.organization_name,
          message: app.message,
          adminUrl,
        }),
      ]);

      return jsonResponse({
        success: true,
        email_sent: emailSent,
        slack_sent: slackSent,
        discord_sent: discordSent,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[notify-pitch-application] error:', message);
      return errorResponse('Internal error', 500);
    }
  })
);
