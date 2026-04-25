/**
 * nose-print-embed — extrae embedding biometrico de una foto de nariz.
 *
 * Refactor Maestro Fase 1 §6.2 — Pilar 1 Trinidad del Corazon.
 *
 * Provider abstraction: cambiamos de modelo via env var sin tocar nada mas.
 *   - default: huggingface (google/siglip2-base-patch16-224 → 768 dims)
 *   - fallback: replicate, local (futuro fine-tune DINOv2-large)
 *
 * Request POST:
 *   {
 *     pet_id: string,            // UUID del pet (requerido para insertar)
 *     image_base64: string,      // imagen JPEG/PNG sin prefijo data:
 *     capture_url?: string,      // URL del thumbnail en Storage (opcional)
 *     quality_score?: number,    // 0-1 del modelo de captura on-device
 *     set_as_primary?: boolean,  // default true (1ra captura del pet)
 *   }
 *
 * Response:
 *   {
 *     ok: true,
 *     nose_print_id: string,
 *     embedding_dim: 768,
 *     embedding_norm: number,
 *     provider: string,
 *     model_id: string,
 *   }
 *
 * Permisos: requiere auth (verify_jwt=true). Solo el dueño del pet puede
 * insertar (RLS lo valida).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';
import { withTelemetry } from '../_shared/telemetry.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// Provider config — env vars overridable sin redeploy
const NOSE_PRINT_PROVIDER = (Deno.env.get('NOSE_PRINT_PROVIDER') ?? 'huggingface') as
  | 'huggingface'
  | 'replicate'
  | 'local';
const HF_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY');
const HF_MODEL_ID = Deno.env.get('NOSE_PRINT_MODEL_ID') ?? 'google/siglip2-base-patch16-224';
const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');

interface EmbedRequest {
  pet_id: string;
  image_base64: string;
  capture_url?: string;
  quality_score?: number;
  set_as_primary?: boolean;
}

interface EmbedResult {
  embedding: number[];
  embedding_norm: number;
  provider: string;
  model_id: string;
}

// ──────────────────────────────────────────────────────────────────────────
// Provider implementations
// ──────────────────────────────────────────────────────────────────────────

/**
 * HuggingFace Inference API — modelo SigLIP2-base (default).
 * Devuelve embedding de 768 dims (image_features). Free tier: 30k req/mes.
 *
 * Endpoint: https://api-inference.huggingface.co/models/{model_id}
 * Para image embeddings con SigLIP2 usamos `feature-extraction` task.
 */
async function embedWithHuggingFace(imageBytes: Uint8Array): Promise<EmbedResult> {
  if (!HF_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY no configurado');
  }

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
    const errText = await res.text();
    throw new Error(`HF API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const json = await res.json();
  // HF feature-extraction puede devolver array plano o array anidado segun modelo
  const flat: number[] = Array.isArray(json[0]) ? json[0] : json;

  if (!Array.isArray(flat) || flat.length !== 768) {
    throw new Error(
      `Embedding shape inesperado: ${Array.isArray(flat) ? flat.length : typeof flat}`
    );
  }

  const norm = Math.sqrt(flat.reduce((acc, v) => acc + v * v, 0));
  return {
    embedding: flat,
    embedding_norm: norm,
    provider: 'huggingface',
    model_id: HF_MODEL_ID,
  };
}

/**
 * Replicate fallback — para cuando tengamos un modelo fine-tuneado
 * (DINOv2-large + triplet loss). Stub por ahora.
 */
async function embedWithReplicate(_imageBytes: Uint8Array): Promise<EmbedResult> {
  if (!REPLICATE_API_KEY) {
    throw new Error('REPLICATE_API_KEY no configurado');
  }
  // TODO: implementar cuando subamos modelo a Replicate.
  // Estructura del request en https://replicate.com/docs/reference/http
  throw new Error('Replicate provider aun no implementado');
}

/**
 * Local provider — para cuando hospedemos el modelo en Cloud Run / Lambda.
 * Stub por ahora.
 */
async function embedWithLocal(_imageBytes: Uint8Array): Promise<EmbedResult> {
  throw new Error('Local provider aun no implementado');
}

async function extractEmbedding(imageBytes: Uint8Array): Promise<EmbedResult> {
  switch (NOSE_PRINT_PROVIDER) {
    case 'huggingface':
      return embedWithHuggingFace(imageBytes);
    case 'replicate':
      return embedWithReplicate(imageBytes);
    case 'local':
      return embedWithLocal(imageBytes);
    default:
      throw new Error(`Provider desconocido: ${NOSE_PRINT_PROVIDER}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Helper: base64 → Uint8Array
// ──────────────────────────────────────────────────────────────────────────
function base64ToBytes(b64: string): Uint8Array {
  // strip "data:image/...;base64," si el cliente lo mando con prefijo
  const cleaned = b64.replace(/^data:[^;]+;base64,/, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ──────────────────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────────────────
serve(
  withTelemetry('nose-print-embed', async (req) => {
    if (req.method === 'OPTIONS') return handleCorsOptions(req);
    const cors = getCorsHeaders(req);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Parse body
    let body: EmbedRequest;
    try {
      body = (await req.json()) as EmbedRequest;
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'Body JSON invalido' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!body.pet_id || !body.image_base64) {
      return new Response(
        JSON.stringify({ ok: false, error: 'pet_id e image_base64 requeridos' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Auth — usar el client del usuario para que RLS valide ownership
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: 'Authorization requerido' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ ok: false, error: 'No autenticado' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Decodificar imagen
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
    let embedResult: EmbedResult;
    try {
      embedResult = await extractEmbedding(imageBytes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      return new Response(JSON.stringify({ ok: false, error: `Embedding falló: ${msg}` }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Si set_as_primary=true (default), bajar primary previos del pet
    const setPrimary = body.set_as_primary !== false;
    if (setPrimary) {
      await supabase
        .from('nose_prints')
        .update({ is_primary: false })
        .eq('pet_id', body.pet_id)
        .eq('is_primary', true);
    }

    // Insertar nuevo nose_print (RLS valida que pet_id sea del owner)
    const { data: inserted, error: insertErr } = await supabase
      .from('nose_prints')
      .insert({
        pet_id: body.pet_id,
        embedding: embedResult.embedding,
        embedding_norm: embedResult.embedding_norm,
        provider: embedResult.provider,
        model_id: embedResult.model_id,
        capture_url: body.capture_url ?? null,
        quality_score: body.quality_score ?? null,
        captured_by_user_id: user.id,
        is_primary: setPrimary,
      })
      .select('id')
      .single();

    if (insertErr) {
      return new Response(
        JSON.stringify({ ok: false, error: `DB insert falló: ${insertErr.message}` }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        nose_print_id: inserted.id,
        embedding_dim: embedResult.embedding.length,
        embedding_norm: embedResult.embedding_norm,
        provider: embedResult.provider,
        model_id: embedResult.model_id,
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  })
);
