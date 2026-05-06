/**
 * Edge Function: send-monthly-vet-stats
 *
 * Cada primer domingo del mes envía un email a cada vet pagando (plan
 * != free) con sus stats del mes anterior:
 *   - Pacientes activos.
 *   - Nuevos pacientes del mes.
 *   - Fichas compartidas recibidas.
 *   - Reviews nuevas + rating promedio actual.
 *   - Próximos recordatorios (bookings) esta semana.
 *
 * Objetivo: retención B2B + refuerzo valor (vet ve que el plan lo
 * vale) + reducir churn INIT-09.
 *
 * Auth: service_role (llamada desde cron pg_net).
 * Requiere: RESEND_API_KEY + SUPABASE_SERVICE_ROLE_KEY.
 *
 * Origen: Plan 90d fidelización vets pagando.
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

interface VetStats {
  provider_id: string;
  user_id: string;
  display_name: string;
  email: string;
  plan_name: string;
  active_patients: number;
  new_patients_month: number;
  shares_received: number;
  new_reviews: number;
  avg_rating: number;
  bookings_this_week: number;
}

function buildEmailHtml(vet: VetStats, monthLabel: string): string {
  const firstName = vet.display_name.split(' ')[0] || 'Doctor/a';
  const stars = '★'.repeat(Math.round(vet.avg_rating)) + '☆'.repeat(5 - Math.round(vet.avg_rating));

  const statBlock = (label: string, value: string | number, hint?: string) => `
    <td align="center" style="padding:12px;width:33.33%;vertical-align:top">
      <div style="font-size:28px;font-weight:800;color:#7c3aed;line-height:1">${value}</div>
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-top:4px">${label}</div>
      ${hint ? `<div style="font-size:10px;color:#9ca3af;margin-top:2px">${hint}</div>` : ''}
    </td>
  `;

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#faf5ff;font-family:system-ui,Arial,sans-serif;color:#1f2937">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.08)">
  <tr><td style="background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);padding:28px 24px;color:#fff">
    <div style="font-size:12px;text-transform:uppercase;letter-spacing:.12em;opacity:.85">Paw Friend — Tu resumen mensual</div>
    <div style="font-size:24px;font-weight:800;margin-top:6px">Hola ${escapeHtml(firstName)}</div>
    <div style="font-size:13px;margin-top:4px;opacity:.9">${escapeHtml(monthLabel)} · Plan ${escapeHtml(vet.plan_name)}</div>
  </td></tr>

  <tr><td style="padding:24px">
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5">
      Aquí va tu resumen del mes con Paw Friend. Seguimos cuidando a tus pacientes juntos.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;border-radius:12px;margin-bottom:16px">
      <tr>
        ${statBlock('Pacientes activos', vet.active_patients)}
        ${statBlock('Nuevos este mes', vet.new_patients_month, `${vet.new_patients_month > 0 ? '↑' : '–'}`)}
        ${statBlock('Fichas recibidas', vet.shares_received, 'compartidas por dueños')}
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;margin-bottom:16px">
      <tr>
        ${statBlock('Reseñas nuevas', vet.new_reviews, vet.new_reviews > 0 ? `${stars}` : 'invita a tus pacientes')}
        ${statBlock('Rating actual', vet.avg_rating > 0 ? vet.avg_rating.toFixed(1) : '—', 'estrellas')}
        ${statBlock('Citas esta semana', vet.bookings_this_week)}
      </tr>
    </table>

    <div style="text-align:center;margin:24px 0">
      <a href="https://pawfriend.cl/provider/dashboard"
         style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:600;font-size:14px">
        Ir a mi panel
      </a>
    </div>

    <p style="margin:16px 0 0;font-size:12px;color:#6b7280;line-height:1.5">
      Consejo del mes: si tienes pacientes sin reseña, envíales invitación desde tu panel.
      Mientras más reseñas verificadas, más arriba apareces en el directorio público.
    </p>
  </td></tr>

  <tr><td style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="margin:0;font-size:11px;color:#6b7280">
      Paw Friend — pawfriend.cl<br/>
      Este email se envía una vez al mes a vets con plan activo.
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
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthLabel = monthStart.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  // Paying vets: plan != free, status ok
  const { data: vets, error: vetsErr } = await admin
    .from('service_providers')
    .select('id, user_id, display_name, provider_plan, status')
    .neq('provider_plan', 'provider_free')
    .in('status', ['approved', 'active']);

  if (vetsErr) return errorResponse(`DB vets error: ${vetsErr.message}`, 500);

  if (!vets || vets.length === 0) {
    return jsonResponse({ sent: 0, skipped: 0, reason: 'no_paying_vets' });
  }

  let sent = 0;
  let skipped = 0;
  const results: Array<{ vet_id: string; ok: boolean; reason?: string }> = [];

  for (const vet of vets) {
    try {
      // Email: profile first, then auth.users
      let email: string | null = null;
      if (vet.user_id) {
        const { data: userRow } = await admin.auth.admin.getUserById(vet.user_id);
        email = userRow?.user?.email ?? null;
      }

      if (!email) {
        results.push({ vet_id: vet.id, ok: false, reason: 'no_email' });
        skipped++;
        continue;
      }

      // Stats aggregate per vet
      const [
        activePatients,
        newPatientsMonth,
        sharesReceived,
        newReviews,
        avgRatingRow,
        bookingsWeek,
      ] = await Promise.all([
        admin
          .from('pet_vet_links')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', vet.id)
          .eq('status', 'active'),
        admin
          .from('pet_vet_links')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', vet.id)
          .gte('created_at', monthStart.toISOString())
          .lt('created_at', monthEnd.toISOString()),
        admin
          .from('medical_share_tokens')
          .select('id', { count: 'exact', head: true })
          .eq('target_provider_id', vet.id)
          .gte('created_at', monthStart.toISOString())
          .lt('created_at', monthEnd.toISOString()),
        admin
          .from('service_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', vet.id)
          .eq('is_visible', true)
          .gte('created_at', monthStart.toISOString())
          .lt('created_at', monthEnd.toISOString()),
        admin.from('service_providers').select('rating').eq('id', vet.id).maybeSingle(),
        admin
          .from('vet_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('vet_id', vet.user_id)
          .in('status', ['pendiente', 'confirmado', 'en_camino'])
          .gte('scheduled_date', now.toISOString())
          .lte('scheduled_date', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const planMap: Record<string, string> = {
        provider_premium: 'Premium',
        provider_clinic_starter: 'Clínica',
        provider_pro_max: 'Pro Max',
        provider_individual: 'Premium',
        provider_clinic_basic: 'Clínica',
        provider_clinic_pro: 'Pro Max',
      };

      const stats: VetStats = {
        provider_id: vet.id,
        user_id: vet.user_id || '',
        display_name: vet.display_name || 'Doctor/a',
        email,
        plan_name: planMap[vet.provider_plan ?? ''] || 'Premium',
        active_patients: activePatients.count ?? 0,
        new_patients_month: newPatientsMonth.count ?? 0,
        shares_received: sharesReceived.count ?? 0,
        new_reviews: newReviews.count ?? 0,
        avg_rating: (avgRatingRow.data?.rating as number) ?? 0,
        bookings_this_week: bookingsWeek.count ?? 0,
      };

      if (!RESEND_API_KEY) {
        // Dev / sin Resend: skip silent
        results.push({ vet_id: vet.id, ok: false, reason: 'resend_not_configured' });
        skipped++;
        continue;
      }

      const html = buildEmailHtml(stats, monthLabel);
      const resendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: email,
          subject: `Paw Friend · Tu resumen ${monthLabel}`,
          html,
        }),
      });

      if (resendResp.ok) {
        sent++;
        results.push({ vet_id: vet.id, ok: true });
      } else {
        skipped++;
        const detail = await resendResp.text().catch(() => '');
        results.push({
          vet_id: vet.id,
          ok: false,
          reason: `resend_${resendResp.status}_${detail.slice(0, 80)}`,
        });
      }
    } catch (err) {
      skipped++;
      results.push({
        vet_id: vet.id,
        ok: false,
        reason: `exception_${(err as Error).message.slice(0, 80)}`,
      });
    }
  }

  return jsonResponse({
    sent,
    skipped,
    total: vets.length,
    month: monthLabel,
    results: results.slice(0, 50), // limitar payload
  });
}

serve(withTelemetry('send-monthly-vet-stats', handle));
