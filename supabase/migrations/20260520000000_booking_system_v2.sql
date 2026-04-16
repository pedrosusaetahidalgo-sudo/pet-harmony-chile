-- ============================================================
-- Booking System V2: availability rules, exceptions, audit trail
-- 2026-04-16
-- ============================================================

-- ============================================================
-- 0. Prerequisito: asegurar que service_provider_id existe en vet_bookings
--    (deberia venir de 20260408100000 pero por seguridad lo re-creamos)
-- ============================================================
ALTER TABLE vet_bookings ADD COLUMN IF NOT EXISTS service_provider_id UUID REFERENCES service_providers(id) ON DELETE SET NULL;

-- Hacer vet_id, visit_address y total_price nullable (necesario para bookings via directorio)
ALTER TABLE vet_bookings ALTER COLUMN vet_id DROP NOT NULL;
ALTER TABLE vet_bookings ALTER COLUMN visit_address DROP NOT NULL;
ALTER TABLE vet_bookings ALTER COLUMN total_price DROP NOT NULL;

-- Constraint: o tiene vet_id (legacy) o service_provider_id (directorio)
-- (idempotente: drop + re-create)
ALTER TABLE vet_bookings DROP CONSTRAINT IF EXISTS vet_bookings_target_check;
DO $$
BEGIN
  -- Solo agregar si hay al menos una de las columnas nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vet_bookings' AND column_name = 'service_provider_id'
  ) THEN
    ALTER TABLE vet_bookings
      ADD CONSTRAINT vet_bookings_target_check
      CHECK (vet_id IS NOT NULL OR service_provider_id IS NOT NULL);
  END IF;
END $$;

-- Index para dashboard del vet (idempotente)
CREATE INDEX IF NOT EXISTS idx_vet_bookings_service_provider
  ON vet_bookings(service_provider_id, status, scheduled_date DESC)
  WHERE service_provider_id IS NOT NULL;

-- ============================================================
-- 1. provider_availability_rules (reglas semanales recurrentes)
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  service_type TEXT, -- null = todos los servicios
  slot_duration_minutes SMALLINT NOT NULL DEFAULT 30,
  buffer_minutes SMALLINT NOT NULL DEFAULT 0,
  capacity SMALLINT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_duration CHECK (slot_duration_minutes BETWEEN 5 AND 480),
  CONSTRAINT valid_buffer CHECK (buffer_minutes BETWEEN 0 AND 120),
  CONSTRAINT valid_capacity CHECK (capacity BETWEEN 1 AND 20)
);

CREATE INDEX IF NOT EXISTS idx_availability_rules_provider
  ON provider_availability_rules(provider_id, day_of_week)
  WHERE is_active = true;

