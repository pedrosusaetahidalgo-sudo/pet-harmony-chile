-- ══════════════════════════════════════════════════════════════
-- CC-16 — availability_rules: ventanas de reserva (Booking V3 Fase 2)
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Contexto (BOOKING_SYSTEM_MASTER_PLAN §8.1 reglas faltantes):
--   Hoy un tutor puede reservar con 2 minutos de antelación, o a
--   180 días vista. Sin ventanas mínima/máxima el provider pierde
--   control de su agenda y hay no-shows por reservas last-minute.
--
-- Ventana mínima (min_lead_time_minutes):
--   Cuántos minutos antes del slot se permite reservar.
--   Default 60 min — evita reservas con 5 min de margen.
--
-- Ventana máxima (max_advance_days):
--   Cuántos días al futuro se pueden reservar.
--   Default 90 días — suficiente para agendas médicas normales,
--   evita agendas bloqueadas con bookings a 6 meses.
--
-- Idempotente: ADD COLUMN IF NOT EXISTS.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.provider_availability_rules
  ADD COLUMN IF NOT EXISTS min_lead_time_minutes INTEGER NOT NULL DEFAULT 60
    CHECK (min_lead_time_minutes >= 0 AND min_lead_time_minutes <= 10080),
  -- 10080 min = 7 dias. Mayor que eso es casi seguro un bug.

  ADD COLUMN IF NOT EXISTS max_advance_days INTEGER NOT NULL DEFAULT 90
    CHECK (max_advance_days >= 1 AND max_advance_days <= 365),

  ADD COLUMN IF NOT EXISTS is_emergency_slot BOOLEAN NOT NULL DEFAULT FALSE;
  -- Si true, este horario solo aparece para bookings con is_emergency=true.
  -- Permite que un vet tenga una franja "urgencias" aparte de su agenda normal.

COMMENT ON COLUMN public.provider_availability_rules.min_lead_time_minutes IS
  'Minutos mínimos antes del slot para poder reservar. Bloquea reservas last-minute. Usado en rpc_get_available_slots y rpc_create_booking para validar.';

COMMENT ON COLUMN public.provider_availability_rules.max_advance_days IS
  'Dias máximos al futuro que se pueden reservar. Evita bloqueos de agenda a largo plazo.';

COMMENT ON COLUMN public.provider_availability_rules.is_emergency_slot IS
  'Si true, este slot solo aparece para bookings con is_emergency=true. Permite franjas de urgencias dedicadas.';

-- ──────────────────────────────────────────────────────────────
-- Verificación:
--
--   SELECT provider_id, day_of_week, min_lead_time_minutes, max_advance_days
--   FROM provider_availability_rules
--   LIMIT 10;
--
-- Rollback:
--   ALTER TABLE provider_availability_rules
--     DROP COLUMN min_lead_time_minutes,
--     DROP COLUMN max_advance_days,
--     DROP COLUMN is_emergency_slot;
-- ──────────────────────────────────────────────────────────────
