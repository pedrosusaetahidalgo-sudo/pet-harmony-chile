-- ══════════════════════════════════════════════════════════════════════════
-- Nose Print System — biometria identitaria de la mascota (Fase 1 Pilar 1)
-- ══════════════════════════════════════════════════════════════════════════
-- Refactor Maestro 2026-04-23 §6.2.
--
-- Tabla productiva de embeddings biometricos. Diferente de
-- nose_print_test_sessions (que es para crowdsourcing de fotos de validacion).
--
-- Esquema clave:
--   - VECTOR(768) porque SigLIP2-base devuelve 768 dims (modelo elegido tras
--     test empirico: 0.923 mean, ver memoria 2026-04-24 + commit 971b6f2d).
--   - HNSW index con vector_cosine_ops para similarity search rapida.
--   - Provider abstraido (`provider` + `model_version`) para soportar
--     migracion a otro modelo sin perder el historial.
--   - Solo 1 nose print "primary" activo por mascota; el resto queda como
--     historial (re-capturas para mejorar quality o para tracking de cambios
--     en la nariz con la edad).
--
-- Aplicar manualmente desde Supabase Dashboard > SQL Editor.
-- Pre-requisito: pgvector habilitado en Dashboard > Extensions.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. pgvector (idempotente; el plan §14.2 dice que Pedro ya lo habilito
--    en Dashboard, esta linea es safety net)
CREATE EXTENSION IF NOT EXISTS vector;

-- 1.1. Campos de "mascota perdida" en pets (para consent gating de
--      nose-print-match: solo si lost_at IS NOT NULL revelamos contacto del
--      dueño a quien encuentre el animal).
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS lost_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lost_message TEXT,
  ADD COLUMN IF NOT EXISTS lost_location TEXT;

CREATE INDEX IF NOT EXISTS idx_pets_lost_at
  ON public.pets(lost_at)
  WHERE lost_at IS NOT NULL;

-- 2. Tabla principal
CREATE TABLE IF NOT EXISTS public.nose_prints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,

  -- Embedding biometrico
  embedding VECTOR(768) NOT NULL,
  embedding_norm REAL,                      -- L2 norm (debug + quality check)

  -- Provider abstraction (clave para migracion futura)
  provider TEXT NOT NULL DEFAULT 'huggingface'
    CHECK (provider IN ('huggingface', 'petnow', 'local', 'replicate')),
  model_id TEXT NOT NULL DEFAULT 'google/siglip2-base-patch16-224',
  model_version TEXT,                       -- ej: 'v1.0' o git sha del modelo

  -- Captura
  capture_url TEXT,                         -- thumbnail (Storage)
  quality_score REAL CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 1)),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  captured_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Estado
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  -- 1 primary por pet; el resto es historial (re-capturas)

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indice unico parcial: solo 1 primary por mascota
CREATE UNIQUE INDEX IF NOT EXISTS uniq_nose_print_primary_per_pet
  ON public.nose_prints(pet_id) WHERE is_primary = TRUE;

-- Indice HNSW para similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_nose_prints_embedding_hnsw
  ON public.nose_prints
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_nose_prints_pet_id
  ON public.nose_prints(pet_id);

CREATE INDEX IF NOT EXISTS idx_nose_prints_captured_at
  ON public.nose_prints(captured_at DESC);

-- 3. RLS
ALTER TABLE public.nose_prints ENABLE ROW LEVEL SECURITY;

-- Owner puede gestionar nose prints de sus mascotas
DROP POLICY IF EXISTS "Owner can manage own pet nose prints" ON public.nose_prints;
CREATE POLICY "Owner can manage own pet nose prints"
  ON public.nose_prints
  FOR ALL
  TO authenticated
  USING (
    pet_id IN (
      SELECT id FROM public.pets WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    pet_id IN (
      SELECT id FROM public.pets WHERE owner_id = auth.uid()
    )
  );

-- Vet con acceso al pet (via pet_vet_links) puede leer nose prints
DROP POLICY IF EXISTS "Vet with link can read pet nose prints" ON public.nose_prints;
CREATE POLICY "Vet with link can read pet nose prints"
  ON public.nose_prints
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pet_vet_links pvl
      WHERE pvl.pet_id = nose_prints.pet_id
        AND pvl.vet_user_id = auth.uid()
        AND pvl.status = 'active'
    )
  );

