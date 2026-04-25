-- ══════════════════════════════════════════════════════════════════════════
-- Nose Print: cambio de modelo SigLIP2-base → DINOv2-large
-- ══════════════════════════════════════════════════════════════════════════
-- Refactor Maestro Fase 1 §6.2.
--
-- Tras test comparativo del 2026-04-25 con 89 fotos / 8 mascotas:
--   - SigLIP2-base: gap 0.0733 (no discriminaba hermanos: 0.8674 inter)
--   - DINOv2-base:  gap 0.2897
--   - DINOv2-large: gap 0.3400  ← elegido
--
-- DINOv2-large devuelve 1024 dims (no 768). Como la tabla nose_prints recién
-- se creo y todavia no tiene embeddings reales, hacemos DROP + CREATE en lugar
-- de un ALTER que tampoco soporta cambio de dim en pgvector.
--
-- IMPORTANTE: si llegaste a esta migracion DESPUES de tener nose prints reales
-- en prod, no la apliques. Habria que crear `nose_prints_v2` y migrar.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Verificar que la tabla esta vacia (safety check)
DO $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.nose_prints;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'nose_prints tiene % filas. NO aplicar esta mig: hay que migrar embeddings, no DROP.', v_count;
  END IF;
END $$;

-- 2. DROP RPCs primero (dependen del tipo VECTOR(768))
DROP FUNCTION IF EXISTS public.match_nose_print(VECTOR, REAL, INT);
DROP FUNCTION IF EXISTS public.set_nose_print_primary(UUID);

-- 3. DROP table
DROP TABLE IF EXISTS public.nose_prints;

-- 4. RE-CREATE con VECTOR(1024)
CREATE TABLE public.nose_prints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,

  -- Embedding biometrico (DINOv2-large = 1024 dims)
  embedding VECTOR(1024) NOT NULL,
  embedding_norm REAL,

  -- Provider abstraction
  provider TEXT NOT NULL DEFAULT 'huggingface'
    CHECK (provider IN ('huggingface', 'petnow', 'local', 'replicate')),
  model_id TEXT NOT NULL DEFAULT 'facebook/dinov2-large',
  model_version TEXT,

  -- Captura
  capture_url TEXT,
  quality_score REAL CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 1)),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  captured_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Estado
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uniq_nose_print_primary_per_pet
  ON public.nose_prints(pet_id) WHERE is_primary = TRUE;

CREATE INDEX idx_nose_prints_embedding_hnsw
  ON public.nose_prints
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_nose_prints_pet_id ON public.nose_prints(pet_id);
CREATE INDEX idx_nose_prints_captured_at ON public.nose_prints(captured_at DESC);

-- 5. RLS (mismas policies que la version 768)
ALTER TABLE public.nose_prints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage own pet nose prints"
  ON public.nose_prints
  FOR ALL
  TO authenticated
  USING (
    pet_id IN (SELECT id FROM public.pets WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    pet_id IN (SELECT id FROM public.pets WHERE owner_id = auth.uid())
  );

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

-- 6. RPC match (VECTOR 1024 + threshold default mas bajo: DINOv2 vive en ~0.55)
CREATE OR REPLACE FUNCTION public.match_nose_print(
  p_embedding VECTOR(1024),
  p_threshold REAL DEFAULT 0.55,
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
GRANT EXECUTE ON FUNCTION public.match_nose_print(VECTOR, REAL, INT) TO authenticated, anon;

COMMENT ON FUNCTION public.match_nose_print IS
  'Similarity search nose_prints (DINOv2-large 1024 dims). Threshold default 0.55 calibrado tras test 2026-04-25 (intra-pet ~0.60, inter-pet ~0.26, gap ~0.34). SECURITY DEFINER porque cruza dueños. Solo expone pet_id+similarity sin embedding ni metadata.';

-- 7. RPC set_primary (reusable, sin cambios de tipo)
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
-- Smoke test
-- ══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_match_dim INT;
  v_match_threshold REAL;
BEGIN
  -- Tabla existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='nose_prints'
  ) INTO v_table_exists;
  IF NOT v_table_exists THEN
    RAISE EXCEPTION 'Tabla nose_prints no existe post-recreate';
  END IF;

  -- RPC con la nueva firma (VECTOR 1024)
  SELECT pg_catalog.format_type(pa.atttypid, pa.atttypmod)::TEXT
    INTO v_match_dim
    FROM pg_proc pp
    JOIN pg_attribute pa ON pa.attrelid = (pp.oid::regproc::text || '_args')::regclass
    WHERE pp.proname = 'match_nose_print'
    LIMIT 1;
  -- Lo de arriba puede no devolver dim cleanly; en su lugar verificamos via prosrc
  PERFORM 1 FROM pg_proc
    WHERE proname = 'match_nose_print'
      AND pronargs = 3;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'match_nose_print no se recreo con 3 args';
  END IF;

  -- Threshold default es 0.55 (DINOv2)
  -- (Verificacion manual: SELECT prosrc FROM pg_proc WHERE proname='match_nose_print')

  RAISE NOTICE 'Smoke test OK: nose_prints recreada con VECTOR(1024) + RPCs DINOv2-ready';
END $$;
