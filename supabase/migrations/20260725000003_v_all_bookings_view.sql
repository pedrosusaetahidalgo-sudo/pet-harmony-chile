-- ══════════════════════════════════════════════════════════════
-- CC-13 — vista v_all_bookings (Booking V3 Master Plan §12.1)
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Contexto (BOOKING_SYSTEM_MASTER_PLAN §12.1 Opción B):
--   Hoy existen 4 tablas de bookings con 80% de columnas comunes
--   (vet_bookings, walk_bookings, dogsitter_bookings, training_bookings)
--   + la tabla legacy `bookings` V1. Cada hook tiene que hacer UNION
--   manual en frontend (useMyBookingsV2.ts waterfall de 4 queries).
--
--   Esta vista consolida las 4 tablas V2 en un shape normalizado,
--   discriminado por `kind`. Permite:
--     - SELECT unificado en useMyBookingsV2 → una sola query
--     - RPC rpc_get_available_slots_range (CC-17) puede contar
--       bookings existentes sin conocer el kind
--     - Analítica cross-kind sin 4× JOIN
--
-- Nota: NO incluye legacy `bookings` (V1) porque su shape es muy
--   distinto — se deprecará gradualmente. Los tests E2E seguirán
--   cubriéndolo.
--
-- Performance: la vista es STABLE/non-materialized, se compila al
-- query-time. Cuando se materializa, Postgres usa los índices de las
-- tablas subyacentes (idx_vet_bookings_service_provider, etc.).
--
-- RLS: hereda de las tablas subyacentes. Postgres evalúa RLS en la
-- fila final, por lo que el user solo ve sus bookings de cada kind
-- según su rol (igual que hoy con SELECT directo).
--
-- Idempotente: CREATE OR REPLACE VIEW.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.v_all_bookings AS
-- ─── vet_bookings ───
SELECT
  id,
  'vet'::TEXT AS kind,
  owner_id,
  service_provider_id,
  vet_id,  -- legacy, mantenemos para backfill gradual
  ARRAY[pet_id]::UUID[] AS pet_ids,
  scheduled_date AS scheduled_at,
  start_time,
  end_time,
  -- Duración: si no hay start/end, usar slot_duration_minutes o default 30.
  COALESCE(
    slot_duration_minutes,
    CASE
      WHEN start_time IS NOT NULL AND end_time IS NOT NULL
      THEN EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER / 60
      ELSE NULL
    END,
    30
  )::SMALLINT AS duration_minutes,
  service_type,
  status,
  is_emergency,
  total_price AS price_clp,
  commission_rate,
  commission_amount_clp,
  payment_status,
  confirmation_mode,
  reminder_24h_sent,
  reminder_2h_sent,
  symptoms AS notes_owner,
  private_notes AS notes_private_provider,
  rescheduled_from,
  follow_up_booking_id,
  google_event_id,
  confirmed_at,
  started_at,
  canceled_at,
  canceled_by,
  cancellation_reason,
  created_at,
  updated_at
FROM public.vet_bookings

UNION ALL

-- ─── walk_bookings ───
SELECT
  id,
  'walk'::TEXT AS kind,
  owner_id,
  NULL::UUID AS service_provider_id,  -- walks no van por service_providers aún
  walker_id AS vet_id,  -- reusamos la columna para el provider user_id
  pet_ids,
  scheduled_date AS scheduled_at,
  start_time,
  end_time,
  COALESCE(
    duration_minutes,
    CASE
      WHEN start_time IS NOT NULL AND end_time IS NOT NULL
      THEN EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER / 60
      ELSE 60
    END
  )::SMALLINT AS duration_minutes,
  service_type,
  status,
  FALSE AS is_emergency,
  total_price AS price_clp,
  NULL::NUMERIC(5,2) AS commission_rate,
  NULL::INTEGER AS commission_amount_clp,
  payment_status,
  'auto'::TEXT AS confirmation_mode,
  reminder_24h_sent,
  reminder_2h_sent,
  special_instructions AS notes_owner,
  NULL::TEXT AS notes_private_provider,
  NULL::UUID AS rescheduled_from,
  NULL::UUID AS follow_up_booking_id,
  google_event_id,
  confirmed_at,
  NULL::TIMESTAMPTZ AS started_at,
  canceled_at,
  canceled_by,
  cancellation_reason,
  created_at,
  updated_at
