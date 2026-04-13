-- =============================================================================
-- Trigger: notificar al dueno cuando un veterinario agrega una nota clinica
-- El dueno recibe una notificacion con link directo a la ficha de su mascota.
-- =============================================================================

CREATE OR REPLACE FUNCTION notify_owner_on_vet_note()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
  SELECT
    p.owner_id,
    'vet_note',
    'Nueva nota clinica',
    'Tu veterinario agrego una nota a la ficha de ' || p.name,
    '/ficha/' || NEW.pet_id,
    NEW.id
  FROM pets p
  WHERE p.id = NEW.pet_id
    AND p.owner_id IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Solo crear el trigger si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notify_owner_on_vet_note'
  ) THEN
    CREATE TRIGGER trg_notify_owner_on_vet_note
      AFTER INSERT ON vet_clinical_notes
      FOR EACH ROW
      EXECUTE FUNCTION notify_owner_on_vet_note();
  END IF;
END;
$$;
