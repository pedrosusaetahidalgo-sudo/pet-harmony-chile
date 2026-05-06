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
import { requireCronAuth } from '../_shared/cron-auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import {
  blockquote,
  bulletList,
  emailFooter,
  emailHeader,
  paragraph,
  signature,
  spacer,
} from '../_shared/email-blocks.ts';
import { renderEmail } from '../_shared/email-layout.ts';
import { GRADIENT, TAGLINE } from '../_shared/email-theme.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

function htmlTemplate(name: string, amount: number, message: string | null) {
  const formatted = amount.toLocaleString('es-CL');
  const sigName = name && name.length > 0 ? name : 'Amigue peludo';

  const body = [
    emailHeader({
      variant: 'emoji',
      gradient: GRADIENT.warm,
      emoji: '🐾💛',
      title: `Gracias, ${sigName}`,
      tagline: TAGLINE.donation,
    }),
    paragraph(
      `Soy Pedro, la persona detras de Paw Friend. Leer que alguien como tu decidio aportar $${formatted} CLP me hace el dia.`
    ),
    paragraph(
      'Quiero que sepas algo: detras de esta app hay alguien como tu — que ama a los animales, que los quiere cuidar, y que lo va a hacer con un poquito de ayuda tuya. No es una empresa gigante, es un humano peludo mas.'
    ),
    paragraph(
      'Este aporte no solo mantiene una app: es un gesto hacia los que cuidan a los peludos todos los dias — tutores, veterinarios, rescatistas, voluntarios de refugios.'
    ),
    bulletList({
      label: 'Hacia donde vamos con lo recaudado',
      items: [
        {
          icon: '🛡️',
          text: 'Hoy: servidores, seguridad de datos y que la app siga 100% gratis para cualquier tutor.',
        },
        {
          icon: '🗺️',
          text: 'Pronto: mapa de callejeros reportables con apoyo colectivo (comida, rescate, esterilizacion).',
        },
        {
          icon: '🏡',
          text: 'Siguiente fase: modulo de adopciones serio, con refugios aliados verificados.',
        },
        {
          icon: '💛',
          text: 'Futuro: canal transparente para derivar excedentes a hogares de transito y clinicas de bajo costo.',
        },
      ],
    }),
    message ? blockquote(message) : '',
    signature({
      intro:
        'Gracias por cuidar a los peludos. Si tienes ideas, reclamos o simplemente quieres saludar, respondeme este correo — lo leo yo.',
    }),
    spacer('md'),
    emailFooter({
      note: 'Si no fuiste tu quien hizo este aporte, respondenos y lo revisamos.',
    }),
  ].join('');

  return renderEmail({
    title: `Gracias por tu aporte a Paw Friend, ${sigName}`,
    preheader: `Tu aporte de $${formatted} CLP ya llego. Este correo es un gracias humano, no automático.`,
    body,
  });
}

function textTemplate(name: string, amount: number, message: string | null) {
  const formatted = amount.toLocaleString('es-CL');
  const sigName = name && name.length > 0 ? name : 'Amigue peludo';
  return [
    `Gracias, ${sigName}.`,
    '',
    `Soy Pedro, detras de Paw Friend. Tu aporte de $${formatted} CLP ayuda muchisimo.`,
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
    const corsHeaders = getCorsHeaders(req);
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // SEC: invocada desde flow-webhook (service_role). Sin auth, atacante
    // puede gatillar emails Resend con donation_id arbitrarios.
    const authError = requireCronAuth(req);
    if (authError) return authError;

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
          // from: dominio verificado en Resend. Mantener pawfriend.cl.
          // reply_to: correo de contacto oficial para que las respuestas
          // del donante lleguen a Pedro directamente.
          from: 'Paw Friend <hola@pawfriend.cl>',
          reply_to: ['pedrosusaeta@pawfriend.cl'],
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
