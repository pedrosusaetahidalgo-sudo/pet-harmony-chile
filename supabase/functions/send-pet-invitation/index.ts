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

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${petName} te espera en Paw Friend</title></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- Header con gradiente -->
  <tr><td style="background:linear-gradient(135deg,#f97316,#fb923c);padding:32px 24px;text-align:center;">
    <div style="font-size:48px;line-height:1;">🐾</div>
    <h1 style="color:#ffffff;font-size:22px;margin:12px 0 0;font-weight:700;">Paw Friend</h1>
    <p style="color:rgba(255,255,255,0.9);font-size:13px;margin:4px 0 0;">La ficha clinica de tu mascota, siempre contigo</p>
  </td></tr>

  <!-- Cuerpo -->
  <tr><td style="padding:32px 28px;">
    <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 16px;font-weight:600;">
      Oye ${firstName}, ${petName} ya tiene ficha en Paw Friend
    </h2>
    <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Tu veterinario/a <strong>${vetName}</strong>${clinicName ? ` de <strong>${clinicName}</strong>` : ''}
      acaba de crear la ficha clinica de <strong>${petName}</strong> en Paw Friend.
    </p>
    <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Solo tienes que crear tu cuenta gratuita y enlazarte con ${petName} para tener acceso a:
    </p>

    <!-- Beneficios -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="padding:8px 0;font-size:14px;color:#333;">
        <span style="display:inline-block;width:28px;text-align:center;font-size:18px;">📋</span>
        Ficha clinica completa y descargable en PDF
      </td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#333;">
        <span style="display:inline-block;width:28px;text-align:center;font-size:18px;">💉</span>
        Registro de vacunas y antiparasitarios con recordatorios
      </td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#333;">
        <span style="display:inline-block;width:28px;text-align:center;font-size:18px;">🔔</span>
        Alertas para controles veterinarios y desparasitaciones
      </td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#333;">
        <span style="display:inline-block;width:28px;text-align:center;font-size:18px;">🗂️</span>
        Documentos medicos: examenes, recetas, imagenes
      </td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#333;">
        <span style="display:inline-block;width:28px;text-align:center;font-size:18px;">🃏</span>
        Paw Card coleccionable unica para ${petName}
      </td></tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${actionUrl}" target="_blank"
           style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;box-shadow:0 4px 12px rgba(249,115,22,0.35);">
          Enlazarme con ${petName}
        </a>
      </td></tr>
    </table>

    <p style="color:#888;font-size:12px;text-align:center;margin:20px 0 0;line-height:1.5;">
      Es gratis y toma menos de 1 minuto.<br>
      Si no reconoces a ${petName}, puedes ignorar este correo.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#fafafa;padding:20px 28px;border-top:1px solid #eee;">
    <p style="color:#999;font-size:11px;text-align:center;margin:0;line-height:1.5;">
      Este correo fue enviado por Paw Friend porque tu veterinario/a creo una ficha para tu mascota.<br>
      <a href="https://pawfriend.cl" style="color:#f97316;text-decoration:none;">pawfriend.cl</a>
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
      from: 'Paw Friend <no-reply@pawfriend.cl>',
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
      .select('id, business_name')
      .eq('user_id', callerId)
      .maybeSingle();

    const vetName = vetProfile?.display_name || 'Tu veterinario/a';
    const clinicName = vetProvider?.business_name || '';

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
    const { data: userByEmail } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

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
