-- Auto-crear recordatorios basicos al agregar mascota nueva.
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.

CREATE TABLE IF NOT EXISTS vaccination_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species TEXT NOT NULL,
  vaccine_name TEXT NOT NULL,
  applies_from_age_months INTEGER NOT NULL DEFAULT 0,
  frequency_months INTEGER NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO vaccination_protocols (species, vaccine_name, applies_from_age_months, frequency_months, is_mandatory)
VALUES
  ('perro', 'Antirrabica', 4, 12, TRUE),
  ('perro', 'Sextuple', 2, 12, TRUE),
  ('perro', 'Antiparasitario interno', 1, 3, TRUE),
  ('gato', 'Triple felina', 2, 12, TRUE),
  ('gato', 'Antirrabica', 4, 12, FALSE),
  ('gato', 'Antiparasitario interno', 1, 3, TRUE)
ON CONFLICT DO NOTHING;

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
    INSERT INTO pet_reminders (pet_id, user_id, title, type, due_date)
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

DROP TRIGGER IF EXISTS trigger_create_default_reminders ON pets;
CREATE TRIGGER trigger_create_default_reminders
  AFTER INSERT ON pets
  FOR EACH ROW
  WHEN (NEW.birth_date IS NOT NULL AND NEW.species IS NOT NULL)
  EXECUTE FUNCTION create_default_reminders_for_new_pet();
