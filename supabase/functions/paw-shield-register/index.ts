/**
 * paw-shield-register · Edge Function
 *
 * Registra una mascota en Petify (PetNow) con biometría de hocico.
 * Implementa la política anti-duplicado server-side: antes de crear el pet
 * en Petify, busca si ya existe (1:N identify). Si match >= 92 con gap >= 5,
 * devuelve `duplicate_detected` con info del pet existente para que la UI
 * abra el flow de claim (en vez de crear duplicado).
 *
 * Branding: "Paw Shield" — feature opt-in del modelo v2 (dueño no paga,
 * pero solo activa Petify quien quiere protección por extravío).
 *
 * Request:
 * {
 *   pet_id: string,           // UUID interno de pets.id
 *   species: 'DOG' | 'CAT',
 *   breed?: string,
 *   images_base64: string[]   // 3 frames extraidos del video 3s
 * }
 *
 * Response (200 success):
 * {
 *   status: 'registered' | 'duplicate_detected' | 'ambiguous_match' | 'low_quality',
 *   petify_pet_id?: string,
 *   fingerprint_count?: number,
 *   matches?: Array<{ id, score, metadata }>
 * }
 *
 * Auth: requiere user JWT — el caller debe ser dueño del pet_id.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';
import {
  identifyByImage,
  registerPetWithFingerprints,
  PetifyError,
  type PetifySpecies,
} from '../_shared/petify-client.ts';
import { archivePawShieldImage, loadPetMetadataForArchive } from '../_shared/paw-shield-archive.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

/** Score umbral para considerar duplicado certero. */
const DUPLICATE_SCORE_THRESHOLD = 92;
/** Si gap top1-top2 < este valor, es ambiguo (perros hermanos). */
const AMBIGUOUS_GAP_THRESHOLD = 5;

// ── Circuit breaker config ────────────────────────────────────────────
/** Max enrollments por usuario por dia (anti-abuso). */
const RATE_LIMIT_PER_USER_24H = parseInt(Deno.env.get('PAW_SHIELD_RATE_LIMIT_USER_24H') ?? '5', 10);
/**
 * Global cap: si pets activos en Petify > este numero, bloqueamos nuevos
 * registros (proteccion contra runaway costs). 0 = sin limite.
 * Default 100k = ~$75k USD/mes COGS Petify Pro tier — circuito de seguridad.
 */
const GLOBAL_PET_CAP = parseInt(Deno.env.get('PAW_SHIELD_GLOBAL_PET_CAP') ?? '100000', 10);

interface RegisterRequest {
  pet_id: string;
  species: PetifySpecies;
  breed?: string;
  images_base64: string[];
  /**
   * Opt-in del dueno para archivar imagenes para training futuro.
   * Si true: imagenes se conservan indefinido en bucket paw-shield-archive.
   * Si false (default): imagenes se borran a los 30 dias por cron.
   * Spec: docs-raiz/PAW_SHIELD_DATA_ARCHIVE.md
   */
  archive_consent?: boolean;
  /** Sharpness Laplacian de cada frame (debug + training meta). */
  sharpness_per_frame?: number[];
}

function base64ToBlob(base64: string): Blob {
  // Acepta tanto data URLs ("data:image/jpeg;base64,...") como raw base64.
  const cleaned = base64.includes(',') ? base64.split(',')[1] : base64;
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: 'image/jpeg' });
}

async function logEvent(
  supabase: ReturnType<typeof createClient>,
  fields: {
    pet_id: string | null;
    owner_id: string | null;
    event_type: string;
    petify_pet_id?: string | null;
    fingerprint_count?: number | null;
    match_top_score?: number | null;
    match_gap?: number | null;
    error_code?: string | null;
    error_message?: string | null;
    metadata?: Record<string, unknown> | null;
  }
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('paw_shield_events').insert(fields);
  } catch (e) {
    console.error('[paw-shield-register] logEvent fallo (best-effort):', e);
  }
}

