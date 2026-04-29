/**
 * Edge Function: vet-checkin-identify
 *
 * Endpoint publico (auth via X-Vet-Api-Key header) usado por widget embebido
 * en software del vet. Mascota llega → escanea hocico → busca en Petify →
 * devuelve datos del paciente si esta en su lista.
 *
 * Spec: docs-raiz/PAW_SHIELD_IDEAS_BANK.md §2 (RICE 126).
 *
 * Auth:
 *   - Header X-Vet-Api-Key con plain key (pf_vet_...).
 *   - Backend valida via RPC verify_vet_api_key (SHA256 match).
 *   - Devuelve provider_id si key activa, sino 401.
 *
 * Scope:
 *   - Solo devuelve match si el pet tiene al vet (provider_id) en su ficha
 *     (campo `pets.preferred_vet_id` o como booking historico). MVP: chequeamos
 *     bookings/medical_records con provider_id en historico.
 *   - Si no hay relacion previa, devolvemos `not_authorized` (vet no puede
 *     identificar pets de otros vets).
 *
 * Request:
 *   POST con header X-Vet-Api-Key + body { species: 'DOG'|'CAT', image_base64: string }
 *
 * Response 200:
 *   {
 *     status: 'matched' | 'no_match' | 'low_confidence' | 'not_authorized',
 *     pet?: { id, name, species, breed, photo_url, owner_name, owner_phone },
 *     score?: number,
 *     ficha_url?: string  // link directo /ficha/{petId}?mode=vet
 *   }
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { identifyByImage, type PetifySpecies } from '../_shared/petify-client.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const MIN_MATCH_SCORE = 80;
const HIGH_CONFIDENCE = 92;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-vet-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  species: PetifySpecies;
  image_base64: string;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function base64ToBlob(base64: string): Blob {
  const cleaned = base64.includes(',') ? base64.split(',')[1] : base64;
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: 'image/jpeg' });
}

serve(
  withTelemetry('vet-checkin-identify', async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

    const apiKey = req.headers.get('X-Vet-Api-Key');
    if (!apiKey || !apiKey.startsWith('pf_vet_')) {
      return jsonResponse({ error: 'missing or invalid X-Vet-Api-Key' }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1. Verificar API key.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: keyRows, error: keyErr } = await (supabase as any).rpc('verify_vet_api_key', {
      p_plain_key: apiKey,
    });
    if (keyErr || !keyRows || (keyRows as unknown[]).length === 0) {
      return jsonResponse({ error: 'invalid or revoked api key' }, 401);
    }
    const keyRow = (
      keyRows as Array<{
        api_key_id: string;
        service_provider_id: string;
        tier: string;
        rate_limit_per_hour: number;
      }>
    )[0];

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'invalid JSON' }, 400);
    }

    if (!body.species || !body.image_base64) {
      return jsonResponse({ error: 'missing required fields' }, 400);
    }
    if (body.species !== 'DOG' && body.species !== 'CAT') {
      return jsonResponse({ error: 'species must be DOG or CAT' }, 400);
    }

    let blob: Blob;
    try {
      blob = base64ToBlob(body.image_base64);
    } catch {
      return jsonResponse({ error: 'invalid base64 image' }, 400);
    }

    // 2. Identify via Petify.
    let matches: Array<{ id: string; score: number; metadata: string }>;
    try {
      matches = await identifyByImage(body.species, blob);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[vet-checkin-identify] Petify error:', msg);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('vet_checkin_log').insert({
        vet_api_key_id: keyRow.api_key_id,
        service_provider_id: keyRow.service_provider_id,
        result: 'error',
        error_message: msg.slice(0, 500),
      });
      return jsonResponse({ status: 'error', error: 'biometric service unavailable' }, 502);
    }

    const valid = matches.filter((m) => m.score >= MIN_MATCH_SCORE);
    if (valid.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('vet_checkin_log').insert({
        vet_api_key_id: keyRow.api_key_id,
        service_provider_id: keyRow.service_provider_id,
        match_score: matches[0]?.score ?? null,
        result: 'no_match',
      });
      return jsonResponse({ status: 'no_match' });
    }

    const top = valid[0];

    // 3. Cruza con DB. Solo devolvemos pet si tiene relacion con el vet
    // (booking historico o preferred_vet_id).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pet } = await (supabase as any)
      .from('pets')
      .select('id, name, species, breed, photo_url, owner_id')
      .eq('petify_pet_id', top.id)
      .maybeSingle();

    if (!pet) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('vet_checkin_log').insert({
        vet_api_key_id: keyRow.api_key_id,
        service_provider_id: keyRow.service_provider_id,
        match_score: top.score,
        result: 'no_match',
      });
      return jsonResponse({ status: 'no_match' });
    }

    // Chequea relacion vet-pet via bookings historicos.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: bookingCount } = await (supabase as any)
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pet_id', pet.id)
      .eq('service_provider_id', keyRow.service_provider_id);

    if ((bookingCount ?? 0) === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('vet_checkin_log').insert({
        vet_api_key_id: keyRow.api_key_id,
        service_provider_id: keyRow.service_provider_id,
        pet_id: pet.id,
        match_score: top.score,
        result: 'no_match',
        error_message: 'pet exists but no booking history with this vet',
      });
      return jsonResponse({
        status: 'not_authorized',
        message: 'Mascota encontrada pero no esta en tu lista de pacientes.',
      });
    }

    // 4. Owner data minima (nombre + telefono para coordinacion).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: owner } = await (supabase as any)
      .from('profiles')
      .select('full_name, phone')
      .eq('id', pet.owner_id)
      .maybeSingle();

    const result = top.score >= HIGH_CONFIDENCE ? 'matched' : 'low_confidence';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('vet_checkin_log').insert({
      vet_api_key_id: keyRow.api_key_id,
      service_provider_id: keyRow.service_provider_id,
      pet_id: pet.id,
      match_score: top.score,
      result,
    });

    // Increment usage counter (best-effort).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('vet_api_keys')
      .update({ last_used_at: new Date().toISOString(), total_requests: undefined })
      .eq('id', keyRow.api_key_id);

    return jsonResponse({
      status: result,
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        photo_url: pet.photo_url,
        owner_name: owner?.full_name ?? null,
        owner_phone: owner?.phone ?? null,
      },
      score: top.score,
      ficha_url: `https://pawfriend.cl/ficha/${pet.id}?mode=vet`,
    });
  })
);
