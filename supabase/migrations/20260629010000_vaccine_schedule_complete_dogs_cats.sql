-- ==========================================================================
-- Cronograma vacunatorio completo: perros y gatos (feedback Pedro 2026-04-20)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20):
-- El trigger original (mig 20260423000001 + 20260504220000) solo creaba
-- UN recordatorio por protocolo con due_date = hoy + frequency_months.
-- Pedro pidio cronograma completo:
--  1. Si mascota es cachorro: programar toda la serie inicial por edad.
--  2. Si mascota es adulta: asumir que la serie inicial ya se puso,
--     solo programar refuerzos anuales proximos.
--  3. Desparasitacion interna cada 3 meses + externa cada 1 mes.
--  4. Solo perros y gatos (los mas frecuentes en onboarding).
--
-- Protocolo usado: estandar Colmevet/AVMA adaptado a Chile.
--   Perros: Sextuple dosis 1 (6-8 sem), 2 (10-12 sem), 3 (14-16 sem) +
--           Antirrabica dosis 1 (16 sem) + refuerzos anuales.
--   Gatos:  Triple felina dosis 1 (8-9 sem), 2 (12 sem), 3 (16 sem) +
--           Antirrabica dosis 1 (16 sem) + Leucemia (opcional) +
--           refuerzos anuales.
--
-- Respeta CLAUDE.md §9.8 (protege datos existentes):
--  - No borra `vaccination_protocols` existente (lo deja como fallback legacy).
--  - Crea tabla nueva `vaccine_schedule_doses`.
--  - El trigger reemplaza la version anterior pero con logica acumulativa:
--    si ya hay reminders para la mascota, NO los duplica (ON CONFLICT).
-- ==========================================================================

-- ----------------------------------------------------------------------
-- 1. Tabla: vaccine_schedule_doses (cada dosis de cada vacuna)
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vaccine_schedule_doses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species TEXT NOT NULL CHECK (species IN ('perro', 'gato')),
  vaccine_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('vaccine', 'parasite_internal', 'parasite_external')),

  -- Identificacion de dosis
  dose_number INT NOT NULL DEFAULT 1,      -- 1, 2, 3 para serie inicial; 0 para booster anual puro
  is_booster BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE si es solo refuerzo anual (sin serie inicial)
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timing
  apply_at_age_weeks INT,                  -- semanas desde nacimiento (serie inicial)
  booster_after_age_weeks INT,             -- edad minima para empezar refuerzos anuales
  frequency_months INT,                    -- frecuencia del refuerzo (NULL = no recurrente)

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (species, vaccine_name, dose_number, is_booster)
);

CREATE INDEX IF NOT EXISTS idx_vaccine_schedule_species
  ON public.vaccine_schedule_doses(species, category);

-- ----------------------------------------------------------------------
-- 2. Seed: cronograma estandar Chile
-- ----------------------------------------------------------------------
INSERT INTO public.vaccine_schedule_doses
  (species, vaccine_name, category, dose_number, is_booster, is_mandatory,
   apply_at_age_weeks, booster_after_age_weeks, frequency_months, notes)
