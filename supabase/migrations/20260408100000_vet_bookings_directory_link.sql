-- ============================================================
-- vet_bookings: link al directorio nuevo (service_providers)
-- 2026-04-08
-- ============================================================
-- Permite crear reservas vinculadas al perfil público del directorio,
-- sin necesidad de que el vet tenga vet_profile (legacy).

-- 1. Agregar service_provider_id (nullable) y permitir vet_id null
ALTER TABLE vet_bookings
  ADD COLUMN IF NOT EXISTS service_provider_id uuid REFERENCES service_providers(id) ON DELETE SET NULL;

ALTER TABLE vet_bookings
  ALTER COLUMN vet_id DROP NOT NULL;

-- visit_address tampoco debería ser obligatorio para reservas que aún no
-- tienen dirección confirmada (el vet la coordina por chat después)
ALTER TABLE vet_bookings
  ALTER COLUMN visit_address DROP NOT NULL;

-- total_price tampoco — se confirma cuando el vet acepta
ALTER TABLE vet_bookings
  ALTER COLUMN total_price DROP NOT NULL;

-- 2. Constraint: o tiene vet_id (legacy) o service_provider_id (directorio)
ALTER TABLE vet_bookings DROP CONSTRAINT IF EXISTS vet_bookings_target_check;
ALTER TABLE vet_bookings
  ADD CONSTRAINT vet_bookings_target_check
  CHECK (vet_id IS NOT NULL OR service_provider_id IS NOT NULL);

-- 3. Índice para que el dashboard del vet pueda buscar por service_provider_id
CREATE INDEX IF NOT EXISTS idx_vet_bookings_service_provider
  ON vet_bookings(service_provider_id, status, scheduled_date DESC)
  WHERE service_provider_id IS NOT NULL;

-- 4. RLS: el dueño del service_provider puede ver las reservas dirigidas a él
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

-- El owner siempre puede ver sus propias reservas (puede ya existir)
DROP POLICY IF EXISTS "Owner can view own bookings" ON vet_bookings;
CREATE POLICY "Owner can view own bookings"
  ON vet_bookings FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Crear booking dirigido al directorio (sin vet_id legacy)
DROP POLICY IF EXISTS "Authenticated can create directory bookings" ON vet_bookings;
CREATE POLICY "Authenticated can create directory bookings"
  ON vet_bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND service_provider_id IS NOT NULL
  );

-- 5. Trigger: al crear booking via directorio, notificar al vet
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
    COALESCE(NEW.symptoms, 'Un dueño solicitó una reserva contigo desde tu perfil público.'),
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
