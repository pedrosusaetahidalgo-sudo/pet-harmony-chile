/**
 * petify-client.ts — Cliente compartido de Petify (PetNow) B2B API V2.
 *
 * Usado por las edge fns:
 *   - paw-shield-register: register flow (create pet + 3 fingerprints).
 *   - paw-shield-identify: identify 1:N (match contra base).
 *
 * Contrato API (validado contra docs.petnow.io/petify/docs el 2026-04-29):
 *   - Auth: header `x-petnow-api-key` con la API key.
 *   - Base URL: PETIFY_BASE_URL env (default staging).
 *   - V2 requiere capture-session previa. PROFILE_REGISTRATION + VERIFICATION
 *     necesitan petId en la session; IDENTIFICATION no.
 *   - Upload es multipart/form-data con campo `file` y sessionId en query.
 *   - Jobs son async: se devuelve jobId, hay que poll cada 2-3s hasta SUCCESS.
 *
 * Memoria: project_petify_integration.md (decisiones de arquitectura).
 */

const PETIFY_BASE_URL = Deno.env.get('PETIFY_BASE_URL') ?? 'https://api.stage-b2b.petnow.io';
const PETIFY_API_KEY = Deno.env.get('PETIFY_API_KEY');

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;

// ── Types ────────────────────────────────────────────────────────────

export type PetifySpecies = 'DOG' | 'CAT';
export type PetifyPurpose =
  | 'PET_PROFILE_REGISTRATION'
  | 'PET_VERIFICATION'
  | 'PET_IDENTIFICATION';

export interface PetifyPetMatch {
  /** UUID del pet en Petify. */
  id: string;
  /** Score 0-100 (higher = better match). */
  score: number;
  /** JSON string con metadata que pasamos al crear el pet. */
  metadata: string;
}

export class PetifyError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | null,
    message: string
  ) {
    super(message);
    this.name = 'PetifyError';
  }
}

// ── Internal HTTP helper ─────────────────────────────────────────────

async function petifyRequest<T = unknown>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: BodyInit | null,
  contentType?: string
): Promise<T> {
  if (!PETIFY_API_KEY) {
    throw new PetifyError(500, null, 'PETIFY_API_KEY env var no esta configurada');
  }

  const headers: Record<string, string> = { 'x-petnow-api-key': PETIFY_API_KEY };
  if (contentType) headers['Content-Type'] = contentType;

  const res = await fetch(`${PETIFY_BASE_URL}${path}`, { method, headers, body });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* response no era JSON */
  }

  if (!res.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorCode = (parsed as any)?.errors?.[0]?.code ?? null;
    throw new PetifyError(
      res.status,
      errorCode,
      `${method} ${path} → ${res.status}: ${text.slice(0, 300)}`
    );
  }
  return parsed as T;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Crea una capture-session V2.
 * Para PROFILE_REGISTRATION y VERIFICATION es OBLIGATORIO pasar petId.
 * Para IDENTIFICATION no se pasa (es 1:N contra toda la base del vendor).
 */
export async function createCaptureSession(
  species: PetifySpecies,
  purpose: PetifyPurpose,
  petId?: string
): Promise<string> {
  const body: Record<string, string> = { species, purpose };
  if (petId) body.petId = petId;

  const result = await petifyRequest<{ data: { id: string } }>(
    'POST',
    '/v2/capture-sessions',
    JSON.stringify(body),
    'application/json'
  );
  const sessionId = result?.data?.id;
  if (!sessionId) {
    throw new PetifyError(500, null, `capture-session sin id: ${JSON.stringify(result)}`);
  }
  return sessionId;
}

/**
 * Sube una imagen a una session existente.
 * El blob debe ser image/jpeg o image/png con el hocico visible.
 */
export async function uploadFingerprint(sessionId: string, image: Blob): Promise<void> {
  const form = new FormData();
  form.append('file', image, 'fingerprint.jpg');

  await petifyRequest<{ data: { id: string } }>(
    'POST',
    `/v2/fingerprints:upload?sessionId=${encodeURIComponent(sessionId)}`,
    form
    // No content-type: el browser/fetch arma multipart/form-data con boundary auto.
  );
}

/**
 * Crea un pet en Petify.
 * `metadata` es un JSON string libre — usamos para guardar referencias internas
 * (ej: pawfriend_pet_id) y poder cruzarlo en identify responses.
 */
export async function createPet(opts: {
  species: PetifySpecies;
  breed?: string;
  metadata: Record<string, unknown>;
}): Promise<string> {
  const result = await petifyRequest<{ data: { id: string } }>(
    'POST',
    '/v2/pets',
    JSON.stringify({
      species: opts.species,
      breed: opts.breed,
      metadata: JSON.stringify(opts.metadata),
    }),
    'application/json'
  );
  const petId = result?.data?.id;
  if (!petId) {
    throw new PetifyError(500, null, `pets POST sin id: ${JSON.stringify(result)}`);
  }
  return petId;
}

