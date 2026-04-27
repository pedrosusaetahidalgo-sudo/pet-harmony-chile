// ==========================================================================
// insurance-prefill-quote — pre-llena cotizacion con ficha del pet
//
// Refactor Maestro §9.2 + §7.2 seguros embebidos.
//
// Caso de uso: el dueño hace click en InsuranceBanner ("Cotiza para Bobby")
// y el frontend llama esta edge fn con pet_id + insurer_slug. La fn:
//   1. Verifica que el dueño es el caller (auth.uid())
//   2. Lee ficha minima del pet (raza, edad, peso, condiciones cronicas)
//   3. Calcula risk_score via RPC calculate_pet_risk_score
//   4. Construye payload pre-llenado con shape estandar para insurer
//   5. Registra partner_event tipo='referral' (el insurer paga commission
//      cuando se convierte en poliza activa)
//   6. Devuelve payload + URL de redirect al insurer (si configurada)
//
// El insurer NO recibe PII via esta fn — solo data de la mascota.
// El usuario completa nombre/email/telefono en el sitio del insurer.
//
// Stub mode: si EMBEDDED_INSURANCE flag esta off (no hay partner firmado),
// la fn retorna 503 con mensaje claro. Cuando aparezca primer partner,
// Pedro inserta row en partner_integrations + activa el flag.
// ==========================================================================
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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

interface PetRow {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  weight: number | null;
  microchip_number: string | null;
  neutered: boolean | null;
}

interface RiskScoreRow {
  risk_score: number;
  age_years: number;
  factors: Record<string, unknown>;
}

interface PartnerRow {
  id: string;
  slug: string;
  name: string;
  status: string;
  config: Record<string, unknown> | null;
}

serve(
  withTelemetry('insurance-prefill-quote', async (req: Request) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // 1. Auth: requiere user logueado (verify_jwt=true en config.toml)
    // El JWT viene en Authorization header. Lo extraemos para get user_id.
    const auth = req.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Authorization required' }, 401);
    }

    // 2. Parse body
    let body: { pet_id?: string; insurer_slug?: string } = {};
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Body must be valid JSON' }, 400);
    }
    if (!body.pet_id || !body.insurer_slug) {
      return jsonResponse({ error: 'Body must include pet_id + insurer_slug' }, 400);
    }

    // 3. Cliente con JWT del user (no service_role) para que RLS valide
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: auth } } }
    );

    // 4. Verificar que el partner aseguradora esta activo
    const { data: partnerData, error: partnerErr } = await supabase
      .from('partner_integrations')
      .select('id, slug, name, status, config')
      .eq('slug', body.insurer_slug)
      .eq('category', 'insurance')
      .in('status', ['pilot', 'active'])
      .maybeSingle();

    if (partnerErr || !partnerData) {
      return jsonResponse(
        {
          error: 'Partner aseguradora no disponible. EMBEDDED_INSURANCE requiere partner firmado.',
          available: false,
        },
        503
      );
    }
    const partner = partnerData as PartnerRow;

    // 5. Lookup pet (RLS asegura que solo owner puede leer)
    const { data: petData, error: petErr } = await supabase
      .from('pets')
      .select('id, owner_id, name, species, breed, birth_date, weight, microchip_number, neutered')
      .eq('id', body.pet_id)
      .maybeSingle();

    if (petErr || !petData) {
      return jsonResponse({ error: 'Pet not found or no permission' }, 404);
    }
    const pet = petData as PetRow;

    // 6. Calcular risk score (RPC validates owner internally)
    let riskScore: number | null = null;
    let riskFactors: Record<string, unknown> = {};
    try {
      const { data: scoreData } = await supabase.rpc('calculate_pet_risk_score', {
        p_pet_id: pet.id,
      });
      const scoreRow = (scoreData as RiskScoreRow[] | null)?.[0];
      if (scoreRow) {
        riskScore = scoreRow.risk_score;
        riskFactors = scoreRow.factors;
      }
    } catch (err) {
      console.warn('[insurance-prefill-quote] risk_score failed', err);
    }

    // 7. Calcular edad
    const ageYears = pet.birth_date
      ? Math.floor(
          (Date.now() - new Date(pet.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        )
      : null;

    // 8. Construir payload pre-llenado (shape estandar)
    const prefillPayload = {
      pet: {
        species: pet.species,
        breed: pet.breed,
        age_years: ageYears,
        weight_kg: pet.weight,
        has_microchip: Boolean(pet.microchip_number?.trim()),
        is_neutered: pet.neutered === true,
      },
      risk: {
        score: riskScore,
        factors: riskFactors,
      },
      // No PII: el insurer pide email/phone en su sitio
    };

    // 9. Registrar referral event en partner_events (best-effort)
    let referralId: string | null = null;
    try {
      const { data: refData } = await supabase.rpc('record_partner_event', {
        p_partner_slug: partner.slug,
        p_event_type: 'referral',
        p_user_id: pet.owner_id,
        p_pet_id: pet.id,
        p_gmv_clp: null,
        p_commission_clp: null,
        p_external_ref: null,
        p_data: {
          source: 'insurance-prefill-quote',
          risk_score: riskScore,
        },
      });
      referralId = refData as string | null;
    } catch (err) {
      console.warn('[insurance-prefill-quote] event log failed', err);
    }

    // 10. URL del partner (si configurada). El frontend la usa para redirect
    //     con el payload pre-llenado por query string o POST.
    const insurerUrl = (partner.config as { quote_url?: string } | null)?.quote_url ?? null;

    return jsonResponse({
      success: true,
      partner: {
        slug: partner.slug,
        name: partner.name,
        quote_url: insurerUrl,
      },
      prefill: prefillPayload,
      referral_id: referralId,
    });
  })
);
