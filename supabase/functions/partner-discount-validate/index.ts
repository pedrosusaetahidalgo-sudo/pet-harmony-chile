// ==========================================================================
// partner-discount-validate — endpoint para que partners validen Paw Member
//
// Refactor Maestro §9.2 + §6.4 partner discounts.
//
// Caso de uso: una tienda partner (Mathiesen, Kiwoko, etc) tiene un POS
// que escanea un QR del Paw Friend Member para aplicar descuento. El POS
// llama esta edge fn con un token + slug del partner; recibe si el user
// es Paw Member activo + nombre + foto + flag de uso reciente.
//
// Auth: API key del partner via header X-Pawfriend-Api-Key (mismo flujo
// que b2b-api). Scope requerido: 'partner_discount_validate'.
//
// Body:
//   {
//     "user_token": "uuid_del_user",  // del QR escaneado
//     "partner_slug": "mathiesen"     // identifica al partner
//   }
//
// Response:
//   {
//     "valid": true,
//     "user_id": "...",
//     "is_paw_member": true,
//     "member_since": "2025-12-01",
//     "display_name": "Pedro",
//     "discount_text": "5% en alimento" (del partner)
//   }
//
// Privacy:
//   - NO expone email, phone, ni address — solo display_name y foto opcional
//   - Cada validacion crea un partner_event tipo='referral' para auditoria
//   - Rate limit per-key (10000/h enterprise)
// ==========================================================================
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-pawfriend-api-key, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ valid: false, error: message }, status);
}

interface VerifyKeyRow {
  id: string;
  name: string;
  scopes: string[];
  is_valid: boolean;
}

serve(
  withTelemetry('partner-discount-validate', async (req: Request) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    // 1. API key auth (mismo flujo que b2b-api)
    const apiKey = req.headers.get('x-pawfriend-api-key') ?? req.headers.get('X-Pawfriend-Api-Key');
    if (!apiKey || !apiKey.startsWith('pf_live_')) {
      return errorResponse('Missing X-Pawfriend-Api-Key header', 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: keyRows, error: keyErr } = await supabase.rpc('verify_b2b_api_key', {
      p_plain_key: apiKey,
    });
    if (keyErr || !keyRows || (keyRows as VerifyKeyRow[]).length === 0) {
      return errorResponse('Invalid API key', 401);
    }
    const keyRow = (keyRows as VerifyKeyRow[])[0];
    if (!keyRow.is_valid) {
      return errorResponse('API key inactive or expired', 401);
    }
    if (!keyRow.scopes.includes('partner_discount_validate')) {
      return errorResponse(
        `Scope 'partner_discount_validate' required. Key scopes: ${keyRow.scopes.join(', ')}`,
        403
      );
    }

    // 2. Parse body
    let body: { user_token?: string; partner_slug?: string } = {};
    try {
      body = await req.json();
    } catch {
      return errorResponse('Body must be valid JSON', 400);
    }

    if (!body.user_token || !body.partner_slug) {
      return errorResponse('Body must include user_token + partner_slug', 400);
    }

    // 3. Lookup user
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, is_premium, premium_start_date, premium_end_date')
      .eq('id', body.user_token)
      .maybeSingle();

    if (profileErr || !profileData) {
      return jsonResponse({ valid: false, reason: 'user_not_found' }, 200);
    }

    const profile = profileData as {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      is_premium: boolean | null;
      premium_start_date: string | null;
      premium_end_date: string | null;
    };

    const isPawMember =
      profile.is_premium === true &&
      (!profile.premium_end_date || new Date(profile.premium_end_date) > new Date());

    // 4. Lookup partner discount text (si existe en paw_companys)
    let discountText: string | null = null;
    try {
      const { data: partnerData } = await supabase
        .from('paw_companys')
        .select('paw_member_discount')
        .eq('slug', body.partner_slug)
        .maybeSingle();
      discountText =
        (partnerData as { paw_member_discount: string | null } | null)?.paw_member_discount ?? null;
    } catch {
      // tabla no existe en algunos envs; continuar sin discount text
    }

    // 5. Audit: registrar referral event en partner_events (best-effort)
    try {
      await supabase.rpc('record_partner_event', {
        p_partner_slug: body.partner_slug,
        p_event_type: 'referral',
        p_user_id: profile.id,
        p_pet_id: null,
        p_gmv_clp: null,
        p_commission_clp: null,
        p_external_ref: null,
        p_data: {
          source: 'partner-discount-validate',
          is_paw_member: isPawMember,
        },
      });
    } catch (err) {
      // Si la tabla partner_integrations no esta lista o el partner no
      // existe, no fallar el endpoint principal.
      console.warn('[partner-discount-validate] event log failed', err);
    }

    return jsonResponse({
      valid: true,
      user_id: profile.id,
      is_paw_member: isPawMember,
      member_since: profile.premium_start_date,
      display_name: profile.display_name ?? null,
      avatar_url: profile.avatar_url ?? null,
      discount_text: discountText,
    });
  })
);
