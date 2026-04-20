-- ==========================================================================
-- pg_cron: weekly reports activados (domingo 10 AM Chile = 13 UTC)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d INIT-20):
-- Las edge fns generate-weekly-owner-reports y generate-weekly-vet-reports
-- estan deployadas pero sin cron schedule configurado
-- (auditoria FEATURES_INCOMPLETAS_2026_04_14.md §C5).
-- Esta migracion agenda 2 cron jobs que las invocan cada domingo 10 AM
-- hora Chile (13 UTC).
--
-- REQUISITO: antes de aplicar, confirmar que el setting
--   `app.settings.service_role_key` esta configurado en Supabase
-- (Dashboard > Database > Configuration). Si no existe, ejecutar
-- una sola vez:
--
--   ALTER DATABASE postgres SET app.settings.service_role_key = '<JWT service_role>';
--
-- (JWT service_role de Settings > API en Supabase Dashboard).
--
-- Por que NO hardcodear el JWT aqui: feedback_cron_no_jwt_hardcoded.md
-- — una vez rotes el service role, los crons con JWT hardcodeado quedan
-- inutiles y silenciosamente dejan de funcionar.
-- ==========================================================================

-- Pre-requisitos: extension pg_cron + net (Supabase Pro ya las trae)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ----------------------------------------------------------------------
-- Limpiar schedules previos (idempotencia)
-- ----------------------------------------------------------------------
DO $$
BEGIN
  PERFORM cron.unschedule('weekly-owner-reports');
EXCEPTION WHEN OTHERS THEN
  -- Si no existe, seguir
  NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('weekly-vet-reports');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ----------------------------------------------------------------------
-- Cron 1: generate-weekly-owner-reports — domingo 13:00 UTC = 10:00 Chile
-- ----------------------------------------------------------------------
SELECT cron.schedule(
  'weekly-owner-reports',
  '0 13 * * 0',  -- domingo 13:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/generate-weekly-owner-reports',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('scheduled', true)
  );
  $$
);

-- ----------------------------------------------------------------------
-- Cron 2: generate-weekly-vet-reports — domingo 13:05 UTC (escalonado)
-- ----------------------------------------------------------------------
SELECT cron.schedule(
  'weekly-vet-reports',
  '5 13 * * 0',  -- domingo 13:05 UTC (5 min despues del owner)
  $$
  SELECT net.http_post(
    url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/generate-weekly-vet-reports',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('scheduled', true)
  );
  $$
);

-- ----------------------------------------------------------------------
-- Verificar que quedaron activos (mostrar en output del SQL editor)
-- ----------------------------------------------------------------------
-- Ejecutar despues de aplicar para confirmar:
--   SELECT jobid, jobname, schedule, active FROM cron.job
--   WHERE jobname IN ('weekly-owner-reports', 'weekly-vet-reports');
--
-- Para ver ultimas ejecuciones:
--   SELECT jobid, runid, start_time, status, return_message FROM cron.job_run_details
--   WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname IN ('weekly-owner-reports', 'weekly-vet-reports'))
--   ORDER BY start_time DESC LIMIT 10;
--
-- Para deshabilitar temporal (sin eliminar):
--   UPDATE cron.job SET active = false WHERE jobname = 'weekly-owner-reports';
--
-- Para eliminar definitivo:
--   SELECT cron.unschedule('weekly-owner-reports');
