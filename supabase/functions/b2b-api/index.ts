// ==========================================================================
// b2b-api — API publica B2B con auth via API key (Refactor Maestro §7.5)
//
// Cliente envia: X-Pawfriend-Api-Key: pf_live_xxxxxxxxxx
// Routing: el body decide el endpoint via { endpoint: 'breed_stats' | ... }
// (Edge functions no tienen path routing nativo en Supabase; usamos body)
//
// Endpoints v1:
//   - breed_stats   — stats por raza (consume public_breed_stats)
//   - species_stats — stats por especie (consume public_species_stats)
//
// Roadmap (no implementados aun):
//   - risk_score    — RPC calculate_pet_risk_score (requiere consent)
//   - cohort_query  — query custom para Pharma (requiere consent + admin OK)
//
// Decisiones:
//   - Threshold privacy: pet_count >= 50 (mismo que insights publicos)
//   - Rate limit: por API key, ventana de 1 hora, atomico via RPC
//   - 401 si key invalida; 403 si scope no incluye endpoint; 429 si rate limit
//   - Logging via withTelemetry (telemetria normal de edge fn)
// ==========================================================================
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';

// CORS abierto: clientes B2B llamaran desde cualquier dominio. La auth
// es la API key, no el origin.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-pawfriend-api-key, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface VerifyRow {
  id: string;
  name: string;
  tier: string;
  scopes: string[];
  rate_limit_per_hour: number;
  is_valid: boolean;
}

interface UsageRow {
  allowed: boolean;
  current_count: number;
  remaining: number;
  reset_in_seconds: number;
}

interface BreedStatsRow {
  breed: string;
  species: string;
  pet_count: number;
  avg_weight_kg: number;
  min_weight_kg: number;
  max_weight_kg: number;
  avg_age_years: number;
}

interface SpeciesStatsRow {
  species: string;
  pet_count: number;
  avg_weight_kg: number;
  min_weight_kg: number;
  max_weight_kg: number;
  avg_age_years: number;
  count_male: number;
  count_female: number;
  count_neutered: number;
  distinct_breeds: number;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status: number, extra?: Record<string, unknown>): Response {
  return jsonResponse({ error: message, ...extra }, status);
}

serve(
  withTelemetry('b2b-api', async (req: Request) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    // 1. Auth: header X-Pawfriend-Api-Key
    const apiKey = req.headers.get('x-pawfriend-api-key') ?? req.headers.get('X-Pawfriend-Api-Key');
    if (!apiKey || !apiKey.startsWith('pf_live_')) {
      return errorResponse('Missing or invalid X-Pawfriend-Api-Key header', 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // 2. Verify key
    const { data: verifyData, error: verifyErr } = await supabase.rpc('verify_b2b_api_key', {
      p_plain_key: apiKey,
    });

    if (verifyErr || !verifyData || (verifyData as VerifyRow[]).length === 0) {
      return errorResponse('Invalid API key', 401);
    }

    const key = (verifyData as VerifyRow[])[0];
    if (!key.is_valid) {
      return errorResponse('API key is inactive or expired', 401);
    }

    // 3. Parse body
    let body: { endpoint?: string; params?: Record<string, unknown> } = {};
    try {
      body = await req.json();
    } catch {
      return errorResponse('Body must be valid JSON', 400);
    }

    const endpoint = body.endpoint;
    if (!endpoint || typeof endpoint !== 'string') {
      return errorResponse("Body must include 'endpoint' (string)", 400);
    }

    // 4. Scope check
    if (!key.scopes.includes(endpoint)) {
      return errorResponse(
        `Endpoint '${endpoint}' not allowed for this key. Scopes: ${key.scopes.join(', ')}`,
        403
      );
    }

    // 5. Rate limit (atomic increment)
    const { data: usageData, error: usageErr } = await supabase.rpc('increment_b2b_api_usage', {
      p_api_key_id: key.id,
    });

    if (usageErr || !usageData || (usageData as UsageRow[]).length === 0) {
      console.error('[b2b-api] usage increment failed', usageErr);
      // Fail-OPEN: si la RPC del rate limiter falla, atendemos el request.
      // No queremos bloquear clientes pagantes por bug interno nuestro.
    } else {
      const usage = (usageData as UsageRow[])[0];
      if (!usage.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            limit_per_hour: key.rate_limit_per_hour,
            reset_in_seconds: usage.reset_in_seconds,
          }),
          {
            status: 429,
            headers: {
              ...CORS,
              'Content-Type': 'application/json',
              'Retry-After': String(usage.reset_in_seconds),
              'X-RateLimit-Limit': String(key.rate_limit_per_hour),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(usage.reset_in_seconds),
            },
          }
        );
      }
    }

    // 6. Routing por endpoint
    if (endpoint === 'breed_stats') {
      return handleBreedStats(supabase, body.params ?? {});
    }
    if (endpoint === 'species_stats') {
      return handleSpeciesStats(supabase, body.params ?? {});
    }
    if (endpoint === 'correlation_insights') {
      return handleCorrelationInsights(supabase, body.params ?? {});
    }
    if (endpoint === 'correlation_catalog') {
      return handleCorrelationCatalog(supabase);
    }

    return errorResponse(`Unknown endpoint '${endpoint}'`, 400, {
      available: ['breed_stats', 'species_stats', 'correlation_insights', 'correlation_catalog'],
    });
  })
);

