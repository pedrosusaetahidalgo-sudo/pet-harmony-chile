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
import { withTelemetry } from '../_shared/telemetry.ts';
import { buildInvitationEmail, sendInvitationViaResend } from '../_shared/invitation-email.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

function jsonResponse(corsHeaders: Record<string, string>, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(corsHeaders: Record<string, string>, message: string, status = 500) {
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
serve(
  withTelemetry('send-pet-invitation', async (req) => {
    const corsHeaders = getCorsHeaders(req);
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      // --- Auth ---
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return errorResponse(corsHeaders, 'Authorization required', 401);

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user)
        return errorResponse(corsHeaders, 'User not authenticated', 401);

      const callerId = userData.user.id;

      // --- Parse body ---
      const { pet_id } = await req.json();
      if (!pet_id || typeof pet_id !== 'string') {
        return errorResponse(corsHeaders, 'pet_id is required and must be a string', 400);
      }

      // --- Rate limit: max 5 invitations per user per day (combina vet + shelter) ---
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Fetch shelter del caller (si tiene) para evaluar rate limit combinado.
      const { data: callerShelter } = await supabaseAdmin
        .from('adoption_centers')
        .select('id, legal_name, type')
        .eq('user_id', callerId)
        .maybeSingle();

      const shelterIds = callerShelter ? [callerShelter.id] : [];

      // Contamos invitaciones recientes enviadas por este caller (vet o shelter).
      const recentVetInvitesQuery = supabaseAdmin
        .from('pets')
        .select('id', { count: 'exact', head: true })
        .eq('created_by_vet_id', callerId)
        .not('owner_invitation_sent_at', 'is', null)
        .gte('owner_invitation_sent_at', oneDayAgo);

      const { count: recentVetInvites } = await recentVetInvitesQuery;

      let recentShelterInvites = 0;
      if (shelterIds.length > 0) {
        const { count } = await supabaseAdmin
          .from('pets')
          .select('id', { count: 'exact', head: true })
          .in('created_by_shelter_id', shelterIds)
          .not('owner_invitation_sent_at', 'is', null)
          .gte('owner_invitation_sent_at', oneDayAgo);
        recentShelterInvites = count ?? 0;
      }

      const totalRecent = (recentVetInvites ?? 0) + recentShelterInvites;
      if (totalRecent >= 5) {
        return errorResponse(
          corsHeaders,
          'Límite de invitaciones alcanzado (5 por día). Intenta mañana.',
          429
        );
      }

      // --- Fetch pet con ambos FKs ---
      const { data: pet, error: petError } = await supabase
        .from('pets')
        .select(
          'id, name, pending_owner_email, pending_owner_name, owner_invitation_token, owner_invitation_sent_at, created_by_vet_id, created_by_shelter_id'
        )
        .eq('id', pet_id)
        .single();

      if (petError || !pet) return errorResponse(corsHeaders, 'Mascota no encontrada', 404);

      // Determinar tipo de caller respecto a esta mascota.
      const callerIsVet = pet.created_by_vet_id === callerId;
      const callerIsShelter = !!callerShelter?.id && pet.created_by_shelter_id === callerShelter.id;

      if (!callerIsVet && !callerIsShelter) {
        return errorResponse(
          corsHeaders,
          'Solo el veterinario o refugio que cargo la ficha puede enviar la invitacion',
          403
        );
      }

      if (!pet.pending_owner_email) {
        return errorResponse(corsHeaders, 'Esta mascota no tiene un email de dueno pendiente', 400);
      }

      const email = pet.pending_owner_email;
      const sourceKind: 'vet' | 'shelter' = callerIsShelter ? 'shelter' : 'vet';

      // Fetch del perfil del caller para el email. Para vet, usa display_name +
      // service_providers (clinica). Para shelter, usa adoption_centers.legal_name.
      let senderName = 'Paw Friend';
      let senderSubLabel = '';
      let vetProviderId: string | null = null;

      if (callerIsShelter && callerShelter) {
        senderName = callerShelter.legal_name;
        senderSubLabel = ''; // el nombre del refugio ya es suficiente
      } else {
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
        senderName = vetProfile?.display_name || 'Tu veterinario/a';
        senderSubLabel = vetProvider?.display_name || '';
        vetProviderId = vetProvider?.id ?? null;
      }

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
          return errorResponse(corsHeaders, 'Error al generar token de invitacion', 500);
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
        // Owner already registered → no email, vet/shelter shares link manually
        // ------------------------------------------------------------------
        // Pre-create active pet_vet_link solo si el caller es vet con provider_id.
        // Para shelter no aplica (refugio no es "proveedor de servicios" en ese sentido).
        if (callerIsVet && vetProviderId) {
          await supabase.from('pet_vet_links').upsert(
            {
              pet_id,
              owner_id: userByEmail.id,
              provider_id: vetProviderId,
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
          vetName: senderName,
          clinicName: senderSubLabel,
          actionUrl,
          sourceKind,
        });

        const subject =
          sourceKind === 'shelter'
            ? `${petName} llega a tu casa con su ficha medica 🐾`
            : `${petName} ya tiene ficha veterinaria en Paw Friend 🐾`;

        const resendResult = await sendViaResend({
          to: email,
          subject,
          html,
        });

        if (resendResult.ok) {
          method = 'resend';
          emailSent = true;
        } else {
          console.error('[send-pet-invitation] Resend failed:', resendResult.error);
          return errorResponse(
            corsHeaders,
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

      return jsonResponse(corsHeaders, corsHeaders, {
        success: true,
        method,
        pet_id,
        pet_name: pet.name,
        email_sent_to: userByEmail ? null : email,
        owner_already_registered: !!userByEmail,
        invitation_token: invitationToken,
        source_kind: sourceKind,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[send-pet-invitation] error:', message);
      return errorResponse(
        corsHeaders,
        'Error al enviar la invitacion. Intenta de nuevo mas tarde.',
        500
      );
    }
  })
);
