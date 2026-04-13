-- ============================================================
-- Fix: el trigger create_default_reminders_for_new_pet() usaba
-- "user_id" pero la columna en pet_reminders se llama "owner_id".
-- Error 42703 al crear mascota con birth_date + species.
--
-- NO aplicar automaticamente. Aplicar en Supabase Dashboard > SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION create_default_reminders_for_new_pet()
RETURNS TRIGGER AS $$
DECLARE
  protocol RECORD;
  pet_age_months INTEGER;
BEGIN
  IF NEW.birth_date IS NULL THEN RETURN NEW; END IF;

  pet_age_months := EXTRACT(YEAR FROM AGE(NEW.birth_date)) * 12
                  + EXTRACT(MONTH FROM AGE(NEW.birth_date));

  FOR protocol IN
    SELECT * FROM vaccination_protocols
    WHERE LOWER(species) = LOWER(NEW.species)
      AND applies_from_age_months <= pet_age_months
      AND is_mandatory = TRUE
  LOOP
    INSERT INTO pet_reminders (pet_id, owner_id, title, type, due_date)
    VALUES (
      NEW.id, NEW.owner_id,
      protocol.vaccine_name || ' de ' || NEW.name,
      'vaccine',
      CURRENT_DATE + (protocol.frequency_months || ' months')::INTERVAL
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
