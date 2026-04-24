-- ══════════════════════════════════════════════════════════════════════════
-- PET TIMELINE EVENTS — Refactor Maestro 2026-04-23 Fase 0
-- ══════════════════════════════════════════════════════════════════════════
-- Contexto: plan maestro (docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md)
-- define el timeline unificado de la vida de la mascota con 10 categorias
-- canonicas. Es el pilar 3 de la Trinidad del Corazon + base para insights
-- agregados (seccion 8.7 Output Engineering).
--
-- Esta tabla centraliza eventos que hoy viven distribuidos:
--   - medical_records (consultas, tratamientos)  → categoria 'health'
--   - pet_reminders completados                  → categoria segun type
--   - vet_bookings                               → categoria 'health'
--   - pet_routines completadas                   → categoria 'activity'
--   - memorial_events                            → categoria 'milestone'
--   - Nuevos eventos (fotos, peso, baño, paseo)  → categorias correspondientes
--
-- NO reemplaza las tablas existentes. Es capa de agregacion + entrada de
-- eventos directos (que hoy no tienen donde ir, ej: "baño casero", "paseo",
-- "cambio de alimento", "visita al parque").
--
-- Triggers futuros (Fase 1) alimentaran esta tabla desde las tablas existentes
-- para que el timeline sea completo sin duplicar data. Por ahora solo creamos
-- la tabla y el enum; no hay triggers de alimentacion automatica en esta mig.
--
-- 100% ADITIVA. No toca pets/profiles/otras tablas existentes.
-- Idempotente. Aplicar manualmente desde Supabase Dashboard > SQL Editor.
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Enum de categorias canonicas
-- ──────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'timeline_category') THEN
    CREATE TYPE timeline_category AS ENUM (
      'health',        -- 🏥 Salud: vacunas, antiparasitarios, consultas, tratamientos
      'weight',        -- ⚖️ Peso y crecimiento: registro peso, curva, etapa
      'nutrition',     -- 🍗 Alimentacion: marca, cambios, intolerancias
      'hygiene',       -- 🛁 Higiene y cuidado: banos, uñas, dental
      'activity',      -- 🐾 Rutinas y actividad: paseos, entrenamiento, juego
      'social',        -- 📸 Vida social y fotos: cumpleaños, encuentros, viajes
      'purchases',     -- 🛒 Compras y accesorios: collar, cama, productos
      'home',          -- 🏠 Hogar y ambiente: mudanza, nuevo pet, cambios familiares
      'milestone',     -- 💜 Momentos e hitos: adopcion, primer dia, memorial
      'legal'          -- 📋 Documentos y legal: chip, Cholito, seguro, pasaporte
    );
    RAISE NOTICE 'Created enum: timeline_category (10 values)';
  ELSE
    RAISE NOTICE 'Skip: timeline_category enum ya existe';
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Enum de fuentes del evento
-- ──────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'timeline_event_source') THEN
    CREATE TYPE timeline_event_source AS ENUM (
      'manual',                -- Dueño ingreso manual via UI
      'audio',                 -- Desde owner_audio_notes transcripcion
      'auto_trigger',          -- Trigger DB desde tabla existente
      'ocr',                   -- OCR de receta/carnet/recibo
      'vet_note',              -- Nota clinica estructurada de vet
      'shelter_transfer',      -- Evento generado en adopcion
      'partner_integration',   -- Scanner fisico o API de partner (Fase 2)
      'import',                -- Importacion masiva (refugios bulk, OCR de libreta)
      'system'                 -- Generado por sistema (ej: cumpleanos, hito)
    );
    RAISE NOTICE 'Created enum: timeline_event_source (9 values)';
  ELSE
    RAISE NOTICE 'Skip: timeline_event_source enum ya existe';
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 3. Tabla pet_timeline_events
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pet_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  category timeline_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Cuando OCURRIO el evento (NO cuando se registro)
  event_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by UUID REFERENCES auth.users(id),

  -- Origen del evento
  source timeline_event_source NOT NULL DEFAULT 'manual',

  -- Metadata visual/organizacional
  is_milestone BOOLEAN NOT NULL DEFAULT FALSE,     -- Destacar visualmente (hito)
  is_user_reported BOOLEAN NOT NULL DEFAULT TRUE,  -- vs oficial (vet, partner)

  -- Medios adjuntos (fotos, audios, pdfs)
  media_urls JSONB,

  -- GPS cuando aplica (paseos, visitas)
  location_geojson JSONB,

  -- Schema por categoria: weight_kg, duration_min, brand, etc.
  data JSONB,

  -- Link a registro canonico si el evento proviene de otra tabla
  related_record_id UUID,
  related_record_table TEXT,

  -- Visibilidad
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'shared', 'public')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────
-- 4. Indices
-- ──────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_timeline_pet_event_at
  ON public.pet_timeline_events(pet_id, event_at DESC);

