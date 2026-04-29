-- 2026-04-29 (Paw Shield · Petify integration)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Contexto: integramos Petify (PetNow) como motor biometrico de hocicos.
-- Tras testeo con 8 mascotas reales:
--   - 1 foto por pet  → 75% top-1 accuracy
--   - 3 fotos por pet → 100% top-1 accuracy (matches con score 96-100)
--
-- Reemplaza nuestro pipeline propio (DINOv2-large) que daba ~random.
-- El pipeline propio queda PRESERVADO (no DROP) durante 6 meses como
-- backstop por si Petify falla o cambia precios. Tras 6 meses estables,
-- otra mig limpia las tablas legacy.
--
-- Politica anti-duplicado (Pedro 2026-04-29):
--   "no pueden haber dos mascotas con dos fichas"
--   → UNIQUE INDEX en petify_pet_id (server-side enforcement).
--
-- Modelo de negocio (Opcion B "Paw Shield activable"):
--   - Por defecto, pets se crean SIN Petify (petify_pet_id IS NULL).
--   - El feature se activa explicitamente por el dueno desde la UI:
--     "Activar Paw Shield" → captura 3 fotos hocico → Petify register.
--   - Solo ~25-30% de los dueños lo activaran (los preocupados por extravio),
--     bajando 70-75% el costo Petify SaaS-per-pet vs activacion default.

-- ─── pets: nuevas columnas Petify ──────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.pets') IS NULL THEN
    RAISE EXCEPTION 'tabla public.pets no existe — abortando migracion';
  END IF;

  -- petify_pet_id: UUID que devuelve Petify al crear el pet alla.
  ALTER TABLE public.pets
    ADD COLUMN IF NOT EXISTS petify_pet_id TEXT NULL;

  -- petify_registered_at: timestamp del primer enrollment exitoso.
  ALTER TABLE public.pets
    ADD COLUMN IF NOT EXISTS petify_registered_at TIMESTAMPTZ NULL;

  -- petify_fingerprint_count: cuántas fotos están registradas en Petify para
  -- este pet. >=3 es lo recomendado. Permite saber si necesitamos pedir mas.
  ALTER TABLE public.pets
    ADD COLUMN IF NOT EXISTS petify_fingerprint_count SMALLINT NOT NULL DEFAULT 0;

  -- petify_quality: 'high' (>=3 fotos), 'low' (1-2), null (no registrado).
  -- UI usa esto para mostrar "Paw Shield activo" vs "Mejora la captura".
  ALTER TABLE public.pets
    ADD COLUMN IF NOT EXISTS petify_quality TEXT NULL
    CHECK (petify_quality IN ('high', 'low') OR petify_quality IS NULL);

  -- nose_print_pending: marca pets con captura intentada pero fallida (3+ retries
  -- con blur). Se muestra en /home como nudge "completa Paw Shield para Kai".
  ALTER TABLE public.pets
    ADD COLUMN IF NOT EXISTS nose_print_pending BOOLEAN NOT NULL DEFAULT FALSE;

  COMMENT ON COLUMN public.pets.petify_pet_id IS
    'UUID del pet en Petify (PetNow). NULL = sin Paw Shield activado. UNIQUE — politica anti-duplicado: una mascota fisica = una sola ficha en el sistema.';
  COMMENT ON COLUMN public.pets.petify_registered_at IS
    'Timestamp del primer enrollment biometrico exitoso. NULL si nunca se activo Paw Shield.';
  COMMENT ON COLUMN public.pets.petify_fingerprint_count IS
    'Cuántos fingerprints (fotos del hocico) estan registrados en Petify. Recomendado: >=3. Inicial: 0.';
  COMMENT ON COLUMN public.pets.petify_quality IS
    '"high" si >=3 fingerprints, "low" si 1-2. NULL si Paw Shield no activado.';
  COMMENT ON COLUMN public.pets.nose_print_pending IS
    'TRUE si el dueño inicio el flow de Paw Shield pero no logro completarlo (blur, perro inquieto). UI muestra nudge en /home para reintentar.';
END $$;

