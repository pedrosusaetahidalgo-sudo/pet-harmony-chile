/**
 * Edge Function: send-pet-invitation
 *
 * Sends an invitation email to a pet owner when a vet creates a pet record
 * for a patient whose owner doesn't have an account yet.
 *
 * POST body: { pet_id: string }
 * Auth: requires authenticated vet user (created_by_vet_id must match caller)
 *
 * Flow:
 * 1. Verify the caller is authenticated
 * 2. Fetch the pet record (must have pending_owner_email and created_by_vet_id = caller)
 * 3. Generate an invitation token if not exists
 * 4. If owner already registered → no email (vet can share link manually)
 * 5. If owner NOT registered → generate invite link + send custom HTML email via Resend
 * 6. Fallback to Supabase inviteUserByEmail if RESEND_API_KEY is not set
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pawfriend.cl',
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

// ---------------------------------------------------------------------------
// Email HTML template — personalizado con nombre de mascota y dueno
// ---------------------------------------------------------------------------
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

  <!-- Header: el perrito te escribe -->
  <tr><td style="background:linear-gradient(135deg,#f97316 0%,#fb923c 50%,#fbbf24 100%);padding:36px 24px 28px;text-align:center;">
    <img src="${LOGO_URL}" alt="Paw Friend" width="56" height="56" style="border-radius:14px;margin-bottom:8px;border:3px solid rgba(255,255,255,0.3);" />
    <h1 style="color:#ffffff;font-size:20px;margin:8px 0 0;font-weight:700;">Paw Friend</h1>
  </td></tr>

  <!-- Burbuja de chat del perrito -->
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

  <!-- Info del vet -->
  <tr><td style="padding:20px 28px;">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 18px;">
      <p style="margin:0;color:#166534;font-size:13px;">
        <span style="font-size:16px;vertical-align:middle;">🩺</span>
        <strong>${vetName}</strong>${clinicName ? ` de ${clinicName}` : ''} acaba de crear la ficha clinica de ${petName} en Paw Friend.
      </p>
    </div>
  </td></tr>

  <!-- Que vas a encontrar -->
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

  <!-- CTA grande -->
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

  <!-- Segunda burbuja del perrito -->
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

  <!-- Footer -->
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

// ---------------------------------------------------------------------------
// Send email via Resend API (free tier: 100/month)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- Auth ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Authorization required', 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return errorResponse('User not authenticated', 401);

    const callerId = userData.user.id;

    // --- Rate limit: max 5 invitations per user per day ---
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentInvites } = await supabaseAdmin
      .from('pets')
      .select('id', { count: 'exact', head: true })
      .eq('created_by_vet_id', callerId)
      .not('owner_invitation_sent_at', 'is', null)
      .gte('owner_invitation_sent_at', oneDayAgo);

    if ((recentInvites ?? 0) >= 5) {
      return errorResponse('Límite de invitaciones alcanzado (5 por día). Intenta mañana.', 429);
    }

    // --- Parse body ---
    const { pet_id } = await req.json();
    if (!pet_id || typeof pet_id !== 'string') {
      return errorResponse('pet_id is required and must be a string', 400);
    }

    // --- Fetch pet + vet profile ---
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select(
        'id, name, pending_owner_email, pending_owner_name, owner_invitation_token, owner_invitation_sent_at, created_by_vet_id'
      )
      .eq('id', pet_id)
      .single();

    if (petError || !pet) return errorResponse('Mascota no encontrada', 404);
    if (pet.created_by_vet_id !== callerId) {
      return errorResponse(
        'Solo el veterinario que creo el registro puede enviar la invitacion',
        403
      );
    }
    if (!pet.pending_owner_email) {
      return errorResponse('Esta mascota no tiene un email de dueno pendiente', 400);
    }

    const email = pet.pending_owner_email;

    // Fetch vet name + clinic for the email
    const { data: vetProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', callerId)
      .single();
    const { data: vetProvider } = await supabase
      .from('service_providers')
      .select('id, display_name')
      .eq('user_id', callerId)
      .maybeSingle();

    const vetName = vetProfile?.display_name || 'Tu veterinario/a';
    const clinicName = vetProvider?.display_name || '';

    // --- Generate invitation token if not exists ---
    let invitationToken = pet.owner_invitation_token;
    if (!invitationToken) {
      invitationToken = crypto.randomUUID();
      const { error: tokenError } = await supabase
        .from('pets')
        .update({ owner_invitation_token: invitationToken })
        .eq('id', pet_id);
      if (tokenError) {
        console.error('Error setting invitation token:', tokenError);
        return errorResponse('Error al generar token de invitacion', 500);
      }
    }

    // --- Check if owner is already registered ---
    // Uses DB function instead of listUsers (which doesn't scale past 1000 users)
    let userByEmail: { id: string } | null = null;
    try {
      const { data: userId } = await supabase.rpc('get_user_id_by_email', {
        p_email: email,
      });
      if (userId) userByEmail = { id: userId };
    } catch {
      // If lookup fails, proceed as if user doesn't exist
      userByEmail = null;
    }

    const redirectTo = `https://pawfriend.cl/auth?returnTo=/my-pets&invitation=${invitationToken}`;

    let emailSent = false;
    let method: 'resend' | 'invite' | 'magiclink' | 'skip' = 'skip';

    if (userByEmail) {
      // ------------------------------------------------------------------
      // Owner already registered → no email, vet shares link manually
      // (or sends magic link if we want auto-login)
      // ------------------------------------------------------------------
      // Pre-create active pet_vet_link since both users exist
      if (vetProvider?.id) {
        await supabase.from('pet_vet_links').upsert(
          {
            pet_id,
            owner_id: userByEmail.id,
            provider_id: vetProvider.id,
            status: 'active',
            responded_at: new Date().toISOString(),
          },
          { onConflict: 'pet_id,provider_id' }
        );
      }

      // Assign owner directly since they already have an account
      await supabase
        .from('pets')
        .update({
          owner_id: userByEmail.id,
          owner_invitation_accepted_at: new Date().toISOString(),
        })
        .eq('id', pet_id);

      method = 'skip';
      emailSent = false;
    } else {
      // ------------------------------------------------------------------
      // Owner NOT registered → send custom invitation email
      // ------------------------------------------------------------------

      // 1. Generate Supabase invite link (creates the user in auth.users as invited)
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email,
        options: { redirectTo },
      });

      if (linkError) {
        console.error('Error generating invite link:', linkError);
        return errorResponse('No se pudo generar la invitacion. Intenta de nuevo.', 500);
      }

      // The action_link is the full Supabase confirm URL
      const actionUrl = linkData?.properties?.action_link || redirectTo;

      // 2. Try sending custom HTML email via Resend
      const petName = pet.name || 'tu mascota';
      const ownerName = pet.pending_owner_name || 'amigo/a';

      const html = buildInvitationEmail({
        petName,
        ownerName,
        vetName,
        clinicName,
        actionUrl,
      });

      const resendResult = await sendViaResend({
        to: email,
        subject: `${petName} ya tiene ficha veterinaria en Paw Friend 🐾`,
        html,
      });

      if (resendResult.ok) {
        method = 'resend';
        emailSent = true;
      } else {
        // Fallback: Supabase default invite email
        console.warn(
          '[send-pet-invitation] Resend failed, falling back to Supabase invite:',
          resendResult.error
        );
        const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
          redirectTo,
        });
        if (inviteError) {
          console.error('Error sending Supabase invite:', inviteError);
          return errorResponse('No se pudo enviar el email de invitacion.', 500);
        }
        method = 'invite';
        emailSent = true;
      }
    }

    // --- Update invitation sent timestamp ---
    if (emailSent) {
      await supabase
        .from('pets')
        .update({ owner_invitation_sent_at: new Date().toISOString() })
        .eq('id', pet_id);
    }

    return jsonResponse({
      success: true,
      method,
      pet_id,
      pet_name: pet.name,
      email_sent_to: userByEmail ? null : email,
      owner_already_registered: !!userByEmail,
      invitation_token: invitationToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[send-pet-invitation] error:', message);
    return errorResponse('Error al enviar la invitacion. Intenta de nuevo mas tarde.', 500);
  }
});
