/**
 * Edge Function: send-co-owner-invitation
 *
 * Envia email de invitacion al co-dueno/cuidador/familiar/entrenador
 * agregado a una mascota via pet_co_owners. Complementa el trigger
 * notify_co_owner_on_invite (mig 20260721000000) que ya manda noti
 * in-app a quienes tienen cuenta; esta fn manda el email en todos
 * los casos (con o sin cuenta), con distinto CTA:
 *   - CON cuenta: link a /my-pets?co_owner=<token> (hook lo procesa).
 *   - SIN cuenta: mismo link; ProtectedRoute redirige a /auth
 *     returnTo y post-registro el hook cierra el flow.
 *
 * POST body: { pet_co_owner_id: string }
 * Auth: requires el user que creo la invitacion (invited_by = caller).
 *
 * Fire-and-forget: llamada desde AddPet.tsx sin esperar respuesta.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { buildCoOwnerInviteEmail, sendInvitationViaResend } from '../_shared/invitation-email.ts';
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

serve(
  withTelemetry('send-co-owner-invitation', async (req) => {
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
      const body = await req.json();
      const petCoOwnerId: string | undefined = body?.pet_co_owner_id;
      if (!petCoOwnerId || typeof petCoOwnerId !== 'string') {
        return errorResponse(corsHeaders, 'pet_co_owner_id is required and must be a string', 400);
      }

      // --- Rate limit: 10 invitaciones co_owner por user por dia ---
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: recentInvites } = await (supabase as any)
        .from('pet_co_owners')
        .select('id', { count: 'exact', head: true })
        .eq('invited_by', callerId)
        .gte('invited_at', oneDayAgo);

      if ((recentInvites ?? 0) > 10) {
        return errorResponse(corsHeaders, 'Limite de invitaciones alcanzado (10 por dia).', 429);
      }

      // --- Fetch pet_co_owners row + joins ---
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inviteRow, error: inviteErr } = await (supabase as any)
        .from('pet_co_owners')
        .select('id, pet_id, invited_email, invited_by, role, invitation_token, status')
        .eq('id', petCoOwnerId)
        .maybeSingle();

      if (inviteErr || !inviteRow)
        return errorResponse(corsHeaders, 'Invitacion no encontrada', 404);

      // Solo el inviter puede disparar el email (evita abuso).
      if (inviteRow.invited_by !== callerId) {
        return errorResponse(corsHeaders, 'Solo el que creo la invitacion puede enviarla', 403);
      }

      if (!inviteRow.invited_email) {
        return errorResponse(corsHeaders, 'La invitacion no tiene email asociado', 400);
      }
      if (inviteRow.status !== 'pending') {
        return errorResponse(corsHeaders, `La invitacion ya esta ${inviteRow.status}`, 400);
      }

      // --- Fetch pet name + inviter name ---
      const { data: pet } = await supabase
        .from('pets')
        .select('name')
        .eq('id', inviteRow.pet_id)
        .maybeSingle();

      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', callerId)
        .maybeSingle();

      const petName = pet?.name ?? 'tu mascota';
      const inviterName = inviterProfile?.display_name ?? 'Un amigo/a';

      // --- Build email ---
      const actionUrl = `https://pawfriend.cl/my-pets?co_owner=${inviteRow.invitation_token}`;
      const role = (inviteRow.role ?? 'co_owner') as
        | 'co_owner'
        | 'caretaker'
        | 'trainer'
        | 'family_member';

      const html = buildCoOwnerInviteEmail({
        petName,
        inviterName,
        role,
        actionUrl,
      });

      const subjectLabel =
        role === 'co_owner'
          ? 'co-dueno/a'
          : role === 'family_member'
            ? 'familiar'
            : role === 'caretaker'
              ? 'cuidador/a'
              : 'entrenador/a';
      const subject = `${inviterName} te invito a compartir ${petName} en Paw Friend (${subjectLabel})`;

      // --- Send via Resend ---
      const sent = await sendInvitationViaResend({
        to: inviteRow.invited_email,
        subject,
        html,
      });

      if (!sent.ok) {
        console.error('[send-co-owner-invitation] Resend error:', sent.error);
        return errorResponse(corsHeaders, `Email no enviado: ${sent.error}`, 502);
      }

      return jsonResponse(corsHeaders, { ok: true });
    } catch (e) {
      console.error('[send-co-owner-invitation] unexpected error:', e);
      const msg = e instanceof Error ? e.message : String(e);
      return errorResponse(corsHeaders, `Internal error: ${msg}`, 500);
    }
  })
);
