-- ==========================================================================
-- Cron: reminder usuarios inactivos 14-45 días, 1x semana
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d):
-- Usuarios con mascota que no se loguean hace 14-45 días son candidatos
-- prime para recuperación. Jueves 14:00 UTC (11:00 Chile) envía email
-- cálido "¿cómo está {mascota}?".
--
-- Fuera del rango (>45d): se asume churn, no molestar más.
-- Dedup: 1 email por user cada 30 días vía whatsapp_message_log.channel='email'.
--
-- REQUISITO: edge fn send-inactive-user-reminder deployada + RESEND_API_KEY
-- + app.settings.service_role_key.
-- ==========================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('inactive-user-reminder-weekly');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'inactive-user-reminder-weekly',
  '0 14 * * 4',  -- Jueves 14:00 UTC = 11:00 Chile
  $$
  SELECT net.http_post(
    url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-inactive-user-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('scheduled', true)
  );
  $$
);

-- Verificacion post-apply:
-- SELECT jobid, jobname, schedule, active FROM cron.job
-- WHERE jobname = 'inactive-user-reminder-weekly';
--
-- Forzar manual:
-- SELECT net.http_post(
--   url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-inactive-user-reminder',
--   headers := jsonb_build_object(
--     'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
--   ),
--   body := jsonb_build_object('manual', true)
-- );
