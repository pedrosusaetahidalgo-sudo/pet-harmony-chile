/**
 * Edge Function: send-inactive-user-reminder
 *
 * Cada semana detecta dueños con ≥1 mascota que no se loguean hace 14-45
 * días y les envía email cálido "¿cómo está {mascota}?". Objetivo: recuperar
 * usuarios antes del churn definitivo.
 *
 * Diseño conservador:
 *   - Solo users con mascotas (sin pet no hay razón para volver).
 *   - Solo 1 recordatorio por usuario cada 30 días (dedup via whatsapp_message_log).
 *   - Si el user está a >45 días sin login, no molestar más (asumimos churn).
 *   - Copy empático, no agresivo.
 *
 * Schedule: jueves 14:00 UTC (11:00 Chile) — día bajo tráfico email, abre OK.
 *
 * Origen: Plan 90d — recuperación de churn temprano.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { requireCronAuth } from '../_shared/cron-auth.ts';

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

function buildEmailHtml(ownerName: string, petName: string, daysAway: number): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#faf5ff;font-family:system-ui,Arial,sans-serif;color:#1f2937">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.08)">
  <tr><td style="background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);padding:28px 24px;color:#fff;text-align:center">
    <div style="font-size:44px;margin-bottom:8px">🐾</div>
    <div style="font-size:22px;font-weight:800;line-height:1.2">¿Cómo está ${escapeHtml(petName)}?</div>
  </td></tr>
  <tr><td style="padding:24px">
    <p style="margin:0 0 14px;font-size:15px;line-height:1.5">
      Hola ${escapeHtml(ownerName)},
    </p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6">
      Hace ${daysAway} días que no te veo en Paw Friend. Espero que ${escapeHtml(petName)}
      esté bien.
    </p>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#4b5563">
      Si hay algo que no te sirvió de la app, me lo puedes decir directamente:{' '}
      <a href="mailto:pedrosusaeta@pawfriend.cl" style="color:#7c3aed">
        pedrosusaeta@pawfriend.cl
      </a>. Leo cada mensaje.
    </p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4b5563">
      Si fue solo que te olvidaste, aquí está la ficha de ${escapeHtml(petName)} esperando:
    </p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://pawfriend.cl/home"
         style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:600;font-size:14px">
        Volver a Paw Friend →
      </a>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;text-align:center">
      Si no quieres recibir más estos mensajes, responde a este email con "STOP" y te saco de
      la lista. Nunca más.
    </p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:14px 24px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="margin:0;font-size:11px;color:#6b7280">
      Paw Friend · pawfriend.cl
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

  // Sprint 1 P1 SEC-007: bloquea spam de "te extranamos" desde caller no autorizado.
  const authError = requireCronAuth(req);
  if (authError) return authError;

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'Paw Friend <no-reply@pawfriend.cl>';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return errorResponse('Server misconfigured', 500);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const now = new Date();
  const floor = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000); // 45d atrás
  const ceiling = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14d atrás
  const dedupWindow = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30d

  // Buscar profiles con updated_at en ventana 14-45 días + tienen pet
  const { data: candidates, error: candErr } = await admin
    .from('profiles')
    .select('id, display_name, updated_at')
    .gte('updated_at', floor.toISOString())
    .lte('updated_at', ceiling.toISOString())
    .limit(500);

  if (candErr) return errorResponse(`DB error: ${candErr.message}`, 500);

  if (!candidates || candidates.length === 0) {
    return jsonResponse({ sent: 0, reason: 'no_inactive_users' });
  }

  let sent = 0;
  let skipped = 0;

  for (const user of candidates) {
    try {
      // Verificar que tiene mascota activa
      const { data: pets } = await admin
        .from('pets')
        .select('name')
        .eq('owner_id', user.id)
        .eq('lifecycle_status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!pets || pets.length === 0) {
        skipped++;
        continue;
      }

      // Dedup: ya enviamos en últimos 30 días?
      const refId = `inactive-${user.id}`;
      const { count: recentSent } = await admin
        .from('whatsapp_message_log')
        .select('*', { count: 'exact', head: true })
        .eq('reference_id', refId)
        .eq('channel', 'email')
        .eq('status', 'sent')
        .gte('created_at', dedupWindow.toISOString());

      if ((recentSent ?? 0) > 0) {
        skipped++;
        continue;
      }

      // Email del user
      const { data: userRow } = await admin.auth.admin.getUserById(user.id);
      const email = userRow?.user?.email;
      if (!email) {
        skipped++;
        continue;
      }

      if (!RESEND_API_KEY) {
        skipped++;
        continue;
      }

      const firstName = (user.display_name || '').split(' ')[0] || 'hola';
      const petName = pets[0].name;
      const daysAway = Math.floor(
        (now.getTime() - new Date(user.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const html = buildEmailHtml(firstName, petName, daysAway);

      const resendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: email,
          subject: `¿Cómo está ${petName}? · Paw Friend`,
          html,
        }),
      });

      if (resendResp.ok) {
        sent++;
        // Registrar dedup
        await admin.from('whatsapp_message_log').insert({
          reference_id: refId,
          channel: 'email',
          status: 'sent',
        });
      } else {
        skipped++;
      }
    } catch {
      skipped++;
    }
  }

  return jsonResponse({
    sent,
    skipped,
    total_candidates: candidates.length,
    ran_at: now.toISOString(),
  });
}

serve(withTelemetry('send-inactive-user-reminder', handle));
