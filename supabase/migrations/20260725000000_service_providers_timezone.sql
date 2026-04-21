-- ══════════════════════════════════════════════════════════════
-- CC-14 — service_providers.timezone (Booking V3 Master Plan Fase 2)
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Contexto (BOOKING_SYSTEM_MASTER_PLAN §14.6):
--   Hoy los slots se almacenan como `scheduled_date TIMESTAMPTZ`
--   + `start_time TIME`. Esa combinación funciona para Chile (todos
--   los providers en America/Santiago), pero cuando un provider opera
--   en otra tz (futuro Argentina / Perú) o durante horario de verano
--   el cálculo de slots puede dar desfase de 60 min.
--
--   Esta columna permite que el RPC `rpc_get_available_slots` (CC-17)
--   convierta las reglas AT TIME ZONE correcto.
--
-- Default: 'America/Santiago' — zero-impact para providers existentes.
-- Idempotente: IF NOT EXISTS + COALESCE default.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.service_providers
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Santiago';

-- Backfill defensivo: si por algún motivo hay nulls (no debería porque
-- el default cubre el INSERT desde que se aplicó), los forzamos.
UPDATE public.service_providers
SET timezone = 'America/Santiago'
WHERE timezone IS NULL OR timezone = '';

-- Validar contra los timezone names soportados por Postgres.
-- No usamos CHECK con pg_timezone_names porque es una vista, pero
-- documentamos los valores esperados.
COMMENT ON COLUMN public.service_providers.timezone IS
  'IANA timezone del provider. Default America/Santiago. Usado por rpc_get_available_slots para convertir TIME local a TIMESTAMPTZ UTC.';

-- ──────────────────────────────────────────────────────────────
-- Verificación post-migración:
--
--   SELECT timezone, COUNT(*)
--   FROM service_providers
--   GROUP BY timezone;
--   -- Todos los providers deben quedar con America/Santiago.
--
-- Rollback:
--   ALTER TABLE public.service_providers DROP COLUMN timezone;
-- ──────────────────────────────────────────────────────────────
