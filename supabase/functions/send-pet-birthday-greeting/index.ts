/**
 * Edge Function: send-pet-birthday-greeting
 *
 * Cada día (cron 13:00 UTC) envía push + email de feliz cumpleaños a dueños
 * cuyas mascotas cumplen años hoy. Incluye link a la Paw Card para compartir.
 *
 * Momento emocional alto → alto engagement → retención.
 * Bajo costo operacional (sólo mascotas que cumplen ese día).
 *
 * Origen: Plan 90d — retención emocional B2C.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { requireCronAuth } from '../_shared/cron-auth.ts';
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

function buildEmailHtml(
  petName: string,
  ownerFirstName: string,
  ageYears: number,
  pawCardUrl: string
): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#faf5ff;font-family:system-ui,Arial,sans-serif;color:#1f2937">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.08)">
  <tr><td style="background:linear-gradient(135deg,#ec4899 0%,#f59e0b 50%,#7c3aed 100%);padding:40px 24px;text-align:center;color:#fff">
    <div style="font-size:14px;text-transform:uppercase;letter-spacing:.2em;opacity:.85">Paw Friend</div>
    <div style="font-size:52px;margin:8px 0">🎂</div>
    <div style="font-size:28px;font-weight:800;line-height:1.2">¡Feliz cumpleaños, ${escapeHtml(petName)}!</div>
  </td></tr>
  <tr><td style="padding:28px 24px">
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5">
      Hola ${escapeHtml(ownerFirstName)},
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6">
      Hoy <strong>${escapeHtml(petName)}</strong> cumple <strong>${ageYears} año${ageYears !== 1 ? 's' : ''}</strong>. Gracias por cuidarlo/a con tanto amor.
    </p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6b7280">
      Regalo de Paw Friend: su Paw Card especial con rareza del día. Compartila en redes
      con el hashtag <strong>#PawFriendFamilia</strong>.
    </p>
    <div style="text-align:center;margin:24px 0">
      <a href="${escapeHtml(pawCardUrl)}"
         style="display:inline-block;background:linear-gradient(135deg,#ec4899 0%,#7c3aed 100%);color:#fff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:700;font-size:15px">
        Ver Paw Card de ${escapeHtml(petName)} →
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;text-align:center">
      Recordatorio: si ${escapeHtml(petName)} tiene refuerzo anual de vacunas pendiente, revisa
      <a href="https://pawfriend.cl/reminders" style="color:#7c3aed">tu ficha</a>.
    </p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="margin:0;font-size:11px;color:#6b7280">
      Paw Friend · pawfriend.cl · hecho con cariño para mascotas chilenas
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

  // Sprint 1 P1 SEC-007: bloquea envio de emails de cumpleanos desde caller no autorizado.
  const authError = requireCronAuth(req);
  if (authError) return authError;

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'Paw Friend <no-reply@pawfriend.cl>';
  const APP_BASE_URL = Deno.env.get('APP_BASE_URL') || 'https://pawfriend.cl';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return errorResponse('Server misconfigured', 500);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const today = new Date();
  const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Buscar mascotas con birth_date cuyo mes-dia coincide con hoy
  // (ignorar año para detectar aniversario anual)
  const { data: pets, error: petsErr } = await admin
    .from('pets')
    .select('id, name, birth_date, owner_id, paw_card_id, lifecycle_status')
    .not('birth_date', 'is', null)
    .not('owner_id', 'is', null)
    .eq('lifecycle_status', 'active')
    .ilike('birth_date', `%-${monthDay}`);

  if (petsErr) return errorResponse(`DB error: ${petsErr.message}`, 500);

  if (!pets || pets.length === 0) {
    return jsonResponse({ sent: 0, reason: 'no_birthdays_today', month_day: monthDay });
  }

  let pushSent = 0;
  let emailSent = 0;
  let skipped = 0;

  for (const pet of pets) {
    try {
      const birthYear = new Date(pet.birth_date).getFullYear();
      const ageYears = today.getFullYear() - birthYear;
      if (ageYears < 0 || ageYears > 30) {
        skipped++;
        continue;
      }

      const pawCardUrl = pet.paw_card_id
        ? `${APP_BASE_URL}/paw-card/${pet.paw_card_id}`
        : `${APP_BASE_URL}/ficha/${pet.id}`;

      // Push via send-push-notification (fire-and-forget, best-effort)
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_ids: [pet.owner_id],
            title: `🎂 Feliz cumpleaños ${pet.name}`,
            body: `${pet.name} cumple ${ageYears} año${ageYears !== 1 ? 's' : ''} hoy. Compartí su Paw Card.`,
            data: {
              route: `/paw-card/${pet.paw_card_id ?? ''}`,
              pet_id: String(pet.id),
              kind: 'birthday_greeting',
            },
          }),
        });
        pushSent++;
      } catch {
        // sigue al email
      }

      // Email via Resend
      if (RESEND_API_KEY) {
        const { data: userRow } = await admin.auth.admin.getUserById(pet.owner_id);
        const email = userRow?.user?.email;

        if (email) {
          const { data: ownerProfile } = await admin
            .from('profiles')
            .select('display_name')
            .eq('id', pet.owner_id)
            .maybeSingle();
          const ownerFirstName = (ownerProfile?.display_name || '').split(' ')[0] || 'hola';

          const html = buildEmailHtml(pet.name, ownerFirstName, ageYears, pawCardUrl);
          const resendResp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to: email,
              subject: `🎂 ${pet.name} cumple ${ageYears} año${ageYears !== 1 ? 's' : ''} hoy`,
              html,
            }),
          });

          if (resendResp.ok) emailSent++;
        }
      }
    } catch {
      skipped++;
    }
  }

  return jsonResponse({
    total_birthdays: pets.length,
    push_sent: pushSent,
    email_sent: emailSent,
    skipped,
    month_day: monthDay,
  });
}

serve(withTelemetry('send-pet-birthday-greeting', handle));