CREATE INDEX IF NOT EXISTS idx_timeline_pet_category
  ON public.pet_timeline_events(pet_id, category, event_at DESC);

CREATE INDEX IF NOT EXISTS idx_timeline_milestone
  ON public.pet_timeline_events(pet_id, event_at DESC)
  WHERE is_milestone = TRUE;

CREATE INDEX IF NOT EXISTS idx_timeline_related_record
  ON public.pet_timeline_events(related_record_table, related_record_id)
  WHERE related_record_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────────
-- 5. Trigger updated_at
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_pet_timeline_events_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_pet_timeline_events_updated_at ON public.pet_timeline_events;
CREATE TRIGGER trg_update_pet_timeline_events_updated_at
  BEFORE UPDATE ON public.pet_timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION update_pet_timeline_events_updated_at();

-- ──────────────────────────────────────────────────────────────────────────
-- 6. Row Level Security
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE public.pet_timeline_events ENABLE ROW LEVEL SECURITY;

-- Owner del pet puede ver/editar/borrar sus eventos
DROP POLICY IF EXISTS "Pet owners manage timeline" ON public.pet_timeline_events;
CREATE POLICY "Pet owners manage timeline"
  ON public.pet_timeline_events
  FOR ALL
  TO authenticated
  USING (
    pet_id IN (SELECT id FROM public.pets WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    pet_id IN (SELECT id FROM public.pets WHERE owner_id = auth.uid())
  );

-- Co-owners pueden ver (segun pet_co_owners)
DROP POLICY IF EXISTS "Co-owners read timeline" ON public.pet_timeline_events;
CREATE POLICY "Co-owners read timeline"
  ON public.pet_timeline_events
  FOR SELECT
  TO authenticated
  USING (
    pet_id IN (
      SELECT pet_id FROM public.pet_co_owners
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

-- Eventos publicos (con visibility='public') se leen sin auth via token
DROP POLICY IF EXISTS "Public timeline visible via share" ON public.pet_timeline_events;
CREATE POLICY "Public timeline visible via share"
  ON public.pet_timeline_events
  FOR SELECT
  TO anon
  USING (visibility = 'public');

-- ──────────────────────────────────────────────────────────────────────────
-- 7. Smoke test (regla CLAUDE.md §9.2.1)
-- ──────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_test_pet_id UUID;
  v_test_event_id UUID;
BEGIN
  -- Buscar una mascota real para el smoke test
  SELECT id INTO v_test_pet_id FROM public.pets WHERE owner_id IS NOT NULL LIMIT 1;

  IF v_test_pet_id IS NULL THEN
    RAISE NOTICE 'Smoke skip: no hay mascotas en DB para testear';
    RETURN;
  END IF;

  -- Insertar evento de test
  INSERT INTO public.pet_timeline_events (
    pet_id, category, title, event_at, source, data
  ) VALUES (
    v_test_pet_id,
    'milestone',
    'SMOKE TEST — Timeline migration ready',
    NOW(),
    'system',
    '{"test": true}'::jsonb
  ) RETURNING id INTO v_test_event_id;

  RAISE NOTICE 'Smoke test OK: event % created for pet %', v_test_event_id, v_test_pet_id;

  -- Rollback inmediato del test event (no contaminar data real)
  DELETE FROM public.pet_timeline_events WHERE id = v_test_event_id;
  RAISE NOTICE 'Smoke test cleanup OK';

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Smoke test FAILED: %', SQLERRM;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- Verificacion post-apply
-- ──────────────────────────────────────────────────────────────────────────
-- SELECT COUNT(*) FROM public.pet_timeline_events;  -- Debe ser 0
-- SELECT enum_range(NULL::timeline_category);        -- 10 valores
-- SELECT enum_range(NULL::timeline_event_source);    -- 9 valores
-- \d+ public.pet_timeline_events                     -- Ver estructura completa
-- ──────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE public.pet_timeline_events IS
  'Timeline unificado de eventos de la vida de la mascota, pilar 3 de la Trinidad del Corazon (Refactor Maestro 2026-04-23). Se alimenta de fuentes multiples (manual, audio, triggers, OCR, vet, partner scanner, import). El frontend lo visualiza con filtros por las 10 categorias canonicas.';
