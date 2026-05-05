-- ═══════════════════════════════════════════════════════════════════════════
-- Re-canonizar pet_reminders.type — alinear DB con frontend (2026-05-05)
--
-- Contexto:
--   El frontend (src/lib/reminderTypes.ts) declara 13 tipos canonicos:
--     vaccine, checkup, deworming, flea, medication, grooming, weight,
--     dental, food, insurance, license, heat_cycle, custom.
--
--   El CHECK de pet_reminders.type quedo en una lista corta despues de un
--   hotfix prod 2026-04-23 (mig 20260725000012) que destrabo `add-pet`
--   pero retrocedio la canonizacion previa de mig 20260521000040. La
--   lista vigente al cierre de mig 20261005000000 (heat_cycle) era:
--     vaccine, checkup, medication, grooming, weight, custom, followup,
--     deworming, antiparasitic, heat_cycle.
--
--   Resultado: si un usuario toca el preset "Antipara mensual" en
--   AddReminderDialog (src/components/reminders/AddReminderDialog.tsx)
--   el INSERT lleva type='flea' y la DB lo rechaza con 23514. Tambien
--   rechaza dental, food, insurance, license. Bug latente igual al de
--   abril 2026 (project_session_2026_04_23_addpet_fix.md).
--
-- Cambios en esta migracion:
--   A. Backfill: filas existentes con 'antiparasitic' → 'flea' o
--      'deworming' segun titulo (heuristica importada de mig 521).
--   B. CHECK canonico: 13 tipos del frontend + 'followup' (creado por
--      trigger create_followup_from_clinical_note, no por user). Se
--      DROPPEA 'antiparasitic' del valid set despues del backfill.
--   C. Realinear create_vaccine_reminder() (mig 521 → 629000) para que
--      antiparasitario externo emita 'flea' en vez de 'antiparasitic'.
--      Mantiene la logica Bravecto/Nexgard Spectra de mig 521.
--   D. Realinear generate_full_vaccine_schedule() (mig 725000012) para
--      que la rama parasite_external emita 'flea' en vez de
--      'antiparasitic'. Mantiene los BEGIN/EXCEPTION blindados.
--   E. Actualizar send_reminder_pushes() (mig 702000000) para que el
--      switch de titulos del push reconozca 'flea' y 'heat_cycle'.
--   F. Smoke test inline §9.2.1 — INSERT/DELETE de cada tipo canonico
--      con rollback. Si un INSERT explota, la migracion falla.
--   G. COMMENT ON COLUMN actualizado con el set vigente.
--
-- Idempotente. Aplicar desde Supabase Dashboard > SQL Editor.
--
-- Recordatorios al aplicar:
--   * Pedro: sin re-deploy de edge fns. send_reminder_pushes es funcion
--     SQL, no Deno; cambia al aplicar la migracion.
--   * Si fallaba algun smoke en el bloque F → revisar pets reales en la
--     DB (puede haber tablas vacias en proyectos nuevos; el smoke se
--     omite con NOTICE en ese caso).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- A0. Ampliar CHECK a SUPERSET temporal (incluye 'antiparasitic' + 'flea' +
--     todos los canonicos nuevos). Necesario antes del UPDATE backfill —
--     si saltas a este paso al CHECK final sin 'antiparasitic', el ALTER
--     valida contra filas existentes con type='antiparasitic' y aborta.
--     Si hacemos UPDATE primero sin permitir 'flea', el UPDATE aborta.
--     Solucion: superset temporal cubre ambos lados durante la transicion.
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.pet_reminders
  DROP CONSTRAINT IF EXISTS pet_reminders_type_check;

