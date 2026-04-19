-- Booking ↔ Medical record link + follow-up tracking + notas privadas.
-- Fase 2 del Booking System Overhaul (docs-specs/BOOKING_SYSTEM_OVERHAUL_PLAN.md §12.3).
--
-- Zero-downtime: todas las columnas agregadas son nullable con default NULL.
-- No modifica datos existentes; backward-compatible con clientes sin refrescar.

-- ─── 1. vet_bookings: notas privadas del vet + FK a follow-up + FK a ficha ───

ALTER TABLE vet_bookings
  ADD COLUMN IF NOT EXISTS private_notes TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_booking_id UUID REFERENCES vet_bookings(id) ON DELETE SET NULL;

COMMENT ON COLUMN vet_bookings.private_notes IS
  'Notas internas del vet NO visibles al dueno. Ej: observaciones clinicas rapidas antes de crear la nota formal.';

COMMENT ON COLUMN vet_bookings.started_at IS
  'Timestamp cuando el vet inicia la atencion (status pasa a en_curso). Usado para metricas de duracion real.';

COMMENT ON COLUMN vet_bookings.follow_up_booking_id IS
  'Link a la cita de seguimiento si el vet programa un control al completar.';

CREATE INDEX IF NOT EXISTS idx_vet_bookings_follow_up
  ON vet_bookings (follow_up_booking_id)
  WHERE follow_up_booking_id IS NOT NULL;

-- ─── 2. medical_records: link a booking que origino la nota ───

-- Verifico que la tabla medical_records exista antes de tocarla.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'medical_records') THEN
    -- Agrega columnas (idempotente)
    ALTER TABLE medical_records
      ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES vet_bookings(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'vet'
        CHECK (booking_type IS NULL OR booking_type IN ('vet', 'generic'));

    COMMENT ON COLUMN medical_records.booking_id IS
      'Si la nota clinica se creo desde una cita completada, referencia esa cita. NULL = nota adhoc.';

    COMMENT ON COLUMN medical_records.booking_type IS
      'Tabla de booking a la que pertenece booking_id. Actualmente solo vet_bookings; futuro: walk/training.';

    -- Index para busquedas del tipo "dame todas las notas de esta cita"
    CREATE INDEX IF NOT EXISTS idx_medical_records_booking
      ON medical_records (booking_id)
      WHERE booking_id IS NOT NULL;
  END IF;
END $$;

-- ─── 3. Trigger: started_at auto-set cuando status pasa a en_curso ───

CREATE OR REPLACE FUNCTION public.set_vet_booking_started_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'en_curso' AND (OLD.status IS DISTINCT FROM 'en_curso') THEN
    IF NEW.started_at IS NULL THEN
      NEW.started_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vet_booking_started_at ON vet_bookings;
CREATE TRIGGER trg_vet_booking_started_at
  BEFORE UPDATE OF status ON vet_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_vet_booking_started_at();

COMMENT ON FUNCTION public.set_vet_booking_started_at() IS
  'Setea started_at automaticamente cuando la cita pasa a en_curso (si no fue seteado manualmente).';
