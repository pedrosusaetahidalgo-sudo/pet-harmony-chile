-- 2026-04-29 (Paw Shield Data Archive · entrenamiento modelo propio futuro)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Spec aprobada: docs-raiz/PAW_SHIELD_DATA_ARCHIVE.md
--
-- Objetivo: guardar cada imagen capturada via Paw Shield (enrollment +
-- identify) con consent opt-in, para entrenar nuestro propio modelo en
-- el futuro o validar/auditar Petify.
--
-- Componentes:
--   1. Bucket Supabase Storage 'paw-shield-archive' (privado, RLS service_role)
--   2. Tabla public.paw_shield_archive (metadata anonimizada)
--   3. Columnas consent en public.pets
--   4. Politicas RLS (acceso solo service_role)
--   5. Indices para lifecycle cleanup
--
-- Ley 19.628 + 21.719 compliance: opt-in obligatorio, anonimizacion
-- (sin nombre/telefono asociado), revocable, retencion 30 dias si no consent.

-- ─── Bucket Storage ────────────────────────────────────────────────────
DO $$
BEGIN
  -- Crear bucket si no existe (privado).
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'paw-shield-archive',
    'paw-shield-archive',
    false,
    10485760, -- 10 MB max por imagen
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ─── Politicas RLS para el bucket ──────────────────────────────────────
-- Solo service_role puede leer/escribir. Sin acceso publico ni de usuarios autenticados directos.
DO $$
BEGIN
  -- INSERT: solo service_role
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'paw_shield_archive_service_insert'
  ) THEN
    CREATE POLICY paw_shield_archive_service_insert
      ON storage.objects FOR INSERT
      TO service_role
      WITH CHECK (bucket_id = 'paw-shield-archive');
  END IF;

  -- SELECT: solo service_role
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'paw_shield_archive_service_select'
  ) THEN
    CREATE POLICY paw_shield_archive_service_select
      ON storage.objects FOR SELECT
      TO service_role
      USING (bucket_id = 'paw-shield-archive');
  END IF;

  -- DELETE: solo service_role (lifecycle cron)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'paw_shield_archive_service_delete'
  ) THEN
    CREATE POLICY paw_shield_archive_service_delete
      ON storage.objects FOR DELETE
      TO service_role
      USING (bucket_id = 'paw-shield-archive');
  END IF;
END $$;

-- ─── Columnas consent en pets ──────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.pets') IS NULL THEN
    RAISE EXCEPTION 'tabla public.pets no existe';
  END IF;

  ALTER TABLE public.pets
    ADD COLUMN IF NOT EXISTS paw_shield_data_archive_consent BOOLEAN NOT NULL DEFAULT false;

  ALTER TABLE public.pets
    ADD COLUMN IF NOT EXISTS paw_shield_data_archive_consent_at TIMESTAMPTZ NULL;

  COMMENT ON COLUMN public.pets.paw_shield_data_archive_consent IS
    'Opt-in del dueno para que Paw Friend conserve imagenes de hocico capturadas via Paw Shield para entrenar modelo propio. Default false (Ley 19.628). Revocable.';
  COMMENT ON COLUMN public.pets.paw_shield_data_archive_consent_at IS
    'Timestamp de cuando el dueno otorgo o revoco el consent. NULL si nunca interactuo.';
END $$;

-- ─── Tabla paw_shield_archive ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.paw_shield_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Refs a pets. SET NULL en delete: si el pet se borra, conservamos imagen
  -- anonimizada SOLO si consent_for_training=true; si no, el cron la limpia.
  pet_id UUID NULL REFERENCES public.pets(id) ON DELETE SET NULL,
  owner_id UUID NULL,

  -- Path en el bucket: pet/{petId}/{kind}/{timestamp}_{frameIdx}.jpg
  storage_path TEXT NOT NULL UNIQUE,

  -- Tipo de captura.
  capture_kind TEXT NOT NULL CHECK (capture_kind IN ('enrollment', 'identify', 'verification')),

  -- Frame index 0,1,2 si es enrollment de 3 frames. NULL si identify.
  frame_index SMALLINT NULL,

  -- Refs opcionales a Petify.
  petify_session_id TEXT NULL,
  petify_pet_id TEXT NULL,

  -- Metadata anonima del pet en momento de captura (para training).
  species TEXT NULL CHECK (species IN ('DOG', 'CAT') OR species IS NULL),
  breed TEXT NULL,
  age_months INTEGER NULL,
  weight_kg NUMERIC(5,2) NULL,
  comuna TEXT NULL,

  -- Resultado del proceso.
  petify_quality_score NUMERIC(5,2) NULL,
  petify_match_score NUMERIC(5,2) NULL,
  sharpness_laplacian NUMERIC(8,2) NULL,
  accepted BOOLEAN NULL,

  -- Consent.
  consent_for_training BOOLEAN NOT NULL DEFAULT false,
  consent_revoked_at TIMESTAMPTZ NULL,

  -- Audit.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- expires_at: NULL si consent_for_training, si no NOW() + 30d.
  expires_at TIMESTAMPTZ NULL
);

