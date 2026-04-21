/**
 * Edge Function: send-new-pet-drip
 *
 * Drip email post-creación de mascota: 3 emails en días 0, 3, 7.
 *   - Day 0: Bienvenida + ficha creada OK + cronograma vacunas automático.
 *   - Day 3: Tip "Sube carnet vacunas con OCR" + cómo compartir con vet.
 *   - Day 7: Tip "Descargar PDF" + engagement hacia joya de la corona.
 *
 * Uso:
 *   POST body: { pet_id: string, stage: 0 | 3 | 7 }
 *   Disparada por trigger SQL (stage=0 inmediato) + cron diario
 *   (stages 3 y 7 según pet.created_at).
 *
 * Origen: Plan 90d — onboarding activación owner post-creación mascota.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';

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

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type Stage = 0 | 3 | 7;

interface StageContent {
  subject: string;
  headerTitle: string;
  headerSubtitle: string;
  body: string;
  cta: { text: string; url: string };
  tipHeading: string;
  tipBody: string;
}

function buildStageContent(
  stage: Stage,
  petName: string,
  ownerName: string,
  petId: string
): StageContent {
  const firstName = ownerName.split(' ')[0] || 'hola';
  switch (stage) {
    case 0:
      return {
        subject: `¡${petName} ya tiene su ficha en Paw Friend!`,
        headerTitle: `${petName} es oficialmente parte de Paw Friend 🐾`,
        headerSubtitle: 'Día 1: tu ficha digital está lista',
        body: `Hola ${firstName}, acabás de crear la ficha de ${petName}. Te damos la bienvenida.\n\nSi ${petName} es perro o gato con fecha de nacimiento registrada, Paw Friend ya generó automáticamente el cronograma de vacunas y antiparasitarios según su edad. Vas a recibir recordatorios cuando toque cada dosis.`,
        cta: { text: `Ver ficha de ${petName}`, url: `https://pawfriend.cl/ficha/${petId}` },
        tipHeading: 'Tip del día',
        tipBody:
          'Agrega una foto y el peso actual. Mascotas con ficha completa reciben mejores recordatorios + mejor atención de veterinarios.',
      };
    case 3:
      return {
        subject: `${petName}: sube el carnet de vacunas`,
        headerTitle: `Día 3 con ${petName}`,
        headerSubtitle: 'Completa el historial de golpe',
        body: `Hola ${firstName}, hace 3 días creaste la ficha de ${petName}. Ahora el paso más importante: cargar su historial de vacunas previo.\n\nNo tienes que copiar a mano. Saca una foto del carnet de vacunas y Paw Friend lo lee con IA + crea los registros. 2 minutos vs 20.`,
        cta: { text: 'Subir carnet de vacunas', url: `https://pawfriend.cl/ficha/${petId}` },
        tipHeading: 'Bonus tip',
        tipBody:
          'Si tenés veterinario de cabecera, compartile la ficha digital. Tu vet accede al instante vía link, sin apps ni registros. Un WhatsApp menos.',
      };
    case 7:
      return {
        subject: `Descarga el PDF de ${petName} — joya de Paw Friend`,
        headerTitle: `Día 7 con ${petName}`,
        headerSubtitle: 'El feature que más vale',
        body: `Hola ${firstName}, llevas una semana con ${petName} en Paw Friend. Te dejo el tip más importante:\n\nDescarga el PDF de la ficha médica. Es un PDF profesional con todo el historial, carátula, fotos y timeline. Úsalo:\n\n• En una urgencia nocturna si vas a un veterinario nuevo.\n• Si viajas fuera de Santiago.\n• Como respaldo ante cualquier cambio de veterinario.\n\nTres toques y lo tenés en tu celular.`,
        cta: { text: 'Descargar PDF ahora', url: `https://pawfriend.cl/ficha/${petId}` },
        tipHeading: '¿Qué más?',
        tipBody:
          'Los dueños que descargaron PDF al menos 1 vez retienen 3× más que los que no. Es literalmente el momento "aha" de Paw Friend.',
      };
  }
}

function buildEmailHtml(stage: Stage, content: StageContent): string {
  const bodyHtml = content.body
    .split('\n\n')
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">${escapeHtml(p)}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#faf5ff;font-family:system-ui,Arial,sans-serif;color:#1f2937">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.08)">
  <tr><td style="background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);padding:28px 24px;color:#fff">
    <div style="font-size:12px;text-transform:uppercase;letter-spacing:.14em;opacity:.85">
      Paw Friend · Onboarding
    </div>
    <div style="font-size:22px;font-weight:800;margin-top:6px;line-height:1.2">
      ${escapeHtml(content.headerTitle)}
    </div>
    <div style="font-size:13px;margin-top:4px;opacity:.9">${escapeHtml(content.headerSubtitle)}</div>
  </td></tr>
  <tr><td style="padding:24px">
    ${bodyHtml}
    <div style="text-align:center;margin:22px 0">
      <a href="${escapeHtml(content.cta.url)}"
         style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:600;font-size:14px">
        ${escapeHtml(content.cta.text)} →
      </a>
    </div>
    <div style="background:#faf5ff;border-left:3px solid #7c3aed;padding:12px 16px;border-radius:6px;margin:16px 0">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.05em">
        ${escapeHtml(content.tipHeading)}
      </p>
      <p style="margin:0;font-size:13px;color:#1f2937;line-height:1.5">
        ${escapeHtml(content.tipBody)}
      </p>
    </div>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:14px 24px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="margin:0;font-size:11px;color:#6b7280">
      Paw Friend · pawfriend.cl · día ${stage} del onboarding
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'Paw Friend <no-reply@pawfriend.cl>';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return errorResponse('Server misconfigured', 500);
  }

  let payload: { pet_id?: string; stage?: number; scheduled?: boolean };
  try {
    payload = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Modo 1: pet_id + stage explícito (trigger SQL, stage=0)
  if (payload.pet_id && payload.stage !== undefined) {
    return processSinglePet(
      admin,
      String(payload.pet_id),
      payload.stage as Stage,
      RESEND_API_KEY,
      FROM_EMAIL
    );
  }

  // Modo 2: scheduled=true (cron diario) → buscar pets creadas exactamente hace 3 y 7 días
  if (payload.scheduled) {
    return processScheduledDrips(admin, RESEND_API_KEY, FROM_EMAIL);
  }

  return errorResponse('Either pet_id+stage or scheduled=true required', 400);
}

async function processSinglePet(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  petId: string,
  stage: Stage,
  RESEND_API_KEY: string | undefined,
  FROM_EMAIL: string
): Promise<Response> {
  const { data: pet } = await admin
    .from('pets')
    .select('id, name, owner_id')
    .eq('id', petId)
    .maybeSingle();

  if (!pet || !pet.owner_id) return errorResponse('Pet or owner not found', 404);

  // Dedup: ya enviamos este stage para este pet?
  const refId = `pet-drip-${petId}-${stage}`;
  const { count: already } = await admin
    .from('whatsapp_message_log')
    .select('*', { count: 'exact', head: true })
    .eq('reference_id', refId)
    .eq('status', 'sent');

  if ((already ?? 0) > 0) {
    return jsonResponse({ skipped: true, reason: 'already_sent', stage });
  }

  // Email destino
  const { data: userRow } = await admin.auth.admin.getUserById(pet.owner_id);
  const email = userRow?.user?.email;
  if (!email) return jsonResponse({ skipped: true, reason: 'no_email' });

  const { data: profile } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', pet.owner_id)
    .maybeSingle();

  const ownerName = profile?.display_name || '';

  if (!RESEND_API_KEY) {
    return jsonResponse({ skipped: true, reason: 'resend_not_configured' });
  }

  const content = buildStageContent(stage, pet.name, ownerName, pet.id);
  const html = buildEmailHtml(stage, content);

  const resendResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: email,
      subject: content.subject,
      html,
    }),
  });

  if (!resendResp.ok) {
    const detail = await resendResp.text().catch(() => '');
    return errorResponse(`Resend error: ${detail.slice(0, 200)}`, 502);
  }

  await admin.from('whatsapp_message_log').insert({
    reference_id: refId,
    channel: 'email',
    status: 'sent',
  });

  return jsonResponse({ ok: true, sent_to: email, stage });
}

async function processScheduledDrips(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  RESEND_API_KEY: string | undefined,
  FROM_EMAIL: string
): Promise<Response> {
  const now = new Date();
  let sent = 0;
  let skipped = 0;

  for (const stage of [3, 7] as const) {
    const targetDate = new Date(now.getTime() - stage * 24 * 60 * 60 * 1000);
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const { data: pets } = await admin
      .from('pets')
      .select('id')
      .gte('created_at', dayStart.toISOString())
      .lt('created_at', dayEnd.toISOString())
      .eq('lifecycle_status', 'active')
      .not('owner_id', 'is', null);

    if (!pets || pets.length === 0) continue;

    for (const pet of pets) {
      const res = await processSinglePet(admin, pet.id, stage as Stage, RESEND_API_KEY, FROM_EMAIL);
      const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (json?.ok) sent++;
      else skipped++;
    }
  }

  return jsonResponse({ sent, skipped, ran_at: now.toISOString() });
}

serve(withTelemetry('send-new-pet-drip', handle));