VALUES
  -- ═══════════════ PERROS ═══════════════
  -- Sextuple serie inicial (3 dosis)
  ('perro', 'Séxtuple (DHPPI+L)', 'vaccine', 1, FALSE, TRUE,  8, NULL, NULL, 'Primera dosis cachorro'),
  ('perro', 'Séxtuple (DHPPI+L)', 'vaccine', 2, FALSE, TRUE, 12, NULL, NULL, '4 semanas despues de dosis 1'),
  ('perro', 'Séxtuple (DHPPI+L)', 'vaccine', 3, FALSE, TRUE, 16, NULL, NULL, '4 semanas despues de dosis 2'),
  -- Sextuple refuerzo anual
  ('perro', 'Séxtuple (DHPPI+L)', 'vaccine', 0, TRUE,  TRUE, NULL, 16, 12, 'Refuerzo anual post serie inicial'),

  -- Antirrabica (obligatoria Chile)
  ('perro', 'Antirrábica', 'vaccine', 1, FALSE, TRUE, 16, NULL, NULL, 'Obligatoria Chile'),
  ('perro', 'Antirrábica', 'vaccine', 0, TRUE,  TRUE, NULL, 16, 12, 'Refuerzo anual obligatorio'),

  -- KC (opcional, pre-pension)
  ('perro', 'KC (Kennel Cough)', 'vaccine', 1, FALSE, FALSE, 26, NULL, NULL, 'Opcional, pre-pension o vida social alta'),
  ('perro', 'KC (Kennel Cough)', 'vaccine', 0, TRUE,  FALSE, NULL, 26, 12, 'Refuerzo anual opcional'),

  -- Antiparasitarios
  ('perro', 'Antiparasitario interno', 'parasite_internal', 0, TRUE, TRUE, NULL,  4,  3, 'Cada 3 meses desde mes 1'),
  ('perro', 'Antiparasitario externo', 'parasite_external', 0, TRUE, TRUE, NULL,  4,  1, 'Mensual (Bravecto = cada 3 meses)'),

  -- ═══════════════ GATOS ═══════════════
  -- Triple felina serie inicial (3 dosis)
  ('gato', 'Triple felina (FVRCP)', 'vaccine', 1, FALSE, TRUE,  8, NULL, NULL, 'Primera dosis gatito'),
  ('gato', 'Triple felina (FVRCP)', 'vaccine', 2, FALSE, TRUE, 12, NULL, NULL, '4 semanas despues de dosis 1'),
  ('gato', 'Triple felina (FVRCP)', 'vaccine', 3, FALSE, TRUE, 16, NULL, NULL, '4 semanas despues de dosis 2'),
  -- Triple felina refuerzo anual
  ('gato', 'Triple felina (FVRCP)', 'vaccine', 0, TRUE,  TRUE, NULL, 16, 12, 'Refuerzo anual'),

  -- Antirrabica (recomendada, no siempre obligatoria en gatos Chile)
  ('gato', 'Antirrábica', 'vaccine', 1, FALSE, FALSE, 16, NULL, NULL, 'Recomendada'),
  ('gato', 'Antirrábica', 'vaccine', 0, TRUE,  FALSE, NULL, 16, 12, 'Refuerzo anual recomendado'),

  -- Leucemia felina (opcional segun estilo de vida)
  ('gato', 'Leucemia felina (FeLV)', 'vaccine', 1, FALSE, FALSE,  8, NULL, NULL, 'Opcional, recomendada si sale'),
  ('gato', 'Leucemia felina (FeLV)', 'vaccine', 2, FALSE, FALSE, 12, NULL, NULL, '4 semanas despues de dosis 1'),
  ('gato', 'Leucemia felina (FeLV)', 'vaccine', 0, TRUE,  FALSE, NULL, 12, 12, 'Refuerzo anual si aplica'),

  -- Antiparasitarios
  ('gato', 'Antiparasitario interno', 'parasite_internal', 0, TRUE, TRUE, NULL,  4,  3, 'Cada 3 meses desde mes 1'),
  ('gato', 'Antiparasitario externo', 'parasite_external', 0, TRUE, TRUE, NULL,  4,  1, 'Mensual (Bravecto = cada 3 meses)')

ON CONFLICT (species, vaccine_name, dose_number, is_booster) DO NOTHING;

