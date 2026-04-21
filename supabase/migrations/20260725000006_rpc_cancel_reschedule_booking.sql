-- ══════════════════════════════════════════════════════════════
-- CC-19 — RPCs rpc_cancel_booking + rpc_reschedule_booking
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
-- DEPENDENCIAS: 20260725000004_rpc_get_available_slots_range.sql
--
-- Contexto (BOOKING_SYSTEM_MASTER_PLAN §25.3):
--   Cancel y reschedule hoy se hacen con UPDATE directo desde el
--   cliente. Problemas:
--     - Cliente decide si el booking puede transicionar (state machine
--       client-side solo informa UI, no enforce)
--     - RLS permite el UPDATE pero no valida la transición semantica
--     - Side effects (notify, google_sync) quedan sueltos al cliente
--
--   Estas RPCs validan server-side y delegan audit trail al trigger
--   existente `log_booking_status_change`.
--
-- Por ahora solo cubre kind='vet' (tabla vet_bookings). Los otros
-- kinds mantienen su path actual hasta Fase 3+.
-- ══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- rpc_cancel_booking
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rpc_cancel_booking(
  p_booking_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_booking RECORD;
  v_actor_role TEXT;
  v_hours_until NUMERIC;
  v_grace_hours NUMERIC;
  v_provider_user_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  -- Cargar booking + provider user_id.
  SELECT
    b.*,
    sp.user_id AS sp_user_id
  INTO v_booking
  FROM vet_bookings b
  LEFT JOIN service_providers sp ON sp.id = b.service_provider_id
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking_not_found' USING ERRCODE = 'P0001';
  END IF;

  -- Determinar rol del actor.
  IF v_user_id = v_booking.owner_id THEN
    v_actor_role := 'owner';
    v_grace_hours := 2;
  ELSIF v_user_id = v_booking.sp_user_id OR v_user_id = v_booking.vet_id THEN
    v_actor_role := 'provider';
    v_grace_hours := 24;
  ELSIF EXISTS (SELECT 1 FROM admin_access WHERE user_id = v_user_id AND is_active) THEN
    v_actor_role := 'admin';
    v_grace_hours := 0;  -- admin sin restricción
  ELSE
    RAISE EXCEPTION 'not_authorized_for_booking' USING ERRCODE = 'P0001';
  END IF;

  -- Validar transición permitida por state machine.
  IF v_booking.status IN ('completado', 'cancelado', 'no_show') THEN
    RAISE EXCEPTION 'cannot_cancel_terminal_status' USING ERRCODE = 'P0001';
  END IF;

  -- Validar grace window: si está fuera, requiere motivo.
  v_hours_until := EXTRACT(EPOCH FROM (v_booking.scheduled_date - NOW())) / 3600;

  IF v_actor_role != 'admin'
     AND v_hours_until < v_grace_hours
     AND (p_reason IS NULL OR trim(p_reason) = '') THEN
    RAISE EXCEPTION 'reason_required_outside_grace' USING ERRCODE = 'P0001';
  END IF;

  -- UPDATE atómico. El trigger log_booking_status_change registra el evento.
  UPDATE vet_bookings
  SET
    status = 'cancelado',
    canceled_at = NOW(),
    canceled_by = v_user_id,
    cancellation_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_booking_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rpc_cancel_booking(UUID, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rpc_cancel_booking(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.rpc_cancel_booking IS
  'Booking V3: cancela un vet_booking validando state machine + grace windows por rol (owner=2h, provider=24h). Lanza reason_required_outside_grace si aplica.';

-- ──────────────────────────────────────────────────────────────
-- rpc_reschedule_booking
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rpc_reschedule_booking(
  p_booking_id UUID,
  p_new_date DATE,
  p_new_start_time TIME,
  p_new_end_time TIME
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_booking RECORD;
  v_actor_role TEXT;
  v_hours_until NUMERIC;
  v_grace_hours NUMERIC;
  v_new_scheduled_at TIMESTAMPTZ;
  v_tz TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  IF p_new_start_time IS NULL OR p_new_end_time IS NULL OR p_new_date IS NULL THEN
    RAISE EXCEPTION 'missing_required_fields' USING ERRCODE = 'P0001';
  END IF;

  IF p_new_end_time <= p_new_start_time THEN
    RAISE EXCEPTION 'invalid_time_range' USING ERRCODE = 'P0001';
  END IF;

  SELECT
    b.*,
    sp.user_id AS sp_user_id,
    COALESCE(sp.timezone, 'America/Santiago') AS sp_tz
  INTO v_booking
  FROM vet_bookings b
  LEFT JOIN service_providers sp ON sp.id = b.service_provider_id
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking_not_found' USING ERRCODE = 'P0001';
  END IF;

  v_tz := v_booking.sp_tz;

  -- Rol del actor.
  IF v_user_id = v_booking.owner_id THEN
    v_actor_role := 'owner';
    v_grace_hours := 24;   -- reschedule más estricto: 24h para owner
  ELSIF v_user_id = v_booking.sp_user_id OR v_user_id = v_booking.vet_id THEN
    v_actor_role := 'provider';
    v_grace_hours := 12;
  ELSIF EXISTS (SELECT 1 FROM admin_access WHERE user_id = v_user_id AND is_active) THEN
    v_actor_role := 'admin';
    v_grace_hours := 0;
  ELSE
    RAISE EXCEPTION 'not_authorized_for_booking' USING ERRCODE = 'P0001';
  END IF;

  -- Solo se reprograman bookings no terminales.
  IF v_booking.status IN ('completado', 'cancelado', 'no_show', 'en_curso') THEN
    RAISE EXCEPTION 'cannot_reschedule_in_current_status' USING ERRCODE = 'P0001';
  END IF;

  v_hours_until := EXTRACT(EPOCH FROM (v_booking.scheduled_date - NOW())) / 3600;

  IF v_actor_role != 'admin' AND v_hours_until < v_grace_hours THEN
    RAISE EXCEPTION 'outside_reschedule_grace' USING ERRCODE = 'P0001';
  END IF;

  -- Validar slot nuevo disponible.
  IF NOT EXISTS (
    SELECT 1 FROM rpc_get_available_slots_range(
      v_booking.service_provider_id,
      p_new_date,
      p_new_date,
      v_booking.service_type,
      v_booking.is_emergency
    )
    WHERE slot_date = p_new_date
      AND slot_start = p_new_start_time
      AND available
  ) THEN
    RAISE EXCEPTION 'new_slot_not_available' USING ERRCODE = '23505';
  END IF;

  v_new_scheduled_at := (p_new_date + p_new_start_time) AT TIME ZONE v_tz;

  UPDATE vet_bookings
  SET
    scheduled_date = v_new_scheduled_at,
    start_time = p_new_start_time,
    end_time = p_new_end_time,
    rescheduled_from = p_booking_id,
    -- Reset de reminders: se deben volver a enviar para la fecha nueva.
    reminder_24h_sent = FALSE,
    reminder_2h_sent = FALSE,
    updated_at = NOW()
  WHERE id = p_booking_id;

  -- Log explícito del rescheduled: el trigger de status no se dispara
  -- porque status no cambió. Inserción directa en booking_events.
  INSERT INTO booking_events (
    booking_type, booking_id, event_type, actor_id, actor_role,
    previous_status, new_status, metadata
  ) VALUES (
    'vet',
    p_booking_id,
    'rescheduled',
    v_user_id,
    v_actor_role,
    v_booking.status,
    v_booking.status,
    jsonb_build_object(
      'previous_scheduled_date', v_booking.scheduled_date,
      'previous_start_time', v_booking.start_time,
      'previous_end_time', v_booking.end_time,
      'new_scheduled_date', v_new_scheduled_at,
      'new_start_time', p_new_start_time,
      'new_end_time', p_new_end_time
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rpc_reschedule_booking(UUID, DATE, TIME, TIME) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rpc_reschedule_booking(UUID, DATE, TIME, TIME) TO authenticated;

COMMENT ON FUNCTION public.rpc_reschedule_booking IS
  'Booking V3: reprograma un vet_booking validando state machine, grace window (owner=24h, provider=12h) y slot nuevo disponible. Registra evento rescheduled en booking_events con metadata antes/después.';

-- ──────────────────────────────────────────────────────────────
-- Verificación:
--
--   SELECT rpc_cancel_booking('BOOKING-UUID'::UUID, 'motivo test');
--   SELECT rpc_reschedule_booking(
--     'BOOKING-UUID'::UUID,
--     CURRENT_DATE + 3,
--     '14:00'::TIME,
--     '14:30'::TIME
--   );
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.rpc_cancel_booking(UUID, TEXT);
--   DROP FUNCTION IF EXISTS public.rpc_reschedule_booking(UUID, DATE, TIME, TIME);
-- ──────────────────────────────────────────────────────────────
