-- ══════════════════════════════════════════════════════════════
-- CC-17 — RPC rpc_get_available_slots_range (Booking V3 Fase 2)
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Contexto (BOOKING_SYSTEM_MASTER_PLAN §14.2 + §25.1):
--   Hoy useAvailableSlots en frontend hace 3 queries paralelas
--   (rules + exceptions + bookings) + cómputo client-side. Problemas:
--     - RLS no puede validar los inputs desde el cliente
--     - Lógica duplicada en 2 lugares (JS y eventualmente backend)
--     - Potencial inconsistencia: un cliente malicioso podría skipear
--       buffer_minutes en su cálculo y pasar un slot inválido a create
--
--   Esta RPC consolida todo en Postgres. Devuelve filas con
--   shape equivalente a ComputedSlot en TS:
--     { slot_date, slot_start, slot_end, capacity, booked, available }
--
--   La función `get_available_slots` ya existe pero solo acepta
--   una fecha puntual (p_target_date). Esta nueva versión acepta
--   rango + respeta min_lead_time_minutes + max_advance_days.
--
-- STABLE + SECURITY DEFINER + search_path fijo → seguro exponer a
-- anon/authenticated (no escribe, solo lee).
--
-- Idempotente: CREATE OR REPLACE.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_get_available_slots_range(
  p_provider_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_service_type TEXT DEFAULT NULL,
  p_is_emergency BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  slot_date DATE,
  slot_start TIME,
  slot_end TIME,
  capacity SMALLINT,
  booked BIGINT,
  available BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz TEXT;
  v_service_duration SMALLINT;
BEGIN
  -- Validaciones básicas de input (defensa en profundidad).
  IF p_provider_id IS NULL OR p_date_from IS NULL OR p_date_to IS NULL THEN
    RETURN;
  END IF;

  IF p_date_to < p_date_from THEN
    RETURN;
  END IF;

  -- Límite de rango: max 90 días. Evita que un cliente pida 2 años.
  IF p_date_to - p_date_from > 90 THEN
    p_date_to := p_date_from + 90;
  END IF;

  -- Timezone del provider (default Santiago si la columna aún no existe).
  SELECT COALESCE(timezone, 'America/Santiago')
    INTO v_tz
  FROM service_providers
  WHERE id = p_provider_id;

  IF v_tz IS NULL THEN
    v_tz := 'America/Santiago';
  END IF;

  -- Duración override si se apunta a un servicio específico.
  IF p_service_type IS NOT NULL THEN
    SELECT duration_minutes INTO v_service_duration
    FROM provider_service_offerings
    WHERE provider_id = p_provider_id
      AND (service_type = p_service_type OR slug = p_service_type)
      AND is_active
    LIMIT 1;
  END IF;

  RETURN QUERY
  WITH
  days AS (
    SELECT generate_series(p_date_from, p_date_to, INTERVAL '1 day')::DATE AS d
  ),
  rules AS (
    SELECT
      r.id,
      r.day_of_week,
      r.start_time,
      r.end_time,
      r.service_type,
      COALESCE(v_service_duration, r.slot_duration_minutes) AS effective_duration,
      r.buffer_minutes,
      r.capacity,
      COALESCE(r.min_lead_time_minutes, 60) AS min_lead_time_minutes,
      COALESCE(r.max_advance_days, 90) AS max_advance_days,
      COALESCE(r.is_emergency_slot, FALSE) AS is_emergency_slot
    FROM provider_availability_rules r
    WHERE r.provider_id = p_provider_id
      AND r.is_active
      AND (
        r.service_type IS NULL
        OR p_service_type IS NULL
        OR r.service_type = p_service_type
      )
      AND (
        p_is_emergency IS NOT NULL
        AND (
          (p_is_emergency AND COALESCE(r.is_emergency_slot, FALSE))
          OR (NOT p_is_emergency AND NOT COALESCE(r.is_emergency_slot, FALSE))
        )
      )
  ),
  exceptions AS (
    SELECT *
    FROM provider_availability_exceptions
    WHERE provider_id = p_provider_id
      AND exception_date BETWEEN p_date_from AND p_date_to
  ),
  -- Genera slots candidatos: cada regla × cada día que matchea day_of_week.
  slot_candidates AS (
    SELECT
      d.d AS slot_dt,
      r.id AS rule_id,
      r.start_time,
      r.end_time,
      r.effective_duration,
      r.buffer_minutes,
      r.capacity,
      r.min_lead_time_minutes,
      r.max_advance_days
    FROM days d
    CROSS JOIN rules r
    WHERE EXTRACT(DOW FROM d.d) = r.day_of_week
      -- Respeta max_advance_days
      AND d.d <= CURRENT_DATE + r.max_advance_days
      -- Excluir días con block de dia completo
      AND NOT EXISTS (
        SELECT 1 FROM exceptions ex
        WHERE ex.exception_date = d.d
          AND ex.exception_type = 'block'
          AND ex.start_time IS NULL
      )
  ),
  -- Expande cada regla en N slots según duración + buffer.
  expanded AS (
    SELECT
      sc.slot_dt,
      sc.start_time + (gs.n * (sc.effective_duration + sc.buffer_minutes) * INTERVAL '1 minute') AS slot_start_time,
      sc.start_time + (gs.n * (sc.effective_duration + sc.buffer_minutes) * INTERVAL '1 minute')
        + (sc.effective_duration * INTERVAL '1 minute') AS slot_end_time,
      sc.effective_duration,
      sc.capacity,
      sc.min_lead_time_minutes
    FROM slot_candidates sc
    CROSS JOIN LATERAL generate_series(
      0,
      GREATEST(0,
        FLOOR(
          EXTRACT(EPOCH FROM (sc.end_time - sc.start_time))::INTEGER
          / NULLIF((sc.effective_duration + sc.buffer_minutes) * 60, 0)
        )::INTEGER - 1
      )
    ) AS gs(n)
  ),
  -- Filtra slots que caen dentro de la ventana de la regla y no colisionan
  -- con bloques parciales.
  valid AS (
    SELECT e.*
    FROM expanded e
    WHERE e.slot_end_time::TIME <= (
      SELECT MAX(r2.end_time) FROM rules r2
    )
      -- Respeta lead time mínimo: timestamp_slot >= now + min_lead_time
      AND ((e.slot_dt::TIMESTAMP + e.slot_start_time::INTERVAL) AT TIME ZONE v_tz)
          >= NOW() + (e.min_lead_time_minutes * INTERVAL '1 minute')
      -- Excluye slots dentro de un bloque parcial de ese día
      AND NOT EXISTS (
        SELECT 1 FROM exceptions ex
        WHERE ex.exception_date = e.slot_dt
          AND ex.exception_type = 'block'
          AND ex.start_time IS NOT NULL
          AND e.slot_start_time::TIME < COALESCE(ex.end_time, '23:59:59'::TIME)
          AND e.slot_end_time::TIME > ex.start_time
      )
  )
  SELECT
    v.slot_dt AS slot_date,
    v.slot_start_time::TIME AS slot_start,
    v.slot_end_time::TIME AS slot_end,
    v.capacity::SMALLINT,
    (
      -- Cuenta bookings existentes que overlap con este slot.
      SELECT COUNT(*)::BIGINT
      FROM v_all_bookings b
      WHERE (
        -- vet_bookings: match por service_provider_id
        (b.kind = 'vet' AND b.service_provider_id = p_provider_id)
        -- otros kinds: match por vet_id (reusamos la columna) cuando el
        -- provider user_id coincide. Si no hay relación, no cuenta.
        OR (
          b.kind IN ('walk', 'training', 'dogsitter')
          AND b.vet_id = (SELECT user_id FROM service_providers WHERE id = p_provider_id)
        )
      )
        AND b.status NOT IN ('cancelado', 'no_show')
        AND b.scheduled_at::DATE = v.slot_dt
        AND (
          -- Si el booking tiene horario, chequear overlap
          (b.start_time IS NOT NULL AND b.end_time IS NOT NULL
           AND b.start_time < v.slot_end_time::TIME
           AND b.end_time > v.slot_start_time::TIME)
          -- Si no tiene horario, asumir que ocupa el día (walks, dogsitter)
          OR (b.start_time IS NULL)
        )
    ) AS booked,
    (
      v.capacity > (
        SELECT COUNT(*)::BIGINT
        FROM v_all_bookings b
        WHERE (
          (b.kind = 'vet' AND b.service_provider_id = p_provider_id)
          OR (
            b.kind IN ('walk', 'training', 'dogsitter')
            AND b.vet_id = (SELECT user_id FROM service_providers WHERE id = p_provider_id)
          )
        )
          AND b.status NOT IN ('cancelado', 'no_show')
          AND b.scheduled_at::DATE = v.slot_dt
          AND (
            (b.start_time IS NOT NULL AND b.end_time IS NOT NULL
             AND b.start_time < v.slot_end_time::TIME
             AND b.end_time > v.slot_start_time::TIME)
            OR (b.start_time IS NULL)
          )
      )
    ) AS available
  FROM valid v
  ORDER BY v.slot_dt, v.slot_start_time;
END;
$$;

-- REVOKE + GRANT explícito (defensa en profundidad).
REVOKE EXECUTE ON FUNCTION public.rpc_get_available_slots_range(UUID, DATE, DATE, TEXT, BOOLEAN) FROM public;
GRANT EXECUTE ON FUNCTION public.rpc_get_available_slots_range(UUID, DATE, DATE, TEXT, BOOLEAN) TO authenticated, anon, service_role;

COMMENT ON FUNCTION public.rpc_get_available_slots_range IS
  'Booking V3: devuelve slots disponibles para un provider en un rango de fechas. Respeta rules, exceptions, bookings existentes, min_lead_time, max_advance_days, emergency flag. Usada por useAvailableSlots (CC-20) como fuente de verdad server-side.';

-- ──────────────────────────────────────────────────────────────
-- Verificación:
--
--   SELECT * FROM rpc_get_available_slots_range(
--     'PROVIDER-UUID'::UUID,
--     CURRENT_DATE,
--     CURRENT_DATE + 7
--   );
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.rpc_get_available_slots_range(UUID, DATE, DATE, TEXT, BOOLEAN);
-- ──────────────────────────────────────────────────────────────
