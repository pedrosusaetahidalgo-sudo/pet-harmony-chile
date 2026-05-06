/**
 * Edge Function: send-shelter-welcome
 *
 * Envía email de bienvenida + onboarding al refugio recién registrado.
 * Disparada por trigger SQL AFTER INSERT en adoption_centers.
 *
 * Contenido: bienvenida cálida, checklist 4 pasos iniciales, link directo
 * al dashboard shelter, contacto de Pedro para soporte.
 *
 * Origen: Plan 90d — retención rol shelter desde día 1.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { requireCronAuth } from '../_shared/cron-auth.ts';
import {
  bulletList,
  cta,
  emailFooter,
  emailHeader,
  paragraph,
  spacer,
} from '../_shared/email-blocks.ts';
import { renderEmail } from '../_shared/email-layout.ts';
import { TAGLINE } from '../_shared/email-theme.ts';

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

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildEmailHtml(shelterName: string, contactName: string, dashboardUrl: string): string {
  const body = [
    emailHeader({
      variant: 'emoji',
      eyebrow: 'Bienvenidos a Paw Friend',
      emoji: '🏡',
      title: shelterName,
      tagline: TAGLINE.shelter,
    }),
    paragraph({
      text: `Hola ${contactName},`,
      size: 'lg',
    }),
    paragraph(
      'Gracias por sumarse a Paw Friend. Desde hoy, las mascotas que tienen a su cuidado pueden cargarse en la plataforma con su ficha médica digital, y cuando alguien las adopte, esa ficha viaja con ellas. Nada se pierde entre el refugio y el nuevo dueño.'
    ),
    bulletList({
      label: 'Checklist primeros 4 pasos',
      items: [
        {
          icon: '📋',
          text: 'Completa el perfil público del refugio (dirección, misión, capacidad).',
        },
        {
          icon: '📥',
          text: 'Carga tus mascotas actuales vía bulk import CSV/XLSX o una por una.',
        },
        {
          icon: '🔗',
          text: 'Genera el link de transferencia cuando alguien adopte.',
        },
        {
          icon: '💛',
          text: 'Activa aportes dirigidos si quieren recibirlos (opcional, cuando la plataforma lo habilite).',
        },
      ],
    }),
    cta({
      text: 'Ir al panel refugio',
      url: dashboardUrl,
    }),
    paragraph({
      text: '¿Alguna duda durante el onboarding? Responde a este email directamente o escribe a pedrosusaeta@pawfriend.cl. Personalmente los primeros 30 días estamos acompañando a cada refugio para que saque el máximo provecho.',
      muted: true,
    }),
    paragraph({
      text: 'Gracias por el trabajo que hacen. Cada mascota que pasa por su refugio y encuentra hogar responsable es un pequeño milagro. Paw Friend existe para amplificarlo.',
      muted: true,
      size: 'sm',
    }),
    spacer('md'),
    emailFooter(),
  ].join('');

  return renderEmail({
    title: `¡Bienvenidos a Paw Friend, ${shelterName}!`,
    preheader: `Tu refugio ya es parte de la red. Carga tus primeras mascotas y empieza en 10 minutos.`,
    body,
    width: 'wide',
  });
}

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  // SEC pre-beta 2026-05-05: la fn se invoca desde trigger SQL post-INSERT
  // en adoption_centers (server-side con service_role). Sin auth, atacante
  // podia disparar emails con shelter_id arbitrarios → spam Resend.
  const authError = requireCronAuth(req);
  if (authError) return authError;

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'Paw Friend <no-reply@pawfriend.cl>';
  const APP_BASE_URL = Deno.env.get('APP_BASE_URL') || 'https://pawfriend.cl';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return errorResponse('Server misconfigured', 500);
  }

  let payload: { adoption_center_id?: string };
  try {
    payload = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const shelterId = String(payload.adoption_center_id || '').trim();
  if (!shelterId) return errorResponse('adoption_center_id required', 400);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Cargar refugio + email del user
  const { data: shelter } = await admin
    .from('adoption_centers')
    .select('id, legal_name, user_id, contact_email')
    .eq('id', shelterId)
    .maybeSingle();

  if (!shelter) return errorResponse('Shelter not found', 404);

  // Email destino: contact_email si existe, si no auth.users.email
  let email = shelter.contact_email as string | null;
  let contactName = shelter.legal_name;
  if (!email && shelter.user_id) {
    const { data: userRow } = await admin.auth.admin.getUserById(shelter.user_id);
    email = userRow?.user?.email ?? null;
    // Profile display_name si está disponible
    const { data: profile } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', shelter.user_id)
      .maybeSingle();
    contactName = profile?.display_name || shelter.legal_name;
  }

  if (!email) {
    return jsonResponse({ skipped: true, reason: 'no_email' });
  }

  if (!RESEND_API_KEY) {
    return jsonResponse({
      skipped: true,
      reason: 'resend_not_configured',
      would_have_sent_to: email,
    });
  }

  const dashboardUrl = `${APP_BASE_URL}/shelter/dashboard`;
  const firstName = (contactName || '').split(' ')[0] || 'hola';
  const html = buildEmailHtml(shelter.legal_name, firstName, dashboardUrl);

  const resendResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: email,
      subject: `¡Bienvenido a Paw Friend, ${shelter.legal_name}!`,
      html,
    }),
  });

  if (!resendResp.ok) {
    const detail = await resendResp.text().catch(() => '');
    return errorResponse(`Resend error: ${detail.slice(0, 200)}`, 502);
  }

  return jsonResponse({ ok: true, sent_to: email, shelter_id: shelterId });
}

serve(withTelemetry('send-shelter-welcome', handle));
