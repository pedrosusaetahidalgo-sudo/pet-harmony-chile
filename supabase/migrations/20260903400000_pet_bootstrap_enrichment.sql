-- ══════════════════════════════════════════════════════════════════════════
-- Pet bootstrap enriquecido (Refactor Maestro §14.bis.3)
-- ══════════════════════════════════════════════════════════════════════════
-- Mejora del trigger create_welcome_timeline_event para que ademas del
-- "Bienvenida" cree eventos derivados de la data ya conocida del pet.
-- Asi el timeline arranca con 2-4 eventos en vez de solo 1, dandole al
-- dueño una sensacion inmediata de "ya tiene historia".
--
-- Eventos derivados que generamos:
--   - "Nacimiento" si birth_date conocida (category=milestone)
--   - "Microchip registrado" si microchip_number presente (category=legal,
--     ley 21.020 — registro Cholito)
--   - "Esterilizada" si neutered=true Y neutered_date conocida (category=health)
--
-- Todos con source='auto_trigger' y is_user_reported=false para distinguir
-- del registro manual del dueño.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.create_welcome_timeline_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- 1. Evento Bienvenida (siempre)
  INSERT INTO public.pet_timeline_events (
    pet_id, category, title, description, event_at,
    source, is_milestone, is_user_reported, recorded_by, data
  ) VALUES (
    NEW.id,
    'milestone',
    FORMAT('%s entra a Paw Friend ✨', NEW.name),
    FORMAT(
      'Empieza la historia de %s. Acá vamos a guardar cada momento — vacunas, peso, fotos, ' ||
      'logros, hasta los pequeños detalles que hacen la diferencia.',
      NEW.name
    ),
    NOW(),
    'auto_trigger',
    TRUE,
    FALSE,
    NEW.owner_id,
    jsonb_build_object(
      'auto_generated', true,
      'event_kind', 'welcome',
      'pet_species', NEW.species
    )
  );

  -- 2. Evento Nacimiento (si birth_date conocida y razonable)
  IF NEW.birth_date IS NOT NULL
    AND NEW.birth_date > '1990-01-01'::DATE
    AND NEW.birth_date <= CURRENT_DATE THEN
    INSERT INTO public.pet_timeline_events (
      pet_id, category, title, description, event_at,
      source, is_milestone, is_user_reported, recorded_by, data
    ) VALUES (
      NEW.id,
      'milestone',
      FORMAT('Nacio %s 🎂', NEW.name),
      FORMAT(
        'El dia que llego al mundo. Calculamos su edad y futuros hitos a partir de aca.'
      ),
      NEW.birth_date::TIMESTAMPTZ,
      'auto_trigger',
      TRUE,
      FALSE,
      NEW.owner_id,
      jsonb_build_object(
        'auto_generated', true,
        'event_kind', 'birth',
        'birth_date', NEW.birth_date
      )
    );
  END IF;

  -- 3. Evento Microchip (Ley 21.020 Cholito) si tiene chip al registrar
  IF NEW.microchip_number IS NOT NULL
    AND TRIM(NEW.microchip_number) != '' THEN
    INSERT INTO public.pet_timeline_events (
      pet_id, category, title, description, event_at,
      source, is_milestone, is_user_reported, recorded_by, data
    ) VALUES (
      NEW.id,
      'legal',
      'Microchip registrado',
      FORMAT(
        'Microchip ISO 11784/11785 registrado: %s. Cumple Ley 21.020 (Ley Cholito) ' ||
        'que exige identificacion electronica obligatoria.',
        NEW.microchip_number
      ),
      NOW(),
      'auto_trigger',
      FALSE,
      FALSE,
      NEW.owner_id,
      jsonb_build_object(
        'auto_generated', true,
        'event_kind', 'microchip_registered',
        'microchip_number', NEW.microchip_number,
        'law_reference', 'Ley 21.020 Chile'
      )
    );
  END IF;

  -- 4. Evento Esterilizacion (si dato presente al registrar)
  -- Detectamos via pets.neutered=true. neutered_date puede estar NULL si
  -- el dueño no recuerda fecha; usamos created_at como aproximacion.
  IF NEW.neutered IS TRUE THEN
    INSERT INTO public.pet_timeline_events (
      pet_id, category, title, description, event_at,
      source, is_milestone, is_user_reported, recorded_by, data
    ) VALUES (
      NEW.id,
      'health',
      FORMAT('%s esta esterilizada', NEW.name),
      'Procedimiento ya realizado al momento de entrar a Paw Friend.',
      COALESCE(NEW.neutered_date::TIMESTAMPTZ, NOW()),
      'auto_trigger',
      FALSE,
      FALSE,
      NEW.owner_id,
      jsonb_build_object(
        'auto_generated', true,
        'event_kind', 'neutered',
        'neutered_date', NEW.neutered_date,
        'date_certainty', CASE WHEN NEW.neutered_date IS NOT NULL THEN 'exact' ELSE 'approximate' END
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'create_welcome_timeline_event enriched failed: %', SQLERRM;
  RETURN NEW;
END $$;

-- Trigger ya existe; CREATE OR REPLACE FUNCTION lo deja conectado.

COMMENT ON FUNCTION public.create_welcome_timeline_event() IS
  'Refactor Maestro §14.bis.3 enriquecido. Crea hasta 4 eventos timeline al '
  'insertar pet: Bienvenida (siempre), Nacimiento (si birth_date), Microchip '
  '(si chip), Esterilizacion (si neutered). Todos source=auto_trigger.';

COMMIT;

DO $$
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'create_welcome_timeline_event';
  IF NOT FOUND THEN RAISE EXCEPTION 'create_welcome_timeline_event no encontrada'; END IF;

  -- Verifica que pets.neutered existe (sino el trigger crashea en runtime)
  PERFORM 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'neutered';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pets.neutered no existe — refactor del trigger asume su presencia';
  END IF;

  RAISE NOTICE 'Smoke test OK: bootstrap enriched (4 eventos derivados)';
END $$;
