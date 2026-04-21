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
import { withTelemetry } from '../_shared/telemetry.ts';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';
import { buildInvitationEmail, sendInvitationViaResend } from '../_shared/invitation-email.ts';

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

// Email template + Resend sender extraidos a `_shared/invitation-email.ts`
// (importados arriba). Esto evita duplicar el HTML entre create-patient y
// send-pet-invitation.
const sendViaResend = sendInvitationViaResend;

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

serve(
  withTelemetry('create-patient', async (req) => {
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
        .select('id, display_name, is_verified, provider_plan')
        .eq('user_id', vetId)
        .maybeSingle();

      if (providerError || !vetProvider) {
        return errorResponse(req, 'Solo veterinarios registrados pueden crear pacientes', 403);
      }

      // ── Gate max_clients segun plan B2B (auditoría 2026-04-20) ──
      // provider_free: 5 pacientes | provider_clinic_starter: 500 |
      // provider_premium y provider_pro_max: ilimitado
      const PLAN_MAX_CLIENTS: Record<string, number> = {
        provider_free: 5,
        provider_premium: -1,
        provider_clinic_starter: 500,
        provider_pro_max: -1,
      };
      const maxClients = PLAN_MAX_CLIENTS[vetProvider.provider_plan ?? 'provider_free'] ?? 5;
      if (maxClients !== -1) {
        const { count: currentPatients } = await supabase
          .from('pet_vet_links')
          .select('pet_id', { count: 'exact', head: true })
          .eq('vet_id', vetProvider.id);
        if ((currentPatients ?? 0) >= maxClients) {
          return errorResponse(
            req,
            `Llegaste al limite de ${maxClients} pacientes del plan ${vetProvider.provider_plan}. Actualiza tu plan para crear mas.`,
            403,
            'plan_limit_reached'
          );
        }
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
      await supabase
        .from('pets')
        .update({ owner_invitation_token: invitationToken })
        .eq('id', petId);

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
  })
);
