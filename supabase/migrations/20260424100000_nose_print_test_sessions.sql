-- ══════════════════════════════════════════════════════════════════════════
-- Nose Print Test Sessions — tabla para crowdsourcing de fotos de narices
-- ══════════════════════════════════════════════════════════════════════════
-- Contexto 2026-04-24:
-- Para validar el feature biometrico antes de invertir en fine-tuning,
-- necesitamos un dataset propio con fotos capturadas bajo protocolo
-- estandarizado por multiples dueños/mascotas.
--
-- Esta tabla almacena sesiones de captura desde la pagina publica
-- /nose-print-test. Cada sesion = 1 mascota + N fotos subidas a Storage.
--
-- No requiere auth (ruta publica). RLS permite INSERT anonymous.
-- Solo admin puede leer (para evaluar las fotos + entrenar modelo).
--
-- Aplicar manualmente desde Supabase Dashboard > SQL Editor.
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.nose_print_test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos del dueño (tester)
  owner_name TEXT NOT NULL,
  owner_email TEXT,                       -- Opcional, para avisar resultado
  owner_location TEXT,                    -- "Santiago Centro", "Valparaiso"

  -- Datos de la mascota
  pet_name TEXT NOT NULL,
  pet_species TEXT NOT NULL CHECK (pet_species IN ('perro', 'gato', 'otro')),
  pet_breed TEXT,
  pet_age_months INT,
  pet_sex TEXT CHECK (pet_sex IN ('macho', 'hembra', 'desconocido')),

  -- Protocolo de captura
  protocol_version TEXT NOT NULL DEFAULT 'v1',
  num_frames_captured INT NOT NULL DEFAULT 0,
  num_frames_uploaded INT NOT NULL DEFAULT 0,

  -- URLs de storage (array de paths en bucket nose-print-tests)
  photo_urls JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Metadata adicional
  user_agent TEXT,                        -- Que browser/device uso
  screen_resolution TEXT,

  -- Procesamiento (lo llena Claude despues de evaluar)
  processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processed', 'quality_low', 'used_for_training', 'duplicate')),

  -- Quality metrics (calculados al procesar)
  avg_quality_score REAL,
  num_valid_frames INT,
  embedding_generated BOOLEAN DEFAULT FALSE,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_nose_test_sessions_created
  ON public.nose_print_test_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nose_test_sessions_pending
  ON public.nose_print_test_sessions(created_at DESC)
  WHERE processing_status = 'pending';

-- RLS
ALTER TABLE public.nose_print_test_sessions ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario anon puede INSERT (es una pagina publica)
DROP POLICY IF EXISTS "Anyone can submit nose test" ON public.nose_print_test_sessions;
CREATE POLICY "Anyone can submit nose test"
  ON public.nose_print_test_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- Solo admins leen (para curar el dataset)
DROP POLICY IF EXISTS "Admins read all nose tests" ON public.nose_print_test_sessions;
CREATE POLICY "Admins read all nose tests"
  ON public.nose_print_test_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins update nose tests" ON public.nose_print_test_sessions;
CREATE POLICY "Admins update nose tests"
  ON public.nose_print_test_sessions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Storage bucket (la creacion del bucket hay que hacerla desde Dashboard
-- o via edge function; este SQL solo crea la tabla)
-- Pedro: en Dashboard > Storage crear bucket 'nose-print-tests' como PUBLIC
-- (para que la pagina publica pueda subir sin auth) con politicas:
--   - anon puede INSERT
--   - anon puede SELECT (para verificar su propia subida)
--   - admins pueden todo

COMMENT ON TABLE public.nose_print_test_sessions IS
  'Crowdsourcing de fotos de narices para validar feature biometrico (Refactor Maestro 2026-04-24). Dataset propio antes de fine-tuning.';

-- ──────────────────────────────────────────────────────────────────────────
-- Verificacion
-- ──────────────────────────────────────────────────────────────────────────
-- SELECT COUNT(*) FROM public.nose_print_test_sessions;  -- Debe ser 0
-- ──────────────────────────────────────────────────────────────────────────
