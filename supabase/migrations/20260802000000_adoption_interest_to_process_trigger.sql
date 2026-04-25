-- Refactor adopcion 2026-04-24 — Auto-crear adoption_process desde adoption_interest
--
-- Cuando un adopter expresa interes en una mascota de refugio (insert en
-- adoption_interests con pet_id NOT NULL), automaticamente se crea un
-- adoption_processes con status='interested' para que el refugio lo vea
-- en el kanban (/shelter/adopciones).
--
-- Sin esto la conexion entre /refugios/:slug "Me interesa" y el kanban
-- esta rota: el refugio nunca ve el interes.
--
-- Idempotencia: ON CONFLICT (pet_id, adopter_user_id) DO NOTHING.

BEGIN;

CREATE OR REPLACE FUNCTION public.create_adoption_process_from_interest()
RETURNS TRIGGER AS $$
DECLARE
  v_shelter_id UUID;
BEGIN
  -- Solo aplica cuando el interes es sobre una mascota de refugio (pet_id NOT NULL)
  IF NEW.pet_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Lookup shelter dueno del pet
  SELECT created_by_shelter_id INTO v_shelter_id
    FROM public.pets
    WHERE id = NEW.pet_id
      AND owner_id IS NULL
      AND created_by_shelter_id IS NOT NULL
      AND shelter_adopted_at IS NULL;

  IF v_shelter_id IS NULL THEN
    -- No es pet de refugio activo, skip
    RETURN NEW;
  END IF;

  -- Crear proceso (idempotente: si ya existe pet_id+adopter, skip)
  INSERT INTO public.adoption_processes (
    pet_id, adopter_user_id, shelter_id, source_interest_id, status, notes_adopter
  )
  VALUES (
    NEW.pet_id,
    NEW.interested_user_id,
    v_shelter_id,
    NEW.id,
    'interested',
    NEW.message
  )
  ON CONFLICT (pet_id, adopter_user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tg_adoption_interest_to_process
  ON public.adoption_interests;
CREATE TRIGGER tg_adoption_interest_to_process
  AFTER INSERT ON public.adoption_interests
  FOR EACH ROW EXECUTE FUNCTION public.create_adoption_process_from_interest();

COMMIT;

-- Smoke test (regla 9.2.1)
DO $$
DECLARE
  v_pet_id UUID;
  v_user_id UUID;
  v_proc_id UUID;
  v_interest_id UUID;
BEGIN
  -- Validar que la function existe
  PERFORM 1 FROM pg_proc WHERE proname = 'create_adoption_process_from_interest';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Function no se creo';
  END IF;

  -- Validar que el trigger existe
  PERFORM 1 FROM pg_trigger
    WHERE tgname = 'tg_adoption_interest_to_process'
      AND tgrelid = 'public.adoption_interests'::regclass;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trigger no se creo';
  END IF;

  -- Si hay pets de refugio + user real, validar que el flujo crea el proceso
  SELECT p.id INTO v_pet_id
    FROM public.pets p
    WHERE p.created_by_shelter_id IS NOT NULL
      AND p.owner_id IS NULL
      AND p.shelter_adopted_at IS NULL
    LIMIT 1;

  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_pet_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    -- Cleanup previo
    DELETE FROM public.adoption_processes
      WHERE pet_id = v_pet_id AND adopter_user_id = v_user_id;
    DELETE FROM public.adoption_interests
      WHERE pet_id = v_pet_id AND interested_user_id = v_user_id;

    -- Insertar interes (debe disparar trigger)
    INSERT INTO public.adoption_interests (pet_id, interested_user_id, message)
    VALUES (v_pet_id, v_user_id, 'SMOKE_TEST')
    RETURNING id INTO v_interest_id;

    -- Verificar que se creo el proceso
    SELECT id INTO v_proc_id FROM public.adoption_processes
      WHERE pet_id = v_pet_id AND adopter_user_id = v_user_id;
    IF v_proc_id IS NULL THEN
      RAISE EXCEPTION 'Trigger no creo adoption_process';
    END IF;

    -- Cleanup
    DELETE FROM public.adoption_processes WHERE id = v_proc_id;
    DELETE FROM public.adoption_interests WHERE id = v_interest_id;

    RAISE NOTICE 'Smoke test OK: trigger crea adoption_process desde adoption_interest';
  ELSE
    RAISE NOTICE 'Smoke test parcial: function + trigger validados (sin pets de refugio para flujo completo)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Smoke test FAILED: %', SQLERRM;
END $$;