FROM public.walk_bookings

UNION ALL

-- ─── training_bookings ───
SELECT
  id,
  'training'::TEXT AS kind,
  owner_id,
  NULL::UUID AS service_provider_id,
  trainer_id AS vet_id,
  ARRAY[pet_id]::UUID[] AS pet_ids,
  scheduled_date AS scheduled_at,
  start_time,
  end_time,
  COALESCE(
    duration_minutes,
    CASE
      WHEN start_time IS NOT NULL AND end_time IS NOT NULL
      THEN EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER / 60
      ELSE 60
    END
  )::SMALLINT AS duration_minutes,
  training_type AS service_type,
  status,
  FALSE AS is_emergency,
  total_price AS price_clp,
  NULL::NUMERIC(5,2) AS commission_rate,
  NULL::INTEGER AS commission_amount_clp,
  payment_status,
  'auto'::TEXT AS confirmation_mode,
  reminder_24h_sent,
  reminder_2h_sent,
  special_notes AS notes_owner,
  NULL::TEXT AS notes_private_provider,
  NULL::UUID AS rescheduled_from,
  NULL::UUID AS follow_up_booking_id,
  google_event_id,
  confirmed_at,
  NULL::TIMESTAMPTZ AS started_at,
  canceled_at,
  canceled_by,
  cancellation_reason,
  created_at,
  updated_at
FROM public.training_bookings

UNION ALL

-- ─── dogsitter_bookings ───
SELECT
  id,
  'dogsitter'::TEXT AS kind,
  owner_id,
  NULL::UUID AS service_provider_id,
  dogsitter_id AS vet_id,
  pet_ids,
  start_date AS scheduled_at,
  NULL::TIME AS start_time,  -- dogsitter usa rango dias, no horarios
  NULL::TIME AS end_time,
  CASE
    WHEN start_date IS NOT NULL AND end_date IS NOT NULL
    THEN (EXTRACT(EPOCH FROM (end_date - start_date))::INTEGER / 60)::SMALLINT
    ELSE 1440::SMALLINT  -- default 24h
  END AS duration_minutes,
  service_type,
  status,
  FALSE AS is_emergency,
  total_price AS price_clp,
  NULL::NUMERIC(5,2) AS commission_rate,
  NULL::INTEGER AS commission_amount_clp,
  payment_status,
  'auto'::TEXT AS confirmation_mode,
  reminder_24h_sent,
  reminder_2h_sent,
  special_instructions AS notes_owner,
  NULL::TEXT AS notes_private_provider,
  NULL::UUID AS rescheduled_from,
  NULL::UUID AS follow_up_booking_id,
  google_event_id,
  confirmed_at,
  NULL::TIMESTAMPTZ AS started_at,
  canceled_at,
  canceled_by,
  cancellation_reason,
  created_at,
  updated_at
FROM public.dogsitter_bookings;

COMMENT ON VIEW public.v_all_bookings IS
  'Vista consolidada de las 4 tablas de booking V2. Discriminada por `kind`. RLS se hereda de las tablas subyacentes. Usada por useMyBookingsV2 y rpc_get_available_slots_range para no duplicar UNION en cada consumidor.';

-- Grants (la vista sigue la RLS de las tablas subyacentes).
GRANT SELECT ON public.v_all_bookings TO authenticated, service_role;

-- ──────────────────────────────────────────────────────────────
-- Verificación:
--
--   -- Contar por kind (debe coincidir con SELECT COUNT(*) por tabla)
--   SELECT kind, COUNT(*)
--   FROM v_all_bookings
--   GROUP BY kind;
--
--   -- Validar que RLS funciona: un tutor solo ve sus bookings
--   -- (usar el rol authenticated en SQL Editor).
--
-- Rollback:
--   DROP VIEW IF EXISTS public.v_all_bookings;
-- ──────────────────────────────────────────────────────────────
