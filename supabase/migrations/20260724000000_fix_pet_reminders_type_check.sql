-- ══════════════════════════════════════════════════════════════
-- Fix pet_reminders.type CHECK: agregar 'deworming' y 'antiparasitic'
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Bug detectado 2026-04-21:
--   El trigger generate_full_vaccine_schedule() (mig 20260629010000)
--   inserta reminders con type='deworming' (antiparasitario interno)
--   y type='antiparasitic' (externo). Pero el CHECK constraint
--   original (mig 20260402000000) solo permitia:
--     'vaccine', 'checkup', 'medication', 'grooming', 'weight', 'custom'.
--
--   Resultado: cualquier INSERT de un pet perro/gato con birth_date
--   disparaba el trigger, que fallaba con:
--     "new row for relation 'pet_reminders' violates check constraint
--      'pet_reminders_type_check'"
--   → el INSERT de pets retornaba 400 al frontend.
--
-- Idempotente: DROP + ADD del constraint.
-- ══════════════════════════════════════════════════════════════

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
      'deworming',      -- antiparasitario interno (mig 20260629010000)
      'antiparasitic'   -- antiparasitario externo (mig 20260629010000)
    )
  );

-- ──────────────────────────────────────────────────────────────
-- Verificacion post-apply:
--
--   -- El constraint debe listar los 8 valores:
--   SELECT pg_get_constraintdef(oid)
--     FROM pg_constraint
--     WHERE conname = 'pet_reminders_type_check';
--
--   -- Smoke: crear un reminder con type='deworming' no debe tirar error:
--   INSERT INTO public.pet_reminders (pet_id, owner_id, title, type, due_date)
--   VALUES (
--     (SELECT id FROM pets ORDER BY created_at DESC LIMIT 1),
--     auth.uid(),
--     'TEST deworming',
--     'deworming',
--     CURRENT_DATE + 1
--   ) RETURNING id;
--   -- cleanup:
--   DELETE FROM public.pet_reminders WHERE title = 'TEST deworming';
-- ──────────────────────────────────────────────────────────────
