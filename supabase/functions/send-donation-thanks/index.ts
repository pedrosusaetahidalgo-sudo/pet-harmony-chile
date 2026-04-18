/**
 * Edge Function: send-donation-thanks
 * Envia mail personalizado de agradecimiento luego de una donacion pagada.
 *
 * Body: { donation_id: string }
 * Llamado desde flow-webhook (service role) cuando marca la donacion como paid.
 * Idempotente: si thanked_at != null, no reenvia.
 *
 * Fallback: si no hay RESEND_API_KEY, solo loggea y marca thanked_at.
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { withTelemetry } from '../_shared/telemetry.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function htmlTemplate(name: string, amount: number, message: string | null) {
  const formatted = amount.toLocaleString('es-CL');
  const sigName = name && name.length > 0 ? name : 'Amigue peludo';
  const messageBlock = message
    ? `
      <blockquote style="margin:16px 0; padding:12px 14px; border-left: 3px solid #f472b6; background:#fdf2f8; color:#831843; font-style:italic; border-radius:6px;">
        "${message.replace(/</g, '&lt;')}"
      </blockquote>
    `
    : '';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Gracias por tu aporte</title>
</head>
<body style="margin:0; padding:0; background:#fff7ed; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 6px 24px rgba(236,72,153,0.12);">
          <tr>
            <td style="background: linear-gradient(135deg,#ec4899,#f59e0b); padding: 28px 28px 20px; color:#fff; text-align:center;">
              <div style="font-size:34px; line-height:1;">🐾💛</div>
              <h1 style="margin: 8px 0 0; font-size:22px; letter-spacing:-0.01em;">Gracias, ${sigName}</h1>
              <p style="margin: 6px 0 0; font-size: 13px; opacity:.9;">Tu donacion llego con patitas a Paw Friend</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 28px; font-size:15px; line-height:1.55;">
              <p>Soy Pedro, la persona detras de Paw Friend. Leer que alguien como tu decidio donar <b>$${formatted} CLP</b> me hace el dia.</p>
              <p>Quiero que sepas algo: <b>detras de esta app hay alguien como tu</b> — que ama a los animales, que los quiere cuidar, y que lo va a hacer con un poquito de ayuda tuya. No es una empresa gigante, es un humano peludo mas.</p>
              <p>Este aporte no solo mantiene una app: <b>es un gesto hacia los que cuidan a los peludos todos los dias</b> — tutores, veterinarios, rescatistas, voluntarios de refugios.</p>
              <p style="margin: 14px 0 6px; font-weight:600; color:#be185d;">Hacia donde vamos con lo recaudado</p>
              <ul style="padding-left:18px; margin: 6px 0 10px;">
                <li><b>Hoy:</b> servidores, seguridad de datos y que la app siga 100% gratis para cualquier tutor.</li>
                <li><b>Pronto:</b> mapa de <b>callejeros</b> reportables con apoyo colectivo (comida, rescate, esterilizacion).</li>
                <li><b>Siguiente fase:</b> modulo de <b>adopciones</b> serio, con refugios aliados verificados.</li>
                <li><b>Futuro:</b> canal transparente para <b>derivar excedentes</b> a hogares de transito y clinicas de bajo costo.</li>
              </ul>
              ${messageBlock}
              <p style="margin-top:18px;">Gracias por cuidar a los peludos. Si tienes ideas, reclamos o simplemente quieres saludar, respondeme este correo — lo leo yo.</p>
              <p style="margin: 22px 0 0;">Con carino,<br /><b>Pedro</b> · Paw Friend 🐾</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 28px 24px; font-size:12px; color:#6b7280; border-top:1px solid #f3e8ff;">
              Si no fuiste tu quien hizo esta donacion, respondenos y lo revisamos.
              <br />
              <a href="https://pawfriend.cl" style="color:#db2777; text-decoration:none;">pawfriend.cl</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function textTemplate(name: string, amount: number, message: string | null) {
  const formatted = amount.toLocaleString('es-CL');
  const sigName = name && name.length > 0 ? name : 'Amigue peludo';
  return [
    `Gracias, ${sigName}.`,
    '',
    `Soy Pedro, detras de Paw Friend. Tu donacion de $${formatted} CLP ayuda muchisimo.`,
    'Es un proyecto home-made en Chile. Cada aporte voluntario nos permite seguir gratis.',
    message ? `\nTu mensaje: "${message}"` : '',
    '',
    'Con carino,',
    'Pedro — Paw Friend 🐾',
    'https://pawfriend.cl',
  ]
    .filter(Boolean)
    .join('\n');
}

serve(
  withTelemetry('send-donation-thanks', async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    try {
      const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { persistSession: false },
      });

      const body = await req.json().catch(() => ({}));
      const donationId = body?.donation_id as string | undefined;
      if (!donationId) return json({ error: 'donation_id requerido' }, 400);

      const { data: donation, error } = await admin
        .from('donations')
        .select('id, user_id, amount_clp, status, donor_name, message, email_contact, thanked_at')
        .eq('id', donationId)
        .maybeSingle();

      if (error) throw error;
      if (!donation) return json({ error: 'donation no encontrada' }, 404);
      if (donation.status !== 'paid') return json({ error: 'donation no esta paid' }, 400);
      if (donation.thanked_at) return json({ ok: true, skipped: 'already_thanked' });

      // Resolver email del donante
      let email = donation.email_contact ?? null;
      let fallbackName = donation.donor_name ?? null;

      if (!email && donation.user_id) {
        const { data: userRes } = await admin.auth.admin.getUserById(donation.user_id);
        email = userRes?.user?.email ?? null;
        if (!fallbackName) {
          const { data: profile } = await admin
            .from('profiles')
            .select('display_name')
            .eq('id', donation.user_id)
            .maybeSingle();
          fallbackName =
            profile?.display_name || userRes?.user?.email?.split('@')[0] || 'Amigue peludo';
        }
      }

      if (!email) {
        // Marcamos thanked_at igual para no reintentar
        await admin
          .from('donations')
          .update({ thanked_at: new Date().toISOString() })
          .eq('id', donationId);
        return json({ ok: true, skipped: 'no_email' });
      }

      const name = fallbackName || 'Amigue peludo';

      if (!RESEND_API_KEY) {
        console.warn('[send-donation-thanks] RESEND_API_KEY missing, marcando igualmente');
        await admin
          .from('donations')
          .update({ thanked_at: new Date().toISOString() })
          .eq('id', donationId);
        return json({ ok: true, skipped: 'no_resend_key' });
      }

      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Pedro de Paw Friend <pedro@pawfriend.cl>',
          to: [email],
          subject: `Gracias por tu aporte a Paw Friend, ${name} 💛`,
          html: htmlTemplate(name, donation.amount_clp, donation.message),
          text: textTemplate(name, donation.amount_clp, donation.message),
        }),
      });

      if (!resp.ok) {
        const detail = await resp.text();
        console.error('[send-donation-thanks] resend error', resp.status, detail);
        return json({ error: 'resend_failed', detail }, 502);
      }

      await admin
        .from('donations')
        .update({ thanked_at: new Date().toISOString() })
        .eq('id', donationId);

      return json({ ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[send-donation-thanks] error', msg);
      return json({ error: msg }, 500);
    }
  })
);
