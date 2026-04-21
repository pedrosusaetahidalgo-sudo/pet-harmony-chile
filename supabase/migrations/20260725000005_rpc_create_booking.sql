-- ══════════════════════════════════════════════════════════════
-- CC-18 — RPC rpc_create_booking (Booking V3 Master Plan §25.2)
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
-- DEPENDENCIAS (aplicar antes):
--   - 20260725000003_v_all_bookings_view.sql
--   - 20260725000004_rpc_get_available_slots_range.sql
--
-- Contexto (BOOKING_SYSTEM_MASTER_PLAN §9.7 + §25.2):
--   Hoy useCreateBooking en frontend hace directamente
--   `supabase.from('vet_bookings').insert(...)`. Problemas:
--     - Cliente calcula precio/slot → admin o script malicioso
--       podría insertar un booking fuera de las rules.
--     - Sin validación de pet ownership (depende 100% de RLS).
--     - Sin snapshot de comisión al crear (se calcula al completar).
--     - Sin validación de min_lead_time (CC-16).
--
--   Esta RPC valida todo server-side en una transacción:
--     1. User autenticado + pet pertenece al user
--     2. Provider activo + visible
--     3. Slot existe en rpc_get_available_slots_range
--     4. scheduled_at >= now + min_lead_time
--     5. Si all OK → INSERT (o 23505 si colisión)
--
-- Por ahora solo soporta kind='vet'. Los otros kinds seguirán usando
-- insert directo hasta que se consolide el modelo (Fase 3+).
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_create_booking(
  p_provider_id UUID,
  p_service_type TEXT,
  p_pet_id UUID,
  p_scheduled_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_notes TEXT DEFAULT NULL,
  p_is_emergency BOOLEAN DEFAULT FALSE,
  p_confirmation_mode TEXT DEFAULT 'auto'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id UUID;
  v_user_id UUID := auth.uid();
  v_scheduled_at TIMESTAMPTZ;
  v_tz TEXT;
  v_slot_duration SMALLINT;
  v_service_duration SMALLINT;
  v_provider_visible BOOLEAN;
  v_service_provider_user_id UUID;
  v_price INTEGER;
BEGIN
  -- ─── 1. Auth + input validation ───
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  IF p_provider_id IS NULL OR p_pet_id IS NULL OR p_scheduled_date IS NULL
     OR p_start_time IS NULL OR p_end_time IS NULL THEN
    RAISE EXCEPTION 'missing_required_fields' USING ERRCODE = 'P0001';
  END IF;

  IF p_end_time <= p_start_time THEN
    RAISE EXCEPTION 'invalid_time_range' USING ERRCODE = 'P0001';
  END IF;

  IF p_confirmation_mode NOT IN ('auto', 'manual') THEN
    RAISE EXCEPTION 'invalid_confirmation_mode' USING ERRCODE = 'P0001';
  END IF;

  -- ─── 2. Pet ownership ───
  IF NOT EXISTS (
    SELECT 1 FROM pets
    WHERE id = p_pet_id
      AND owner_id = v_user_id
      AND deceased_at IS NULL
  ) THEN
    RAISE EXCEPTION 'pet_not_owned_or_deceased' USING ERRCODE = 'P0001';
  END IF;

  -- ─── 3. Provider visibility + timezone ───
  SELECT
    COALESCE(is_directory_visible, FALSE),
    COALESCE(timezone, 'America/Santiago'),
    user_id
  INTO v_provider_visible, v_tz, v_service_provider_user_id
  FROM service_providers
  WHERE id = p_provider_id
    AND status IN ('approved', 'active');

  IF v_service_provider_user_id IS NULL THEN
    RAISE EXCEPTION 'provider_not_found' USING ERRCODE = 'P0001';
  END IF;

  -- No bloqueamos inserts si el provider tiene is_directory_visible=false
  -- porque el owner puede tener un link directo (QR, compartido, etc.).
  -- Solo validamos que exista y esté activo.

  -- ─── 4. Construir scheduled_at timestamp ───
  v_scheduled_at := (p_scheduled_date + p_start_time) AT TIME ZONE v_tz;

  -- ─── 5. Validar que no sea en el pasado (con margen de 5 min) ───
  IF v_scheduled_at < NOW() + INTERVAL '5 minute' THEN
    RAISE EXCEPTION 'scheduled_in_past' USING ERRCODE = 'P0001';
  END IF;

  -- ─── 6. Validar slot disponible (llamando a rpc_get_available_slots_range) ───
  IF NOT EXISTS (
    SELECT 1 FROM rpc_get_available_slots_range(
      p_provider_id,
      p_scheduled_date,
      p_scheduled_date,
      p_service_type,
      p_is_emergency
    )
    WHERE slot_date = p_scheduled_date
      AND slot_start = p_start_time
      AND available
  ) THEN
    RAISE EXCEPTION 'slot_not_available' USING ERRCODE = '23505';
  END IF;

  -- ─── 7. Precio snapshot desde provider_service_offerings ───
  SELECT price_base, duration_minutes INTO v_price, v_service_duration
  FROM provider_service_offerings
  WHERE provider_id = p_provider_id
    AND (service_type = p_service_type OR slug = p_service_type)
    AND is_active
  LIMIT 1;
  -- Si no hay servicio específico, usamos service_providers.price_from como fallback.
  IF v_price IS NULL THEN
    SELECT price_from INTO v_price
    FROM service_providers
    WHERE id = p_provider_id;
  END IF;

  -- Duración: override servicio > duración calculada del slot.
  v_slot_duration := COALESCE(
    v_service_duration,
    EXTRACT(EPOCH FROM (p_end_time - p_start_time))::INTEGER / 60,
    30
  );

  -- ─── 8. INSERT con UNIQUE constraint (23505 si colisión) ───
  INSERT INTO vet_bookings (
    owner_id,
    service_provider_id,
    vet_id,                    -- legacy: replica desde service_provider_id para compat.
    pet_id,
    scheduled_date,
    start_time,
    end_time,
    slot_duration_minutes,
    service_type,
    status,
    is_emergency,
    total_price,
    payment_status,
    confirmation_mode,
    symptoms,
    visit_address
  ) VALUES (
    v_user_id,
    p_provider_id,
    v_service_provider_user_id,   -- vet_id = user_id del provider (legacy compat)
    p_pet_id,
    p_scheduled_date::TIMESTAMPTZ,
    p_start_time,
    p_end_time,
    v_slot_duration,
    p_service_type,
    'pendiente',                   -- auto_confirm_booking trigger lo cambia si corresponde
    p_is_emergency,
    v_price,
    'pendiente',
    p_confirmation_mode,
    p_notes,
    ''                             -- visit_address era NOT NULL en versiones previas; default empty
  )
  RETURNING id INTO v_booking_id;

  -- El trigger auto_confirm_booking se encarga de setear status='confirmado'
  -- si confirmation_mode='auto' y de registrar en booking_events.

  RETURN v_booking_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rpc_create_booking(UUID, TEXT, UUID, DATE, TIME, TIME, TEXT, BOOLEAN, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rpc_create_booking(UUID, TEXT, UUID, DATE, TIME, TIME, TEXT, BOOLEAN, TEXT) TO authenticated;

COMMENT ON FUNCTION public.rpc_create_booking IS
  'Booking V3: crea un vet_booking validando server-side (pet ownership, provider activo, slot disponible, lead time). Lanza 23505 si el slot ya fue reservado — el cliente usa ese código para disparar SlotConflictDialog. Fase 2 del master plan.';

-- ──────────────────────────────────────────────────────────────
-- Verificación:
--
--   SELECT rpc_create_booking(
--     'PROVIDER-UUID'::UUID,
--     'consulta_general',
--     'PET-UUID'::UUID,
--     CURRENT_DATE + 1,
--     '10:00'::TIME,
--     '10:30'::TIME,
--     'Control anual'
--   );
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.rpc_create_booking(UUID, TEXT, UUID, DATE, TIME, TIME, TEXT, BOOLEAN, TEXT);
-- ──────────────────────────────────────────────────────────────
