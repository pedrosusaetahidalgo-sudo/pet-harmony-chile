/**
 * Edge Function: request-insurance-quote
 *
 * El dueno completa el form de contacto en /cotizar-seguro/:petId →
 * esta fn:
 *   1. Crea row en insurance_leads (con datos owner + quote_id).
 *   2. Marca insurance_quotes.status = 'lead_sent'.
 *   3. Envia email al partner (contact_email del insurance_partners) con
 *      los datos del lead + datos de la mascota + risk score.
 *   4. Envia email-copia al admin (Pedro) para tracking.
 *
 * Auth: requiere user JWT (no es publica).
 *
 * Body:
 *   {
 *     pet_id: string,
 *     quote_id: string,
 *     partner_id: string,
 *     name: string,
 *     phone: string,
 *     message?: string
 *   }
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { escapeHtml, sendEmail as sendResendEmail } from '../_shared/email-layout.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ADMIN_NOTIFY_EMAIL = Deno.env.get('PITCH_NOTIFICATION_EMAIL') ?? 'pawfriendcl@gmail.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  pet_id: string;
  quote_id: string;
  partner_id: string;
  name: string;
  phone: string;
  message?: string;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface QuoteRow {
  id: string;
  pet_id: string;
  owner_id: string;
  partner_id: string;
  risk_score: number;
  age_years: number | null;
  monthly_premium_clp: number;
  annual_premium_clp: number;
}

interface PartnerRow {
  display_name: string;
  contact_email: string;
}

interface PetRow {
  id: string;
  name: string;
  species: string;
  breed: string | null;
}

interface ProfileRow {
  full_name: string | null;
  email: string | null;
}

function buildPartnerEmail(opts: {
  partnerName: string;
  petName: string;
  species: string;
  breed: string | null;
  riskScore: number;
  ageYears: number | null;
  monthly: number;
  annual: number;
  ownerName: string;
  ownerEmail: string | null;
  ownerPhone: string;
  message: string;
}): string {
  const fmt = (n: number) => n.toLocaleString('es-CL');
  return `<!DOCTYPE html>
<html><body style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a102b;">
  <div style="background:#9333ea;color:#fff;padding:20px;border-radius:12px 12px 0 0;">
    <p style="margin:0;font-size:11px;letter-spacing:0.1em;color:#fde047;text-transform:uppercase;font-weight:700;">Paw Friend · Lead B2B Insurance</p>
    <h1 style="margin:8px 0 0;font-size:22px;">Nuevo lead aseguradora</h1>
  </div>
  <div style="background:#fff;border:1px solid #e9d5ff;border-top:0;padding:24px;border-radius:0 0 12px 12px;">
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
      Hola <strong>${escapeHtml(opts.partnerName)}</strong>, un dueño de Paw Friend pidio cotizacion en vivo y quiere que lo contactes.
    </p>

    <h2 style="font-size:14px;margin:20px 0 8px;color:#6b21a8;text-transform:uppercase;letter-spacing:0.08em;">Mascota</h2>
    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#64748b;">Nombre</td><td><strong>${escapeHtml(opts.petName)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Especie</td><td>${escapeHtml(opts.species)}</td></tr>
      ${opts.breed ? `<tr><td style="padding:6px 0;color:#64748b;">Raza</td><td>${escapeHtml(opts.breed)}</td></tr>` : ''}
      ${opts.ageYears !== null ? `<tr><td style="padding:6px 0;color:#64748b;">Edad</td><td>${opts.ageYears} ${opts.ageYears === 1 ? 'año' : 'años'}</td></tr>` : ''}
      <tr><td style="padding:6px 0;color:#64748b;">Risk Score</td><td><strong>${opts.riskScore}/100</strong></td></tr>
    </table>

    <h2 style="font-size:14px;margin:20px 0 8px;color:#6b21a8;text-transform:uppercase;letter-spacing:0.08em;">Cotizacion mostrada</h2>
    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#64748b;">Prima mensual</td><td><strong>$${fmt(opts.monthly)} CLP</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Prima anual</td><td><strong>$${fmt(opts.annual)} CLP</strong></td></tr>
    </table>

    <h2 style="font-size:14px;margin:20px 0 8px;color:#6b21a8;text-transform:uppercase;letter-spacing:0.08em;">Dueno</h2>
    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#64748b;width:120px;">Nombre</td><td><strong>${escapeHtml(opts.ownerName)}</strong></td></tr>
      ${opts.ownerEmail ? `<tr><td style="padding:6px 0;color:#64748b;">Email</td><td><a href="mailto:${escapeHtml(opts.ownerEmail)}">${escapeHtml(opts.ownerEmail)}</a></td></tr>` : ''}
      <tr><td style="padding:6px 0;color:#64748b;">Telefono</td><td><strong>${escapeHtml(opts.ownerPhone)}</strong></td></tr>
    </table>

    ${opts.message ? `<div style="margin-top:16px;padding:12px;background:#faf5ff;border-left:3px solid #9333ea;border-radius:4px;font-size:13px;line-height:1.6;"><strong style="color:#6b21a8;">Mensaje:</strong> ${escapeHtml(opts.message)}</div>` : ''}

    <div style="margin-top:24px;padding:14px;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;font-size:12px;line-height:1.6;color:#78350f;">
      <strong>Compliance:</strong> el dueno acepto explicitamente compartir sus datos contigo al hacer click en "Contactar partner". Pedimos contacto en menos de 48h habiles.
    </div>
  </div>
  <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:16px;">Paw Friend · pawfriend.cl · pawfriendcl@gmail.com</p>
</body></html>`;
}

serve(
  withTelemetry('request-insurance-quote', async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'unauthorized' }, 401);
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return jsonResponse({ error: 'invalid token' }, 401);

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'invalid JSON' }, 400);
    }

    if (
      !body.pet_id ||
      !body.quote_id ||
      !body.partner_id ||
      !body.name?.trim() ||
      !body.phone?.trim()
    ) {
      return jsonResponse({ error: 'missing required fields' }, 400);
    }

    // Cargar quote (validando ownership).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: quote, error: quoteErr } = await (supabase as any)
      .from('insurance_quotes')
      .select(
        'id, pet_id, owner_id, partner_id, risk_score, age_years, monthly_premium_clp, annual_premium_clp'
      )
      .eq('id', body.quote_id)
      .maybeSingle();

    if (quoteErr || !quote) {
      return jsonResponse({ error: 'quote not found' }, 404);
    }
    const q = quote as QuoteRow;
    if (q.owner_id !== userId) {
      return jsonResponse({ error: 'not your quote' }, 403);
    }
    if (q.partner_id !== body.partner_id) {
      return jsonResponse({ error: 'partner mismatch' }, 400);
    }

    // Cargar partner.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: partner } = await (supabase as any)
      .from('insurance_partners')
      .select('display_name, contact_email')
      .eq('id', body.partner_id)
      .eq('is_active', true)
      .maybeSingle();
    if (!partner) return jsonResponse({ error: 'partner inactive' }, 400);
    const p = partner as PartnerRow;

    // Cargar pet + owner.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pet } = await (supabase as any)
      .from('pets')
      .select('id, name, species, breed')
      .eq('id', body.pet_id)
      .maybeSingle();
    if (!pet) return jsonResponse({ error: 'pet not found' }, 404);
    const petRow = pet as PetRow;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .maybeSingle();
    const profileRow = (profile ?? null) as ProfileRow | null;
    const ownerEmail = profileRow?.email ?? userData?.user?.email ?? null;

    // Crear lead.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: leadRow, error: leadErr } = await (supabase as any)
      .from('insurance_leads')
      .insert({
        quote_id: body.quote_id,
        pet_id: body.pet_id,
        owner_id: userId,
        partner_id: body.partner_id,
        contact_name: body.name.trim(),
        contact_email: ownerEmail ?? '',
        contact_phone: body.phone.trim(),
        message: body.message?.trim() || null,
      })
      .select('id')
      .single();

    if (leadErr) {
      console.error('[request-insurance-quote] insert lead fallo:', leadErr);
      return jsonResponse({ error: 'failed to create lead' }, 500);
    }

    // Update quote status.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('insurance_quotes')
      .update({ status: 'lead_sent' })
      .eq('id', body.quote_id);

    // Email al partner + admin.
    const html = buildPartnerEmail({
      partnerName: p.display_name,
      petName: petRow.name,
      species: petRow.species,
      breed: petRow.breed,
      riskScore: q.risk_score,
      ageYears: q.age_years,
      monthly: q.monthly_premium_clp,
      annual: q.annual_premium_clp,
      ownerName: body.name.trim(),
      ownerEmail,
      ownerPhone: body.phone.trim(),
      message: body.message?.trim() ?? '',
    });

    const subject = `Lead nuevo · ${petRow.name} (${petRow.species}) · ${p.display_name}`;

    let partnerSent = false;
    try {
      const partnerResult = await sendResendEmail({
        to: p.contact_email,
        subject,
        html,
        replyTo: ownerEmail ?? undefined,
        tags: [{ name: 'kind', value: 'insurance_lead_partner' }],
      });
      partnerSent = partnerResult.ok;
      if (!partnerResult.ok) {
        console.error('[request-insurance-quote] email partner fallo', partnerResult);
      }
    } catch (err) {
      console.error('[request-insurance-quote] email partner exception', err);
    }

    // Email-copia admin (best-effort).
    try {
      await sendResendEmail({
        to: ADMIN_NOTIFY_EMAIL,
        subject: `[admin] Insurance lead · ${p.display_name} → ${petRow.name}`,
        html,
        tags: [{ name: 'kind', value: 'insurance_lead_admin' }],
      });
    } catch {
      /* best-effort */
    }

    if (partnerSent) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('insurance_leads')
        .update({ status: 'sent', partner_notified_at: new Date().toISOString() })
        .eq('id', (leadRow as { id: string }).id);
    }

    return jsonResponse({
      ok: true,
      lead_id: (leadRow as { id: string }).id,
      partner_notified: partnerSent,
    });
  })
);
