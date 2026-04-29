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
import {
  blockquote,
  cta,
  emailFooter,
  emailHeader,
  metaTable,
  section,
  spacer,
  type MetaRow,
} from '../_shared/email-blocks.ts';
import {
  escapeHtml,
  escapeUrl,
  renderEmail,
  sendEmail as sendResendEmail,
} from '../_shared/email-layout.ts';
import { BRAND, FONT, NEUTRAL, SIZE, SPACE } from '../_shared/email-theme.ts';

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
  b2b_api: 'B2B API',
  otro: 'Otro',
};

const NOTIFICATION_EMAIL = Deno.env.get('PITCH_NOTIFICATION_EMAIL') || 'pedrosusaeta@pawfriend.cl';

const ADMIN_URL = 'https://pawfriend.cl/admin?section=system&sub=pitch-applications';

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

  // Contact card custom (nombre grande + org + email/phone como links)
  const contactCard = section(
    `
<h2 style="margin:0 0 ${SPACE.sm};font-family:${FONT.display};font-size:${SIZE.h2};color:${NEUTRAL[900]};font-weight:700;">${escapeHtml(app.contact_name)}</h2>
${app.organization_name ? `<p style="margin:0 0 6px;color:${NEUTRAL[500]};font-size:${SIZE.body};">${escapeHtml(app.organization_name)}</p>` : ''}
<p style="margin:0;color:${NEUTRAL[600]};font-size:${SIZE.body};line-height:1.6;">
<a href="mailto:${escapeUrl(app.contact_email)}" style="color:${BRAND[700]};text-decoration:none;">${escapeHtml(app.contact_email)}</a>
${app.contact_phone ? ` · <a href="tel:${escapeUrl(app.contact_phone)}" style="color:${BRAND[700]};text-decoration:none;">${escapeHtml(app.contact_phone)}</a>` : ''}
${app.website ? `<br><a href="${escapeUrl(app.website)}" target="_blank" rel="noopener noreferrer" style="color:${BRAND[700]};text-decoration:none;">${escapeHtml(app.website)}</a>` : ''}
</p>
`,
    `${SPACE.xl} ${SPACE['2xl']}`
  );

  // Convertimos el payload (datos adicionales) en rows de metaTable
  const metaRows: MetaRow[] = Object.entries(app.payload || {})
    .filter(([, v]) => v !== null && v !== '' && v !== undefined)
    .map(([k, v]) => ({
      label: k.replace(/_/g, ' '),
      value: String(v),
    }));

  const body = [
    emailHeader({
      variant: 'emoji',
      eyebrow: 'Nueva postulacion',
      emoji: '📮',
      title: label,
      tagline: 'Paw Friend · admin',
    }),
    contactCard,
    app.message ? blockquote(app.message) : '',
    metaRows.length ? metaTable(metaRows) : '',
    spacer('md'),
    cta({
      text: 'Revisar en Admin',
      url: ADMIN_URL,
    }),
    section(
      `<p style="margin:0;font-size:${SIZE.xs};color:${NEUTRAL[500]};line-height:1.6;">
ID: <code style="background:${NEUTRAL[100]};padding:2px 6px;border-radius:4px;color:${NEUTRAL[700]};font-family:${FONT.mono};">${escapeHtml(app.id)}</code>
${app.source_url ? `<br>Origen: ${escapeHtml(app.source_url)}` : ''}
</p>`,
      `${SPACE.md} ${SPACE['2xl']} ${SPACE.xl}`
    ),
    emailFooter({
      note: 'Notificación interna · Paw Friend admin',
      homeMade: false,
    }),
  ].join('');

  return renderEmail({
    title: `Nueva postulacion · ${label} · ${app.contact_name}`,
    preheader: `${label} · ${app.contact_name}${app.organization_name ? ` (${app.organization_name})` : ''} · ${app.contact_email}`,
    body,
    width: 'wide',
  });
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
  const result = await sendResendEmail(opts);
  if (!result.ok) {
    console.warn('[notify-pitch-application] email not sent:', result.error);
  }
  return result.ok;
}

// Sprint 1 P1 SEC-008 (2026-04-28): tightening de seguridad.
//
// Antes: aceptaba cualquier application_id y disparaba email Resend + Slack +
// Discord, permitiendo enumeracion + abuse de quota.
//
// Ahora exigimos las DOS condiciones:
//   1. El caller envia `confirmation_email` en el body que coincide con
//      contact_email del application_id. Esto bloquea enumeracion pura.
//   2. El application_id se creo en los ultimos 10 minutos. Bloquea abuse
//      retroactivo (replay para spammear admin con re-notificaciones).
//
// El path legitimo (frontend POST justo despues del INSERT en /aplicar) cumple
// ambas: el usuario acaba de tipear su email y de crear la fila.
const RECENT_WINDOW_MINUTES = 10;

serve(
  withTelemetry('notify-pitch-application', async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      const { application_id, confirmation_email } = await req.json();
      if (!application_id || typeof application_id !== 'string') {
        return errorResponse('application_id is required', 400);
      }
      if (!confirmation_email || typeof confirmation_email !== 'string') {
        return errorResponse('confirmation_email is required', 400);
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

      // Verifica que el caller conoce el email de quien postulo.
      if (
        confirmation_email.trim().toLowerCase() !== (app.contact_email || '').trim().toLowerCase()
      ) {
        // Misma respuesta que "not found" — no revelar si el id existe.
        return errorResponse('Application not found', 404);
      }

      // Verifica que el application_id es reciente.
      const createdAt = new Date(app.created_at).getTime();
      const ageMinutes = (Date.now() - createdAt) / 60_000;
      if (!Number.isFinite(ageMinutes) || ageMinutes > RECENT_WINDOW_MINUTES) {
        return errorResponse('Notification window expired', 410);
      }

      const label = KIND_LABELS[app.kind] || app.kind;
      const subject = `Nueva postulacion · ${label} · ${app.contact_name}`;

      const html = buildEmailHtml(app as Parameters<typeof buildEmailHtml>[0]);

      const [emailSent, slackSent, discordSent] = await Promise.all([
        sendEmail({ to: NOTIFICATION_EMAIL, subject, html }),
        sendToSlack({
          kindLabel: label,
          name: app.contact_name,
          email: app.contact_email,
          org: app.organization_name,
          message: app.message,
          adminUrl: ADMIN_URL,
        }),
        sendToDiscord({
          kindLabel: label,
          name: app.contact_name,
          email: app.contact_email,
          org: app.organization_name,
          message: app.message,
          adminUrl: ADMIN_URL,
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