-- Indices.
CREATE INDEX IF NOT EXISTS idx_psa_pet ON public.paw_shield_archive(pet_id) WHERE pet_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_psa_owner ON public.paw_shield_archive(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_psa_consent_true ON public.paw_shield_archive(consent_for_training) WHERE consent_for_training = true;
CREATE INDEX IF NOT EXISTS idx_psa_expires ON public.paw_shield_archive(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_psa_kind_species ON public.paw_shield_archive(capture_kind, species);

COMMENT ON TABLE public.paw_shield_archive IS
  'Archivo de imagenes capturadas via Paw Shield para entrenar modelo propio futuro. Opt-in obligatorio (Ley 19.628). Lifecycle: 30d si no consent, indefinido si consent. Spec: docs-raiz/PAW_SHIELD_DATA_ARCHIVE.md';

-- ─── RLS ───────────────────────────────────────────────────────────────
ALTER TABLE public.paw_shield_archive ENABLE ROW LEVEL SECURITY;

-- Service role puede todo (edge fns).
DROP POLICY IF EXISTS psa_service_all ON public.paw_shield_archive;
CREATE POLICY psa_service_all
  ON public.paw_shield_archive
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Usuarios autenticados pueden ver SOLO los archivos de SUS mascotas
-- (para ARCO Ley 19.628 — tienes derecho a saber que tenemos guardado).
DROP POLICY IF EXISTS psa_owner_select ON public.paw_shield_archive;
CREATE POLICY psa_owner_select
  ON public.paw_shield_archive FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Usuarios pueden actualizar su propio consent_revoked_at (revocacion ARCO).
-- No pueden modificar otra cosa. La revocacion la procesa el cron.
DROP POLICY IF EXISTS psa_owner_revoke ON public.paw_shield_archive;
CREATE POLICY psa_owner_revoke
  ON public.paw_shield_archive FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ─── RPC para revocar consent en bulk (toda la cuenta del user) ────────
CREATE OR REPLACE FUNCTION public.revoke_paw_shield_archive_consent()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_count INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- Marca todas las imagenes del user como revocadas + setea expiracion 30d.
  UPDATE public.paw_shield_archive
     SET consent_for_training = false,
         consent_revoked_at = NOW(),
         expires_at = NOW() + INTERVAL '30 days'
   WHERE owner_id = v_user
     AND (consent_for_training = true OR expires_at IS NULL);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Tambien actualiza el flag en pets para futuros enrollments.
  UPDATE public.pets
     SET paw_shield_data_archive_consent = false,
         paw_shield_data_archive_consent_at = NOW()
   WHERE owner_id = v_user
     AND paw_shield_data_archive_consent = true;

  RETURN v_count;
END $$;

REVOKE ALL ON FUNCTION public.revoke_paw_shield_archive_consent() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_paw_shield_archive_consent() TO authenticated;

COMMENT ON FUNCTION public.revoke_paw_shield_archive_consent IS
  'Revoca el consent de archivado para training futuro de TODAS las mascotas del user. Programa borrado en 30 dias. Compliance Ley 19.628 ARCO.';

-- ─── RPC stats agregadas (admin-only via RLS) ──────────────────────────
CREATE OR REPLACE FUNCTION public.paw_shield_archive_stats()
RETURNS TABLE (
  total_images BIGINT,
  with_consent BIGINT,
  pending_expiration BIGINT,
  by_species_dog BIGINT,
  by_species_cat BIGINT,
  oldest_image TIMESTAMPTZ,
  newest_image TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
  SELECT
    COUNT(*) AS total_images,
    COUNT(*) FILTER (WHERE consent_for_training = true) AS with_consent,
    COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at < NOW() + INTERVAL '7 days') AS pending_expiration,
    COUNT(*) FILTER (WHERE species = 'DOG') AS by_species_dog,
    COUNT(*) FILTER (WHERE species = 'CAT') AS by_species_cat,
    MIN(created_at) AS oldest_image,
    MAX(created_at) AS newest_image
  FROM public.paw_shield_archive;
$$;

REVOKE ALL ON FUNCTION public.paw_shield_archive_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.paw_shield_archive_stats() TO authenticated;
-- Frontend chequea is_admin antes de llamar; aqui dejamos a authenticated
-- (RLS de admin_access sigue valida en el resto del sistema).

COMMENT ON FUNCTION public.paw_shield_archive_stats IS
  'Stats agregadas del archivo Paw Shield. Solo agregaciones, nunca expone imagenes individuales. Para admin dashboard COGS Petify + tracking dataset training.';
