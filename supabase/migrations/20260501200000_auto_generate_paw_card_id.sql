-- Auto-generate paw_card_id for new pets that don't have one
-- This ensures every pet always gets a unique Paw Card ID

CREATE OR REPLACE FUNCTION generate_paw_card_id_on_insert()
RETURNS trigger AS $$
DECLARE
  charset text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_id text;
  block1 text;
  block2 text;
  i int;
  attempts int := 0;
BEGIN
  IF NEW.paw_card_id IS NOT NULL AND NEW.paw_card_id != '' THEN
    RETURN NEW;
  END IF;

  LOOP
    block1 := '';
    block2 := '';
    FOR i IN 1..4 LOOP
      block1 := block1 || substr(charset, floor(random() * length(charset) + 1)::int, 1);
      block2 := block2 || substr(charset, floor(random() * length(charset) + 1)::int, 1);
    END LOOP;
    new_id := 'PAW-' || block1 || '-' || block2;

    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM pets WHERE paw_card_id = new_id) THEN
      NEW.paw_card_id := new_id;
      EXIT;
    END IF;

    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique paw_card_id after 10 attempts';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop if exists to make migration idempotent
DROP TRIGGER IF EXISTS trg_auto_paw_card_id ON pets;

CREATE TRIGGER trg_auto_paw_card_id
  BEFORE INSERT ON pets
  FOR EACH ROW
  EXECUTE FUNCTION generate_paw_card_id_on_insert();

-- Backfill any remaining pets without paw_card_id
DO $$
DECLARE
  pet_row record;
  charset text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_id text;
  block1 text;
  block2 text;
  i int;
BEGIN
  FOR pet_row IN SELECT id FROM pets WHERE paw_card_id IS NULL OR paw_card_id = '' LOOP
    LOOP
      block1 := '';
      block2 := '';
      FOR i IN 1..4 LOOP
        block1 := block1 || substr(charset, floor(random() * length(charset) + 1)::int, 1);
        block2 := block2 || substr(charset, floor(random() * length(charset) + 1)::int, 1);
      END LOOP;
      new_id := 'PAW-' || block1 || '-' || block2;

      IF NOT EXISTS (SELECT 1 FROM pets WHERE paw_card_id = new_id) THEN
        UPDATE pets SET paw_card_id = new_id WHERE id = pet_row.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;