-- IMPORTANTE: NO hay policy SELECT publica directa sobre la tabla. El match
-- solo se hace via RPC match_nose_print() que es SECURITY DEFINER y devuelve
-- pet_id + similarity, sin exponer el embedding ni datos del dueño.

-- 4. RPC: matching seguro
-- Recibe un embedding y devuelve top matches (pet_id + similarity).
-- SECURITY DEFINER porque tiene que leer toda la tabla, pero solo expone
-- pet_id y similarity (no embedding ni metadata sensible).
CREATE OR REPLACE FUNCTION public.match_nose_print(
  p_embedding VECTOR(768),
  p_threshold REAL DEFAULT 0.85,
  p_limit INT DEFAULT 3
)
RETURNS TABLE (
  pet_id UUID,
  similarity REAL,
  captured_at TIMESTAMPTZ,
  is_primary BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    np.pet_id,
    (1 - (np.embedding <=> p_embedding))::REAL AS similarity,
    np.captured_at,
    np.is_primary
  FROM public.nose_prints np
  WHERE (1 - (np.embedding <=> p_embedding)) > p_threshold
  ORDER BY np.embedding <=> p_embedding ASC
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.match_nose_print(VECTOR, REAL, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_nose_print(VECTOR, REAL, INT)
  TO authenticated, anon;
-- anon: para que /nose-scan publica funcione sin login (mascota perdida)

COMMENT ON FUNCTION public.match_nose_print IS
  'Similarity search sobre nose_prints. SECURITY DEFINER porque el match cruza dueños. Solo devuelve pet_id + similarity (sin embedding ni metadata). El detalle del pet (contacto del dueño) se revela via edge fn nose-print-match con consent gating.';

-- 5. RPC: marcar nose print como primary (single transaction safety)
CREATE OR REPLACE FUNCTION public.set_nose_print_primary(
  p_nose_print_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pet_id UUID;
  v_owner_id UUID;
BEGIN
  -- Lookup pet + verificar permiso del caller
  SELECT np.pet_id, p.owner_id INTO v_pet_id, v_owner_id
    FROM public.nose_prints np
    JOIN public.pets p ON p.id = np.pet_id
    WHERE np.id = p_nose_print_id;

  IF v_pet_id IS NULL THEN
    RAISE EXCEPTION 'Nose print no existe';
  END IF;

  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Atomic: bajar todos los primary del pet, luego subir el target
  UPDATE public.nose_prints
    SET is_primary = FALSE
    WHERE pet_id = v_pet_id AND is_primary = TRUE;

  UPDATE public.nose_prints
    SET is_primary = TRUE
    WHERE id = p_nose_print_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_nose_print_primary(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_nose_print_primary(UUID) TO authenticated;

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- Smoke test (regla 9.2.1)
-- ══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_pgvector_installed BOOLEAN;
  v_table_exists BOOLEAN;
  v_match_fn_exists BOOLEAN;
  v_set_primary_fn_exists BOOLEAN;
  v_lost_at_exists BOOLEAN;
BEGIN
  -- 1. pgvector instalado
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) INTO v_pgvector_installed;
  IF NOT v_pgvector_installed THEN
    RAISE EXCEPTION 'pgvector no esta instalado. Habilitar en Dashboard > Database > Extensions';
  END IF;

  -- 2. Tabla nose_prints creada
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'nose_prints'
  ) INTO v_table_exists;
  IF NOT v_table_exists THEN
    RAISE EXCEPTION 'Tabla nose_prints no se creo';
  END IF;

  -- 3. Columnas lost_* en pets
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pets'
      AND column_name = 'lost_at'
  ) INTO v_lost_at_exists;
  IF NOT v_lost_at_exists THEN
    RAISE EXCEPTION 'pets.lost_at no se agrego';
  END IF;

  -- 4. Functions creadas
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'match_nose_print'
  ) INTO v_match_fn_exists;
  IF NOT v_match_fn_exists THEN
    RAISE EXCEPTION 'Function match_nose_print no se creo';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_nose_print_primary'
  ) INTO v_set_primary_fn_exists;
  IF NOT v_set_primary_fn_exists THEN
    RAISE EXCEPTION 'Function set_nose_print_primary no se creo';
  END IF;

  RAISE NOTICE 'Smoke test OK: pgvector + nose_prints + lost_* en pets + 2 RPCs creados';
END $$;
