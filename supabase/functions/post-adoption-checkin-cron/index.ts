/**
 * Edge Function: post-adoption-checkin-cron
 *
 * Cron diario que procesa post_adoption_checkins con scheduled_at <= now()
 * y status='pending'. Por cada check-in:
 *   1. Envia email al owner_email via Resend con CTA a /post-adoption/:id
 *   2. Marca status='sent' + sent_at=now()
 *   3. Si falla, marca status='failed' + error_message
 *
 * No hace follow-up adicional si el owner no responde. El shelter puede
 * ver la tabla en su dashboard para saber tasa de respuesta.
 *
 * Cron: configurar en Supabase Dashboard > Scheduled Jobs con
 *   `SELECT net.http_post(
 *      'https://gwailbjlvevkhwcrovfd.functions.supabase.co/post-adoption-checkin-cron',
 *      headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE>')
 *    );`
 * Frecuencia: 1x/dia a las 10:00 AM Chile (13:00 UTC).
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

function escapeHtml(s: string): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface CheckinRow {
  id: string;
  pet_id: string;
  shelter_id: string | null;
  owner_email: string;
  milestone_days: number;
}

interface PetRow {
  id: string;
  name: string;
}

interface ShelterRow {
  id: string;
  legal_name: string;
}

const MILESTONE_COPY: Record<number, { subject: string; greeting: string }> = {
  7: {
    subject: '¿Como va tu primera semana con tu nueva mascota?',
    greeting: 'Ya pasaron 7 dias desde que llego',
  },
  30: {
    subject: 'Un mes junto a tu peludo · ¿Como esta todo?',
    greeting: 'Ya cumplen 1 mes juntos',
  },
  90: {
    subject: '3 meses de tu adopcion · Cuentanos como va',
    greeting: 'Ya son 3 meses increibles con',
  },
};

function buildEmailHtml(opts: {
  petName: string;
  milestone: number;
  shelterName: string | null;
  ctaUrl: string;
}): string {
  const { petName, milestone, shelterName, ctaUrl } = opts;
  const copy = MILESTONE_COPY[milestone] || MILESTONE_COPY[7];
  const safePet = escapeHtml(petName);
  const safeShelter = shelterName ? escapeHtml(shelterName) : null;

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#faf5ff;font-family:system-ui,Arial,sans-serif;color:#1f2937">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.08)">
  <tr><td style="background:linear-gradient(135deg,#9333ea 0%,#c084fc 100%);padding:28px 24px;color:#fff;text-align:center">
    <div style="font-size:40px;margin-bottom:8px">🐾</div>
    <div style="font-size:22px;font-weight:800">${escapeHtml(copy.greeting)} ${safePet}</div>
  </td></tr>
  <tr><td style="padding:28px 24px">
    <p style="margin:0 0 16px;font-size:16px;line-height:1.55">
      ¡Hola! ${escapeHtml(copy.greeting)} <strong>${safePet}</strong> a tu casa${safeShelter ? ` desde ${safeShelter}` : ''}.
      Queremos saber como van.
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.55">
      Es solo un minuto: cuentanos del estado de ${safePet} (salud, animo, adaptacion). Tu respuesta
      le llega al refugio y ayuda a mas adopciones futuras.
    </p>
    <div style="text-align:center;margin:24px 0">
      <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#7e22ce);color:#fff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 6px 20px rgba(147,51,234,.3)">
        Contestar check-in · ${milestone} dias
      </a>
    </div>
    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.5">
      Si no queres recibir mas recordatorios, responde este correo con "baja" y te damos de baja al
      toque. Tu ficha medica sigue intacta.
    </p>
  </td></tr>
  <tr><td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af">
    Enviado con ❤️ desde Paw Friend · pawfriend.cl
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.warn('[post-adoption-checkin-cron] RESEND_API_KEY not set');
    return false;
  }
  const from = Deno.env.get('RESEND_FROM_EMAIL') || 'Paw Friend <onboarding@resend.dev>';
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        reply_to: 'hola@pawfriend.cl',
      }),
    });
    if (!resp.ok) {
      console.error('[post-adoption-checkin-cron] Resend error:', resp.status, await resp.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[post-adoption-checkin-cron] fetch error:', err);
    return false;
  }
}

serve(
  withTelemetry('post-adoption-checkin-cron', async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const authError = requireCronAuth(req);
    if (authError) return authError;

    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Fetch pending check-ins due
      const { data: dueCheckins, error: fetchError } = await supabase
        .from('post_adoption_checkins')
        .select('id, pet_id, shelter_id, owner_email, milestone_days')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .limit(100); // batch cap

      if (fetchError) {
        return jsonResponse({ success: false, error: fetchError.message }, 500);
      }

      if (!dueCheckins || dueCheckins.length === 0) {
        return jsonResponse({ success: true, processed: 0, message: 'No checkins due' });
      }

      const results = { sent: 0, failed: 0 };
      const petIds = [...new Set((dueCheckins as CheckinRow[]).map((c) => c.pet_id))];
      const shelterIds = [
        ...new Set(
          (dueCheckins as CheckinRow[]).map((c) => c.shelter_id).filter((x): x is string => !!x)
        ),
      ];

      const [{ data: pets }, { data: shelters }] = await Promise.all([
        supabase.from('pets').select('id, name').in('id', petIds),
        shelterIds.length
          ? supabase.from('adoption_centers').select('id, legal_name').in('id', shelterIds)
          : Promise.resolve({ data: [] as ShelterRow[] }),
      ]);

      const petMap = new Map<string, PetRow>((pets as PetRow[]).map((p) => [p.id, p]));
      const shelterMap = new Map<string, ShelterRow>(
        (shelters as ShelterRow[]).map((s) => [s.id, s])
      );

      for (const c of dueCheckins as CheckinRow[]) {
        const pet = petMap.get(c.pet_id);
        if (!pet) {
          await supabase
            .from('post_adoption_checkins')
            .update({ status: 'failed', error_message: 'pet not found' })
            .eq('id', c.id);
          results.failed++;
          continue;
        }

        const shelter = c.shelter_id ? shelterMap.get(c.shelter_id) : null;
        const copy = MILESTONE_COPY[c.milestone_days] || MILESTONE_COPY[7];
        const ctaUrl = `https://pawfriend.cl/post-adoption/${c.id}`;
        const html = buildEmailHtml({
          petName: pet.name,
          milestone: c.milestone_days,
          shelterName: shelter?.legal_name || null,
          ctaUrl,
        });

        const ok = await sendEmail({
          to: c.owner_email,
          subject: copy.subject,
          html,
        });

        if (ok) {
          await supabase
            .from('post_adoption_checkins')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', c.id);
          results.sent++;
        } else {
          await supabase
            .from('post_adoption_checkins')
            .update({ status: 'failed', error_message: 'email send failed' })
            .eq('id', c.id);
          results.failed++;
        }
      }

      return jsonResponse({
        success: true,
        processed: dueCheckins.length,
        sent: results.sent,
        failed: results.failed,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[post-adoption-checkin-cron] error:', message);
      return jsonResponse({ success: false, error: message }, 500);
    }
  })
);
