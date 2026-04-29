/**
 * Edge Function: send-b2b-welcome
 *
 * Envia email transaccional de bienvenida al partner B2B con su API key
 * recien emitida (post-aprobacion en AdminPitchApplications).
 *
 * Cierra el flow C 2026-04-29:
 *   /aplicar?tipo=b2b_api → admin approve via RPC approve_b2b_api_application
 *   → admin recibe plain key UNA SOLA VEZ → llama esta fn con la plain key
 *   → partner recibe email con su key + link /b2b + docs.
 *
 * Auth: admin-only via JWT (verifica admin_access table).
 *
 * POST body:
 *   {
 *     api_key_id: string,
 *     plain_key: string,
 *     partner_email: string,
 *     partner_name: string,
 *     tier: 'free' | 'research' | 'enterprise'
 *   }
 *
 * Response: { sent: boolean, message_id?: string }
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { escapeHtml, renderEmail, sendEmail as sendResendEmail } from '../_shared/email-layout.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface RequestBody {
  api_key_id: string;
  plain_key: string;
  partner_email: string;
  partner_name: string;
  tier: 'free' | 'research' | 'enterprise';
}

const TIER_INFO: Record<string, { label: string; rate: string; scopes: string }> = {
  free: { label: 'Free', rate: '100 req/h', scopes: 'breed_stats' },
  research: { label: 'Research', rate: '1.000 req/h', scopes: 'breed_stats, species_stats' },
  enterprise: {
    label: 'Enterprise',
    rate: '10.000 req/h',
    scopes: 'breed_stats, species_stats, correlation_insights, risk_score',
  },
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildEmailHtml(body: RequestBody): string {
  const tier = TIER_INFO[body.tier] ?? TIER_INFO.free;
  const escName = escapeHtml(body.partner_name);
  const escKey = escapeHtml(body.plain_key);
  const escTier = escapeHtml(tier.label);
  const keyShort = escapeHtml(body.plain_key.slice(0, 20)) + '...';

  const inner = `
<!-- Header -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#9333ea;color:#fff;">
  <tr><td style="padding:24px 32px;text-align:center;">
    <img src="https://pawfriend.cl/paw-friend-assets-v2/logo/pwa_icon_192.png" alt="Paw Friend" width="48" height="48" style="border-radius:12px;display:inline-block;" />
    <p style="margin:8px 0 0 0;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;font-size:13px;color:#fde047;letter-spacing:0.08em;font-weight:700;">API B2B · TU ACCESO ESTA ACTIVO</p>
  </td></tr>
</table>

<!-- Body -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fff;">
  <tr><td style="padding:32px;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;color:#1a102b;">

    <h1 style="margin:0 0 12px 0;font-family:Fredoka,'Plus Jakarta Sans',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;line-height:1.2;color:#1a102b;">
      Hola ${escName}, tu API key esta lista.
    </h1>

    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#475569;">
      Aprobamos tu solicitud de acceso a la API B2B de Paw Friend (tier <strong>${escTier}</strong>).
      Esta es tu API key: guardala en lugar seguro, <strong>no la compartas publicamente</strong> y no la subas a un repo abierto.
    </p>

    <p style="margin:24px 0 8px 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">
      🔑 Tu API key
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr><td style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:14px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;color:#1a102b;word-break:break-all;">
        ${escKey}
      </td></tr>
    </table>

    <p style="margin:12px 0 24px 0;font-size:13px;color:#64748b;line-height:1.5;">
      <strong>Esta es la unica vez que te enviamos la key plana.</strong> Despues de este email solo
      vas a ver el prefix (los primeros 16 caracteres) en tu portal. Si la pierdes, generamos una
      nueva.
    </p>

    <h2 style="margin:24px 0 12px 0;font-family:Fredoka,'Plus Jakarta Sans',Helvetica,Arial,sans-serif;font-size:18px;font-weight:600;color:#1a102b;">
      Tu plan
    </h2>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border-spacing:0 4px;">
      <tr>
        <td style="background:#faf5ff;padding:10px 14px;border-radius:6px 0 0 6px;font-size:12px;color:#6b21a8;font-weight:600;width:35%;">Tier</td>
        <td style="background:#faf5ff;padding:10px 14px;border-radius:0 6px 6px 0;font-size:13px;color:#1a102b;font-weight:700;">${escTier}</td>
      </tr>
      <tr>
        <td style="background:#faf5ff;padding:10px 14px;border-radius:6px 0 0 6px;font-size:12px;color:#6b21a8;font-weight:600;">Rate limit</td>
        <td style="background:#faf5ff;padding:10px 14px;border-radius:0 6px 6px 0;font-size:13px;color:#1a102b;">${escapeHtml(tier.rate)}</td>
      </tr>
      <tr>
        <td style="background:#faf5ff;padding:10px 14px;border-radius:6px 0 0 6px;font-size:12px;color:#6b21a8;font-weight:600;">Scopes</td>
        <td style="background:#faf5ff;padding:10px 14px;border-radius:0 6px 6px 0;font-family:'JetBrains Mono',monospace;font-size:11px;color:#1a102b;">${escapeHtml(tier.scopes)}</td>
      </tr>
    </table>

    <h2 style="margin:28px 0 12px 0;font-family:Fredoka,'Plus Jakarta Sans',Helvetica,Arial,sans-serif;font-size:18px;font-weight:600;color:#1a102b;">
      Quickstart
    </h2>
    <p style="margin:0 0 8px 0;font-size:13px;color:#475569;line-height:1.5;">
      Autentica con header <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:11px;">X-Pawfriend-Api-Key</code>:
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr><td style="background:#0f172a;border-radius:8px;padding:14px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#e2e8f0;line-height:1.6;">
        curl https://gwailbjlvevkhwcrovfd.functions.supabase.co/b2b-api/breed_stats \\<br/>
        &nbsp;&nbsp;-H "X-Pawfriend-Api-Key: ${keyShort}" \\<br/>
        &nbsp;&nbsp;-H "Content-Type: application/json"
      </td></tr>
    </table>

    <p style="margin:12px 0 0 0;font-size:12px;color:#64748b;line-height:1.5;">
      Privacy threshold: solo razas / cohorts con n ≥ 50 son publicables. Si excedes el rate limit
      vas a recibir <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:11px;">429</code>
      con <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:11px;">Retry-After</code>.
    </p>

    <!-- CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:32px 0 16px 0;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background:#9333ea;border-radius:30px;">
            <a href="https://pawfriend.cl/b2b" style="display:inline-block;padding:14px 32px;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#fff;text-decoration:none;border-radius:30px;letter-spacing:-0.2px;">
              Abrir portal /b2b →
            </a>
          </td></tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;text-align:center;">
      Pega tu key alli para ver tu uso (req/24h, req/7d, scopes activos, expiracion).
    </p>

    <!-- Compliance -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:32px;border-top:1px solid #e2e8f0;padding-top:20px;">
      <tr><td style="font-size:12px;color:#64748b;line-height:1.5;">
        <strong style="color:#1a102b;">Cumplimiento</strong> · Ley 19.628 (privacidad) +
        Ley 21.719 (proteccion de datos) + threshold n≥50 + consent opt-in del dueno.
        Datos siempre agregados, nunca individualizables.
      </td></tr>
    </table>

  </td></tr>
</table>

<!-- Footer -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf5ff;">
  <tr><td style="padding:24px 32px;text-align:center;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;font-size:12px;color:#6b21a8;">
    <p style="margin:0 0 6px 0;font-weight:700;">Paw Friend · pawfriend.cl</p>
    <p style="margin:0;color:#94a3b8;">Cualquier duda escribinos a <a href="mailto:pawfriendcl@gmail.com" style="color:#9333ea;">pawfriendcl@gmail.com</a> · respondemos en menos de 48h.</p>
  </td></tr>
</table>
`;

  return renderEmail({
    title: 'Tu API key Paw Friend B2B',
    preheader: `Tier ${tier.label} · ${tier.rate} · scopes ${tier.scopes}`,
    body: inner,
  });
}

serve(
  withTelemetry('send-b2b-welcome', async (req) => {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: adminRow } = await (supabase as any)
      .from('admin_access')
      .select('user_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (!adminRow) return jsonResponse({ error: 'admin only' }, 403);

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'invalid JSON' }, 400);
    }

    if (
      !body.api_key_id ||
      !body.plain_key ||
      !body.partner_email ||
      !body.partner_name ||
      !body.tier
    ) {
      return jsonResponse({ error: 'missing required fields' }, 400);
    }

    if (!/^pf_(live|test)_[a-f0-9]{20,}$/.test(body.plain_key)) {
      return jsonResponse({ error: 'invalid plain_key format' }, 400);
    }

    const html = buildEmailHtml(body);

    try {
      const result = await sendResendEmail({
        to: body.partner_email,
        subject: '🔑 Tu API key Paw Friend B2B esta lista',
        html,
        tags: [{ name: 'kind', value: 'b2b_welcome' }],
      });

      if (!result.ok) {
        console.error('[send-b2b-welcome] Resend error:', result);
        return jsonResponse(
          { sent: false, error: result.error ?? 'send failed', status: result.status },
          502
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('pitch_applications')
        .update({
          admin_notes: `Welcome email enviado a ${body.partner_email} (${new Date().toISOString()})`,
        })
        .eq('approved_entity_id', body.api_key_id);

      return jsonResponse({ sent: true, message_id: result.id ?? null });
    } catch (err) {
      console.error('[send-b2b-welcome] sendEmail fallo:', err);
      return jsonResponse(
        { sent: false, error: err instanceof Error ? err.message : 'send failed' },
        500
      );
    }
  })
);
