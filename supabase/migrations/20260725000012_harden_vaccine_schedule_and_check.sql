-- ═══════════════════════════════════════════════════════════════════════════
-- Hardening: CHECK pet_reminders.type + trigger generate_full_vaccine_schedule
-- 2026-04-23 — incidente prod: crear mascota fallaba con 23514.
--
-- Contexto:
--   Usuario reporta en pawfriend.cl/add-pet:
--     code: 23514
--     message: new row for relation "pet_reminders" violates check
--              constraint "pet_reminders_type_check"
--     details: ...antiparasitic, Antiparasitario externo #1 (Firulad)...
--
--   La migración 20260724000000 (que ya añadía 'deworming' y 'antiparasitic'
--   al CHECK) NO estaba aplicada en prod a pesar de estar en el repo. Esta
--   migración es idempotente y vuelve a aplicar el fix + blinda el trigger
--   para que un tipo nuevo en el futuro nunca bloquee crear mascota.
--
-- Cambios:
--   1. Re-aplica CHECK de pet_reminders.type con todos los tipos conocidos.
--      Incluye 'followup' (mig 20260517000000) y 'deworming'/'antiparasitic'
--      (mig 20260724000000) para cubrir todos los triggers existentes.
--   2. Reemplaza generate_full_vaccine_schedule() envolviendo cada INSERT
--      en un BEGIN/EXCEPTION WHEN OTHERS que loguea el error pero deja
--      pasar la creación del pet. La mascota se crea; el reminder problemático
--      no, pero el dueño puede agregarlo manualmente luego. Mejor perder un
--      reminder que bloquear onboarding.
--
-- Idempotente. Aplicar desde Supabase Dashboard > SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. CHECK constraint con todos los tipos vigentes
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.pet_reminders
  DROP CONSTRAINT IF EXISTS pet_reminders_type_check;

