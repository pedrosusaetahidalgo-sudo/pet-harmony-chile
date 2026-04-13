-- ============================================================
-- Fix: el trigger create_followup_from_clinical_note() usaba
-- "user_id" pero la columna en pet_reminders se llama "owner_id".
-- Mismo bug que se corrigio en 20260503110000 para el otro trigger.
-- Error 42703 al insertar vet_clinical_notes con followup_required=true.
--
-- NO aplicar automaticamente. Aplicar en Supabase Dashboard > SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION create_followup_from_clinical_note()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.followup_required = TRUE AND NEW.followup_date IS NOT NULL THEN
    INSERT INTO pet_reminders (pet_id, owner_id, title, type, due_date, notes)
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
