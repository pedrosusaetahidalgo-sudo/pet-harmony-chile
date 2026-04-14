-- Agregar campos de lote y serie a registros medicos (feedback Sofia — auditorias SAG)
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.

ALTER TABLE medical_records
  ADD COLUMN IF NOT EXISTS batch_number TEXT,
  ADD COLUMN IF NOT EXISTS serial_number TEXT;

COMMENT ON COLUMN medical_records.batch_number IS 'Numero de lote de la vacuna o antiparasitario';
COMMENT ON COLUMN medical_records.serial_number IS 'Numero de serie de la vacuna o antiparasitario';
