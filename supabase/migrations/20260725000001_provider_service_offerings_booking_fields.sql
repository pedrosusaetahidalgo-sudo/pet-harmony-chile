-- ══════════════════════════════════════════════════════════════
-- CC-15 — extender provider_service_offerings para Booking V3
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Contexto (BOOKING_SYSTEM_MASTER_PLAN §12.3):
--   El plan original proponía crear una tabla `provider_services`
--   NUEVA, pero auditoría posterior encontró que ya existe
--   `provider_service_offerings` con 95% de las columnas necesarias.
--
--   Regla CLAUDE.md §9.7: extender lo que existe, no duplicar — los
--   providers ya tienen filas ahí que se romperían con una FK nueva.
--
-- Agregamos las columnas que faltan para soportar:
--   - slug            → URL-friendly identifier (ej. 'consulta-general')
--   - duration_minutes → override a provider_availability_rules.slot_duration
--                        cuando el booking apunta a un servicio específico
--   - requires_pre_check_in → futuro flag (Fase 5) para formulario pre-cita
--
-- Idempotente: ADD COLUMN IF NOT EXISTS en todas.
-- ══════════════════════════════════════════════════════════════

-- 1. slug por servicio (único por provider)
ALTER TABLE public.provider_service_offerings
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill de slugs a partir de service_type para filas existentes.
-- Usa service_type normalizado: 'dog_walker' → 'paseo', 'veterinarian' → 'consulta-general', etc.
UPDATE public.provider_service_offerings
SET slug = CASE service_type
  WHEN 'veterinarian' THEN 'consulta-general'
  WHEN 'dog_walker' THEN 'paseo'
  WHEN 'dogsitter' THEN 'hospedaje'
  WHEN 'trainer' THEN 'entrenamiento'
  WHEN 'grooming' THEN 'peluqueria'
  ELSE regexp_replace(lower(service_type), '[^a-z0-9]+', '-', 'g')
END
WHERE slug IS NULL;

-- UNIQUE (provider_id, slug) — ya existe UNIQUE (provider_id, service_type),
-- pero permitimos varios servicios del mismo type con distinto slug en el
-- futuro (ej. 'consulta-general' + 'consulta-especializada' ambos 'veterinarian').
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_service_offerings_slug
  ON public.provider_service_offerings (provider_id, slug)
  WHERE slug IS NOT NULL;

COMMENT ON COLUMN public.provider_service_offerings.slug IS
  'URL-friendly identifier único por provider. Usado en deep links /veterinarios/:slug/servicios/:service_slug.';

-- 2. duration_minutes — override a rules.slot_duration por servicio
ALTER TABLE public.provider_service_offerings
  ADD COLUMN IF NOT EXISTS duration_minutes SMALLINT
    CHECK (duration_minutes IS NULL OR duration_minutes BETWEEN 5 AND 480);

COMMENT ON COLUMN public.provider_service_offerings.duration_minutes IS
  'Duración del servicio en minutos. Si null, usa slot_duration_minutes de provider_availability_rules. Resuelve el caso "consulta 30 min + cirugía 90 min".';

-- 3. requires_pre_check_in — feature futura Fase 5
ALTER TABLE public.provider_service_offerings
  ADD COLUMN IF NOT EXISTS requires_pre_check_in BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.provider_service_offerings.requires_pre_check_in IS
  'Si true, al agendar este servicio se envía prompt T-1h pidiendo confirmación o form de síntomas. Feature-flaggeada en Fase 5 del master plan.';

-- ──────────────────────────────────────────────────────────────
-- Verificación:
--
--   SELECT provider_id, service_type, slug, duration_minutes
--   FROM provider_service_offerings
--   WHERE slug IS NULL;   -- Debe estar vacío tras el backfill.
--
-- Rollback:
--   DROP INDEX IF EXISTS idx_provider_service_offerings_slug;
--   ALTER TABLE provider_service_offerings
--     DROP COLUMN IF EXISTS slug,
--     DROP COLUMN IF EXISTS duration_minutes,
--     DROP COLUMN IF EXISTS requires_pre_check_in;
-- ──────────────────────────────────────────────────────────────
