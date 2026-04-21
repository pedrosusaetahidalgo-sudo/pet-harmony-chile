-- ==========================================================================
-- Badge "Vet Verificado Excelente" — trigger tras 3+ reviews 5★
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d):
-- Los vets que reciben 3 o mas reviews visibles con 5 estrellas ganan
-- automaticamente el badge "Vet Verificado Excelente" en su perfil publico.
-- Esto:
--   1. Diferencia vets con reputacion real vs recien llegados.
--   2. Refuerza loop positivo: mas reviews excelentes -> mas badge -> mas
--      exposicion -> mas pacientes.
--   3. Se calcula via trigger post-INSERT en service_reviews, fire-and-forget.
--
-- Idempotencia: CREATE OR REPLACE. Columna `excellence_badge_at` es
-- NULL hasta primera vez que se otorga; luego fijo (no se pierde aunque
-- bajen reviews despues, pero se puede recalcular manualmente por RPC).
-- ==========================================================================

-- ----------------------------------------------------------------------
-- 1. Columna para marcar badge (fecha en que se otorgo, NULL = sin badge)
-- ----------------------------------------------------------------------
ALTER TABLE public.service_providers
  ADD COLUMN IF NOT EXISTS excellence_badge_at TIMESTAMPTZ;

COMMENT ON COLUMN public.service_providers.excellence_badge_at IS
  'Fecha en que el vet alcanzo 3+ reviews 5-estrella visibles. NULL = no tiene badge.';

CREATE INDEX IF NOT EXISTS idx_service_providers_excellence_badge
  ON public.service_providers(excellence_badge_at)
  WHERE excellence_badge_at IS NOT NULL;

-- ----------------------------------------------------------------------
-- 2. Funcion: calcula y aplica badge si corresponde
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.maybe_award_excellence_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_five_star_count INT;
  v_already_has_badge BOOLEAN;
  v_vet_user_id UUID;
BEGIN
  -- Solo procesar reviews visibles con rating 5
  IF NEW.is_visible IS DISTINCT FROM TRUE THEN RETURN NEW; END IF;
  IF NEW.rating IS DISTINCT FROM 5 THEN RETURN NEW; END IF;
  IF NEW.provider_id IS NULL THEN RETURN NEW; END IF;

  -- Chequear si el provider ya tiene el badge (evita trabajo extra)
  SELECT excellence_badge_at IS NOT NULL, user_id
    INTO v_already_has_badge, v_vet_user_id
  FROM public.service_providers
  WHERE id = NEW.provider_id;

  IF v_already_has_badge THEN RETURN NEW; END IF;

  -- Contar reviews 5-star visibles distintas (por reviewer, para evitar
  -- que un solo user spamee el mismo vet con 3 reseñas)
  SELECT COUNT(DISTINCT reviewer_id) INTO v_five_star_count
  FROM public.service_reviews
  WHERE provider_id = NEW.provider_id
    AND rating = 5
    AND is_visible = TRUE;

  -- Umbral: 3 reviewers distintos con 5 estrellas
  IF v_five_star_count >= 3 THEN
    UPDATE public.service_providers
    SET excellence_badge_at = NOW()
    WHERE id = NEW.provider_id
      AND excellence_badge_at IS NULL;

    -- Push al vet celebrando (best effort)
    IF v_vet_user_id IS NOT NULL THEN
      BEGIN
        PERFORM net.http_post(
          url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-push-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
          ),
          body := jsonb_build_object(
            'user_ids', jsonb_build_array(v_vet_user_id::text),
            'title', 'Nuevo badge: Vet Verificado Excelente',
            'body', 'Alcanzaste 3 resenas 5 estrellas. Tu perfil publico ahora muestra el badge.',
            'data', jsonb_build_object(
              'route', '/provider/dashboard',
              'kind', 'excellence_badge_awarded'
            )
          )
        );
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.maybe_award_excellence_badge() IS
  'Otorga badge "Vet Verificado Excelente" cuando service_providers acumula 3+ reviewers distintos con rating 5. Push fire-and-forget al vet.';

-- ----------------------------------------------------------------------
-- 3. Trigger sobre service_reviews
-- ----------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_maybe_award_excellence_badge ON public.service_reviews;
CREATE TRIGGER trigger_maybe_award_excellence_badge
  AFTER INSERT ON public.service_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.maybe_award_excellence_badge();

-- ----------------------------------------------------------------------
-- 4. Backfill: aplicar badge a vets que YA tenian 3+ reviews 5-star
-- ----------------------------------------------------------------------
UPDATE public.service_providers sp
SET excellence_badge_at = NOW()
WHERE excellence_badge_at IS NULL
  AND (
    SELECT COUNT(DISTINCT reviewer_id)
    FROM public.service_reviews
    WHERE provider_id = sp.id
      AND rating = 5
      AND is_visible = TRUE
  ) >= 3;

-- ----------------------------------------------------------------------
-- 5. RPC manual para admin: recalcular badge de un vet especifico
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_recalculate_excellence_badge(p_provider_id UUID)
RETURNS TABLE(provider_id UUID, five_star_reviewers INT, has_badge BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  IF NOT public.is_active_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COUNT(DISTINCT reviewer_id) INTO v_count
  FROM public.service_reviews
  WHERE service_reviews.provider_id = p_provider_id
    AND rating = 5
    AND is_visible = TRUE;

  IF v_count >= 3 THEN
    UPDATE public.service_providers
    SET excellence_badge_at = COALESCE(excellence_badge_at, NOW())
    WHERE id = p_provider_id;
  ELSE
    UPDATE public.service_providers
    SET excellence_badge_at = NULL
    WHERE id = p_provider_id;
  END IF;

  RETURN QUERY
  SELECT p_provider_id, v_count,
    (SELECT excellence_badge_at IS NOT NULL
     FROM public.service_providers WHERE id = p_provider_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_recalculate_excellence_badge(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_recalculate_excellence_badge(UUID) TO authenticated;

-- Verificacion post-apply:
-- 1. Chequear cuantos vets recibieron badge por backfill:
--    SELECT COUNT(*) FROM service_providers WHERE excellence_badge_at IS NOT NULL;
-- 2. Insertar review 5* de prueba y verificar que badge se aplica si es el 3er reviewer.
-- 3. RPC admin:
--    SELECT * FROM admin_recalculate_excellence_badge('<provider_id>');
