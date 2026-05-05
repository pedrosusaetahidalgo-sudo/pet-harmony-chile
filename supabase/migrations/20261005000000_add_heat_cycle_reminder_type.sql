-- ═══════════════════════════════════════════════════════════════════════════
-- Add 'heat_cycle' to pet_reminders.type — feedback Antonia 2026-05-05
--
-- Contexto:
--   La co-founder Antonia (dueña de perra) reporta que falta categoria
--   para registrar/recordar celos en hembras. Caso de uso real:
--     - "esta semana estuvo en celo" (registro)
--     - "esta semana lo tengo que llevar a control post-celo" (recordatorio)
--
-- Cambio:
--   Extiende el CHECK constraint de pet_reminders.type para incluir
--   'heat_cycle' como tipo canonico. El frontend agrega el preset
--   correspondiente en AddReminderDialog + REMINDER_TYPES.
--
-- Idempotente. Smoke test al final per CLAUDE.md §9.2.1.
-- Aplicar desde Supabase Dashboard > SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

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
      'followup',       -- mig 20260517000000
      'deworming',      -- mig 20260629010000 / 20260725000012
      'antiparasitic',  -- mig 20260629010000 / 20260725000012
      'heat_cycle'      -- mig 20261005000000 (este archivo) — celo / ciclo reproductivo
    )
  );

COMMENT ON COLUMN public.pet_reminders.type IS
  'Tipo canonico del recordatorio. Lista vigente al 2026-05-05: vaccine, checkup, medication, grooming, weight, custom, followup, deworming, antiparasitic, heat_cycle. Mantener sincronizado con src/lib/reminderTypes.ts.';

-- Smoke test inline (CLAUDE.md §9.2.1) — verifica que el CHECK acepta heat_cycle
-- sin necesitar un trigger real. Hace un INSERT/DELETE dummy con un pet+owner
-- existente (si los hay); si no hay datos, omite el smoke.
DO $$
DECLARE
  v_pet UUID;
  v_owner UUID;
  v_reminder UUID;
BEGIN
  SELECT id, owner_id INTO v_pet, v_owner
    FROM public.pets
    WHERE owner_id IS NOT NULL
    LIMIT 1;

  IF v_pet IS NULL THEN
    RAISE NOTICE 'Smoke test omitido: no hay pets con owner_id en la base.';
    RETURN;
  END IF;

  INSERT INTO public.pet_reminders (pet_id, owner_id, title, type, due_date)
  VALUES (v_pet, v_owner, '[smoke heat_cycle]', 'heat_cycle', CURRENT_DATE + 30)
  RETURNING id INTO v_reminder;

  DELETE FROM public.pet_reminders WHERE id = v_reminder;

  RAISE NOTICE 'Smoke test heat_cycle: OK (insertado y borrado correctamente).';
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Smoke test heat_cycle FAILED: %', SQLERRM;
END $$;
