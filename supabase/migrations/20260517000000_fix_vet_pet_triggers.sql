-- =============================================================================
-- Fix: triggers que rompen creacion de mascotas por vets
-- Bugs encontrados:
--   1. create_default_reminders_for_new_pet() usa columna "user_id" que no
--      existe en pet_reminders (la columna real es "owner_id")
--   2. Mismo trigger no maneja owner_id NULL (mascotas creadas por vet)
--   3. create_followup_from_clinical_note() usa "user_id" y "notes" que
--      no existen (columnas reales: "owner_id", "description")
--   4. Tipo 'followup' no esta en el CHECK constraint de pet_reminders.type
--   5. guard_seed_pet_names() falla cuando owner_id IS NULL (vet-created)
--
-- Aplicar manualmente desde Supabase Dashboard > SQL Editor.
-- =============================================================================

-- =============================================================================
-- 1. Ampliar CHECK constraint de type para incluir 'followup'
-- =============================================================================
ALTER TABLE public.pet_reminders DROP CONSTRAINT IF EXISTS pet_reminders_type_check;
ALTER TABLE public.pet_reminders ADD CONSTRAINT pet_reminders_type_check
  CHECK (type IN ('vaccine', 'checkup', 'medication', 'grooming', 'weight', 'custom', 'followup'));

-- =============================================================================
-- 2. Fix trigger: auto-crear recordatorios al insertar mascota
--    - Usa "owner_id" en vez de "user_id"
--    - Skip si owner_id IS NULL (mascota creada por vet sin dueno aun)
-- =============================================================================
CREATE OR REPLACE FUNCTION create_default_reminders_for_new_pet()
RETURNS TRIGGER AS $$
DECLARE
  protocol RECORD;
  pet_age_months INTEGER;
BEGIN
  -- Skip si no hay dueno asignado (mascota creada por vet, pending)
  IF NEW.owner_id IS NULL THEN RETURN NEW; END IF;
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

-- =============================================================================
-- 3. Fix trigger: auto-crear recordatorio de seguimiento desde nota clinica
--    - Usa "owner_id" en vez de "user_id", "description" en vez de "notes"
--    - Ya manejaba NULL owner_id con WHERE clause (mantener)
-- =============================================================================
CREATE OR REPLACE FUNCTION create_followup_from_clinical_note()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.followup_required = TRUE AND NEW.followup_date IS NOT NULL THEN
    INSERT INTO pet_reminders (pet_id, owner_id, title, type, due_date, description)
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

-- =============================================================================
-- 4. Fix seed guard: no bloquear mascotas creadas por vet (owner_id NULL)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.guard_seed_pet_names()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  seed_names TEXT[] := ARRAY['Pelusa','Bruno','Luli','Capitán','Coco','Chocolate','Bella','Cachorro Curioso'];
  user_is_demo BOOLEAN;
  check_user_id UUID;
BEGIN
  -- Solo chequear si el nombre es un nombre conocido de seed
  IF NEW.name = ANY(seed_names) THEN
    -- Determinar que usuario verificar: owner si existe, sino el vet creador
    check_user_id := COALESCE(NEW.owner_id, NEW.created_by_vet_id);
    IF check_user_id IS NULL THEN
      RETURN NEW; -- Sin responsable, dejar pasar (el constraint chk_pet_has_responsible lo ataja)
    END IF;
    SELECT is_demo INTO user_is_demo FROM profiles WHERE id = check_user_id;
    IF user_is_demo IS NOT TRUE THEN
      RAISE EXCEPTION 'SEED_GUARD: Intentando insertar mascota con nombre seed "%" en cuenta no-demo (user=%)', NEW.name, check_user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
