-- Extiende vet_clinical_notes con link opcional al booking que la origino.
-- Complementa la migracion 20260612000000 (que agrego booking_id a medical_records).
-- Permite cerrar el flujo "Cita completada -> Crear nota clinica" para el rol vet.
--
-- Zero-downtime: columna nullable, sin default.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'vet_clinical_notes') THEN
    ALTER TABLE vet_clinical_notes
      ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES vet_bookings(id) ON DELETE SET NULL;

    COMMENT ON COLUMN vet_clinical_notes.booking_id IS
      'Si la nota clinica del vet se creo desde una cita completada, referencia esa cita. NULL = nota ad-hoc.';

    CREATE INDEX IF NOT EXISTS idx_vet_clinical_notes_booking
      ON vet_clinical_notes (booking_id)
      WHERE booking_id IS NOT NULL;
  END IF;
END $$;
