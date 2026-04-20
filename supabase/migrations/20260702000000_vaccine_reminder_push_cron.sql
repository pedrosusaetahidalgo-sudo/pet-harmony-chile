-- ==========================================================================
-- Cron push: recordatorios de vacuna/antiparasitario 24-36h antes
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d INIT-16 segundo caller real):
-- reminder-cron ya corre 1x/dia 8 AM Chile enviando WhatsApp. Este cron
-- complementa con push nativo (FCM Android + iOS via FCM) para los
-- usuarios con device_tokens registrados. Mas probabilidad que WhatsApp
-- (push no depende de phone/opt-in explicito).
--
-- Diseno:
--  - Corre 1x/dia a las 16:00 UTC (13:00 Chile) — horario visible para
--    usuarios mientras trabajan, evita madrugada.
--  - Busca pet_reminders no completados con due_date entre 24h y 36h en el
--    futuro (ventana de 12h para capturar sin duplicar).
--  - Solo si el owner tiene algun device_token enabled.
--  - Dispara send-push-notification por cada reminder elegible.
--
-- Idempotencia:
--  - Usamos whatsapp_message_log como tabla de dedup (ya existe). Nuevo
--    valor channel='push' identifica envios push. Si ya hay uno para
--    (reminder_id, 'push') en ultimas 20h, skippear.
--
-- REQUISITO:
--  - pg_cron + pg_net extensions (ya activas si el cron weekly corre).
--  - app.settings.service_role_key configurada.
--  - send-push-notification deployada + FCM_SERVER_KEY secret.
-- ==========================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ----------------------------------------------------------------------
-- 1. Asegurar columna channel en whatsapp_message_log para dedup push
-- ----------------------------------------------------------------------
-- Idempotente: si ya existe, no hace nada.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'whatsapp_message_log'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'whatsapp_message_log'
        AND column_name = 'channel'
    ) THEN
      ALTER TABLE public.whatsapp_message_log
        ADD COLUMN channel TEXT NOT NULL DEFAULT 'whatsapp'
          CHECK (channel IN ('whatsapp', 'push', 'email'));
    END IF;
  END IF;
END $$;

-- Index para dedup eficiente por (reference_id, channel) ventana reciente
CREATE INDEX IF NOT EXISTS idx_msg_log_ref_channel_recent
  ON public.whatsapp_message_log (reference_id, channel, created_at DESC)
  WHERE status = 'sent';

-- ----------------------------------------------------------------------
-- 2. Funcion: enviar push de recordatorios elegibles (proximas 24-36h)
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_reminder_pushes()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reminder RECORD;
  v_count_sent INT := 0;
  v_count_skipped INT := 0;
  v_title TEXT;
  v_body TEXT;
  v_pet_name TEXT;
BEGIN
  -- Ventana: due_date entre ahora+20h y ahora+36h (para agarrar los de mañana)
  FOR v_reminder IN
    SELECT r.id, r.pet_id, r.owner_id, r.title, r.type, r.due_date
    FROM public.pet_reminders r
    WHERE r.due_date BETWEEN (CURRENT_DATE + INTERVAL '20 hours')
                         AND (CURRENT_DATE + INTERVAL '36 hours')
      AND (r.is_completed IS NULL OR r.is_completed = FALSE)
      AND r.owner_id IS NOT NULL
      -- Solo si el owner tiene device_token habilitado
      AND EXISTS (
        SELECT 1 FROM public.device_tokens dt
        WHERE dt.user_id = r.owner_id AND dt.enabled = TRUE
      )
      -- Dedup: no enviar si ya mandamos push de este reminder en ultimas 20h
      AND NOT EXISTS (
        SELECT 1 FROM public.whatsapp_message_log wml
        WHERE wml.reference_id = r.id::text
          AND wml.channel = 'push'
          AND wml.status = 'sent'
          AND wml.created_at > NOW() - INTERVAL '20 hours'
      )
  LOOP
    -- Nombre de mascota para el body
    SELECT name INTO v_pet_name FROM public.pets WHERE id = v_reminder.pet_id;

    v_title := CASE v_reminder.type
      WHEN 'vaccine'       THEN 'Vacuna mañana'
      WHEN 'antiparasitic' THEN 'Antiparasitario mañana'
      WHEN 'deworming'     THEN 'Desparasitacion mañana'
      ELSE 'Recordatorio mañana'
    END;

    v_body := COALESCE(v_reminder.title, 'Recordatorio')
              || ' para ' || COALESCE(v_pet_name, 'tu mascota')
              || ' el ' || to_char(v_reminder.due_date, 'DD "de" FMMonth');

    -- Disparar push fire-and-forget
    BEGIN
      PERFORM net.http_post(
        url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'user_ids', jsonb_build_array(v_reminder.owner_id::text),
          'title', v_title,
          'body', v_body,
          'data', jsonb_build_object(
            'route', '/reminders',
            'reminder_id', v_reminder.id::text,
            'pet_id', v_reminder.pet_id::text,
            'kind', 'reminder_push'
          )
        )
      );

      -- Marcar como enviado (para dedup)
      INSERT INTO public.whatsapp_message_log (reference_id, channel, status, created_at)
      VALUES (v_reminder.id::text, 'push', 'sent', NOW())
      ON CONFLICT DO NOTHING;

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

COMMENT ON FUNCTION public.send_reminder_pushes() IS
  'Envia push a owners con reminders due dentro de 20-36h. Dedup via whatsapp_message_log. Skippea si owner no tiene device_token enabled.';

GRANT EXECUTE ON FUNCTION public.send_reminder_pushes() TO service_role;

-- ----------------------------------------------------------------------
-- 3. Schedule cron: 1x/dia 16:00 UTC = 13:00 Chile
-- ----------------------------------------------------------------------
DO $$
BEGIN
  PERFORM cron.unschedule('reminder-push-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'reminder-push-daily',
  '0 16 * * *',  -- 16:00 UTC = 13:00 Chile todos los dias
  $$
  SELECT public.send_reminder_pushes();
  $$
);

-- ----------------------------------------------------------------------
-- Verificacion post-apply:
-- 1. Forzar ejecucion manual:
--      SELECT public.send_reminder_pushes();
-- 2. Ver jobs:
--      SELECT jobid, jobname, schedule, active FROM cron.job
--      WHERE jobname = 'reminder-push-daily';
-- 3. Ver resultados ultimas corridas:
--      SELECT * FROM cron.job_run_details
--      WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'reminder-push-daily')
--      ORDER BY start_time DESC LIMIT 5;
-- ----------------------------------------------------------------------