ALTER TABLE public.pet_reminders
  ADD CONSTRAINT pet_reminders_type_check
  CHECK (
    type IN (
      'vaccine',
      'checkup',
      'deworming',
      'flea',
      'medication',
      'grooming',
      'weight',
      'dental',
      'food',
      'insurance',
      'license',
      'heat_cycle',
      'custom',
      'followup',
      'antiparasitic'  -- ← legacy, se purga del set en B despues del backfill
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- A. Backfill de filas con 'antiparasitic' (legacy del hotfix abril 2026)
--    Heuristica: titulo sugiere uso externo → 'flea'; resto → 'deworming'.
--    Misma logica que mig 20260521000040 §A.
-- ─────────────────────────────────────────────────────────────────────────
UPDATE public.pet_reminders
SET type = 'flea'
WHERE type = 'antiparasitic'
  AND (
    LOWER(COALESCE(title, '')) LIKE '%pulga%'
    OR LOWER(COALESCE(title, '')) LIKE '%garrapata%'
    OR LOWER(COALESCE(title, '')) LIKE '%externo%'
    OR LOWER(COALESCE(title, '')) LIKE '%pipeta%'
    OR LOWER(COALESCE(title, '')) LIKE '%collar%'
    OR LOWER(COALESCE(title, '')) LIKE '%bravecto%'
    OR LOWER(COALESCE(title, '')) LIKE '%nexgard%'
    OR LOWER(COALESCE(title, '')) LIKE '%simparica%'
  );

UPDATE public.pet_reminders
SET type = 'deworming'
WHERE type = 'antiparasitic';

-- ─────────────────────────────────────────────────────────────────────────
-- B. CHECK canonico final — 13 tipos del frontend + followup.
--    Ya no quedan filas con 'antiparasitic' (las migro A.flea/A.deworming
--    arriba). El ALTER ahora es seguro contra las filas existentes.
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.pet_reminders
  DROP CONSTRAINT IF EXISTS pet_reminders_type_check;

ALTER TABLE public.pet_reminders
  ADD CONSTRAINT pet_reminders_type_check
  CHECK (
    type IN (
      'vaccine',
      'checkup',
      'deworming',
      'flea',
      'medication',
      'grooming',
      'weight',
      'dental',
      'food',
      'insurance',
      'license',
      'heat_cycle',
      'custom',
      'followup'
    )
  );

COMMENT ON COLUMN public.pet_reminders.type IS
  'Tipo canonico del recordatorio. Set vigente 2026-05-05: vaccine, checkup, deworming, flea, medication, grooming, weight, dental, food, insurance, license, heat_cycle, custom, followup. Mantener sincronizado con src/lib/reminderTypes.ts. ''antiparasitic'' fue deprecado en mig 20261005000001 (back-filleado a flea/deworming).';

-- ─────────────────────────────────────────────────────────────────────────
-- C. create_vaccine_reminder() — antiparasitario externo emite 'flea'.
--    Importa logica de mig 20260521000040 con la mejora Nexgard Spectra
--    de mig 20260629000000 (Bravecto y Nexgard Spectra → +3 meses).
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_vaccine_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_due_date DATE;
  v_title TEXT;
  v_type TEXT;
  v_is_antiparasitario BOOLEAN;
  v_brand_lower TEXT;
BEGIN
  v_is_antiparasitario := NEW.record_type IN ('antiparasitario', 'desparasitacion', 'antipulgas');
  v_brand_lower := LOWER(COALESCE(NEW.product_brand, ''));

  IF NEW.record_type = 'vacuna' THEN
    v_type := 'vaccine';
    v_due_date := NEW.next_date;
    v_title := 'Refuerzo: ' || COALESCE(NEW.title, 'Vacuna');

  ELSIF v_is_antiparasitario THEN
    -- Tipo canonico: 'flea' (externo) | 'deworming' (interno/ambos/null).
    IF NEW.antiparasitic_type = 'externo' THEN
      v_type := 'flea';
    ELSE
      v_type := 'deworming';
    END IF;

    -- Calculo de due_date alineado a src/lib/frequencies.ts:
    --   interno / ambos / null → +3 meses
    --   externo → +1 mes (excepto Bravecto / Nexgard Spectra → +3 meses)
    IF NEW.next_date IS NOT NULL THEN
      v_due_date := NEW.next_date;
    ELSIF NEW.antiparasitic_type = 'externo' THEN
      IF v_brand_lower LIKE '%bravecto%' OR v_brand_lower LIKE '%nexgard spectra%' THEN
        v_due_date := NEW.date + INTERVAL '3 months';
      ELSE
        v_due_date := NEW.date + INTERVAL '1 month';
      END IF;
    ELSE
      v_due_date := NEW.date + INTERVAL '3 months';
    END IF;

    v_title := 'Antiparasitario: ' || COALESCE(
      NEW.product_brand,
      NEW.title,
      CASE NEW.antiparasitic_type
        WHEN 'interno' THEN 'Desparasitacion interna'
        WHEN 'externo' THEN 'Pulgas y garrapatas'
        WHEN 'ambos'   THEN 'Desparasitacion completa'
        ELSE 'Desparasitacion'
      END
    );
  ELSE
    -- Otros record_type: sin reminder automatico.
    RETURN NEW;
  END IF;

  IF NEW.owner_id IS NULL OR v_due_date IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.pet_reminders (pet_id, owner_id, type, title, due_date)
  VALUES (NEW.pet_id, NEW.owner_id, v_type, v_title, v_due_date)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.create_vaccine_reminder() IS
  'Auto-crea pet_reminders con tipo canonico (vaccine|deworming|flea). Re-canonizado 2026-05-05 (mig 20261005000001). Ver src/lib/reminderTypes.ts.';

-- ─────────────────────────────────────────────────────────────────────────
-- D. generate_full_vaccine_schedule() — externo → 'flea' en vez de
--    'antiparasitic'. Resto del trigger queda igual (BEGIN/EXCEPTION
--    blindado, refuerzos anuales, antiparasitarios x4 futuros).
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
          CASE WHEN dose.category = 'parasite_internal' THEN 'deworming' ELSE 'flea' END,
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
  'Genera cronograma vacunatorio para perro/gato al crear mascota. Cada INSERT en BEGIN/EXCEPTION para no bloquear creacion del pet. parasite_external emite type=flea (no antiparasitic) desde mig 20261005000001.';

-- ─────────────────────────────────────────────────────────────────────────
-- E. send_reminder_pushes() — switch de titulos reconoce flea + heat_cycle.
--    Mantiene logica de ventana 20-36h, dedup via whatsapp_message_log,
--    fire-and-forget vs send-push-notification.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.send_reminder_pushes()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reminder RECORD;
  v_count_sent INT := 0;
  v_count_skipped INT := 0;
  v_title TEXT;
  v_body TEXT;
  v_pet_name TEXT;
BEGIN
  FOR v_reminder IN
    SELECT r.id, r.pet_id, r.owner_id, r.title, r.type, r.due_date
    FROM public.pet_reminders r
    WHERE r.due_date BETWEEN (CURRENT_DATE + INTERVAL '20 hours')
                         AND (CURRENT_DATE + INTERVAL '36 hours')
      AND (r.is_completed IS NULL OR r.is_completed = FALSE)
      AND r.owner_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.device_tokens dt
        WHERE dt.user_id = r.owner_id AND dt.enabled = TRUE
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.whatsapp_message_log wml
        WHERE wml.reference_id = r.id::text
          AND wml.channel = 'push'
          AND wml.status = 'sent'
          AND wml.created_at > NOW() - INTERVAL '20 hours'
      )
  LOOP
    SELECT name INTO v_pet_name FROM public.pets WHERE id = v_reminder.pet_id;

    -- Titulo segun tipo canonico (mig 20261005000001).
    v_title := CASE v_reminder.type
      WHEN 'vaccine'    THEN 'Vacuna mañana'
      WHEN 'deworming'  THEN 'Desparasitacion mañana'
      WHEN 'flea'       THEN 'Antipulgas mañana'
      WHEN 'checkup'    THEN 'Control vet mañana'
      WHEN 'medication' THEN 'Medicamento mañana'
      WHEN 'grooming'   THEN 'Baño mañana'
      WHEN 'weight'     THEN 'Pesar mascota mañana'
      WHEN 'dental'     THEN 'Limpieza dental mañana'
      WHEN 'food'       THEN 'Comprar alimento'
      WHEN 'insurance'  THEN 'Renovar seguro'
      WHEN 'license'    THEN 'Renovar registro municipal'
      WHEN 'heat_cycle' THEN 'Celo / control reproductivo'
      WHEN 'followup'   THEN 'Seguimiento veterinario mañana'
      ELSE 'Recordatorio mañana'
    END;

    v_body := COALESCE(v_reminder.title, 'Recordatorio')
              || ' para ' || COALESCE(v_pet_name, 'tu mascota')
              || ' el ' || to_char(v_reminder.due_date, 'DD "de" FMMonth');

    BEGIN
      PERFORM net.http_post(
        url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'user_ids', jsonb_build_array(v_reminder.owner_id::text),
          'title', v_title,
          'body', v_body,
          'data', jsonb_build_object(
            'route', '/reminders',
            'reminder_id', v_reminder.id::text,
            'pet_id', v_reminder.pet_id::text,
            'kind', 'reminder_push'
          )
        )
      );

      INSERT INTO public.whatsapp_message_log (reference_id, channel, status, created_at)
      VALUES (v_reminder.id::text, 'push', 'sent', NOW())
      ON CONFLICT DO NOTHING;

      v_count_sent := v_count_sent + 1;
    EXCEPTION WHEN OTHERS THEN
      v_count_skipped := v_count_skipped + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'sent', v_count_sent,
    'skipped', v_count_skipped,
    'ran_at', NOW()
  );
