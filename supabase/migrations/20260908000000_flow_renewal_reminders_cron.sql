-- 2026-04-28 (Sprint 1 P1 BIZ-006)
--
-- Programa el cron que invoca `flow-renewal-reminders-cron` 1x/dia.
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
-- DEPENDENCIAS:
--   - pg_cron + pg_net (extensiones)
--   - Edge fn `flow-renewal-reminders-cron` deployed
--   - Vault secret `service_role_key` (ver cron-auth requireCronAuth)
--   - Migracion 20260907200000_subscriptions_renewal_reminder.sql aplicada
--     (agrega columna last_renewal_reminder_at)
--
-- Schedule: 0 14 * * *  → 11am Chile (UTC-3 verano / UTC-4 invierno; usamos
-- 14 UTC = 10/11 CLT segun DST). Hora elegida porque:
--   1. No colisiona con audit-cron-daily (8am UTC) ni run-all-cascades (3am).
--   2. Despues del horario laboral chico-comercio (PYME revisa email tarde).
--
-- Idempotente: si el cron ya existe, lo replazamos.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─── Desprogramar version anterior si existe ───
SELECT cron.unschedule('flow-renewal-reminders-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'flow-renewal-reminders-daily'
);

-- ─── Programar 1x/dia a las 14:00 UTC ───
-- Lee service_role_key desde Supabase Vault (NO hardcodear el JWT — memoria
-- feedback_cron_no_jwt_hardcoded.md).
SELECT cron.schedule(
  'flow-renewal-reminders-daily',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/flow-renewal-reminders-cron',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'service_role_key'
        LIMIT 1
      ),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('source', 'pg_cron'),
    timeout_milliseconds := 30000
  );
  $$
);

-- ─── Verificacion (correr manualmente en SQL Editor) ───
--
-- 1) Ver el cron programado:
--    SELECT jobid, jobname, schedule, active
--    FROM cron.job
--    WHERE jobname = 'flow-renewal-reminders-daily';
--
-- 2) Triggear manualmente (sin esperar 14 UTC):
--    SELECT net.http_post(
--      url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/flow-renewal-reminders-cron',
--      headers := jsonb_build_object(
--        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
--        'Content-Type', 'application/json'
--      ),
--      body := '{"source":"manual_test"}'::jsonb,
--      timeout_milliseconds := 30000
--    );
--
--    Esperar ~5s y consultar el resultado:
--    SELECT * FROM net._http_response ORDER BY created DESC LIMIT 3;
--
-- 3) Auditar ultimas corridas del cron en cron.job_run_details:
--    SELECT runid, status, return_message, start_time, end_time
--    FROM cron.job_run_details
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'flow-renewal-reminders-daily')
--    ORDER BY start_time DESC
--    LIMIT 10;
--
-- 4) Ver subscriptions que recibieron recordatorio (post-corrida):
--    SELECT id, user_id, plan_type, end_date, last_renewal_reminder_at
--    FROM subscriptions
--    WHERE last_renewal_reminder_at >= NOW() - INTERVAL '24 hours'
--    ORDER BY last_renewal_reminder_at DESC;
--
-- ─── Rollback ───
--
--   SELECT cron.unschedule('flow-renewal-reminders-daily');
