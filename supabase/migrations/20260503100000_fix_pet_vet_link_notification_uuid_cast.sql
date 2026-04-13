-- ============================================================
-- Fix: reference_id es uuid, no text + notificar a AMBOS lados
--
-- 1. Quitaba NEW.id::text → ahora pasa NEW.id directamente (uuid)
-- 2. En INSERT pending: notifica al vet Y al dueño
--    (soporta tanto dueño→vet como vet→dueño via QR)
--
-- NO aplicar automaticamente. Aplicar en Supabase Dashboard > SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_pet_vet_link_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_pet_name text;
  v_owner_name text;
  v_vet_user_id uuid;
  v_vet_name text;
BEGIN
  SELECT name INTO v_pet_name FROM public.pets WHERE id = NEW.pet_id;
  SELECT display_name INTO v_owner_name FROM public.profiles WHERE id = NEW.owner_id;
  SELECT sp.user_id, p.display_name INTO v_vet_user_id, v_vet_name
    FROM public.service_providers sp
    JOIN public.profiles p ON p.id = sp.user_id
    WHERE sp.id = NEW.provider_id;

  -- Nueva solicitud -> notificar al vet
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- Notificar al vet (para flujo dueno→vet)
    IF v_vet_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, action_url, reference_id)
      VALUES (
        v_vet_user_id,
        'vet_link_request',
        'Nueva solicitud de paciente',
        COALESCE(v_owner_name, 'Un usuario') || ' quiere compartir la ficha de ' || COALESCE(v_pet_name, 'su mascota') || ' contigo.',
        '/provider/dashboard',
        NEW.id
      );
    END IF;

    -- Notificar al dueno (para flujo vet→dueno via QR)
    INSERT INTO public.notifications (user_id, type, title, body, action_url, reference_id)
    VALUES (
      NEW.owner_id,
      'vet_link_request_from_vet',
      'Un veterinario quiere acceder a tu ficha',
      COALESCE(v_vet_name, 'Un veterinario') || ' solicita acceso a la ficha de ' || COALESCE(v_pet_name, 'tu mascota') || '.',
      '/ficha/' || NEW.pet_id || '?tab=compartir',
      NEW.id
    );
  END IF;

  -- Vet acepta -> notificar al dueno
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'active' THEN
    INSERT INTO public.notifications (user_id, type, title, body, action_url, reference_id)
    VALUES (
      NEW.owner_id,
      'vet_link_accepted',
      'Tu vet acepto la solicitud',
      COALESCE(v_vet_name, 'Tu veterinario') || ' ahora tiene acceso a la ficha de ' || COALESCE(v_pet_name, 'tu mascota') || '.',
      '/ficha/' || NEW.pet_id,
      NEW.id
    );
  END IF;

  -- Vet rechaza -> notificar al dueno
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, type, title, body, action_url, reference_id)
    VALUES (
      NEW.owner_id,
      'vet_link_rejected',
      'Solicitud no aceptada',
      COALESCE(v_vet_name, 'El veterinario') || ' no acepto la solicitud para ' || COALESCE(v_pet_name, 'tu mascota') || '.',
      '/my-pets',
      NEW.id
    );
  END IF;

  -- Dueno revoca -> notificar al vet
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'revoked_by_owner' THEN
    INSERT INTO public.notifications (user_id, type, title, body, action_url, reference_id)
    VALUES (
      v_vet_user_id,
      'vet_link_revoked',
      'Paciente desvinculado',
      COALESCE(v_owner_name, 'El dueno') || ' revoco el acceso a la ficha de ' || COALESCE(v_pet_name, 'una mascota') || '.',
      '/provider/dashboard',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;
