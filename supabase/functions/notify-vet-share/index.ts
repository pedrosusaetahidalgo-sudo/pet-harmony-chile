/**
 * Edge Function: notify-vet-share
 *
 * Cuando un dueño crea un medical_share_token con target_provider_id
 * definido (compartió su ficha con un vet en particular), esta fn se
 * llama desde el frontend con el share_token_id. Carga datos, genera
 * email HTML y manda via Resend al email publico del vet.
 *
 * POST body: { share_token_id: string }
 * Auth: usuario autenticado (dueño que compartió).
 *
 * Origen: INIT-08 del Plan 90d — cerrar el loop B2C -> B2B.
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

interface NotifyPayload {
  share_token_id: string;
}

function buildEmailHtml(input: {
  providerName: string;
  ownerName: string;
  petName: string;
  petSpecies: string | null;
  dashboardUrl: string;
  expiresAt: string;
}): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#faf5ff;font-family:system-ui,Arial,sans-serif;color:#1f2937">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.08)">
  <tr><td style="background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);padding:24px;color:#fff">
    <div style="font-size:12px;text-transform:uppercase;letter-spacing:.12em;opacity:.9">Paw Friend — Ficha clinica compartida</div>
    <div style="font-size:24px;font-weight:800;margin-top:4px">Hola ${escapeHtml(input.providerName)}</div>
  </td></tr>
  <tr><td style="padding:24px">
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5">
      <strong>${escapeHtml(input.ownerName)}</strong> compartió contigo la ficha clinica de
      <strong>${escapeHtml(input.petName)}</strong>${input.petSpecies ? ` (${escapeHtml(input.petSpecies)})` : ''}.
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.5">
      Desde tu panel puedes ver el historial completo, agregar notas clinicas y generar un PDF
      profesional. La ficha esta disponible hasta el <strong>${escapeHtml(input.expiresAt)}</strong>.
    </p>
    <div style="text-align:center;margin:28px 0">
      <a href="${escapeHtml(input.dashboardUrl)}"
         style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:600;font-size:15px">
        Ver ficha en mi panel
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#9ca3af">
      Si no esperabas esta ficha, no te preocupes: el dueño puede revocar el acceso cuando quiera.
    </p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="margin:0;font-size:11px;color:#6b7280">
      Paw Friend — pawfriend.cl · <a href="https://pawfriend.cl/provider/dashboard" style="color:#7c3aed">Panel proveedor</a>
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

  // SEC pre-beta 2026-05-05: la fn declaraba "Auth: usuario autenticado" pero
  // no validaba ningun header → cualquiera con un share_token_id valido (UUID
  // adivinable) podia triggear emails al vet. Ahora exige JWT del dueno.
  const SUPABASE_URL_FOR_AUTH = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return errorResponse('Authorization required', 401);
  }
  if (SUPABASE_URL_FOR_AUTH && SUPABASE_ANON_KEY) {
    const userClient = createClient(SUPABASE_URL_FOR_AUTH, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const token = authHeader.slice(7).trim();
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return errorResponse('Invalid auth token', 401);
    }
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'Paw Friend <no-reply@pawfriend.cl>';
  const DASHBOARD_BASE = Deno.env.get('APP_BASE_URL') || 'https://pawfriend.cl';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return errorResponse('Server misconfigured', 500);
  }

  let payload: NotifyPayload;
  try {
    payload = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const shareTokenId = String(payload.share_token_id || '').trim();
  if (!shareTokenId) {
    return errorResponse('share_token_id required', 400);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // 1. Load share token
  const { data: token, error: tokenErr } = await admin
    .from('medical_share_tokens')
    .select('id, pet_id, owner_id, target_provider_id, expires_at, is_revoked')
    .eq('id', shareTokenId)
    .maybeSingle();

  if (tokenErr || !token) {
    return errorResponse('Share token not found', 404);
  }

  if (token.is_revoked) {
    return jsonResponse({ skipped: true, reason: 'revoked' });
  }

  if (!token.target_provider_id) {
    return jsonResponse({ skipped: true, reason: 'no_target_provider' });
  }

  // 2. Load provider (vet) + owner + pet en paralelo
  const [providerResp, ownerResp, petResp] = await Promise.all([
    admin
      .from('service_providers')
      .select('id, display_name, public_email, user_id')
      .eq('id', token.target_provider_id)
      .maybeSingle(),
    admin.from('profiles').select('id, display_name').eq('id', token.owner_id).maybeSingle(),
    admin.from('pets').select('id, name, species').eq('id', token.pet_id).maybeSingle(),
  ]);

  const provider = providerResp.data as {
    id: string;
    display_name: string | null;
    public_email: string | null;
    user_id: string | null;
  } | null;
  const owner = ownerResp.data as { id: string; display_name: string | null } | null;
  const pet = petResp.data as { id: string; name: string | null; species: string | null } | null;

  if (!provider || !pet) {
    return errorResponse('Missing provider or pet data', 404);
  }

  // 3. Determinar email del vet: public_email primero, luego auth.users.email
  let vetEmail: string | null = provider.public_email;
  if (!vetEmail && provider.user_id) {
    const { data: userRow } = await admin.auth.admin.getUserById(provider.user_id);
    vetEmail = userRow?.user?.email ?? null;
  }

  if (!vetEmail) {
    return jsonResponse({ skipped: true, reason: 'vet_has_no_email' });
  }

  // 4. Enviar via Resend (si no hay key, retornar ok sin fallar — util en dev)
  if (!RESEND_API_KEY) {
    return jsonResponse({
      skipped: true,
      reason: 'resend_not_configured',
      would_have_sent_to: vetEmail,
    });
  }

  const expiresAtDate = new Date(token.expires_at).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const html = buildEmailHtml({
    providerName: provider.display_name || 'Doctor/a',
    ownerName: owner?.display_name || 'Un dueño',
    petName: pet.name || 'una mascota',
    petSpecies: pet.species,
    dashboardUrl: `${DASHBOARD_BASE}/provider/dashboard?highlight=${encodeURIComponent(shareTokenId)}`,
    expiresAt: expiresAtDate,
  });

  const resendResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: vetEmail,
      subject: `Nueva ficha clinica compartida: ${pet.name ?? 'mascota'}`,
      html,
    }),
  });

  if (!resendResp.ok) {
    const detail = await resendResp.text().catch(() => '');
    return errorResponse(`Resend error: ${detail.slice(0, 200)}`, 502);
  }

  return jsonResponse({ ok: true, sent_to: vetEmail });
}

serve(withTelemetry('notify-vet-share', handle));
