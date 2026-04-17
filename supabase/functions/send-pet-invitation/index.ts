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
import { buildInvitationEmail, sendInvitationViaResend } from '../_shared/invitation-email.ts';

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

// Email template + Resend sender extraidos a `_shared/invitation-email.ts`.
const sendViaResend = sendInvitationViaResend;

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
      // Owner NOT registered → send invitation link only (NO auth user creation)
      // The owner clicks the link, lands on /auth, signs up themselves,
      // and useAutoClaimByEmail / useClaimPetInvitation auto-links the pet.
      // ------------------------------------------------------------------
      const actionUrl = redirectTo;
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
        console.error('[send-pet-invitation] Resend failed:', resendResult.error);
        return errorResponse(
          'No se pudo enviar el email. Verifica que Resend este configurado.',
          500
        );
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
