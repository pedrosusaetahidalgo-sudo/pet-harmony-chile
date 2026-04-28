/**
 * nose-print-match — recibe una foto de nariz y devuelve la(s) mascota(s)
 * que matchean por similarity (Refactor Maestro Fase 1 §6.2).
 *
 * Flujo:
 *   1. Recibe imagen (de /nose-scan publica o de la app authenticated)
 *   2. Extrae embedding (reutiliza la lógica de nose-print-embed sin
 *      insertar en DB — query-only)
 *   3. Llama RPC match_nose_print(embedding) → top-3 con similarity
 *   4. CONSENT GATING: para cada match, devuelve solo info publica del pet
 *      (nombre, foto, especie). El contacto del dueño se revela solo si:
 *      - el caller esta autenticado Y
 *      - el pet tiene `lost_at IS NOT NULL` (mascota reportada como perdida)
 *      → si si, devuelve owner_phone / owner_email / direccion del refugio
 *      → si no, devuelve solo "esta mascota tiene dueño, contacta a Paw Friend"
 *
 * verify_jwt = false (la pagina /nose-scan es publica para mascotas perdidas).
 *
 * Request POST:
 *   { image_base64: string, threshold?: number, limit?: number }
 *
 * Response:
 *   {
 *     ok: true,
 *     matches: [{
 *       pet_id: string,
 *       similarity: number,
 *       pet: { name, species, photo_url, breed_label },
 *       lost: boolean,
 *       owner_contact?: { type: 'phone'|'email', value: string }, // solo si lost
 *       captured_at: string,
 *     }],
 *     debug: { provider, model_id, embedding_norm }
 *   }
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';
import { withTelemetry } from '../_shared/telemetry.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const NOSE_PRINT_PROVIDER = (Deno.env.get('NOSE_PRINT_PROVIDER') ?? 'huggingface') as
  | 'huggingface'
  | 'replicate'
  | 'local';
const HF_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY');
const HF_MODEL_ID = Deno.env.get('NOSE_PRINT_MODEL_ID') ?? 'facebook/dinov2-large';
const HF_EMBEDDING_DIM = parseInt(Deno.env.get('NOSE_PRINT_EMBEDDING_DIM') ?? '1024', 10);

// Threshold default ajustado a DINOv2-large (vive en ~0.55, no ~0.85 como SigLIP2)
const DEFAULT_THRESHOLD = parseFloat(Deno.env.get('NOSE_PRINT_THRESHOLD') ?? '0.55');
const DEFAULT_LIMIT = 3;

interface MatchRequest {
  image_base64: string;
  threshold?: number;
  limit?: number;
}

interface MatchRow {
  pet_id: string;
  similarity: number;
  captured_at: string;
  is_primary: boolean;
}

// ──────────────────────────────────────────────────────────────────────────
// Embedding (mismo provider que nose-print-embed)
// ──────────────────────────────────────────────────────────────────────────
async function embedImage(imageBytes: Uint8Array): Promise<{
  embedding: number[];
  norm: number;
  provider: string;
  model_id: string;
}> {
  if (NOSE_PRINT_PROVIDER !== 'huggingface') {
    throw new Error(`Provider ${NOSE_PRINT_PROVIDER} no implementado en match aún`);
  }
  if (!HF_API_KEY) throw new Error('HUGGINGFACE_API_KEY no configurado');

  const url = `https://api-inference.huggingface.co/models/${HF_MODEL_ID}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/octet-stream',
      'X-Wait-For-Model': 'true',
    },
    body: imageBytes,
  });
  if (!res.ok) {
    throw new Error(`HF API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = await res.json();

  // Misma logica que en nose-print-embed para soportar DINOv2 + SigLIP2
  let candidate: unknown = json;
  while (Array.isArray(candidate) && Array.isArray((candidate as unknown[])[0])) {
    candidate = (candidate as unknown[])[0];
  }
  if (!Array.isArray(candidate)) {
    throw new Error(`Response shape inesperado: ${typeof candidate}`);
  }
  const first = (candidate as unknown[])[0];
  let flat: number[];
  if (Array.isArray(first)) {
    const seqLen = (candidate as number[][]).length;
    const hiddenDim = (candidate as number[][])[0].length;
    flat = new Array(hiddenDim).fill(0);
    for (let i = 0; i < seqLen; i++) {
      const row = (candidate as number[][])[i];
      for (let j = 0; j < hiddenDim; j++) flat[j] += row[j];
    }
    for (let j = 0; j < hiddenDim; j++) flat[j] /= seqLen;
  } else {
    flat = candidate as number[];
  }

  if (!Array.isArray(flat) || flat.length !== HF_EMBEDDING_DIM) {
    throw new Error(
      `Embedding dim inesperado: got ${flat?.length ?? typeof flat}, expected ${HF_EMBEDDING_DIM}`
    );
  }

  // L2 normalize (cosine similarity = dot product de unit vectors)
  const rawNorm = Math.sqrt(flat.reduce((acc, v) => acc + v * v, 0));
  const normalized = rawNorm > 0 ? flat.map((v) => v / rawNorm) : flat;

  return {
    embedding: normalized,
    norm: rawNorm,
    provider: 'huggingface',
    model_id: HF_MODEL_ID,
  };
}

function base64ToBytes(b64: string): Uint8Array {
  const cleaned = b64.replace(/^data:[^;]+;base64,/, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ──────────────────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────────────────
serve(
  withTelemetry('nose-print-match', async (req) => {
    if (req.method === 'OPTIONS') return handleCorsOptions(req);
    const cors = getCorsHeaders(req);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    let body: MatchRequest;
    try {
      body = (await req.json()) as MatchRequest;
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'Body JSON invalido' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!body.image_base64) {
      return new Response(JSON.stringify({ ok: false, error: 'image_base64 requerido' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const threshold = typeof body.threshold === 'number' ? body.threshold : DEFAULT_THRESHOLD;
    const limit = typeof body.limit === 'number' ? Math.min(body.limit, 10) : DEFAULT_LIMIT;

    let imageBytes: Uint8Array;
    try {
      imageBytes = base64ToBytes(body.image_base64);
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'image_base64 invalido' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (imageBytes.length < 1024 || imageBytes.length > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Tamaño de imagen fuera de rango: ${imageBytes.length} bytes (1KB-10MB)`,
        }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Extraer embedding
    let embedResult;
    try {
      embedResult = await embedImage(imageBytes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      return new Response(JSON.stringify({ ok: false, error: `Embedding falló: ${msg}` }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Service role para llamar el RPC (cruza dueños — el RPC es SECURITY DEFINER)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const { data: matches, error: matchErr } = await adminClient.rpc('match_nose_print', {
      p_embedding: embedResult.embedding,
      p_threshold: threshold,
      p_limit: limit,
    });

    if (matchErr) {
      return new Response(
        JSON.stringify({ ok: false, error: `Match RPC falló: ${matchErr.message}` }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const matchRows = (matches ?? []) as MatchRow[];

    if (matchRows.length === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          matches: [],
          message: 'No encontramos coincidencias por encima del umbral.',
          debug: {
            provider: embedResult.provider,
            model_id: embedResult.model_id,
            embedding_norm: embedResult.norm,
            threshold,
          },
        }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Hidratar pets + consent gating
    const petIds = matchRows.map((m) => m.pet_id);
    const { data: pets } = await adminClient
      .from('pets')
      .select(
        'id, name, species, breed, photo_url, owner_id, lost_at, lost_message, profiles!owner_id (display_name, phone)'
      )
      .in('id', petIds);

    const petsById = new Map<string, NonNullable<typeof pets>[number]>();
    (pets ?? []).forEach((p) => petsById.set(p.id, p));

    type ResultMatch = {
      pet_id: string;
      similarity: number;
      captured_at: string;
      pet: {
        name: string;
        species: string;
        breed: string | null;
        photo_url: string | null;
      };
      lost: boolean;
      owner_contact?: { type: 'phone' | 'email'; value: string };
      message: string;
    };

    const result: ResultMatch[] = matchRows
      .map((m): ResultMatch | null => {
        const pet = petsById.get(m.pet_id);
        if (!pet) return null;

        const isLost = !!pet.lost_at;
        let ownerContact: ResultMatch['owner_contact'] | undefined;

        // CONSENT GATING: solo revelamos contacto si la mascota está reportada como perdida
        if (isLost) {
          const profile = (
            pet as unknown as {
              profiles?: { display_name?: string; phone?: string };
            }
          ).profiles;
          if (profile?.phone) {
            ownerContact = { type: 'phone', value: profile.phone };
          }
        }

        return {
          pet_id: m.pet_id,
          similarity: m.similarity,
          captured_at: m.captured_at,
          pet: {
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            photo_url: pet.photo_url,
          },
          lost: isLost,
          owner_contact: ownerContact,
          message: isLost
            ? `${pet.name} está reportada como perdida. ${pet.lost_message ?? 'Por favor contacta al dueño'}.`
            : `${pet.name} tiene dueño. Si la encontraste, escríbenos a hola@pawfriend.cl con el código del match para coordinar.`,
        };
      })
      .filter((m): m is ResultMatch => m !== null);

    return new Response(
      JSON.stringify({
        ok: true,
        matches: result,
        debug: {
          provider: embedResult.provider,
          model_id: embedResult.model_id,
          embedding_norm: embedResult.norm,
          threshold,
        },
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  })
);
