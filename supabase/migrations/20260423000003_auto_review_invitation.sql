-- Auto-crear invitacion de review al dueno despues de cada consulta vet.
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.

CREATE OR REPLACE FUNCTION create_review_invitation_after_consultation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pending_reviews (user_id, target_user_id, target_type, transaction_id, pet_id, expires_at)
  SELECT
    pets.owner_id,
    NEW.provider_id,
    'vet_consultation',
    NEW.id,
    NEW.pet_id,
    NOW() + INTERVAL '30 days'
  FROM pets
  WHERE pets.id = NEW.pet_id
    AND pets.owner_id IS NOT NULL
    -- Evitar duplicados si el vet edita la nota
    AND NOT EXISTS (
      SELECT 1 FROM pending_reviews
      WHERE transaction_id = NEW.id
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_review_invitation_after_note ON vet_clinical_notes;
CREATE TRIGGER trigger_review_invitation_after_note
  AFTER INSERT ON vet_clinical_notes
  FOR EACH ROW EXECUTE FUNCTION create_review_invitation_after_consultation();