ALTER TABLE provider_availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider can manage own rules"
  ON provider_availability_rules FOR ALL
  USING (provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid()))
  WITH CHECK (provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view active rules"
  ON provider_availability_rules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role full access to availability rules"
  ON provider_availability_rules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_availability_rules_updated_at
  BEFORE UPDATE ON provider_availability_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. provider_availability_exceptions (bloqueos / aperturas puntuales)
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  exception_type TEXT NOT NULL CHECK (exception_type IN ('block', 'override')),
  start_time TIME, -- null = todo el dia
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_exception_time CHECK (
    (start_time IS NULL AND end_time IS NULL) OR
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_provider_exception
  ON provider_availability_exceptions(provider_id, exception_date, COALESCE(start_time, '00:00:00'::time));

CREATE INDEX IF NOT EXISTS idx_exceptions_provider_date
  ON provider_availability_exceptions(provider_id, exception_date);

ALTER TABLE provider_availability_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider can manage own exceptions"
  ON provider_availability_exceptions FOR ALL
  USING (provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid()))
  WITH CHECK (provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view exceptions"
  ON provider_availability_exceptions FOR SELECT
  USING (true);

CREATE POLICY "Service role full access to availability exceptions"
  ON provider_availability_exceptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3. booking_events (audit trail de transiciones de estado)
-- ============================================================
CREATE TABLE IF NOT EXISTS booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_type TEXT NOT NULL, -- 'vet', 'walk', 'dogsitter', 'training', 'generic'
  booking_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'confirmed', 'cancelled_by_owner', 'cancelled_by_provider',
    'rescheduled', 'in_progress', 'completed', 'no_show', 'reviewed',
    'payment_received', 'payment_refunded', 'reminder_sent', 'en_camino'
  )),
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT CHECK (actor_role IN ('owner', 'provider', 'admin', 'system')),
  previous_status TEXT,
  new_status TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_events_lookup
  ON booking_events(booking_type, booking_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_events_actor
  ON booking_events(actor_id);

ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view booking events"
  ON booking_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert booking events"
  ON booking_events FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

CREATE POLICY "Service role full access to booking events"
  ON booking_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. Extender vet_bookings con columnas para V2
-- ============================================================

-- Hora de inicio/fin especifica (complementa scheduled_date)
ALTER TABLE vet_bookings ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE vet_bookings ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE vet_bookings ADD COLUMN IF NOT EXISTS slot_duration_minutes SMALLINT DEFAULT 30;

-- Modo de confirmacion
ALTER TABLE vet_bookings ADD COLUMN IF NOT EXISTS confirmation_mode TEXT DEFAULT 'auto';

-- Timestamp de confirmacion
ALTER TABLE vet_bookings ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Reprogramacion: link al booking original
ALTER TABLE vet_bookings ADD COLUMN IF NOT EXISTS rescheduled_from UUID;

-- Recordatorios enviados
ALTER TABLE vet_bookings ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT false;
ALTER TABLE vet_bookings ADD COLUMN IF NOT EXISTS reminder_2h_sent BOOLEAN DEFAULT false;

-- Google Calendar event ID
ALTER TABLE vet_bookings ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Extender CHECK de status para incluir 'no_show' y 'en_camino'
-- Primero drop el constraint existente, luego recrear
ALTER TABLE vet_bookings DROP CONSTRAINT IF EXISTS vet_bookings_status_check;
ALTER TABLE vet_bookings
  ADD CONSTRAINT vet_bookings_status_check
  CHECK (status IN ('pendiente', 'confirmado', 'en_camino', 'en_curso', 'completado', 'cancelado', 'no_show'));

-- Index para recordatorios pendientes
CREATE INDEX IF NOT EXISTS idx_vet_bookings_reminder
  ON vet_bookings(scheduled_date, reminder_24h_sent, reminder_2h_sent)
  WHERE status IN ('pendiente', 'confirmado');

-- Index para busqueda por fecha (calendar)
CREATE INDEX IF NOT EXISTS idx_vet_bookings_date_status
  ON vet_bookings(scheduled_date, status);

-- ============================================================
-- 5. RLS para vet_bookings (re-creacion defensiva)
-- ============================================================

-- SELECT: el provider puede ver bookings dirigidas a el
DROP POLICY IF EXISTS "Provider can view directory bookings" ON vet_bookings;
CREATE POLICY "Provider can view directory bookings"
  ON vet_bookings FOR SELECT
  TO authenticated
  USING (
    service_provider_id IS NOT NULL
    AND service_provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );

-- SELECT: el owner siempre puede ver sus propias reservas
DROP POLICY IF EXISTS "Owner can view own bookings" ON vet_bookings;
CREATE POLICY "Owner can view own bookings"
  ON vet_bookings FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- INSERT: crear booking dirigido al directorio
DROP POLICY IF EXISTS "Authenticated can create directory bookings" ON vet_bookings;
CREATE POLICY "Authenticated can create directory bookings"
  ON vet_bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND service_provider_id IS NOT NULL
  );

-- UPDATE: provider puede actualizar status
DROP POLICY IF EXISTS "Provider can update own bookings status" ON vet_bookings;
CREATE POLICY "Provider can update own bookings status"
  ON vet_bookings FOR UPDATE
  TO authenticated
  USING (
    service_provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
    OR vet_id = auth.uid()
  )
  WITH CHECK (
    service_provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
    OR vet_id = auth.uid()
  );