-- ----------------------------------------------------------------------
-- 3. Funcion: generar cronograma completo al crear mascota
-- ----------------------------------------------------------------------
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
  -- Requerimos birth_date + species + owner_id para generar cronograma
  IF NEW.birth_date IS NULL THEN RETURN NEW; END IF;
  IF NEW.species IS NULL THEN RETURN NEW; END IF;
  IF NEW.owner_id IS NULL THEN RETURN NEW; END IF;

  -- Solo aplica a perros y gatos (scope acordado 2026-04-20)
  IF LOWER(NEW.species) NOT IN ('perro', 'gato') THEN
    RETURN NEW;
  END IF;

  -- Edad en semanas desde birth_date
  pet_age_weeks := FLOOR((CURRENT_DATE - NEW.birth_date) / 7.0)::INT;

  -- ─────────────── SERIE INICIAL (dosis puntuales) ───────────────
  -- Para cada dosis de la serie inicial: si la mascota AUN no tiene la
  -- edad para aplicarla, programar la dosis en (birth_date + weeks).
  -- Si ya paso la edad, asumimos que se aplico en su momento y NO la
  -- programamos retroactiva.
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
      INSERT INTO public.pet_reminders (pet_id, owner_id, title, type, due_date)
      VALUES (
        NEW.id,
        NEW.owner_id,
        dose.vaccine_name || ' — dosis ' || dose.dose_number || ' (' || NEW.name || ')',
        'vaccine',
        dose_date
      )
      ON CONFLICT DO NOTHING;
    END IF;
    -- Si ya paso la edad, no hacemos nada (asumimos aplicada).
  END LOOP;

  -- ─────────────── REFUERZOS ANUALES ───────────────
  -- Programar el PROXIMO refuerzo de cada vacuna con is_booster=TRUE.
  -- Si la mascota ya paso booster_after_age_weeks, el proximo es
  -- CURRENT_DATE + frequency_months. Si no, es
  -- (birth_date + booster_after_age_weeks).
  FOR dose IN
    SELECT * FROM public.vaccine_schedule_doses
    WHERE LOWER(species) = LOWER(NEW.species)
      AND is_booster = TRUE
      AND category = 'vaccine'
      AND is_mandatory = TRUE
  LOOP
    IF pet_age_weeks >= COALESCE(dose.booster_after_age_weeks, 0) THEN
      -- Adulta: proximo refuerzo en frequency_months
      next_booster_date := CURRENT_DATE + (COALESCE(dose.frequency_months, 12) || ' months')::INTERVAL;
    ELSE
      -- Cachorro: primer refuerzo cuando termine serie inicial + 1 año
      next_booster_date := NEW.birth_date
        + (COALESCE(dose.booster_after_age_weeks, 16) * 7)
        + (COALESCE(dose.frequency_months, 12) || ' months')::INTERVAL;
    END IF;

    INSERT INTO public.pet_reminders (pet_id, owner_id, title, type, due_date)
    VALUES (
      NEW.id,
      NEW.owner_id,
      'Refuerzo ' || dose.vaccine_name || ' (' || NEW.name || ')',
      'vaccine',
      next_booster_date
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- ─────────────── ANTIPARASITARIOS ───────────────
  -- Programar 4 proximas aplicaciones para cubrir ~1 año visible.
  -- Interno: cada 3m → 4 aplicaciones = 12 meses.
  -- Externo: cada 1m → programamos solo 4 (Pedro ve proximos 4m, se
  -- agendan siguientes al completar).
  FOR dose IN
    SELECT * FROM public.vaccine_schedule_doses
    WHERE LOWER(species) = LOWER(NEW.species)
      AND category IN ('parasite_internal', 'parasite_external')
      AND is_mandatory = TRUE
  LOOP
    future_count := 4;
    FOR loop_counter IN 1..future_count LOOP
      -- Primera aplicacion: hoy mismo si la mascota supera edad minima,
      -- si no, en (birth_date + booster_after_age_weeks).
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

      INSERT INTO public.pet_reminders (pet_id, owner_id, title, type, due_date)
      VALUES (
        NEW.id,
        NEW.owner_id,
        dose.vaccine_name || ' #' || loop_counter || ' (' || NEW.name || ')',
        CASE WHEN dose.category = 'parasite_internal' THEN 'deworming' ELSE 'antiparasitic' END,
        dose_date
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.generate_full_vaccine_schedule() IS
  'Genera cronograma vacunatorio COMPLETO para perros y gatos al crear mascota. Si la mascota es adulta, asume serie inicial aplicada. Programa refuerzos anuales + 4 iteraciones de antiparasitarios. Scope: perros y gatos (Pedro 2026-04-20).';

-- ----------------------------------------------------------------------
-- 4. Reemplazar trigger existente
-- ----------------------------------------------------------------------
-- El trigger original (20260423000001) solo dispara 1 recordatorio por
-- protocolo. Lo reemplazamos con el cronograma completo.
DROP TRIGGER IF EXISTS trigger_create_default_reminders ON public.pets;
DROP TRIGGER IF EXISTS trigger_generate_full_vaccine_schedule ON public.pets;

CREATE TRIGGER trigger_generate_full_vaccine_schedule
  AFTER INSERT ON public.pets
  FOR EACH ROW
  WHEN (NEW.birth_date IS NOT NULL
        AND NEW.species IS NOT NULL
        AND NEW.owner_id IS NOT NULL
        AND LOWER(NEW.species) IN ('perro', 'gato'))
  EXECUTE FUNCTION public.generate_full_vaccine_schedule();

-- Comentario: el trigger solo dispara al INSERT de pet. Si la mascota
-- ya existe y el dueño edita birth_date, NO se regeneran los reminders
-- (evita duplicar). Caso edge que se maneja manualmente desde admin.

-- ----------------------------------------------------------------------
-- 5. Verificacion (opcional, ejecutar despues de aplicar)
-- ----------------------------------------------------------------------
-- SELECT species, vaccine_name, category, dose_number, is_booster, apply_at_age_weeks
-- FROM public.vaccine_schedule_doses
-- ORDER BY species, category, vaccine_name, dose_number;
