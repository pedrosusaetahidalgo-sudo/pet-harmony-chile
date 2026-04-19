-- RPCs centralizadas para el booking system (Fase 2 §11.2 del Overhaul Plan).
-- Proveen transicion de estado validada + calculo de slots server-side.
-- Todas SECURITY DEFINER con checks explicitos de auth + rol.
--
-- Zero-downtime: funciones nuevas, no reemplazan codigo existente todavia.
-- Los hooks pueden migrar gradualmente a consumir estas RPCs.

-- ══════════════════════════════════════════════════════════════════════════
-- 1. RPC transition_booking
-- Valida la transicion, actualiza status + timestamps derivados,
-- y registra en booking_events. Todo en una transaccion atomica.
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.transition_booking(
  p_booking_type TEXT,
  p_booking_id UUID,
  p_new_status TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_booking RECORD;
  v_actor_role TEXT;
  v_event_type TEXT;
  v_table TEXT;
  v_provider_col TEXT;
  v_update_sql TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING HINT = 'No autenticado';
  END IF;

  -- Validate booking_type
  IF p_booking_type NOT IN ('vet', 'walk', 'dogsitter', 'training') THEN
    RAISE EXCEPTION 'invalid_booking_type: %', p_booking_type;
  END IF;

  -- Validate new_status
  IF p_new_status NOT IN ('pendiente', 'confirmado', 'en_camino', 'en_curso', 'completado', 'cancelado', 'no_show') THEN
    RAISE EXCEPTION 'invalid_status: %', p_new_status;
  END IF;

  -- Map booking_type to table + provider column
  v_table := CASE p_booking_type
    WHEN 'vet' THEN 'vet_bookings'
    WHEN 'walk' THEN 'walk_bookings'
    WHEN 'dogsitter' THEN 'dogsitter_bookings'
    WHEN 'training' THEN 'training_bookings'
  END;
  v_provider_col := CASE p_booking_type
    WHEN 'vet' THEN 'service_provider_id'
    WHEN 'walk' THEN 'walker_id'
    WHEN 'dogsitter' THEN 'dogsitter_id'
    WHEN 'training' THEN 'trainer_id'
  END;

  -- Fetch booking (dynamic SQL because table varies)
  EXECUTE format(
    'SELECT id, owner_id, %I AS provider_id_val, status, scheduled_date FROM %I WHERE id = $1',
    v_provider_col, v_table
  )
  INTO v_booking
  USING p_booking_id;

  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'booking_not_found: %', p_booking_id;
  END IF;

  -- Detect actor role
  SELECT EXISTS (
    SELECT 1 FROM public.admin_access WHERE user_id = v_user_id AND is_active = true
  ) INTO v_is_admin;

  IF v_is_admin THEN
    v_actor_role := 'admin';
  ELSIF v_booking.owner_id = v_user_id THEN
    v_actor_role := 'owner';
  ELSE
    -- Check if current user is the provider (via service_providers.user_id)
    PERFORM 1 FROM public.service_providers
      WHERE id = v_booking.provider_id_val AND user_id = v_user_id;
    IF FOUND THEN
      v_actor_role := 'provider';
    ELSE
      RAISE EXCEPTION 'not_authorized' USING HINT = 'No eres owner, provider ni admin de esta reserva.';
    END IF;
  END IF;

  -- Validate transition (reflejo de bookingStateMachine.ts)
  -- Reglas: misma tabla que VALID_TRANSITIONS en el frontend.
  IF NOT (
    (v_booking.status = 'pendiente' AND p_new_status = 'confirmado' AND v_actor_role IN ('provider', 'admin')) OR
    (v_booking.status = 'pendiente' AND p_new_status = 'cancelado') OR
    (v_booking.status = 'confirmado' AND p_new_status = 'en_camino' AND v_actor_role IN ('provider', 'admin')) OR
    (v_booking.status = 'confirmado' AND p_new_status = 'en_curso' AND v_actor_role IN ('provider', 'admin')) OR
    (v_booking.status = 'confirmado' AND p_new_status = 'cancelado') OR
    (v_booking.status = 'confirmado' AND p_new_status = 'no_show' AND v_actor_role IN ('provider', 'admin')) OR
    (v_booking.status = 'en_camino' AND p_new_status = 'en_curso' AND v_actor_role IN ('provider', 'admin')) OR
    (v_booking.status = 'en_camino' AND p_new_status = 'cancelado') OR
    (v_booking.status = 'en_curso' AND p_new_status = 'completado' AND v_actor_role IN ('provider', 'admin'))
  ) THEN
    RAISE EXCEPTION 'invalid_transition' USING
      DETAIL = format('%s -> %s no permitido para rol %s', v_booking.status, p_new_status, v_actor_role);
  END IF;

  -- Map new status to booking_event event_type
  v_event_type := CASE p_new_status
    WHEN 'confirmado' THEN 'confirmed'
    WHEN 'en_camino' THEN 'en_camino'
    WHEN 'en_curso' THEN 'in_progress'
    WHEN 'completado' THEN 'completed'
    WHEN 'no_show' THEN 'no_show'
    WHEN 'cancelado' THEN
      CASE v_actor_role
        WHEN 'owner' THEN 'cancelled_by_owner'
        ELSE 'cancelled_by_provider'
      END
    ELSE 'confirmed'
  END;

  -- Update booking status + timestamps
  v_update_sql := format(
    'UPDATE %I SET status = $1, updated_at = NOW()',
    v_table
  );
  IF p_new_status = 'confirmado' THEN
    v_update_sql := v_update_sql || ', confirmed_at = COALESCE(confirmed_at, NOW())';
  ELSIF p_new_status = 'cancelado' THEN
    v_update_sql := v_update_sql || ', canceled_at = NOW(), canceled_by = $3';
  ELSIF p_new_status = 'completado' THEN
    v_update_sql := v_update_sql || ', completed_at = NOW()';
  END IF;
  v_update_sql := v_update_sql || ' WHERE id = $2';

  IF p_new_status = 'cancelado' THEN
    EXECUTE v_update_sql USING p_new_status, p_booking_id, v_user_id;
  ELSE
    EXECUTE v_update_sql USING p_new_status, p_booking_id;
  END IF;

  -- Log en booking_events
  INSERT INTO public.booking_events (
    booking_type,
    booking_id,
    event_type,
    actor_id,
    actor_role,
    previous_status,
    new_status,
    metadata
  ) VALUES (
    p_booking_type,
    p_booking_id,
    v_event_type,
    v_user_id,
    v_actor_role,
    v_booking.status,
    p_new_status,
    p_metadata
  );

  RETURN jsonb_build_object(
    'ok', true,
    'booking_id', p_booking_id,
    'previous_status', v_booking.status,
    'new_status', p_new_status,
    'event_type', v_event_type,
    'actor_role', v_actor_role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.transition_booking(TEXT, UUID, TEXT, JSONB) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.transition_booking(TEXT, UUID, TEXT, JSONB) FROM anon, PUBLIC;

COMMENT ON FUNCTION public.transition_booking(TEXT, UUID, TEXT, JSONB) IS
  'Valida y ejecuta transicion de estado de un booking, con logging en booking_events. Rol del actor se detecta automaticamente (owner/provider/admin). Lanza invalid_transition si la transicion no esta permitida por la state machine.';

-- ══════════════════════════════════════════════════════════════════════════
-- 2. RPC get_available_slots
-- Computa slots disponibles para un provider en una fecha, considerando
-- reglas + excepciones + bookings existentes. Movimiento de logica del
-- cliente al server (§11.2 T7 del Overhaul Plan).
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_provider_id UUID,
  p_target_date DATE,
  p_service_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  slot_date DATE,
  start_time TIME,
  end_time TIME,
  capacity SMALLINT,
  booked_count INT,
  is_available BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day_of_week SMALLINT := EXTRACT(DOW FROM p_target_date)::SMALLINT;
  v_full_day_block BOOLEAN;
BEGIN
  -- Check full-day block exception
  SELECT EXISTS (
    SELECT 1 FROM provider_availability_exceptions
    WHERE provider_id = p_provider_id
      AND exception_date = p_target_date
      AND exception_type = 'block'
      AND start_time IS NULL
  ) INTO v_full_day_block;

  IF v_full_day_block THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH applicable_rules AS (
    SELECT r.*
    FROM provider_availability_rules r
    WHERE r.provider_id = p_provider_id
      AND r.is_active = true
      AND r.day_of_week = v_day_of_week
      AND (p_service_type IS NULL OR r.service_type IS NULL OR r.service_type = p_service_type)
  ),
  partial_blocks AS (
    SELECT start_time AS block_start, end_time AS block_end
    FROM provider_availability_exceptions
    WHERE provider_id = p_provider_id
      AND exception_date = p_target_date
      AND exception_type = 'block'
      AND start_time IS NOT NULL
  ),
  existing_bookings AS (
    SELECT start_time::TIME AS book_start, end_time::TIME AS book_end
    FROM vet_bookings
    WHERE service_provider_id = p_provider_id
      AND scheduled_date = p_target_date
      AND status NOT IN ('cancelado', 'no_show')
      AND start_time IS NOT NULL
  ),
  -- Genera slots por cada regla
  generated AS (
    SELECT
      p_target_date AS s_date,
      gs AS s_start,
      gs + (r.slot_duration_minutes * INTERVAL '1 minute') AS s_end_ts,
      r.capacity AS s_capacity,
      r.buffer_minutes AS s_buffer
    FROM applicable_rules r
    CROSS JOIN LATERAL (
      SELECT generate_series(
        r.start_time::TIME,
        r.end_time::TIME - (r.slot_duration_minutes * INTERVAL '1 minute'),
        (r.slot_duration_minutes + r.buffer_minutes) * INTERVAL '1 minute'
      ) AS gs
    ) t
  ),
  slots AS (
    SELECT
      s_date,
      s_start::TIME AS s_start_time,
      s_end_ts::TIME AS s_end_time,
      s_capacity,
      (SELECT COUNT(*)::INT FROM existing_bookings eb
        WHERE (eb.book_start, eb.book_end) OVERLAPS (s_start::TIME, s_end_ts::TIME)
      ) AS s_booked,
      -- Blocked si algun partial_block overlapa con el slot
      EXISTS (
        SELECT 1 FROM partial_blocks pb
        WHERE (pb.block_start, pb.block_end) OVERLAPS (s_start::TIME, s_end_ts::TIME)
      ) AS s_blocked
    FROM generated
  )
  SELECT
    s_date,
    s_start_time,
    s_end_time,
    s_capacity,
    s_booked,
    (NOT s_blocked AND s_booked < s_capacity)
  FROM slots
  ORDER BY s_start_time;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_slots(UUID, DATE, TEXT) TO authenticated, anon;

COMMENT ON FUNCTION public.get_available_slots(UUID, DATE, TEXT) IS
  'Retorna slots horarios disponibles para un provider en una fecha. Usa provider_availability_rules + provider_availability_exceptions + vet_bookings (no canceladas). Expuesta a anon para permitir reservar antes de login (landings publicas).';
