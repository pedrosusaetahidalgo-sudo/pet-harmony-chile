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
 * 4. Send email via Supabase auth admin API (inviteUserByEmail or magiclink)
 * 5. Update pets.owner_invitation_sent_at
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- Auth: verify caller ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Authorization required', 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return errorResponse('User not authenticated', 401);
    }

    const callerId = userData.user.id;

    // --- Parse body ---
    const { pet_id } = await req.json();

    if (!pet_id || typeof pet_id !== 'string') {
      return errorResponse('pet_id is required and must be a string', 400);
    }

    // --- Fetch pet record ---
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select(
        'id, name, pending_owner_email, pending_owner_name, owner_invitation_token, owner_invitation_sent_at, created_by_vet_id'
      )
      .eq('id', pet_id)
      .single();

    if (petError || !pet) {
      return errorResponse('Mascota no encontrada', 404);
    }

    // Verify the caller is the vet who created this pet
    if (pet.created_by_vet_id !== callerId) {
      return errorResponse(
        'Solo el veterinario que creó el registro puede enviar la invitación',
        403
      );
    }

    if (!pet.pending_owner_email) {
      return errorResponse('Esta mascota no tiene un email de dueño pendiente', 400);
    }

    const email = pet.pending_owner_email;

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
        return errorResponse('Error al generar token de invitación', 500);
      }
    }

    // --- Check if user already exists in auth ---
    const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 1 });

    // Use a targeted lookup: try to find user by email
    const { data: userByEmail } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    const redirectTo = `https://pawfriend.cl/auth?returnTo=/my-pets&invitation=${invitationToken}`;

    let emailSent = false;
    let method: 'invite' | 'magiclink' = 'invite';

    if (userByEmail) {
      // User already has an account — send magic link instead
      const { error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo },
      });

      if (magicLinkError) {
        console.error('Error sending magic link:', magicLinkError);
        // Fallback: try invite anyway
        const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
          redirectTo,
        });

        if (inviteError) {
          console.error('Error sending invite (fallback):', inviteError);
          return errorResponse(
            'No se pudo enviar el email de invitación. Intenta de nuevo más tarde.',
            500
          );
        }
        method = 'invite';
      } else {
        method = 'magiclink';
      }
      emailSent = true;
    } else {
      // New user — send invitation email
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo,
      });

      if (inviteError) {
        console.error('Error sending invitation:', inviteError);
        return errorResponse(
          'No se pudo enviar el email de invitación. Intenta de nuevo más tarde.',
          500
        );
      }
      method = 'invite';
      emailSent = true;
    }

    // --- Update pet record with sent timestamp ---
    if (emailSent) {
      const { error: updateError } = await supabase
        .from('pets')
        .update({ owner_invitation_sent_at: new Date().toISOString() })
        .eq('id', pet_id);

      if (updateError) {
        console.error('Error updating invitation_sent_at:', updateError);
        // Non-fatal: email was already sent
      }
    }

    // --- Pre-create pet_vet_link so when owner accepts, the link auto-activates ---
    // Look up the service_providers row for this vet
    const { data: vetProvider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', callerId)
      .maybeSingle();

    if (vetProvider?.id) {
      // If the owner already exists, create an active link directly
      // Otherwise, the link will be created when the owner claims the pet
      if (userByEmail?.id) {
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
      // For new users, the frontend handles creating the link after account creation
    }

    return jsonResponse({
      success: true,
      method,
      pet_id,
      pet_name: pet.name,
      email_sent_to: email,
      invitation_token: invitationToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[send-pet-invitation] error:', message);
    return errorResponse(
      'Error al enviar la invitación. Por favor, intenta de nuevo más tarde.',
      500
    );
  }
});
