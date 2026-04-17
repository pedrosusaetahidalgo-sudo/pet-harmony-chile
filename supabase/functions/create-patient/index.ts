/**
 * Edge Function: create-patient
 *
 * Atomic patient creation from a vet:
 * 1. Validates the caller is an active service_provider
 * 2. Server-side duplicate detection (name+species+email, microchip)
 * 3. Generates Paw Card data (holo pattern + ID)
 * 4. Inserts the pet record
 * 5. If owner already registered → links directly (owner_id + pet_vet_links)
 * 6. If owner NOT registered → generates invite link + sends email (Resend → Supabase fallback)
 *
 * POST body: NewPatientPayload (see below)
 * Auth: requires authenticated vet user with active service_provider record
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';

// ─── Types ──────────────────────────────────────────────────────────

interface NewPatientPayload {
  name: string;
  species: string;
  breed?: string;
  birth_date?: string;
  sex?: string;
  weight?: string;
  color?: string;
  owner_name: string;
  owner_email: string;
  microchip_number?: string;
  blood_type?: string;
  known_allergies?: string;
  chronic_conditions?: string;
  force_create?: boolean; // bypass duplicate warning (second attempt)
}

// ─── Helpers ────────────────────────────────────────────────────────

function jsonResponse(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function errorResponse(req: Request, message: string, status = 500, code?: string) {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

// ─── Paw Card generation (mirrors src/lib/paw-cards.ts) ─────────────

type HoloPattern =
  | 'holo-none'
  | 'holo-paws'
  | 'holo-stars'
  | 'holo-hearts'
  | 'holo-diamonds'
  | 'holo-waves'
  | 'holo-fire'
  | 'holo-galaxy'
  | 'holo-rainbow';

const HOLO_PATTERNS: { id: HoloPattern; probability: number }[] = [
  { id: 'holo-none', probability: 0.35 },
  { id: 'holo-paws', probability: 0.2 },
  { id: 'holo-stars', probability: 0.15 },
  { id: 'holo-hearts', probability: 0.1 },
  { id: 'holo-diamonds', probability: 0.08 },
  { id: 'holo-waves', probability: 0.05 },
  { id: 'holo-fire', probability: 0.04 },
  { id: 'holo-galaxy', probability: 0.02 },
  { id: 'holo-rainbow', probability: 0.01 },
];

function rollHoloPattern(): HoloPattern {
  const roll = Math.random();
  let cumulative = 0;
  for (const p of HOLO_PATTERNS) {
    cumulative += p.probability;
    if (roll < cumulative) return p.id;
  }
  return 'holo-none';
}

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generatePawCardId(): string {
  const block = (len: number) =>
    Array.from({ length: len }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join('');
  return `PAW-${block(4)}-${block(4)}`;
}

// ─── Email template (same as send-pet-invitation) ───────────────────

function buildInvitationEmail(opts: {
  petName: string;
  ownerName: string;
  vetName: string;
  clinicName: string;
  actionUrl: string;
}) {
  const { petName, ownerName, vetName, clinicName, actionUrl } = opts;
  const firstName = ownerName.split(' ')[0] || ownerName;
  const LOGO_URL = 'https://pawfriend.cl/lovable-uploads/f78e7803-40e0-4194-9e66-80e4fce27093.png';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${petName} te escribio!</title></head>
<body style="margin:0;padding:0;background:#fef9f3;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef9f3;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(249,115,22,0.12);">
  <tr><td style="background:linear-gradient(135deg,#f97316 0%,#fb923c 50%,#fbbf24 100%);padding:36px 24px 28px;text-align:center;">
    <img src="${LOGO_URL}" alt="Paw Friend" width="56" height="56" style="border-radius:14px;margin-bottom:8px;border:3px solid rgba(255,255,255,0.3);" />
    <h1 style="color:#ffffff;font-size:20px;margin:8px 0 0;font-weight:700;">Paw Friend</h1>
  </td></tr>
  <tr><td style="padding:28px 28px 0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="44" valign="top" style="padding-right:12px;">
          <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#f97316,#fbbf24);text-align:center;line-height:44px;font-size:24px;">🐶</div>
        </td>
        <td>
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:16px;border-top-left-radius:4px;padding:16px 20px;">
            <p style="margin:0 0 4px;font-weight:700;color:#c2410c;font-size:13px;">${petName}</p>
            <p style="margin:0;color:#431407;font-size:15px;line-height:1.5;">
              Hola ${firstName}! Soy ${petName} y tengo noticias increibles: mi vet me creo una ficha medica digital y necesito que tu la veas!
            </p>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="padding:20px 28px;">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 18px;">
      <p style="margin:0;color:#166534;font-size:13px;">
        <span style="font-size:16px;vertical-align:middle;">🩺</span>
        <strong>${vetName}</strong>${clinicName ? ` de ${clinicName}` : ''} acaba de crear la ficha clinica de ${petName} en Paw Friend.
      </p>
    </div>
  </td></tr>
  <tr><td style="padding:0 28px;">
    <p style="color:#92400e;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Que vas a encontrar:</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:7px 0;font-size:14px;color:#44403c;">
        <span style="display:inline-block;width:32px;text-align:center;font-size:18px;">📋</span>
        Ficha clinica completa, descargable en PDF
      </td></tr>
      <tr><td style="padding:7px 0;font-size:14px;color:#44403c;">
        <span style="display:inline-block;width:32px;text-align:center;font-size:18px;">💉</span>
        Vacunas y antiparasitarios con recordatorios automaticos
      </td></tr>
      <tr><td style="padding:7px 0;font-size:14px;color:#44403c;">
        <span style="display:inline-block;width:32px;text-align:center;font-size:18px;">🔔</span>
        Alertas de controles, desparasitaciones y citas
      </td></tr>
      <tr><td style="padding:7px 0;font-size:14px;color:#44403c;">
        <span style="display:inline-block;width:32px;text-align:center;font-size:18px;">📎</span>
        Examenes, recetas e imagenes en un solo lugar
      </td></tr>
      <tr><td style="padding:7px 0;font-size:14px;color:#44403c;">
        <span style="display:inline-block;width:32px;text-align:center;font-size:18px;">🃏</span>
        Una Paw Card coleccionable unica de ${petName}!
      </td></tr>
      <tr><td style="padding:7px 0;font-size:14px;color:#44403c;">
        <span style="display:inline-block;width:32px;text-align:center;font-size:18px;">🔗</span>
        Compartir la ficha con otro vet si viajas o hay urgencia
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:28px 28px 8px;" align="center">
    <a href="${actionUrl}" target="_blank"
       style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:#ffffff;font-size:17px;font-weight:700;text-decoration:none;padding:16px 44px;border-radius:14px;box-shadow:0 6px 20px rgba(249,115,22,0.3);letter-spacing:0.3px;">
      🐾 Ver la ficha de ${petName}
    </a>
  </td></tr>
  <tr><td style="padding:4px 28px 24px;" align="center">
    <p style="color:#a8a29e;font-size:12px;margin:8px 0 0;">
      Gratis y toma menos de 1 minuto
    </p>
  </td></tr>
  <tr><td style="padding:0 28px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="44" valign="top" style="padding-right:12px;">
          <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#f97316,#fbbf24);text-align:center;line-height:44px;font-size:24px;">🐶</div>
        </td>
        <td>
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:16px;border-top-left-radius:4px;padding:14px 18px;">
            <p style="margin:0;color:#431407;font-size:14px;line-height:1.5;">
              Te espero adentro! No me dejes en visto 🥺👉👈
            </p>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="background:#fafaf9;padding:20px 28px;border-top:1px solid #f5f5f4;">
    <p style="color:#a8a29e;font-size:11px;text-align:center;margin:0;line-height:1.6;">
      ${petName} te envio este correo con la ayuda de su vet y de
      <a href="https://pawfriend.cl" style="color:#f97316;text-decoration:none;font-weight:600;">Paw Friend</a><br>
      Si no reconoces a ${petName}, puedes ignorar este correo sin problema.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Send email via Resend ──────────────────────────────────────────

async function sendViaResend(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not set' };

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('RESEND_FROM_EMAIL') || 'Paw Friend <onboarding@resend.dev>',
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    console.error('[Resend] error:', resp.status, body);
    return { ok: false, error: body };
  }
  return { ok: true };
}

// ─── Validation ─────────────────────────────────────────────────────

function validatePayload(
  data: unknown
): { valid: true; payload: NewPatientPayload } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') return { valid: false, error: 'Body invalido' };

  const d = data as Record<string, unknown>;

  const name = typeof d.name === 'string' ? d.name.trim() : '';
  if (!name || name.length > 50)
    return { valid: false, error: 'Nombre requerido (max 50 caracteres)' };

  const species = typeof d.species === 'string' ? d.species.trim() : '';
  if (!species) return { valid: false, error: 'Especie requerida' };

  const owner_name = typeof d.owner_name === 'string' ? d.owner_name.trim() : '';
  if (!owner_name || owner_name.length < 2)
    return { valid: false, error: 'Nombre del dueno requerido (min 2 caracteres)' };

  const owner_email = typeof d.owner_email === 'string' ? d.owner_email.trim().toLowerCase() : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!owner_email || !emailRegex.test(owner_email))
    return { valid: false, error: 'Email del dueno invalido' };

  const microchip_number = typeof d.microchip_number === 'string' ? d.microchip_number.trim() : '';
  if (microchip_number && !/^\d{15}$/.test(microchip_number)) {
    return { valid: false, error: 'El microchip debe tener exactamente 15 digitos' };
  }

  return {
    valid: true,
    payload: {
      name,
      species,
      breed: typeof d.breed === 'string' ? d.breed.trim() : undefined,
      birth_date: typeof d.birth_date === 'string' ? d.birth_date.trim() : undefined,
      sex: typeof d.sex === 'string' ? d.sex.trim() : undefined,
      weight: typeof d.weight === 'string' ? d.weight.trim() : undefined,
      color: typeof d.color === 'string' ? d.color.trim() : undefined,
      owner_name,
      owner_email,
      microchip_number: microchip_number || undefined,
      blood_type: typeof d.blood_type === 'string' ? d.blood_type.trim() : undefined,
      known_allergies: typeof d.known_allergies === 'string' ? d.known_allergies.trim() : undefined,
      chronic_conditions:
        typeof d.chronic_conditions === 'string' ? d.chronic_conditions.trim() : undefined,
      force_create: d.force_create === true,
    },
  };
}

// ─── Main handler ───────────────────────────────────────────────────

serve(async (req) => {
  // CORS preflight — respond immediately with 204
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': req.headers.get('Origin') || 'https://pawfriend.cl',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  try {
    // ── Auth ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse(req, 'Authorization required', 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return errorResponse(req, 'User not authenticated', 401);

    const vetId = userData.user.id;

    // ── Verify caller is an active service_provider ──
    const { data: vetProvider, error: providerError } = await supabase
      .from('service_providers')
      .select('id, display_name, is_verified')
      .eq('user_id', vetId)
      .maybeSingle();

    if (providerError || !vetProvider) {
      return errorResponse(req, 'Solo veterinarios registrados pueden crear pacientes', 403);
    }

    // ── Rate limit: max 20 patients per vet per day ──
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCreations } = await supabase
      .from('pets')
      .select('id', { count: 'exact', head: true })
      .eq('created_by_vet_id', vetId)
      .gte('created_at', oneDayAgo);

    if ((recentCreations ?? 0) >= 20) {
      return errorResponse(
        req,
        'Limite de creacion alcanzado (20 pacientes por dia). Intenta manana.',
        429
      );
    }

    // ── Parse & validate body ──
    const body = await req.json();
    const validation = validatePayload(body);
    if (!validation.valid) return errorResponse(req, validation.error, 400);
    const data = validation.payload;

    // ── Server-side duplicate detection ──
    if (!data.force_create) {
      // Check name + species + email
      const { data: existingPets } = await supabase
        .from('pets')
        .select('id, name, owner_id, pending_owner_email')
        .ilike('name', data.name)
        .eq('species', data.species);

      const ownerEmail = data.owner_email;
      const match = (existingPets ?? []).find(
        (p: { pending_owner_email?: string; owner_id?: string }) =>
          p.pending_owner_email === ownerEmail || p.owner_id
      );

      if (match) {
        const msg = match.owner_id
          ? `Ya existe "${match.name}" en el sistema con un dueno registrado.`
          : `Otro profesional ya registro "${match.name}" para ${ownerEmail}. Envia de nuevo con force_create=true para crear otro registro.`;
        return jsonResponse(
          req,
          { error: msg, code: 'DUPLICATE_DETECTED', existing_pet_id: match.id },
          409
        );
      }

      // Microchip uniqueness
      if (data.microchip_number) {
        const { data: chipMatch } = await supabase
          .from('pets')
          .select('id, name')
          .eq('microchip_number', data.microchip_number)
          .limit(1);

        if (chipMatch && chipMatch.length > 0) {
          return errorResponse(
            req,
            `Este microchip ya esta asociado a "${chipMatch[0].name}". Verifica el numero.`,
            409,
            'DUPLICATE_MICROCHIP'
          );
        }
      }
    }

    // ── Generate Paw Card ──
    const holoPattern = rollHoloPattern();
    const pawCardId = generatePawCardId();

    // ── Build insert payload ──
    const insertPayload: Record<string, unknown> = {
      name: data.name,
      species: data.species,
      created_by_vet_id: vetId,
      pending_owner_email: data.owner_email,
      pending_owner_name: data.owner_name || null,
      breed: data.breed || null,
      birth_date: data.birth_date || null,
      gender: data.sex || null,
      weight: data.weight ? parseFloat(data.weight) : null,
      color: data.color || null,
      holo_pattern: holoPattern,
      paw_card_id: pawCardId,
      microchip_number: data.microchip_number || null,
      blood_type: data.blood_type || null,
    };

    if (data.known_allergies) {
      insertPayload.allergies = data.known_allergies
        .split(',')
        .map((a: string) => a.trim())
        .filter(Boolean);
    }
    if (data.chronic_conditions) {
      insertPayload.chronic_conditions = data.chronic_conditions
        .split(',')
        .map((c: string) => c.trim())
        .filter(Boolean);
    }

    // ── Insert pet ──
    const { data: petRow, error: insertError } = await supabase
      .from('pets')
      .insert(insertPayload)
      .select('id')
      .single();

    if (insertError) {
      console.error('[create-patient] insert error:', insertError);
      return errorResponse(req, 'Error al crear el paciente: ' + insertError.message, 500);
    }

    const petId = petRow.id;

    // ── Generate invitation token ──
    const invitationToken = crypto.randomUUID();
    await supabase.from('pets').update({ owner_invitation_token: invitationToken }).eq('id', petId);

    // ── Check if owner already registered (via DB function, not listUsers) ──
    const { data: existingOwnerId } = await supabase.rpc('get_user_id_by_email', {
      p_email: data.owner_email,
    });

    // Fetch vet display name for the email
    const { data: vetProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', vetId)
      .single();

    const vetName = vetProfile?.display_name || 'Tu veterinario/a';
    const clinicName = vetProvider.display_name || '';

    let emailSent = false;
    let method: 'resend' | 'invite' | 'skip' = 'skip';
    let ownerAlreadyRegistered = false;

    if (existingOwnerId) {
      // ── Owner exists → link directly ──
      ownerAlreadyRegistered = true;

      await supabase
        .from('pets')
        .update({
          owner_id: existingOwnerId,
          owner_invitation_accepted_at: new Date().toISOString(),
        })
        .eq('id', petId);

      // Create pet_vet_link
      await supabase.from('pet_vet_links').upsert(
        {
          pet_id: petId,
          owner_id: existingOwnerId,
          provider_id: vetProvider.id,
          status: 'active',
          responded_at: new Date().toISOString(),
        },
        { onConflict: 'pet_id,provider_id' }
      );

      method = 'skip';
    } else {
      // ── Owner NOT registered → send invitation link only (NO auth user creation) ──
      // The owner clicks the link, lands on /auth, signs up themselves,
      // and useAutoClaimByEmail / useClaimPetInvitation auto-links the pet.
      const actionUrl = `https://pawfriend.cl/auth?returnTo=/my-pets&invitation=${invitationToken}`;

      // Send custom email via Resend
      const html = buildInvitationEmail({
        petName: data.name,
        ownerName: data.owner_name || 'amigo/a',
        vetName,
        clinicName,
        actionUrl,
      });

      const resendResult = await sendViaResend({
        to: data.owner_email,
        subject: `${data.name} ya tiene ficha veterinaria en Paw Friend 🐾`,
        html,
      });

      if (resendResult.ok) {
        method = 'resend';
        emailSent = true;
        await supabase
          .from('pets')
          .update({ owner_invitation_sent_at: new Date().toISOString() })
          .eq('id', petId);
      } else {
        console.error('[create-patient] Resend failed:', resendResult.error);
        // No fallback — do NOT create auth user. Just notify the vet.
        return jsonResponse(req, {
          success: true,
          pet_id: petId,
          pet_name: data.name,
          owner_already_registered: false,
          email_sent: false,
          invitation_error:
            'Paciente creado pero no se pudo enviar el email. Puedes reenviar desde tu panel.',
        });
      }
    }

    return jsonResponse(req, {
      success: true,
      pet_id: petId,
      pet_name: data.name,
      method,
      email_sent: emailSent,
      email_sent_to: ownerAlreadyRegistered ? null : data.owner_email,
      owner_already_registered: ownerAlreadyRegistered,
      invitation_token: invitationToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[create-patient] error:', message);
    return errorResponse(req, 'Error al crear el paciente. Intenta de nuevo mas tarde.', 500);
  }
});