serve(
  withTelemetry('paw-shield-register', async (req) => {
    if (req.method === 'OPTIONS') return handleCorsOptions(req);
    const corsHeaders = getCorsHeaders(req);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth: extraer user del JWT.
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Body validation.
    let body: RegisterRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.pet_id || !body.species || !Array.isArray(body.images_base64)) {
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
    if (body.images_base64.length < 1 || body.images_base64.length > 5) {
      return new Response(JSON.stringify({ error: 'images_base64 must have 1-5 items' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar que el pet pertenece al user (RLS + double-check).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pet, error: petErr } = await (supabase as any)
      .from('pets')
      .select('id, owner_id, name, species, petify_pet_id')
      .eq('id', body.pet_id)
      .maybeSingle();

    if (petErr || !pet) {
      return new Response(JSON.stringify({ error: 'pet not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (pet.owner_id !== userId) {
      return new Response(JSON.stringify({ error: 'not your pet' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (pet.petify_pet_id) {
      // Ya registrado — UI debe llamar al endpoint de "addFingerprints" si quiere
      // sumar mas. Devolvemos el estado actual sin reintentar (idempotencia).
      return new Response(
        JSON.stringify({
          status: 'already_registered',
          petify_pet_id: pet.petify_pet_id,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Circuit breaker 1: rate limit per-user 24h ─────────────────────
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: recentAttempts } = await (supabase as any)
        .from('paw_shield_events')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .eq('event_type', 'register_success')
        .gte('created_at', since);

      if ((recentAttempts ?? 0) >= RATE_LIMIT_PER_USER_24H) {
        await logEvent(supabase, {
          pet_id: body.pet_id,
          owner_id: userId,
          event_type: 'register_rate_limited',
          error_code: 'RATE_LIMIT_USER',
          error_message: `${recentAttempts}/${RATE_LIMIT_PER_USER_24H} enrollments in last 24h`,
        });
        return new Response(
          JSON.stringify({
            status: 'rate_limited',
            error: `Limite de ${RATE_LIMIT_PER_USER_24H} activaciones de Paw Shield por dia. Intenta manana.`,
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': '86400',
            },
          }
        );
      }
    } catch (e) {
      // Fail-open en rate limit (no bloqueamos por error de DB).
      console.warn('[paw-shield-register] rate limit check fallo, sigo:', e);
    }

    // ── Circuit breaker 2: global pet cap ──────────────────────────────
    if (GLOBAL_PET_CAP > 0) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: globalActive } = await (supabase as any)
          .from('pets')
          .select('id', { count: 'exact', head: true })
          .not('petify_pet_id', 'is', null);

        if ((globalActive ?? 0) >= GLOBAL_PET_CAP) {
          await logEvent(supabase, {
            pet_id: body.pet_id,
            owner_id: userId,
            event_type: 'register_global_cap',
            error_code: 'GLOBAL_CAP',
            error_message: `${globalActive}/${GLOBAL_PET_CAP} active pets`,
          });
          return new Response(
            JSON.stringify({
              status: 'service_unavailable',
              error:
                'Paw Shield esta temporalmente al limite. Estamos negociando capacidad adicional. Intenta mas tarde.',
            }),
            {
              status: 503,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (e) {
        // Fail-open: si el query falla, dejamos pasar (pet cap es proteccion
        // soft, no esencial).
        console.warn('[paw-shield-register] global cap check fallo, sigo:', e);
      }
    }

    // Convert base64 → Blobs.
    let blobs: Blob[];
    try {
      blobs = body.images_base64.map(base64ToBlob);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'invalid base64 image', detail: String(e) }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await logEvent(supabase, {
      pet_id: body.pet_id,
      owner_id: userId,
      event_type: 'register_attempt',
      fingerprint_count: blobs.length,
      metadata: { species: body.species, breed: body.breed ?? null },
    });

    // ── Persistir consent + archivar imagenes (best-effort, pre-Petify) ─
    const archiveConsent = body.archive_consent === true;
    if (archiveConsent) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('pets')
        .update({
          paw_shield_data_archive_consent: true,
          paw_shield_data_archive_consent_at: new Date().toISOString(),
        })
        .eq('id', body.pet_id);
    }

    const petMeta = await loadPetMetadataForArchive(supabase, body.pet_id);
    // El consent efectivo es: lo que el usuario marco AHORA (UI explicita) o
    // lo que tenia guardado de antes. Si marca false ahora se respeta tal cual.
    const effectiveConsent = archiveConsent || petMeta.consentForTraining;

    // Archivar cada frame ANTES de mandar a Petify (asi quedan los originales
    // aunque Petify haga lo suyo con ellos).
    for (let i = 0; i < blobs.length; i++) {
      await archivePawShieldImage(supabase, {
        imageBlob: blobs[i],
        petId: body.pet_id,
        ownerId: userId,
        captureKind: 'enrollment',
        frameIndex: i,
        species: body.species,
        breed: body.breed ?? petMeta.breed ?? null,
        ageMonths: petMeta.ageMonths ?? null,
        weightKg: petMeta.weightKg ?? null,
        comuna: petMeta.comuna ?? null,
        sharpnessLaplacian: body.sharpness_per_frame?.[i] ?? null,
        accepted: true,
        consentForTraining: effectiveConsent,
      });
    }

    // ── Fase 1: Identify ANTES de crear (anti-duplicado) ──────────────
    try {
      const matches = await identifyByImage(body.species, blobs[0]);

      if (matches.length > 0) {
        const top = matches[0];
        const second = matches[1];
        const gap = second ? top.score - second.score : 100;

        if (top.score >= DUPLICATE_SCORE_THRESHOLD) {
          if (gap >= AMBIGUOUS_GAP_THRESHOLD) {
            // Match certero → duplicado.
            await logEvent(supabase, {
              pet_id: body.pet_id,
              owner_id: userId,
              event_type: 'duplicate_detected',
              petify_pet_id: top.id,
              match_top_score: top.score,
              match_gap: gap,
            });
            return new Response(
              JSON.stringify({
                status: 'duplicate_detected',
                existing_petify_pet_id: top.id,
                top_score: top.score,
                gap,
                metadata: top.metadata,
                message:
                  'Esta mascota ya esta registrada en Paw Shield. Si es tuya, podes reclamarla con el dueno actual.',
              }),
              {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          } else {
            // Score alto pero gap bajo → ambiguo (hermanos misma camada).
            await logEvent(supabase, {
              pet_id: body.pet_id,
              owner_id: userId,
              event_type: 'ambiguous_match',
              match_top_score: top.score,
              match_gap: gap,
              metadata: { top3: matches.slice(0, 3) },
            });
            return new Response(
              JSON.stringify({
                status: 'ambiguous_match',
                candidates: matches.slice(0, 3),
                message:
                  'Encontramos mascotas muy parecidas (probablemente hermanos). Confirma si tu mascota es alguna de ellas o registrala como nueva.',
              }),
              {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
        }
      }
    } catch (err) {
      // Si identify falla, NO bloqueamos el register (loggeamos y seguimos).
      // La regla anti-duplicado es "best effort" si Petify se cae para identify.
      console.warn('[paw-shield-register] identify pre-check fallo, sigo:', err);
    }

    // ── Fase 2: Register en Petify ─────────────────────────────────────
    try {
      const { petifyPetId, fingerprintCount } = await registerPetWithFingerprints({
        species: body.species,
        breed: body.breed,
        metadata: {
          pawfriend_pet_id: body.pet_id,
          pawfriend_pet_name: pet.name,
          owner_id: userId,
        },
        images: blobs,
      });

      // ── Fase 3: Update pets table (atomico, server-side) ────────────
      const quality = fingerprintCount >= 3 ? 'high' : 'low';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateErr } = await (supabase as any)
        .from('pets')
        .update({
          petify_pet_id: petifyPetId,
          petify_registered_at: new Date().toISOString(),
          petify_fingerprint_count: fingerprintCount,
          petify_quality: quality,
          nose_print_pending: false,
        })
        .eq('id', body.pet_id);

      if (updateErr) {
        // Update fallo despues de Petify OK → estado inconsistente.
        // Logueamos para soporte, pero no rollback Petify (el pet alla queda
        // registrado y sera idempotente en el siguiente intento).
        console.error('[paw-shield-register] update pets fallo post-Petify:', updateErr);
        await logEvent(supabase, {
          pet_id: body.pet_id,
          owner_id: userId,
          event_type: 'register_failed',
          petify_pet_id: petifyPetId,
          error_code: 'DB_UPDATE_FAILED',
          error_message: updateErr.message,
        });
        return new Response(
          JSON.stringify({
            status: 'partial_failure',
            petify_pet_id: petifyPetId,
            error: 'pet registered in Petify but our DB update failed. Contact support.',
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      await logEvent(supabase, {
        pet_id: body.pet_id,
        owner_id: userId,
        event_type: 'register_success',
        petify_pet_id: petifyPetId,
        fingerprint_count: fingerprintCount,
      });

      return new Response(
        JSON.stringify({
          status: 'registered',
          petify_pet_id: petifyPetId,
          fingerprint_count: fingerprintCount,
          quality,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      const isPetifyErr = err instanceof PetifyError;
      const errorCode = isPetifyErr ? err.code : null;
      const errorMessage = err instanceof Error ? err.message : String(err);

      await logEvent(supabase, {
        pet_id: body.pet_id,
        owner_id: userId,
        event_type: 'register_failed',
        error_code: errorCode,
        error_message: errorMessage.slice(0, 500),
      });

      return new Response(
        JSON.stringify({
          status: 'failed',
          error_code: errorCode,
          error: errorMessage.slice(0, 300),
        }),
        {
          status: isPetifyErr && err.status >= 400 && err.status < 500 ? 400 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  })
);
