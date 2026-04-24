-- ══════════════════════════════════════════════════════════════════════════
-- OWNER AUDIO NOTES — Refactor Maestro 2026-04-23 Fase 0
-- ══════════════════════════════════════════════════════════════════════════
-- Contexto: el plan maestro §2.6.2 establece que el tutor puede alimentar
-- la ficha de su mascota mediante audio (consultas vet, observaciones)
-- aunque el vet NO use Paw Friend. La edge function process-consultation-transcript
-- ya existe para vets; esta tabla extiende el flujo al caller=owner.
--
-- Flujo:
--   1. Dueño presiona "Grabar consulta/observacion" en la ficha
--   2. App captura audio, lo sube a storage, inserta fila en esta tabla
--   3. Edge function process-consultation-transcript (extendida) toma el audio,
--      lo transcribe con Whisper, estructura con IA (motivo, diagnostico,
--      tratamiento, medicacion), y crea evento en pet_timeline_events
--   4. Dueño revisa la estructura sugerida y confirma (o edita)
--   5. Evento queda en timeline categoria 'health' (o segun IA)
--
-- Dependencia: pet_timeline_events (mig 20260525000000) debe existir antes.
--
-- 100% ADITIVA. Aplicar manualmente desde Supabase Dashboard > SQL Editor.
-- Idempotente.
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Enum estado procesamiento
-- ──────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audio_note_processing_status') THEN
    CREATE TYPE audio_note_processing_status AS ENUM (
      'pending',       -- Audio subido, esperando procesamiento
      'transcribing',  -- Whisper en curso
      'structuring',   -- IA estructurando
      'review',        -- Esperando revision del dueño antes de crear evento timeline
      'done',          -- Evento timeline creado
      'failed',        -- Procesamiento fallo (ver error_message)
      'rejected'       -- Dueño rechazo la estructura propuesta
    );
    RAISE NOTICE 'Created enum: audio_note_processing_status';
  ELSE
    RAISE NOTICE 'Skip: audio_note_processing_status ya existe';
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Tabla owner_audio_notes
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.owner_audio_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Audio
  audio_url TEXT NOT NULL,        -- Path en Supabase storage
  audio_mime_type TEXT,           -- audio/webm, audio/mp4, audio/m4a
  duration_seconds INT,
  size_bytes BIGINT,

  -- Metadata del evento que describe el audio
  event_at TIMESTAMPTZ NOT NULL,  -- Cuando ocurrio la consulta/observacion
  location_name TEXT,             -- Texto libre: "Clinica Vetplus", "En casa", etc.

  -- Resultado del procesamiento
  processing_status audio_note_processing_status NOT NULL DEFAULT 'pending',
  transcript TEXT,                          -- Texto completo transcrito
  structured_data JSONB,                    -- IA extrae: motivo, diagnostico, tratamiento, medicacion, vet_name, follow_up_date

  -- Error si falla
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,

  -- Timestamps del pipeline
  transcribed_at TIMESTAMPTZ,
  structured_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,

  -- Link al evento creado en timeline (si processing_status='done')
  timeline_event_id UUID REFERENCES public.pet_timeline_events(id) ON DELETE SET NULL,

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────
-- 3. Indices
-- ──────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audio_notes_pet_id
  ON public.owner_audio_notes(pet_id, event_at DESC);

CREATE INDEX IF NOT EXISTS idx_audio_notes_owner_id
  ON public.owner_audio_notes(owner_id, created_at DESC);

-- Index para encontrar audios que esperan procesamiento (cron o edge fn)
CREATE INDEX IF NOT EXISTS idx_audio_notes_pending_processing
  ON public.owner_audio_notes(processing_status, created_at)
  WHERE processing_status IN ('pending', 'transcribing', 'structuring');

-- Index para dashboard del dueño (audios esperando su review)
CREATE INDEX IF NOT EXISTS idx_audio_notes_awaiting_review
  ON public.owner_audio_notes(owner_id, updated_at DESC)
  WHERE processing_status = 'review';

-- ──────────────────────────────────────────────────────────────────────────
-- 4. Trigger updated_at
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_owner_audio_notes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_owner_audio_notes_updated_at ON public.owner_audio_notes;
CREATE TRIGGER trg_update_owner_audio_notes_updated_at
  BEFORE UPDATE ON public.owner_audio_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_owner_audio_notes_updated_at();

-- ──────────────────────────────────────────────────────────────────────────
-- 5. RLS
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE public.owner_audio_notes ENABLE ROW LEVEL SECURITY;

-- Owner ve/gestiona sus audios
DROP POLICY IF EXISTS "Owners manage own audio notes" ON public.owner_audio_notes;
CREATE POLICY "Owners manage own audio notes"
  ON public.owner_audio_notes
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Co-owners con permiso add_records pueden INSERT (grabar audio)
DROP POLICY IF EXISTS "Co-owners can add audio notes" ON public.owner_audio_notes;
CREATE POLICY "Co-owners can add audio notes"
  ON public.owner_audio_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    pet_id IN (
      SELECT pet_id FROM public.pet_co_owners
      WHERE user_id = auth.uid()
        AND status = 'accepted'
        AND 'add_records' = ANY(permissions)
    )
  );

-- Service role (edge fn) puede todo
DROP POLICY IF EXISTS "Service role full access audio notes" ON public.owner_audio_notes;
CREATE POLICY "Service role full access audio notes"
  ON public.owner_audio_notes
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ──────────────────────────────────────────────────────────────────────────
-- 6. Smoke test (regla CLAUDE.md §9.2.1)
-- ──────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_test_pet_id UUID;
  v_test_owner_id UUID;
  v_test_note_id UUID;
BEGIN
  SELECT p.id, p.owner_id INTO v_test_pet_id, v_test_owner_id
  FROM public.pets p
  WHERE p.owner_id IS NOT NULL
  LIMIT 1;

  IF v_test_pet_id IS NULL OR v_test_owner_id IS NULL THEN
    RAISE NOTICE 'Smoke skip: no hay mascotas con owner real';
    RETURN;
  END IF;

  INSERT INTO public.owner_audio_notes (
    pet_id, owner_id, audio_url, event_at, processing_status
  ) VALUES (
    v_test_pet_id,
    v_test_owner_id,
    'test://smoke-test-audio-url',
    NOW(),
    'pending'
  ) RETURNING id INTO v_test_note_id;

  RAISE NOTICE 'Smoke OK: audio note % created for pet %', v_test_note_id, v_test_pet_id;

  DELETE FROM public.owner_audio_notes WHERE id = v_test_note_id;
  RAISE NOTICE 'Smoke cleanup OK';

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Smoke test FAILED: %', SQLERRM;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- Verificacion post-apply
-- ──────────────────────────────────────────────────────────────────────────
-- SELECT COUNT(*) FROM public.owner_audio_notes;  -- Debe ser 0
-- SELECT enum_range(NULL::audio_note_processing_status);
-- ──────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE public.owner_audio_notes IS
  'Audio notes grabadas por el dueño (NO el vet) para alimentar la ficha cuando el vet de cabecera no usa Paw Friend. Pipeline: upload → transcript (Whisper) → structure (IA) → review → event en pet_timeline_events. Refactor Maestro 2026-04-23 §2.6.2.';
