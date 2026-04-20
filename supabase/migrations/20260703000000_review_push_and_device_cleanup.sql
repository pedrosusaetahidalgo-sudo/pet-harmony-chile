-- ==========================================================================
-- Cron push reseña pendiente + cleanup device_tokens zombie
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d):
-- 1. Reviews: cuando se completa una consulta vet, se crea pending_review.
--    Hoy queda visible en /home pero nadie recuerda dejar review. Un push
--    24h despues cierra el loop y sube NPS + rating vets pagando.
-- 2. Device tokens: dispositivos que no se ven hace >180 dias probablemente
--    son zombis (telefono vendido, app desinstalada). Limpiar para:
--       - Evitar push a tokens invalidos que FCM cobra igual.
--       - Reducir tabla device_tokens.
--       - Mejorar signal de MAU mobile.
--
-- Idempotencia: ambos crons usan cron.unschedule si ya existen.
-- REQUISITO: app.settings.service_role_key + send-push-notification
-- deployada + FCM_SERVER_KEY secret.
-- ==========================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ----------------------------------------------------------------------
-- 1. Funcion: push "dejas tu reseña?" a pending_reviews 24-48h viejos
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_pending_review_pushes()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending RECORD;
  v_count_sent INT := 0;
  v_count_skipped INT := 0;
  v_vet_name TEXT;
  v_pet_name TEXT;
  v_title TEXT;
  v_body TEXT;
BEGIN
  FOR v_pending IN
    SELECT pr.id, pr.user_id, pr.target_user_id, pr.pet_id, pr.transaction_id
    FROM public.pending_reviews pr
    WHERE pr.completed_at IS NULL
      AND pr.notification_sent_at IS NULL
      AND pr.created_at BETWEEN (NOW() - INTERVAL '48 hours')
                           AND (NOW() - INTERVAL '24 hours')
      AND pr.expires_at > NOW()
      -- Solo si el user tiene device_token habilitado
      AND EXISTS (
        SELECT 1 FROM public.device_tokens dt
        WHERE dt.user_id = pr.user_id AND dt.enabled = TRUE
      )
  LOOP
    SELECT COALESCE(display_name, 'tu veterinario') INTO v_vet_name
      FROM public.profiles WHERE id = v_pending.target_user_id;
    SELECT name INTO v_pet_name FROM public.pets WHERE id = v_pending.pet_id;

    v_title := '¿Cómo fue la consulta?';
    v_body := 'Deja tu reseña para ' || v_vet_name
              || CASE WHEN v_pet_name IS NOT NULL THEN ' (consulta de ' || v_pet_name || ')' ELSE '' END
              || '. Ayuda a otros dueños.';

    BEGIN
      PERFORM net.http_post(
        url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'user_ids', jsonb_build_array(v_pending.user_id::text),
          'title', v_title,
          'body', v_body,
          'data', jsonb_build_object(
            'route', '/home',
            'pending_review_id', v_pending.id::text,
            'kind', 'review_pending'
          )
        )
      );

      -- Marcar que ya se notifico (dedup futura)
      UPDATE public.pending_reviews
      SET notification_sent_at = NOW()
      WHERE id = v_pending.id;

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

COMMENT ON FUNCTION public.send_pending_review_pushes() IS
  'Push a usuarios con pending_review creada hace 24-48h sin notificacion y sin completar. Marca notification_sent_at para dedup.';

GRANT EXECUTE ON FUNCTION public.send_pending_review_pushes() TO service_role;

-- ----------------------------------------------------------------------
-- 2. Schedule cron review push: 1x/dia 17:00 UTC = 14:00 Chile
-- ----------------------------------------------------------------------
DO $$
BEGIN
  PERFORM cron.unschedule('pending-review-push-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'pending-review-push-daily',
  '0 17 * * *',  -- 17:00 UTC = 14:00 Chile
  $$
  SELECT public.send_pending_review_pushes();
  $$
);

-- ----------------------------------------------------------------------
-- 3. Funcion: cleanup device_tokens zombie (last_seen > 180 dias)
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_zombie_device_tokens()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_disabled INT;
BEGIN
  -- Paso 1: deshabilitar tokens no vistos hace >180 dias
  UPDATE public.device_tokens
  SET enabled = FALSE
  WHERE enabled = TRUE
    AND last_seen_at < NOW() - INTERVAL '180 days';

  GET DIAGNOSTICS v_disabled = ROW_COUNT;

  -- Paso 2 (mas agresivo): borrar tokens deshabilitados hace >365 dias
  DELETE FROM public.device_tokens
  WHERE enabled = FALSE
    AND last_seen_at < NOW() - INTERVAL '365 days';

  RETURN jsonb_build_object(
    'disabled', v_disabled,
    'ran_at', NOW()
  );
END;
$$;

COMMENT ON FUNCTION public.cleanup_zombie_device_tokens() IS
  'Deshabilita device_tokens no vistos hace 180d; borra definitivo los deshabilitados hace 365d. Higiene semanal.';

GRANT EXECUTE ON FUNCTION public.cleanup_zombie_device_tokens() TO service_role;

-- ----------------------------------------------------------------------
-- 4. Schedule cron cleanup: domingo 03:00 UTC (bajo trafico)
-- ----------------------------------------------------------------------
DO $$
BEGIN
  PERFORM cron.unschedule('device-tokens-cleanup-weekly');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'device-tokens-cleanup-weekly',
  '0 3 * * 0',  -- Domingo 03:00 UTC
  $$
  SELECT public.cleanup_zombie_device_tokens();
  $$
);

-- ----------------------------------------------------------------------
-- Verificacion post-apply:
--   SELECT jobid, jobname, schedule, active FROM cron.job
--   WHERE jobname IN ('pending-review-push-daily', 'device-tokens-cleanup-weekly');
--
-- Forzar ejecucion manual:
--   SELECT public.send_pending_review_pushes();
--   SELECT public.cleanup_zombie_device_tokens();
-- ----------------------------------------------------------------------
