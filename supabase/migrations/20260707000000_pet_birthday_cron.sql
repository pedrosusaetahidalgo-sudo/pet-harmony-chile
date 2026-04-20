-- ==========================================================================
-- Cron: cumpleaños de mascotas diario
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d retención emocional):
-- Cada día 13:00 UTC (10:00 Chile) llama send-pet-birthday-greeting,
-- que busca mascotas con birth_date de mes-día = hoy y envía push + email.
--
-- Volumen esperado: 1-5 pets/día según base activa.
-- Costo: casi cero (solo Resend email + FCM push para birthdays reales).
--
-- REQUISITO: edge fn send-pet-birthday-greeting deployada + RESEND_API_KEY +
-- FCM_SERVER_KEY + app.settings.service_role_key.
-- ==========================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('pet-birthday-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'pet-birthday-daily',
  '0 13 * * *',  -- Diario 13:00 UTC = 10:00 Chile
  $$
  SELECT net.http_post(
    url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-pet-birthday-greeting',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('scheduled', true)
  );
  $$
);

-- ----------------------------------------------------------------------
-- Verificacion post-apply:
--   SELECT jobid, jobname, schedule, active FROM cron.job
--   WHERE jobname = 'pet-birthday-daily';
--
-- Forzar manual (testear sin esperar):
--   SELECT net.http_post(
--     url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-pet-birthday-greeting',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
--     ),
--     body := jsonb_build_object('manual', true)
--   );
-- ----------------------------------------------------------------------
