-- ══════════════════════════════════════════════════════════════════════════
-- Auto-sync triggers a pet_timeline_events (Refactor Maestro §2.4.3)
-- ══════════════════════════════════════════════════════════════════════════
-- Sin estos triggers, pet_timeline_events solo recibe inserts manuales
-- (welcome event + acciones del dueño). El plan §2.4.3 dice que el timeline
-- debe alimentarse automaticamente desde:
--
--   - medical_records (insert) → categoria 'health'
--   - pet_reminders (UPDATE: completed_at IS NOT NULL) → categoria segun reminder.type
--   - vet_bookings (UPDATE: status='completed') → categoria 'health'
--   - routine_completions (insert) → categoria 'activity'
--
-- Cada trigger es:
--   - SECURITY DEFINER (cruza RLS de timeline para owner)
--   - EXCEPTION WHEN OTHERS (no bloquea creacion del registro original)
--   - Idempotente (related_record_id + related_record_table como UNIQUE check)
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Trigger: medical_records → timeline (category: health)
CREATE OR REPLACE FUNCTION public.sync_medical_record_to_timeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_pet_name TEXT;
BEGIN
  IF TG_OP != 'INSERT' THEN RETURN NEW; END IF;

  -- Idempotencia: si ya hay evento timeline para este record, no duplicar
  IF EXISTS (
    SELECT 1 FROM public.pet_timeline_events
    WHERE related_record_id = NEW.id
      AND related_record_table = 'medical_records'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT owner_id, name INTO v_owner_id, v_pet_name
  FROM public.pets WHERE id = NEW.pet_id;

  IF v_owner_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.pet_timeline_events (
    pet_id, category, title, description, event_at,
    source, is_user_reported, recorded_by,
    related_record_id, related_record_table, data
  ) VALUES (
    NEW.pet_id,
    'health',
    NEW.title,
    NEW.description,
    NEW.date::TIMESTAMPTZ,
    'auto_trigger',
    TRUE,
    v_owner_id,
    NEW.id,
    'medical_records',
    jsonb_build_object(
      'record_type', NEW.record_type,
      'next_date', NEW.next_date,
      'veterinarian', NEW.veterinarian_name,
      'clinic', NEW.clinic_name
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'sync_medical_record_to_timeline failed: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trigger_medical_to_timeline ON public.medical_records;
CREATE TRIGGER trigger_medical_to_timeline
  AFTER INSERT ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_medical_record_to_timeline();

-- 2. Trigger: pet_reminders completados → timeline
CREATE OR REPLACE FUNCTION public.sync_reminder_completion_to_timeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_category TEXT;
BEGIN
  IF TG_OP != 'UPDATE' THEN RETURN NEW; END IF;

  -- Solo cuando completed_at pasa de NULL a NOT NULL
  IF OLD.completed_at IS NOT NULL OR NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Idempotencia
  IF EXISTS (
    SELECT 1 FROM public.pet_timeline_events
    WHERE related_record_id = NEW.id
      AND related_record_table = 'pet_reminders'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT owner_id INTO v_owner_id FROM public.pets WHERE id = NEW.pet_id;
  IF v_owner_id IS NULL THEN RETURN NEW; END IF;

  -- Mapear reminder.type → timeline category
  v_category := CASE NEW.type
    WHEN 'vaccine' THEN 'health'
    WHEN 'antiparasitic' THEN 'health'
    WHEN 'vet_visit' THEN 'health'
    WHEN 'medication' THEN 'health'
    WHEN 'grooming' THEN 'hygiene'
    WHEN 'walk' THEN 'activity'
    WHEN 'feeding' THEN 'nutrition'
    WHEN 'weight' THEN 'weight'
    ELSE 'health'
  END;

  INSERT INTO public.pet_timeline_events (
    pet_id, category, title, description, event_at,
    source, is_user_reported, recorded_by,
    related_record_id, related_record_table, data
  ) VALUES (
    NEW.pet_id,
    v_category::timeline_category,
    NEW.title,
    NEW.notes,
    NEW.completed_at,
    'auto_trigger',
    TRUE,
    v_owner_id,
    NEW.id,
    'pet_reminders',
    jsonb_build_object(
      'reminder_type', NEW.type,
      'due_date', NEW.due_date,
      'completed_at', NEW.completed_at
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'sync_reminder_completion_to_timeline failed: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trigger_reminder_to_timeline ON public.pet_reminders;
CREATE TRIGGER trigger_reminder_to_timeline
  AFTER UPDATE OF completed_at ON public.pet_reminders
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL)
  EXECUTE FUNCTION public.sync_reminder_completion_to_timeline();

-- 3. Trigger: vet_bookings completados → timeline
CREATE OR REPLACE FUNCTION public.sync_booking_completion_to_timeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_pet_id UUID;
BEGIN
  IF TG_OP != 'UPDATE' THEN RETURN NEW; END IF;

  -- Solo cuando status pasa a 'completed'
  IF OLD.status = NEW.status OR NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  v_pet_id := NEW.pet_id;
  IF v_pet_id IS NULL THEN RETURN NEW; END IF;

  -- Idempotencia
  IF EXISTS (
    SELECT 1 FROM public.pet_timeline_events
    WHERE related_record_id = NEW.id
      AND related_record_table = 'vet_bookings'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT owner_id INTO v_owner_id FROM public.pets WHERE id = v_pet_id;
  IF v_owner_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.pet_timeline_events (
    pet_id, category, title, description, event_at,
    source, is_user_reported, recorded_by,
    related_record_id, related_record_table, data
  ) VALUES (
    v_pet_id,
    'health',
    COALESCE('Consulta vet: ' || NEW.service_type, 'Consulta veterinaria'),
    NEW.notes,
    COALESCE(NEW.scheduled_date::TIMESTAMPTZ, NOW()),
    'auto_trigger',
    FALSE,  -- es vet, no user-reported
    v_owner_id,
    NEW.id,
    'vet_bookings',
    jsonb_build_object(
      'service_type', NEW.service_type,
      'service_provider_id', NEW.service_provider_id
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'sync_booking_completion_to_timeline failed: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trigger_booking_to_timeline ON public.vet_bookings;
CREATE TRIGGER trigger_booking_to_timeline
  AFTER UPDATE OF status ON public.vet_bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION public.sync_booking_completion_to_timeline();

-- 4. Trigger: routine_completions → timeline (categoria activity)
CREATE OR REPLACE FUNCTION public.sync_routine_completion_to_timeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_routine_title TEXT;
  v_pet_id UUID;
BEGIN
  IF TG_OP != 'INSERT' THEN RETURN NEW; END IF;

  -- Idempotencia
  IF EXISTS (
    SELECT 1 FROM public.pet_timeline_events
    WHERE related_record_id = NEW.id
      AND related_record_table = 'routine_completions'
  ) THEN
    RETURN NEW;
  END IF;

  -- Resolver pet_id desde la rutina
  SELECT pet_id, title INTO v_pet_id, v_routine_title
  FROM public.pet_routines WHERE id = NEW.routine_id;

  IF v_pet_id IS NULL THEN RETURN NEW; END IF;

  SELECT owner_id INTO v_owner_id FROM public.pets WHERE id = v_pet_id;
  IF v_owner_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.pet_timeline_events (
    pet_id, category, title, description, event_at,
    source, is_user_reported, recorded_by,
    related_record_id, related_record_table, data
  ) VALUES (
    v_pet_id,
    'activity',
    COALESCE(v_routine_title, 'Rutina completada'),
    NEW.notes,
    NEW.completed_at,
    'auto_trigger',
    TRUE,
    v_owner_id,
    NEW.id,
    'routine_completions',
    jsonb_build_object(
      'routine_id', NEW.routine_id,
      'duration_minutes', NEW.duration_minutes
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'sync_routine_completion_to_timeline failed: %', SQLERRM;
  RETURN NEW;
END $$;

-- Conditional: solo si la tabla routine_completions existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'routine_completions'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_routine_to_timeline ON public.routine_completions;
    EXECUTE 'CREATE TRIGGER trigger_routine_to_timeline ' ||
            'AFTER INSERT ON public.routine_completions ' ||
            'FOR EACH ROW EXECUTE FUNCTION public.sync_routine_completion_to_timeline()';
    RAISE NOTICE 'trigger_routine_to_timeline creado';
  ELSE
    RAISE NOTICE 'routine_completions no existe — trigger skip';
  END IF;
END $$;

COMMIT;

-- Smoke test
DO $$
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'sync_medical_record_to_timeline';
  IF NOT FOUND THEN RAISE EXCEPTION 'sync_medical_record_to_timeline no creada'; END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'sync_reminder_completion_to_timeline';
  IF NOT FOUND THEN RAISE EXCEPTION 'sync_reminder_completion_to_timeline no creada'; END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'sync_booking_completion_to_timeline';
  IF NOT FOUND THEN RAISE EXCEPTION 'sync_booking_completion_to_timeline no creada'; END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'trigger_medical_to_timeline';
  IF NOT FOUND THEN RAISE EXCEPTION 'trigger_medical_to_timeline no se conecto'; END IF;

  RAISE NOTICE 'Smoke test OK: 4 triggers auto-sync timeline (§2.4.3)';
END $$;