/**
 * Borra un pet en Petify (cleanup, dueño elimina cuenta, GDPR/ARCO, etc).
 * Petify excluye del billing en el siguiente ciclo.
 */
export async function deletePet(petifyPetId: string): Promise<void> {
  await petifyRequest('DELETE', `/v2/pets/${encodeURIComponent(petifyPetId)}`);
}

/**
 * Attacha los fingerprints subidos a una session a un pet existente.
 * Devuelve jobId para polling. Los fingerprints se procesan async (~5-15 seg).
 */
export async function addFingerprintsToPet(
  petifyPetId: string,
  sessionId: string
): Promise<string> {
  const result = await petifyRequest<{ data: { jobId: string } }>(
    'POST',
    `/v2/pets/${encodeURIComponent(petifyPetId)}:addFingerprints`,
    JSON.stringify({ sessionId }),
    'application/json'
  );
  const jobId = result?.data?.jobId;
  if (!jobId) {
    throw new PetifyError(500, null, `addFingerprints sin jobId`);
  }
  return jobId;
}

/**
 * Identify 1:N: busca matches contra TODA la base del vendor.
 * `sessionId` debe ser de purpose=PET_IDENTIFICATION (sin petId).
 * Devuelve jobId para polling.
 */
export async function identifyPets(sessionId: string): Promise<string> {
  const result = await petifyRequest<{ data: { jobId: string } }>(
    'POST',
    '/v2/pets:identify',
    JSON.stringify({ sessionId }),
    'application/json'
  );
  const jobId = result?.data?.jobId;
  if (!jobId) {
    throw new PetifyError(500, null, `identify sin jobId`);
  }
  return jobId;
}

/**
 * Polling generico de jobs.
 * `kind` mapea al endpoint:
 *   - 'fingerprint-addition' → /v2/fingerprint-addition-jobs/{jobId}
 *   - 'identification'       → /v2/identification-jobs/{jobId}
 *   - 'verification'         → /v2/verification-jobs/{jobId}
 */
export async function pollJob<T = unknown>(
  kind: 'fingerprint-addition' | 'identification' | 'verification',
  jobId: string
): Promise<T> {
  const path = `/v2/${kind}-jobs/${encodeURIComponent(jobId)}`;
  const start = Date.now();

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const result = await petifyRequest<{ data: { status: string } & T }>('GET', path);
    const status = result?.data?.status;
    if (status === 'SUCCESS') return result.data;
    if (status === 'FAILED') {
      throw new PetifyError(500, null, `Job ${jobId} (${kind}) FAILED: ${JSON.stringify(result)}`);
    }
  }
  throw new PetifyError(504, null, `Job ${jobId} (${kind}) timeout despues de ${POLL_TIMEOUT_MS}ms`);
}

/**
 * Helper: identifica una imagen de hocico contra la base.
 * Internamente: createSession → upload → identify → poll.
 * Retorna el array de matches (sorted desc by score).
 */
export async function identifyByImage(
  species: PetifySpecies,
  image: Blob
): Promise<PetifyPetMatch[]> {
  const sessionId = await createCaptureSession(species, 'PET_IDENTIFICATION');
  await uploadFingerprint(sessionId, image);
  const jobId = await identifyPets(sessionId);
  const jobResult = await pollJob<{ pets: PetifyPetMatch[] }>('identification', jobId);
  return jobResult.pets ?? [];
}

/**
 * Helper: registra un pet con multiples fingerprints en una sola operacion.
 * Internamente: createPet → createSession(REG) → upload[*] → addFingerprints → poll.
 */
export async function registerPetWithFingerprints(opts: {
  species: PetifySpecies;
  breed?: string;
  metadata: Record<string, unknown>;
  images: Blob[];
}): Promise<{ petifyPetId: string; fingerprintCount: number }> {
  if (opts.images.length === 0) {
    throw new PetifyError(400, null, 'registerPet requiere al menos 1 imagen');
  }

  const petifyPetId = await createPet({
    species: opts.species,
    breed: opts.breed,
    metadata: opts.metadata,
  });

  // Si falla algo despues de createPet, intentamos cleanup para no dejar pets huerfanos.
  try {
    const sessionId = await createCaptureSession(opts.species, 'PET_PROFILE_REGISTRATION', petifyPetId);
    for (const img of opts.images) {
      await uploadFingerprint(sessionId, img);
    }
    const jobId = await addFingerprintsToPet(petifyPetId, sessionId);
    await pollJob('fingerprint-addition', jobId);
    return { petifyPetId, fingerprintCount: opts.images.length };
  } catch (err) {
    // Best-effort cleanup. Si cleanup falla, log + propaga el error original.
    try {
      await deletePet(petifyPetId);
    } catch (cleanupErr) {
      console.error(`[petify-client] cleanup post-error fallo:`, cleanupErr);
    }
    throw err;
  }
}
