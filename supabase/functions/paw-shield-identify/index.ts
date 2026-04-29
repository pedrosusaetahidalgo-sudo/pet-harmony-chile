/**
 * paw-shield-identify · Edge Function
 *
 * Identifica una mascota por foto de hocico — usado en el flow publico
 * /nose-scan ("encontre un perro perdido, ayudame a saber quien es").
 *
 * NO requiere auth (publico). Pero hay rate limit per-IP via Supabase
 * platform default + log en paw_shield_events para detectar abuse.
 *
 * Lógica:
 *   1. Recibe imagen base64 + species.
 *   2. Llama Petify identify 1:N.
 *   3. Cruza los petify_pet_id con nuestra tabla pets.
 *   4. Devuelve top-3 candidates con info publica del owner (nombre +
 *      foto pet, NO datos de contacto). Si gap < threshold, marca
 *      ambiguous para que la UI muestre todos.
 *
 * Privacidad: solo retornamos info publica (pet name, photo, comuna del
 * dueño si la tiene). Para contactar al dueño, el flow lleva a un
 * formulario "envíale un mensaje a [dueño]" que va via in-app message,
 * no expone email/telefono.
 *
 * Request:
 * {
 *   species: 'DOG' | 'CAT',
 *   image_base64: string
 * }
 *
 * Response (200):
 * {
 *   status: 'match' | 'ambiguous' | 'no_match',
 *   matches?: Array<{
 *     pet_id: string,         // pawfriend_pet_id (UUID)
 *     pet_name: string,
 *     pet_photo_url: string | null,
 *     species: string,
 *     score: number,
 *     comuna?: string | null  // del dueño, si esta publica
 *   }>
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';
import { identifyByImage, type PetifySpecies } from '../_shared/petify-client.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

/** Score minimo para considerar match valido (no spam). */
const MIN_MATCH_SCORE = 80;
/** Si gap top1-top2 < N, marcar como ambiguo. */
const AMBIGUOUS_GAP = 5;

interface IdentifyRequest {
  species: PetifySpecies;
  image_base64: string;
}

function base64ToBlob(base64: string): Blob {
  const cleaned = base64.includes(',') ? base64.split(',')[1] : base64;
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: 'image/jpeg' });
}

serve(
  withTelemetry('paw-shield-identify', async (req) => {
    if (req.method === 'OPTIONS') return handleCorsOptions(req);
    const corsHeaders = getCorsHeaders(req);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body: IdentifyRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.species || !body.image_base64) {
      return new Response(JSON.stringify({ error: 'missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (body.species !== 'DOG' && body.species !== 'CAT') {
      return new Response(JSON.stringify({ error: 'species must be DOG or CAT' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    let blob: Blob;
    try {
      blob = base64ToBlob(body.image_base64);
    } catch {
      return new Response(JSON.stringify({ error: 'invalid base64 image' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Identify via Petify ──
    let matches: Array<{ id: string; score: number; metadata: string }>;
    try {
      matches = await identifyByImage(body.species, blob);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[paw-shield-identify] Petify error:', msg);
      return new Response(JSON.stringify({ status: 'service_error', error: msg.slice(0, 300) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Filtrar por score minimo ──
    const valid = matches.filter((m) => m.score >= MIN_MATCH_SCORE);

    if (valid.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('paw_shield_events').insert({
        event_type: 'identify_no_match',
        match_top_score: matches[0]?.score ?? null,
      });
      return new Response(
        JSON.stringify({ status: 'no_match', message: 'No encontramos coincidencias.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Cruzar con nuestra DB ──
    const petifyIds = valid.slice(0, 3).map((m) => m.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pets } = await (supabase as any)
      .from('pets')
      .select('id, name, species, photo_url, petify_pet_id, owner_id')
      .in('petify_pet_id', petifyIds);

    const petsMap = new Map(
      (pets ?? []).map((p: { petify_pet_id: string }) => [p.petify_pet_id, p])
    );

    // Comuna del dueño desde profile (mejor esfuerzo, no rompe si falla).
    const ownerIds = (pets ?? []).map((p: { owner_id: string }) => p.owner_id).filter(Boolean);
    const ownerComunas = new Map<string, string | null>();
    if (ownerIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('id, comuna')
        .in('id', ownerIds);
      for (const p of profiles ?? []) {
        ownerComunas.set(p.id, p.comuna ?? null);
      }
    }

    const enriched = valid.slice(0, 3).map((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbPet = petsMap.get(m.id) as any;
      return {
        pet_id: dbPet?.id ?? null,
        pet_name: dbPet?.name ?? '(desconocido)',
        pet_photo_url: dbPet?.photo_url ?? null,
        species: dbPet?.species ?? body.species,
        score: m.score,
        comuna: dbPet?.owner_id ? (ownerComunas.get(dbPet.owner_id) ?? null) : null,
        // pawfriend_pet_id puede estar en metadata como fallback si la cross-ref
        // de petify_pet_id no encuentra (caso raro: pet borrado de nuestra DB
        // pero no de Petify).
        _petify_id: m.id,
      };
    });

    // ── Determinar status ──
    const top = valid[0];
    const second = valid[1];
    const gap = second ? top.score - second.score : 100;
    const status = gap < AMBIGUOUS_GAP ? 'ambiguous' : 'match';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('paw_shield_events').insert({
      event_type: 'identify_success',
      match_top_score: top.score,
      match_gap: gap,
      metadata: { count: valid.length, status },
    });

    return new Response(
      JSON.stringify({
        status,
        matches: enriched,
        gap,
        message:
          status === 'ambiguous'
            ? 'Encontramos varias mascotas parecidas. Revisa cada una para identificar la correcta.'
            : 'Encontramos a tu mascota.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  })
);
