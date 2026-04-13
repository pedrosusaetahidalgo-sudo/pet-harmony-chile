-- ============================================================
-- Garantizar que TODAS las mascotas tienen paw_card_id + holo_pattern
-- y que nunca más puedan quedar NULL.
--
-- 1. Backfill paw_card_id para TODAS las pets sin uno
-- 2. Backfill holo_pattern para pets sin patrón
-- 3. Recrear trigger de auto-generación (idempotente)
-- 4. Agregar constraint NOT NULL (con default fallback)
--
-- NO aplicar automáticamente. Aplicar manualmente en Supabase Dashboard > SQL Editor.
-- ============================================================

-- ============================================================
-- 1. Backfill paw_card_id para pets que no tienen
-- ============================================================

DO $$
DECLARE
  pet_row record;
  charset text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_id text;
  block1 text;
  block2 text;
  i int;
  total_fixed int := 0;
BEGIN
  FOR pet_row IN SELECT id, name FROM pets WHERE paw_card_id IS NULL OR paw_card_id = '' LOOP
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
        total_fixed := total_fixed + 1;
        RAISE NOTICE 'Assigned % to pet "%"', new_id, pet_row.name;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Backfill complete: % pets fixed', total_fixed;
END $$;

-- ============================================================
-- 2. Backfill holo_pattern para pets sin patrón
-- ============================================================

DO $$
DECLARE
  pet_row record;
  roll float;
  pattern text;
  total_fixed int := 0;
BEGIN
  FOR pet_row IN SELECT id FROM pets WHERE holo_pattern IS NULL OR holo_pattern = '' LOOP
    roll := random();
    pattern := CASE
      WHEN roll < 0.01  THEN 'holo-rainbow'     -- 1% Full Rainbow
      WHEN roll < 0.03  THEN 'holo-galaxy'       -- 2% Galaxy Swirl
      WHEN roll < 0.07  THEN 'holo-fire'         -- 4% Phoenix Flame
      WHEN roll < 0.12  THEN 'holo-waves'        -- 5% Ocean Waves
      WHEN roll < 0.20  THEN 'holo-diamonds'     -- 8% Diamond Dust
      WHEN roll < 0.30  THEN 'holo-hearts'       -- 10% Corazones
      WHEN roll < 0.45  THEN 'holo-stars'        -- 15% Starlight
      WHEN roll < 0.65  THEN 'holo-paws'         -- 20% Huellas Holo
      ELSE                    'holo-none'         -- 35% Clásica
    END;
    UPDATE pets SET holo_pattern = pattern WHERE id = pet_row.id;
    total_fixed := total_fixed + 1;
  END LOOP;
  RAISE NOTICE 'Holo backfill complete: % pets fixed', total_fixed;
END $$;

-- ============================================================
-- 3. Recrear trigger de auto-generación (idempotente)
-- ============================================================

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
  -- Si ya tiene ID válido, no tocar
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

    IF NOT EXISTS (SELECT 1 FROM pets WHERE paw_card_id = new_id) THEN
      NEW.paw_card_id := new_id;
      EXIT;
    END IF;

    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique paw_card_id after 10 attempts';
    END IF;
  END LOOP;

  -- Si no tiene holo_pattern, asignar uno al azar
  IF NEW.holo_pattern IS NULL OR NEW.holo_pattern = '' THEN
    DECLARE
      roll float := random();
    BEGIN
      NEW.holo_pattern := CASE
        WHEN roll < 0.01  THEN 'holo-rainbow'
        WHEN roll < 0.03  THEN 'holo-galaxy'
        WHEN roll < 0.07  THEN 'holo-fire'
        WHEN roll < 0.12  THEN 'holo-waves'
        WHEN roll < 0.20  THEN 'holo-diamonds'
        WHEN roll < 0.30  THEN 'holo-hearts'
        WHEN roll < 0.45  THEN 'holo-stars'
        WHEN roll < 0.65  THEN 'holo-paws'
        ELSE                    'holo-none'
      END;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_paw_card_id ON pets;

CREATE TRIGGER trg_auto_paw_card_id
  BEFORE INSERT ON pets
  FOR EACH ROW
  EXECUTE FUNCTION generate_paw_card_id_on_insert();

-- ============================================================
-- 4. Hacer NOT NULL (ahora que todas tienen valor)
-- ============================================================

ALTER TABLE pets
  ALTER COLUMN paw_card_id SET NOT NULL;

ALTER TABLE pets
  ALTER COLUMN holo_pattern SET DEFAULT 'holo-none',
  ALTER COLUMN holo_pattern SET NOT NULL;

-- ============================================================
-- Verificación final
-- ============================================================

DO $$
DECLARE
  total int;
  sin_id int;
  sin_holo int;
BEGIN
  SELECT COUNT(*) INTO total FROM pets;
  SELECT COUNT(*) INTO sin_id FROM pets WHERE paw_card_id IS NULL OR paw_card_id = '';
  SELECT COUNT(*) INTO sin_holo FROM pets WHERE holo_pattern IS NULL OR holo_pattern = '';
  RAISE NOTICE '=== VERIFICACIÓN ===';
  RAISE NOTICE 'Total mascotas: %', total;
  RAISE NOTICE 'Sin paw_card_id: % (debe ser 0)', sin_id;
  RAISE NOTICE 'Sin holo_pattern: % (debe ser 0)', sin_holo;
END $$;