// --------------------------------------------------------------------------
// Endpoint handlers
// --------------------------------------------------------------------------

async function handleBreedStats(
  supabase: ReturnType<typeof createClient>,
  params: Record<string, unknown>
): Promise<Response> {
  const breedFilter = typeof params.breed === 'string' ? params.breed : null;
  const speciesFilter = typeof params.species === 'string' ? params.species : null;
  const minPetCount =
    typeof params.min_pet_count === 'number'
      ? Math.max(50, params.min_pet_count) // siempre >=50 (privacy)
      : 50;

  let query = supabase
    .from('public_breed_stats')
    .select('breed, species, pet_count, avg_weight_kg, min_weight_kg, max_weight_kg, avg_age_years')
    .gte('pet_count', minPetCount);

  if (breedFilter) query = query.ilike('breed', breedFilter);
  if (speciesFilter) query = query.eq('species', speciesFilter);

  const { data, error } = await query.order('pet_count', { ascending: false }).limit(100);

  if (error) {
    return errorResponse(`Database error: ${error.message}`, 500);
  }

  return jsonResponse({
    endpoint: 'breed_stats',
    threshold_privacy: minPetCount,
    count: (data ?? []).length,
    rows: (data ?? []) as BreedStatsRow[],
  });
}

async function handleSpeciesStats(
  supabase: ReturnType<typeof createClient>,
  params: Record<string, unknown>
): Promise<Response> {
  const speciesFilter = typeof params.species === 'string' ? params.species : null;
  const minPetCount =
    typeof params.min_pet_count === 'number' ? Math.max(50, params.min_pet_count) : 50;

  let query = supabase
    .from('public_species_stats')
    .select(
      'species, pet_count, avg_weight_kg, min_weight_kg, max_weight_kg, avg_age_years, count_male, count_female, count_neutered, distinct_breeds'
    )
    .gte('pet_count', minPetCount);

  if (speciesFilter) query = query.eq('species', speciesFilter);

  const { data, error } = await query.order('pet_count', { ascending: false });

  if (error) {
    return errorResponse(`Database error: ${error.message}`, 500);
  }

  return jsonResponse({
    endpoint: 'species_stats',
    threshold_privacy: minPetCount,
    count: (data ?? []).length,
    rows: (data ?? []) as SpeciesStatsRow[],
  });
}

// --------------------------------------------------------------------------
// Correlation insights — Refactor Maestro Fase 3 §2.9
// --------------------------------------------------------------------------

interface CorrelationDefinitionRow {
  id: string;
  slug: string;
  question: string;
  category: string;
  input_dimensions: string[];
  output_metric: string;
  status: string;
}

interface CorrelationObservationRow {
  bucket: Record<string, unknown>;
  sample_size: number;
  output_value: number;
  output_stddev: number | null;
  confidence_level: string | null;
}

async function handleCorrelationCatalog(
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  // Solo definitions status='published' son visibles para clientes B2B.
  // El catalogo completo (incluye drafts) solo es visible desde admin panel.
  const { data, error } = await supabase
    .from('correlation_definitions')
    .select('id, slug, question, category, input_dimensions, output_metric, status')
    .eq('status', 'published')
    .order('category');

  if (error) {
    return errorResponse(`Database error: ${error.message}`, 500);
  }

  return jsonResponse({
    endpoint: 'correlation_catalog',
    count: (data ?? []).length,
    correlations: (data ?? []) as CorrelationDefinitionRow[],
  });
}

async function handleCorrelationInsights(
  supabase: ReturnType<typeof createClient>,
  params: Record<string, unknown>
): Promise<Response> {
  const definitionId = typeof params.definition_id === 'string' ? params.definition_id : null;
  if (!definitionId) {
    return errorResponse(
      "Param 'definition_id' (UUID) is required. Use endpoint 'correlation_catalog' to list available definitions.",
      400
    );
  }

  const minSampleSize =
    typeof params.min_sample_size === 'number' ? Math.max(50, params.min_sample_size) : 50;

  // RPC ya enforza threshold k-anonymity floor 50 + status='published'.
  // El cliente Supabase no tiene tipos generados aqui — cast a unknown
  // y a la firma minima necesaria para no usar any.
  const rpcCaller = (
    supabase as unknown as {
      rpc: (
        name: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
    }
  ).rpc;
  const { data, error } = await rpcCaller('get_correlation_insights', {
    p_definition_id: definitionId,
    p_min_sample_size: minSampleSize,
  });

  if (error) {
    return errorResponse(`RPC error: ${error.message}`, 500);
  }

  // Si la definition no existe o no esta publicada, devuelve array vacio
  // (no exponemos diferencia entre "no existe" vs "no publicada" para no
  // dar mas info de la cuenta).
  return jsonResponse({
    endpoint: 'correlation_insights',
    definition_id: definitionId,
    threshold_privacy: minSampleSize,
    count: (data ?? []).length,
    observations: (data ?? []) as CorrelationObservationRow[],
  });
}