END;
$$;

COMMENT ON FUNCTION public.send_reminder_pushes() IS
  'Envia push a owners con reminders due dentro de 20-36h. Switch de titulos cubre los 14 tipos canonicos (mig 20261005000001). Dedup via whatsapp_message_log.';

-- ─────────────────────────────────────────────────────────────────────────
-- F. Smoke test inline §9.2.1 — verifica que el CHECK acepta cada tipo
--    canonico. Si no hay pets reales en la DB, omite (proyectos nuevos).
--    Hace INSERT + DELETE de cada tipo. Si alguno explota, RAISE EXCEPTION
--    aborta la migracion completa (se hace rollback automatico).
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_pet UUID;
  v_owner UUID;
  v_reminder UUID;
  v_type TEXT;
  v_types TEXT[] := ARRAY[
    'vaccine', 'checkup', 'deworming', 'flea', 'medication', 'grooming',
    'weight', 'dental', 'food', 'insurance', 'license', 'heat_cycle',
    'custom', 'followup'
  ];
BEGIN
  SELECT id, owner_id INTO v_pet, v_owner
    FROM public.pets
    WHERE owner_id IS NOT NULL
    LIMIT 1;

  IF v_pet IS NULL THEN
    RAISE NOTICE 'Smoke test omitido: no hay pets con owner_id en la base.';
    RETURN;
  END IF;

  FOREACH v_type IN ARRAY v_types LOOP
    BEGIN
      INSERT INTO public.pet_reminders (pet_id, owner_id, title, type, due_date)
      VALUES (v_pet, v_owner, '[smoke ' || v_type || ']', v_type, CURRENT_DATE + 30)
      RETURNING id INTO v_reminder;

      DELETE FROM public.pet_reminders WHERE id = v_reminder;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Smoke test FAILED for type=%: %', v_type, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Smoke test re-canonize: OK (14 tipos canonicos aceptados).';
END $$;