-- ─── UNIQUE index en petify_pet_id (anti-duplicado) ───────────────────
-- Partial index: solo aplica a pets que SI tienen Paw Shield (petify_pet_id NOT NULL).
-- Pets sin Paw Shield (NULL) no estan sujetos a unicidad — pueden ser muchos.
DO $$
BEGIN
  IF to_regclass('public.pets') IS NOT NULL THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pets_petify_pet_id_unique
      ON public.pets (petify_pet_id)
      WHERE petify_pet_id IS NOT NULL;
  END IF;
END $$;

-- ─── Index para nudge en /home ────────────────────────────────────────
-- Query: WHERE owner_id = X AND nose_print_pending = true → "completa Paw Shield"
DO $$
BEGIN
  IF to_regclass('public.pets') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_pets_owner_nose_print_pending
      ON public.pets (owner_id)
      WHERE nose_print_pending = true;
  END IF;
END $$;

-- ─── Audit log de Petify operations ───────────────────────────────────
-- Para soporte: si un user reporta "no funciono mi Paw Shield", podemos ver
-- aqui los intentos, errores, sessionIds, jobIds. Retencion 90 dias.
CREATE TABLE IF NOT EXISTS public.paw_shield_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'register_attempt', 'register_success', 'register_failed',
    'identify_attempt', 'identify_success', 'identify_no_match',
    'duplicate_detected', 'ambiguous_match'
  )),
  petify_pet_id TEXT NULL,
  petify_session_id TEXT NULL,
  petify_job_id TEXT NULL,
  fingerprint_count SMALLINT NULL,
  match_top_score SMALLINT NULL,
  match_gap SMALLINT NULL,
  error_code TEXT NULL,
  error_message TEXT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.paw_shield_events ENABLE ROW LEVEL SECURITY;

-- Owner ve solo sus eventos.
CREATE POLICY "owners_view_own_paw_shield_events"
  ON public.paw_shield_events FOR SELECT
  USING (owner_id = auth.uid());

-- Solo edge fns con service_role pueden insertar.
CREATE POLICY "service_role_inserts_paw_shield_events"
  ON public.paw_shield_events FOR INSERT
  WITH CHECK (true);  -- service_role bypassa RLS, pero policy explicita por claridad.

CREATE INDEX IF NOT EXISTS idx_paw_shield_events_owner_created
  ON public.paw_shield_events (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paw_shield_events_pet
  ON public.paw_shield_events (pet_id, created_at DESC)
  WHERE pet_id IS NOT NULL;

COMMENT ON TABLE public.paw_shield_events IS
  'Audit log de operaciones Petify (register/identify/duplicate). Retencion 90d via cron de cleanup. Para troubleshooting "Paw Shield no funcionó" sin pedirle a Petify logs.';

-- ─── Smoke test ───────────────────────────────────────────────────────
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- 1. Verificar columnas creadas.
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'pets'
    AND column_name IN ('petify_pet_id', 'petify_registered_at',
      'petify_fingerprint_count', 'petify_quality', 'nose_print_pending');
  IF v_count <> 5 THEN
    RAISE EXCEPTION 'pets: faltan columnas Petify (esperaba 5, encontre %)', v_count;
  END IF;

  -- 2. Verificar UNIQUE index.
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pets_petify_pet_id_unique'
  ) THEN
    RAISE EXCEPTION 'idx_pets_petify_pet_id_unique no fue creado';
  END IF;

  -- 3. Verificar tabla audit.
  IF to_regclass('public.paw_shield_events') IS NULL THEN
    RAISE EXCEPTION 'paw_shield_events no fue creado';
  END IF;

  RAISE NOTICE '✓ Migracion Paw Shield · Petify aplicada OK';
END $$;

-- ──────────────────────────────────────────────────────────────────────
-- LEGACY: tabla nose_print_embeddings se PRESERVA por 6 meses como backup.
-- Pasado ese tiempo, nueva mig 20261029_drop_nose_print_legacy.sql:
--   DROP TABLE IF EXISTS public.nose_print_embeddings CASCADE;
--   ALTER TABLE public.pets DROP COLUMN IF EXISTS nose_print_embedded_at;
--
-- Verificacion:
--   SELECT id, petify_pet_id, petify_quality, petify_fingerprint_count
--   FROM pets WHERE petify_pet_id IS NOT NULL
--   ORDER BY petify_registered_at DESC LIMIT 10;
-- ──────────────────────────────────────────────────────────────────────
