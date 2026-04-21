-- ══════════════════════════════════════════════════════════════
-- C.1 — Daily digest cron (auditoria top-tier 2026-04-20)
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Dispara generate-daily-digest cada dia a las 11 UTC (8 AM Chile).
-- Esa edge fn inserta 1 notificacion in-app por owner con reminders
-- pendientes en las proximas 48h. Es idempotente (dedupe por user-day).
--
-- Pre-requisito: app.settings.service_role_key seteado (mismo que usa
-- weekly_reports_cron). Si el cron de weekly ya corre, este heredara
-- la misma config.
--
-- Idempotente: cron.unschedule + cron.schedule.
-- ══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Limpiar schedule previo (idempotencia)
DO $$
BEGIN
  PERFORM cron.unschedule('daily-digest');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Schedule: todos los dias a las 11 UTC = 8 AM Chile
SELECT cron.schedule(
  'daily-digest',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/generate-daily-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('scheduled', true)
  );
  $$
);

-- ──────────────────────────────────────────────────────────────
-- Verificacion:
--
--   SELECT jobid, jobname, schedule, active
--     FROM cron.job
--     WHERE jobname = 'daily-digest';
--
--   -- Forzar ejecucion manual (testing):
--   SELECT net.http_post(
--     url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/generate-daily-digest',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
--     ),
--     body := jsonb_build_object('manual_test', true)
--   );
--
--   -- Ver notificaciones daily_digest creadas hoy:
--   SELECT count(*) FROM public.notifications
--     WHERE type = 'daily_digest'
--       AND created_at >= current_date;
--
--   -- Desactivar temporalmente:
--   UPDATE cron.job SET active = false WHERE jobname = 'daily-digest';
-- ──────────────────────────────────────────────────────────────