DROP POLICY IF EXISTS "Owner can update own bookings" ON vet_bookings;
CREATE POLICY "Owner can update own bookings"
  ON vet_bookings FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Trigger: notificar al vet cuando recibe booking via directorio (idempotente)
CREATE OR REPLACE FUNCTION notify_provider_on_directory_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NEW.service_provider_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_user_id
  FROM service_providers
  WHERE id = NEW.service_provider_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
  VALUES (
    v_user_id,
    'booking_received',
    'Nueva solicitud de reserva',
    COALESCE(NEW.symptoms, 'Un dueno solicito una reserva contigo desde tu perfil publico.'),
    '/provider/dashboard',
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_directory_booking ON vet_bookings;
CREATE TRIGGER notify_on_directory_booking
  AFTER INSERT ON vet_bookings
  FOR EACH ROW
  WHEN (NEW.service_provider_id IS NOT NULL)
  EXECUTE FUNCTION notify_provider_on_directory_booking();

-- ============================================================
-- 6. Extender walk_bookings con columnas V2
-- ============================================================
ALTER TABLE walk_bookings ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE walk_bookings ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE walk_bookings ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE walk_bookings ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT false;
ALTER TABLE walk_bookings ADD COLUMN IF NOT EXISTS reminder_2h_sent BOOLEAN DEFAULT false;
ALTER TABLE walk_bookings ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- ============================================================
-- 7. Extender dogsitter_bookings con columnas V2
-- ============================================================
ALTER TABLE dogsitter_bookings ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE dogsitter_bookings ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT false;
ALTER TABLE dogsitter_bookings ADD COLUMN IF NOT EXISTS reminder_2h_sent BOOLEAN DEFAULT false;
ALTER TABLE dogsitter_bookings ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- ============================================================
-- 8. Extender training_bookings con columnas V2
-- ============================================================
ALTER TABLE training_bookings ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE training_bookings ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE training_bookings ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE training_bookings ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT false;
ALTER TABLE training_bookings ADD COLUMN IF NOT EXISTS reminder_2h_sent BOOLEAN DEFAULT false;
ALTER TABLE training_bookings ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- ============================================================
-- 9. Vista unificada all_bookings_view (read-only, cross-type)
-- ============================================================
CREATE OR REPLACE VIEW all_bookings_view AS
SELECT
  id, 'vet'::text AS booking_type, owner_id,
  COALESCE(service_provider_id, vet_id) AS provider_id,
  pet_id, ARRAY[pet_id] AS pet_ids,
  scheduled_date, start_time, end_time,
  service_type, status, total_price, payment_status, is_emergency,
  confirmed_at, canceled_at, cancellation_reason,
  reminder_24h_sent, reminder_2h_sent, google_event_id,
  created_at, updated_at
FROM vet_bookings

UNION ALL

SELECT
  id, 'walk'::text, owner_id, walker_id,
  NULL::uuid, pet_ids,
  scheduled_date, start_time, end_time,
  service_type, status, total_price, payment_status, false,
  confirmed_at, canceled_at, cancellation_reason,
  reminder_24h_sent, reminder_2h_sent, google_event_id,
  created_at, updated_at
FROM walk_bookings

UNION ALL

SELECT
  id, 'dogsitter'::text, owner_id, dogsitter_id,
  NULL::uuid, pet_ids,
  start_date, NULL::time, NULL::time,
  service_type, status, total_price, payment_status, false,
  confirmed_at, canceled_at, cancellation_reason,
  reminder_24h_sent, reminder_2h_sent, google_event_id,
  created_at, updated_at
FROM dogsitter_bookings

UNION ALL

SELECT
  id, 'training'::text, owner_id, trainer_id,
  pet_id, ARRAY[pet_id],
  scheduled_date, start_time, end_time,
  training_type, status, total_price, payment_status, false,
  confirmed_at, canceled_at, cancellation_reason,
  reminder_24h_sent, reminder_2h_sent, google_event_id,
  created_at, updated_at
FROM training_bookings;

-- ============================================================
-- 10. Trigger: auto-confirm bookings con confirmation_mode='auto'
-- ============================================================
CREATE OR REPLACE FUNCTION auto_confirm_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.confirmation_mode = 'auto' AND NEW.status = 'pendiente' THEN
    NEW.status := 'confirmado';
    NEW.confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_confirm_vet_booking ON vet_bookings;
CREATE TRIGGER auto_confirm_vet_booking
  BEFORE INSERT ON vet_bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_booking();

-- ============================================================
-- 11. Trigger: log booking creation en booking_events
-- ============================================================
CREATE OR REPLACE FUNCTION log_booking_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO booking_events (booking_type, booking_id, event_type, actor_id, actor_role, new_status)
  VALUES (
    TG_ARGV[0],
    NEW.id,
    'created',
    COALESCE(NEW.owner_id, auth.uid()),
    'owner',
    NEW.status
  );

  -- Si auto-confirmed, log tambien
  IF NEW.status = 'confirmado' THEN
    INSERT INTO booking_events (booking_type, booking_id, event_type, actor_id, actor_role, previous_status, new_status)
    VALUES (
      TG_ARGV[0],
      NEW.id,
      'confirmed',
      NULL,
      'system',
      'pendiente',
      'confirmado'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_vet_booking_created ON vet_bookings;
CREATE TRIGGER log_vet_booking_created
  AFTER INSERT ON vet_bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_created('vet');

DROP TRIGGER IF EXISTS log_walk_booking_created ON walk_bookings;
CREATE TRIGGER log_walk_booking_created
  AFTER INSERT ON walk_bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_created('walk');

DROP TRIGGER IF EXISTS log_dogsitter_booking_created ON dogsitter_bookings;
CREATE TRIGGER log_dogsitter_booking_created
  AFTER INSERT ON dogsitter_bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_created('dogsitter');

DROP TRIGGER IF EXISTS log_training_booking_created ON training_bookings;
CREATE TRIGGER log_training_booking_created
  AFTER INSERT ON training_bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_created('training');

-- ============================================================
-- 12. Trigger: log status changes en booking_events
-- ============================================================
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_type text;
  v_actor_role text;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Determinar event_type basado en nuevo status
  v_event_type := CASE NEW.status
    WHEN 'confirmado' THEN 'confirmed'
    WHEN 'en_camino' THEN 'en_camino'
    WHEN 'en_curso' THEN 'in_progress'
    WHEN 'completado' THEN 'completed'
    WHEN 'cancelado' THEN
      CASE WHEN NEW.canceled_by = OLD.owner_id THEN 'cancelled_by_owner'
      ELSE 'cancelled_by_provider'
      END
    WHEN 'no_show' THEN 'no_show'
    ELSE 'confirmed' -- fallback
  END;

  -- Determinar actor_role
  v_actor_role := CASE
    WHEN auth.uid() = OLD.owner_id THEN 'owner'
    ELSE 'provider'
  END;

  INSERT INTO booking_events (booking_type, booking_id, event_type, actor_id, actor_role, previous_status, new_status)
  VALUES (
    TG_ARGV[0],
    NEW.id,
    v_event_type,
    auth.uid(),
    v_actor_role,
    OLD.status,
    NEW.status
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_vet_booking_status ON vet_bookings;
CREATE TRIGGER log_vet_booking_status
  AFTER UPDATE OF status ON vet_bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_status_change('vet');

DROP TRIGGER IF EXISTS log_walk_booking_status ON walk_bookings;
CREATE TRIGGER log_walk_booking_status
  AFTER UPDATE OF status ON walk_bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_status_change('walk');

DROP TRIGGER IF EXISTS log_dogsitter_booking_status ON dogsitter_bookings;
CREATE TRIGGER log_dogsitter_booking_status
  AFTER UPDATE OF status ON dogsitter_bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_status_change('dogsitter');

DROP TRIGGER IF EXISTS log_training_booking_status ON training_bookings;
CREATE TRIGGER log_training_booking_status
  AFTER UPDATE OF status ON training_bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_status_change('training');
