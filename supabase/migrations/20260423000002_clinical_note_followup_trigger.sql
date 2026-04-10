-- Agregar columnas de seguimiento a vet_clinical_notes + trigger auto-recordatorio.
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.

-- 1. Agregar columnas necesarias para seguimiento
ALTER TABLE public.vet_clinical_notes
  ADD COLUMN IF NOT EXISTS followup_required BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS followup_date DATE,
  ADD COLUMN IF NOT EXISTS followup_reason TEXT,
  ADD COLUMN IF NOT EXISTS consultation_date DATE DEFAULT CURRENT_DATE;

-- 2. Trigger que auto-crea recordatorio cuando vet marca seguimiento
CREATE OR REPLACE FUNCTION create_followup_from_clinical_note()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.followup_required = TRUE AND NEW.followup_date IS NOT NULL THEN
    INSERT INTO pet_reminders (pet_id, user_id, title, type, due_date, notes)
    SELECT
      NEW.pet_id,
      pets.owner_id,
      COALESCE(NEW.followup_reason, 'Control veterinario'),
      'followup',
      NEW.followup_date::TIMESTAMPTZ,
      'Creado automaticamente desde consulta del ' || to_char(NEW.consultation_date, 'DD/MM/YYYY')
    FROM pets WHERE pets.id = NEW.pet_id AND pets.owner_id IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_followup_from_clinical_note ON vet_clinical_notes;
CREATE TRIGGER trigger_followup_from_clinical_note
  AFTER INSERT ON vet_clinical_notes
  FOR EACH ROW EXECUTE FUNCTION create_followup_from_clinical_note();