ALTER TABLE public.pet_reminders
  ADD CONSTRAINT pet_reminders_type_check
  CHECK (
    type IN (
      'vaccine',
      'checkup',
      'medication',
      'grooming',
      'weight',
      'custom',
      'followup',       -- mig 20260517000000 (create_followup_from_clinical_note)
      'deworming',      -- mig 20260629010000 (antiparasitario interno)
      'antiparasitic'   -- mig 20260629010000 (antiparasitario externo)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Trigger blindado: cada INSERT dentro de BEGIN/EXCEPTION
--    Si un INSERT falla (ej: CHECK desactualizado, FK rota), logueamos con
--    RAISE NOTICE y seguimos. El pet SE CREA. Los reminders que fallen se
--    pueden regenerar después.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_full_vaccine_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dose RECORD;
  pet_age_weeks INT;
  dose_date DATE;
  next_booster_date DATE;
  future_count INT;
  loop_counter INT;
BEGIN
  IF NEW.birth_date IS NULL THEN RETURN NEW; END IF;
  IF NEW.species IS NULL THEN RETURN NEW; END IF;
  IF NEW.owner_id IS NULL THEN RETURN NEW; END IF;

  IF LOWER(NEW.species) NOT IN ('perro', 'gato') THEN
    RETURN NEW;
  END IF;

  pet_age_weeks := FLOOR((CURRENT_DATE - NEW.birth_date) / 7.0)::INT;

  -- Serie inicial
  FOR dose IN
    SELECT * FROM public.vaccine_schedule_doses
    WHERE LOWER(species) = LOWER(NEW.species)
      AND is_booster = FALSE
      AND apply_at_age_weeks IS NOT NULL
      AND category = 'vaccine'
      AND is_mandatory = TRUE
  LOOP
    IF pet_age_weeks < dose.apply_at_age_weeks THEN
      dose_date := NEW.birth_date + (dose.apply_at_age_weeks * 7);
      BEGIN
        INSERT INTO public.pet_reminders (pet_id, owner_id, title, type, due_date)
        VALUES (
          NEW.id,
          NEW.owner_id,
          dose.vaccine_name || ' — dosis ' || dose.dose_number || ' (' || NEW.name || ')',
          'vaccine',
          dose_date
        )
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'generate_full_vaccine_schedule: skip serie inicial % dosis % → %',
          dose.vaccine_name, dose.dose_number, SQLERRM;
      END;
    END IF;
  END LOOP;

  -- Refuerzos anuales
  FOR dose IN
    SELECT * FROM public.vaccine_schedule_doses
    WHERE LOWER(species) = LOWER(NEW.species)
      AND is_booster = TRUE
      AND category = 'vaccine'
      AND is_mandatory = TRUE
  LOOP
    IF pet_age_weeks >= COALESCE(dose.booster_after_age_weeks, 0) THEN
      next_booster_date := CURRENT_DATE + (COALESCE(dose.frequency_months, 12) || ' months')::INTERVAL;
    ELSE
      next_booster_date := NEW.birth_date
        + (COALESCE(dose.booster_after_age_weeks, 16) * 7)
        + (COALESCE(dose.frequency_months, 12) || ' months')::INTERVAL;
    END IF;

    BEGIN
      INSERT INTO public.pet_reminders (pet_id, owner_id, title, type, due_date)
      VALUES (
        NEW.id,
        NEW.owner_id,
        'Refuerzo ' || dose.vaccine_name || ' (' || NEW.name || ')',
        'vaccine',
        next_booster_date
      )
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'generate_full_vaccine_schedule: skip refuerzo % → %',
        dose.vaccine_name, SQLERRM;
    END;
  END LOOP;

  -- Antiparasitarios (4 aplicaciones futuras)
  FOR dose IN
    SELECT * FROM public.vaccine_schedule_doses
    WHERE LOWER(species) = LOWER(NEW.species)
      AND category IN ('parasite_internal', 'parasite_external')
      AND is_mandatory = TRUE
  LOOP
    future_count := 4;
    FOR loop_counter IN 1..future_count LOOP
      IF loop_counter = 1 THEN
        IF pet_age_weeks >= COALESCE(dose.booster_after_age_weeks, 4) THEN
          dose_date := CURRENT_DATE;
        ELSE
          dose_date := NEW.birth_date
            + (COALESCE(dose.booster_after_age_weeks, 4) * 7);
        END IF;
      ELSE
        dose_date := dose_date
          + (COALESCE(dose.frequency_months, 1) || ' months')::INTERVAL;
      END IF;

      BEGIN
        INSERT INTO public.pet_reminders (pet_id, owner_id, title, type, due_date)
        VALUES (
          NEW.id,
          NEW.owner_id,
          dose.vaccine_name || ' #' || loop_counter || ' (' || NEW.name || ')',
          CASE WHEN dose.category = 'parasite_internal' THEN 'deworming' ELSE 'antiparasitic' END,
          dose_date
        )
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'generate_full_vaccine_schedule: skip antiparasitario % #% → %',
          dose.vaccine_name, loop_counter, SQLERRM;
      END;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.generate_full_vaccine_schedule() IS
  'Genera cronograma vacunatorio para perro/gato al crear mascota. Cada INSERT está en BEGIN/EXCEPTION para que un fallo (CHECK desactualizado, FK rota, etc.) NO bloquee la creación del pet. Los reminders que fallen se pueden regenerar manualmente. Hardened 2026-04-23.';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Smoke test (CLAUDE.md §9.2.1): probar que el trigger no explota
--    incluso si eliminamos temporalmente un tipo del CHECK.
-- ─────────────────────────────────────────────────────────────────────────
-- Este smoke es opcional y está comentado porque requiere un user real.
-- Para probar manualmente post-apply:
--
--   -- Ver constraint vigente:
--   SELECT pg_get_constraintdef(oid)
--     FROM pg_constraint
--     WHERE conname = 'pet_reminders_type_check';
--
--   -- Crear mascota de prueba (con una cuenta real logueada):
--   -- Desde /add-pet en la app con species=perro, birth_date=cachorro
--   -- → el trigger debe crear ~12 reminders y el pet debe persistir.
