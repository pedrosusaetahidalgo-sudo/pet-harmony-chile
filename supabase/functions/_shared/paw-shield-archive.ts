/**
 * paw-shield-archive.ts — Helper compartido para archivar imagenes de Paw Shield.
 *
 * Spec: docs-raiz/PAW_SHIELD_DATA_ARCHIVE.md
 *
 * Sube imagenes capturadas (enrollment + identify) al bucket privado
 * `paw-shield-archive` y registra metadata en `paw_shield_archive` table.
 * Best-effort: si el archivado falla, NO bloquea el flujo principal de Paw Shield.
 *
 * Lifecycle:
 *   - Si consent_for_training=true → expires_at NULL (preservacion indefinida).
 *   - Si consent_for_training=false → expires_at = NOW() + 30d (cron cleanup).
 *
 * Privacidad:
 *   - Bucket privado, RLS solo service_role.
 *   - Metadata anonimizada (sin nombre dueno, sin telefono, sin email).
 *   - Si pet se borra: pet_id queda NULL pero imagen anonimizada se preserva
 *     SI consent=true; si no, cron la limpia.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BUCKET = 'paw-shield-archive';
const RETENTION_NO_CONSENT_DAYS = 30;

export type CaptureKind = 'enrollment' | 'identify' | 'verification';

export interface ArchiveImageInput {
  /** Blob de la imagen JPEG/PNG. */
  imageBlob: Blob;
  /** UUID del pet en pets.id. NULL si es identify publico sin pet asociado. */
  petId: string | null;
  /** UUID del owner. NULL si es identify publico. */
  ownerId: string | null;
  /** Tipo de captura. */
  captureKind: CaptureKind;
  /** Indice del frame (0,1,2 para enrollment de 3 frames). NULL para identify. */
  frameIndex?: number | null;
  /** Sesion Petify si aplica. */
  petifySessionId?: string | null;
  /** Pet ID en Petify si aplica. */
  petifyPetId?: string | null;
  /** Especie. */
  species?: 'DOG' | 'CAT' | null;
  /** Raza si se conoce en momento de captura. */
  breed?: string | null;
  /** Edad en meses para training cohort. */
  ageMonths?: number | null;
  /** Peso. */
  weightKg?: number | null;
  /** Comuna del owner. */
  comuna?: string | null;
  /** Score de calidad reportado por Petify. */
  petifyQualityScore?: number | null;
  /** Score del match si es identify. */
  petifyMatchScore?: number | null;
  /** Sharpness propio (Laplacian variance). */
  sharpnessLaplacian?: number | null;
  /** True si paso threshold de calidad. */
  accepted?: boolean | null;
  /** Consent del owner para training futuro. Default false. */
  consentForTraining: boolean;
}

export interface ArchiveResult {
  archiveId: string;
  storagePath: string;
}

/**
 * Genera path unico en el bucket.
 * Format: pet/{petId}/{kind}/{timestamp}_{frameIdx}.jpg
 *         identify/{timestamp}_{random}.jpg  (si no hay petId)
 */
function buildStoragePath(input: ArchiveImageInput): string {
  const ts = Date.now();
  const frame = typeof input.frameIndex === 'number' ? `_f${input.frameIndex}` : '';
  if (input.petId) {
    return `pet/${input.petId}/${input.captureKind}/${ts}${frame}.jpg`;
  }
  // Identify publico sin pet asociado.
  const rand = Math.random().toString(36).slice(2, 10);
  return `${input.captureKind}/${ts}_${rand}${frame}.jpg`;
}

/**
 * Sube una imagen al archivo Paw Shield + registra metadata.
 *
 * @returns archiveId + storagePath si exito · null si fallo (best-effort,
 *          el caller no debe abortar su flujo principal por este fallo).
 */
export async function archivePawShieldImage(
  supabase: ReturnType<typeof createClient>,
  input: ArchiveImageInput
): Promise<ArchiveResult | null> {
  try {
    const storagePath = buildStoragePath(input);

    // 1. Subir al bucket.
    const arrayBuffer = await input.imageBlob.arrayBuffer();
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType: input.imageBlob.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadErr) {
      console.warn('[paw-shield-archive] upload fallo:', uploadErr.message);
      return null;
    }

    // 2. Insertar registro de metadata.
    const expiresAt = input.consentForTraining
      ? null
      : new Date(Date.now() + RETENTION_NO_CONSENT_DAYS * 86400_000).toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error: insertErr } = await (supabase as any)
      .from('paw_shield_archive')
      .insert({
        pet_id: input.petId,
        owner_id: input.ownerId,
        storage_path: storagePath,
        capture_kind: input.captureKind,
        frame_index: input.frameIndex ?? null,
        petify_session_id: input.petifySessionId ?? null,
        petify_pet_id: input.petifyPetId ?? null,
        species: input.species ?? null,
        breed: input.breed ?? null,
        age_months: input.ageMonths ?? null,
        weight_kg: input.weightKg ?? null,
        comuna: input.comuna ?? null,
        petify_quality_score: input.petifyQualityScore ?? null,
        petify_match_score: input.petifyMatchScore ?? null,
        sharpness_laplacian: input.sharpnessLaplacian ?? null,
        accepted: input.accepted ?? null,
        consent_for_training: input.consentForTraining,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (insertErr || !row) {
      // Insert fallo despues de upload OK. Limpiamos el archivo huerfano.
      console.warn('[paw-shield-archive] insert metadata fallo:', insertErr?.message);
      await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
      return null;
    }

    return { archiveId: row.id, storagePath };
  } catch (err) {
    console.warn('[paw-shield-archive] error catch-all:', err);
    return null;
  }
}

/**
 * Carga el metadata anonimizado del pet (especie, raza, edad, peso, comuna)
 * para enriquecer el archive. Best-effort.
 */
export async function loadPetMetadataForArchive(
  supabase: ReturnType<typeof createClient>,
  petId: string
): Promise<{
  species?: 'DOG' | 'CAT' | null;
  breed?: string | null;
  ageMonths?: number | null;
  weightKg?: number | null;
  comuna?: string | null;
  consentForTraining: boolean;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pet } = await (supabase as any)
      .from('pets')
      .select(
        'species, breed, birthdate, weight_kg, owner_id, paw_shield_data_archive_consent'
      )
      .eq('id', petId)
      .maybeSingle();

    if (!pet) return { consentForTraining: false };

    let comuna: string | null = null;
    if (pet.owner_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('comuna')
        .eq('id', pet.owner_id)
        .maybeSingle();
      comuna = profile?.comuna ?? null;
    }

    let ageMonths: number | null = null;
    if (pet.birthdate) {
      const birth = new Date(pet.birthdate);
      const now = new Date();
      ageMonths = Math.max(
        0,
        (now.getFullYear() - birth.getFullYear()) * 12 +
          (now.getMonth() - birth.getMonth())
      );
    }

    // Normalizar species a DOG/CAT.
    const sp = String(pet.species ?? '').toLowerCase();
    const species: 'DOG' | 'CAT' | null = sp.includes('perro') || sp === 'dog'
      ? 'DOG'
      : sp.includes('gato') || sp === 'cat'
      ? 'CAT'
      : null;

    return {
      species,
      breed: pet.breed ?? null,
      ageMonths,
      weightKg: pet.weight_kg ?? null,
      comuna,
      consentForTraining: !!pet.paw_shield_data_archive_consent,
    };
  } catch (err) {
    console.warn('[paw-shield-archive] loadPetMetadata fallo:', err);
    return { consentForTraining: false };
  }
}
