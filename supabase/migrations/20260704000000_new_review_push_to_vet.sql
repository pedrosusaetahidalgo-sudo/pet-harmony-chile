-- ==========================================================================
-- Trigger push: nueva reseña publicada → notificar al vet
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d, cuarto caller push):
-- Cuando un dueño publica una reseña visible con rating, queremos que el
-- vet reciba push inmediato. Esto:
--   1. Cierra el loop feedback del vet (se siente valorado).
--   2. Si rating ≥ 4: lo motiva a mantener calidad.
--   3. Si rating ≤ 2: el vet sabe de inmediato y puede responder.
--
-- Idempotencia: AFTER INSERT con WHEN is_visible = true. Si el trigger
-- corre 2 veces por la misma row (caso raro), FCM solo entrega 1 push
-- por dispositivo, no hay spam real.
--
-- REQUISITO: app.settings.service_role_key + send-push-notification
-- deployada + FCM_SERVER_KEY secret.
-- ==========================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ----------------------------------------------------------------------
-- Funcion: notificar al vet cuando recibe nueva review visible
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_vet_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vet_user_id UUID;
  v_reviewer_name TEXT;
  v_title TEXT;
  v_body TEXT;
  v_stars TEXT;
BEGIN
  -- Solo procesar reviews visibles con rating
  IF NEW.is_visible IS DISTINCT FROM TRUE THEN RETURN NEW; END IF;
  IF NEW.rating IS NULL THEN RETURN NEW; END IF;
  IF NEW.provider_id IS NULL THEN RETURN NEW; END IF;

  -- Obtener user_id del vet (dueño del service_providers)
  SELECT user_id INTO v_vet_user_id
  FROM public.service_providers
  WHERE id = NEW.provider_id;

  IF v_vet_user_id IS NULL THEN RETURN NEW; END IF;

  -- Nombre del reviewer (fallback a anónimo)
  SELECT COALESCE(display_name, 'Un dueño') INTO v_reviewer_name
  FROM public.profiles
  WHERE id = NEW.reviewer_id;

  -- Stars visuales según rating
  v_stars := REPEAT('★', NEW.rating::INT) || REPEAT('☆', 5 - NEW.rating::INT);

  -- Title y body según rating
  IF NEW.rating >= 4 THEN
    v_title := 'Nueva reseña ' || v_stars;
    v_body := v_reviewer_name || ' te dejó '
              || NEW.rating::TEXT || ' de 5 estrellas'
              || CASE WHEN NEW.comment IS NOT NULL AND LENGTH(NEW.comment) > 0
                      THEN ': "' || LEFT(NEW.comment, 80) ||
                           CASE WHEN LENGTH(NEW.comment) > 80 THEN '..."' ELSE '"' END
                      ELSE '.'
                 END;
  ELSE
    -- Rating bajo: tono neutral, invita a responder
    v_title := 'Nueva reseña ' || v_stars;
    v_body := v_reviewer_name || ' te dejó '
              || NEW.rating::TEXT || ' de 5. Revisa y responde desde tu panel.';
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'user_ids', jsonb_build_array(v_vet_user_id::text),
        'title', v_title,
        'body', v_body,
        'data', jsonb_build_object(
          'route', '/provider/dashboard?tab=reviews',
          'review_id', NEW.id::text,
          'provider_id', NEW.provider_id::text,
          'rating', NEW.rating::TEXT,
          'kind', 'new_review'
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Best effort, no romper el insert
    NULL;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_vet_new_review() IS
  'Push al vet cuando recibe review visible. Rating >=4 copy positivo con snippet; <4 neutral invita a responder. Fire-and-forget.';

-- ----------------------------------------------------------------------
-- Trigger
-- ----------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_notify_vet_new_review ON public.service_reviews;
CREATE TRIGGER trigger_notify_vet_new_review
  AFTER INSERT ON public.service_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_vet_new_review();

-- ----------------------------------------------------------------------
-- Verificacion post-apply:
-- 1. Insertar review de prueba:
--    INSERT INTO service_reviews (provider_id, reviewer_id, rating, comment, is_visible, service_type)
--    VALUES ('<provider_id>', '<user_id>', 5, 'Excelente atencion', true, 'veterinarian');
-- 2. Ver si el vet recibio push.
-- 3. Si no llega: revisar que el vet tenga device_token habilitado y
--    FCM_SERVER_KEY configurada.
-- ----------------------------------------------------------------------
