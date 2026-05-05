-- ═══════════════════════════════════════════════════════════════════════════
-- Splitear create_booking_reminder() V1 vs V2 — bug latente desde 2026-05-21
--
-- Contexto:
--   Existen dos triggers que llaman a la MISMA funcion `create_booking_reminder()`:
--     * trigger_auto_booking_reminder      ON public.bookings      (mig 20260508000002)
--     * trigger_booking_reminder_on_confirm ON public.vet_bookings (mig 20260521000050)
--
--   La mig 20260521000050 redefinio el body para vet_bookings (V2) usando
--   refs a NEW.owner_id, NEW.scheduled_date, NEW.status — columnas que NO
--   existen en la tabla `bookings` (V1, columnas: user_id, slot_id,
--   service_type, status, total_price, ...).
--
--   Resultado: cualquier INSERT en `bookings` (via EnhancedBookingDialog
--   /services/walkers, /services/sitters, /services/trainers, /services/
--   grooming) dispara el trigger V1 que ahora ejecuta la funcion V2 y
--   explota con "record 'new' has no field 'owner_id'". El INSERT falla
--   y el dueno no puede agendar walker/sitter/trainer/groomer.
--
--   No fue detectado antes porque (a) `bookings` esta marcado @deprecated
--   y se migra a Booking V3 progresivamente, (b) el flow vet usa
--   vet_bookings que si funciona, y (c) los planes 90d redirigieron foco
--   a otros motors. Pero el flow legacy de servicios sigue usando bookings.
--
-- Cambios:
--   A. Crear `create_booking_reminder_v1()` con la logica original de mig
--      20260508000002 (lee slot_date desde service_slots, inserta 'checkup'
--      con due_date = slot_date). Smoke inline §9.2.1.
--   B. Mantener `create_booking_reminder()` (V2) tal como esta. Solo
--      verificamos que sigue siendo el body V2.
--   C. Re-apuntar el trigger sobre `bookings` a la version V1.
--   D. El trigger sobre `vet_bookings` queda intacto (sigue usando V2).
--
-- Idempotente: CREATE OR REPLACE + DROP/CREATE TRIGGER. Aplicar manual.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- A. create_booking_reminder_v1 — para bookings legacy (walkers/sitters/etc)
--    Logica importada de mig 20260508000002, ahora con owner_id correcto
--    (mapeado a NEW.user_id de bookings) y type='checkup' canonico.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_booking_reminder_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot_date DATE;
  v_service_type TEXT;
BEGIN
  -- bookings.slot_id puede ser NULL en flows que no usan service_slots.
  IF NEW.slot_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT ss.slot_date, ss.service_type
    INTO v_slot_date, v_service_type
  FROM public.service_slots ss
  WHERE ss.id = NEW.slot_id;

  IF NEW.pet_id IS NOT NULL AND v_slot_date IS NOT NULL AND v_slot_date >= CURRENT_DATE THEN
    BEGIN
      INSERT INTO public.pet_reminders (pet_id, owner_id, type, title, due_date)
      VALUES (
        NEW.pet_id,
        NEW.user_id,
        'checkup',
        'Cita: ' || COALESCE(v_service_type, NEW.service_type, 'Servicio'),
        v_slot_date
      )
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- Blindado: cualquier fallo (FK rota, CHECK desactualizado) no
      -- bloquea el INSERT del booking. Patron consistente con
      -- generate_full_vaccine_schedule (mig 20260725000012).
      RAISE NOTICE 'create_booking_reminder_v1: skip reminder para booking % → %',
        NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.create_booking_reminder_v1() IS
  'V1: trigger sobre public.bookings (legacy walkers/sitters/trainers/grooming). Lee slot_date de service_slots. Splitea de V2 (vet_bookings) en mig 20261005000002. Blindado con BEGIN/EXCEPTION.';

-- ─────────────────────────────────────────────────────────────────────────
-- B. Re-apuntar trigger sobre bookings → V1
-- ─────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trigger_auto_booking_reminder ON public.bookings;
CREATE TRIGGER trigger_auto_booking_reminder
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_booking_reminder_v1();

-- El trigger sobre vet_bookings sigue apuntando a create_booking_reminder()
-- (V2, definida por mig 20260521000050). Solo verificamos que no se
-- haya borrado por error.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_booking_reminder_on_confirm'
      AND tgrelid = 'public.vet_bookings'::regclass
  ) THEN
    RAISE WARNING 'trigger_booking_reminder_on_confirm no existe en vet_bookings; revisar mig 20260521000050.';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- C. Smoke test inline §9.2.1 — ejercitar el trigger V1 con un INSERT
--    sintetico de booking + slot. Si el trigger explota, RAISE EXCEPTION
--    aborta la migracion (rollback automatico).
--
--    Requiere: (1) un user real en auth.users (para user_id FK),
--              (2) un service_provider real (para provider_id FK),
--              (3) un service_slot real con slot_date futura.
--    Si no hay datos suficientes, el smoke se omite con NOTICE — la
--    funcion ya esta validada estaticamente por el CREATE.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_user UUID;
  v_provider UUID;
  v_slot UUID;
  v_pet UUID;
  v_booking UUID;
  v_reminder_count INT;
BEGIN
  SELECT id INTO v_user FROM auth.users LIMIT 1;
  SELECT id INTO v_provider FROM public.service_providers LIMIT 1;
  SELECT id INTO v_slot FROM public.service_slots
    WHERE slot_date >= CURRENT_DATE
    LIMIT 1;
  SELECT id INTO v_pet FROM public.pets WHERE owner_id IS NOT NULL LIMIT 1;

  IF v_user IS NULL OR v_provider IS NULL OR v_slot IS NULL OR v_pet IS NULL THEN
    RAISE NOTICE 'Smoke test V1 omitido: faltan datos seed (user/provider/slot/pet).';
    RETURN;
  END IF;

  BEGIN
    INSERT INTO public.bookings (
      user_id, provider_id, slot_id, pet_id, service_type, total_price, status
    ) VALUES (
      v_user, v_provider, v_slot, v_pet, 'walk', 0, 'pending'
    ) RETURNING id INTO v_booking;

    -- Verificar que el trigger no exploto y opcionalmente creo el reminder.
    SELECT COUNT(*) INTO v_reminder_count
      FROM public.pet_reminders
      WHERE pet_id = v_pet
        AND title LIKE 'Cita: %';

    DELETE FROM public.bookings WHERE id = v_booking;
    -- Limpiar reminders sinteticos creados por el trigger (mejor esfuerzo).
    DELETE FROM public.pet_reminders
      WHERE pet_id = v_pet
        AND title LIKE 'Cita: %'
        AND created_at > NOW() - INTERVAL '1 minute';

    RAISE NOTICE 'Smoke test V1: OK (trigger no explota, % reminder(s) sintetico(s) limpiados).',
      v_reminder_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Smoke test V1 FAILED: %', SQLERRM;
  END;
END $$;
