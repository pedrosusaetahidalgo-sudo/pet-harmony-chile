-- ==========================================================================
-- Cron: email mensual stats a vets pagando
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d fidelización B2B):
-- Primer domingo del mes, 12:00 UTC (9:00 Chile). Vets con plan != free
-- reciben resumen mensual con:
--   - Pacientes activos + nuevos del mes.
--   - Fichas recibidas.
--   - Reseñas nuevas + rating.
--   - Citas próxima semana.
--
-- Objetivo: reforzar valor percibido del plan pagado, reducir churn B2B.
--
-- REQUISITO: edge fn send-monthly-vet-stats deployada + RESEND_API_KEY +
-- app.settings.service_role_key.
-- ==========================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('monthly-vet-stats');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- pg_cron no soporta "primer domingo del mes" directamente.
-- Usamos: todos los domingos a las 12:00 UTC, pero el cron-schedule
-- corre solo los domingos 1-7 del mes (es decir, primer domingo).
-- Chequeamos día del mes dentro del SQL invocado.
SELECT cron.schedule(
  'monthly-vet-stats',
  '0 12 * * 0',  -- Domingos 12:00 UTC
  $$
  DO $cron$
  BEGIN
    -- Solo dispara si es el primer domingo del mes (día 1-7)
    IF EXTRACT(DAY FROM NOW() AT TIME ZONE 'UTC') BETWEEN 1 AND 7 THEN
      PERFORM net.http_post(
        url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-monthly-vet-stats',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object('scheduled', true)
      );
    END IF;
  END;
  $cron$;
  $$
);

-- ----------------------------------------------------------------------
-- Verificacion post-apply:
-- 1. Cron:
--    SELECT jobid, jobname, schedule, active FROM cron.job
--    WHERE jobname = 'monthly-vet-stats';
-- 2. Forzar manual (para testear sin esperar al primer domingo):
--    SELECT net.http_post(
--      url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-monthly-vet-stats',
--      headers := jsonb_build_object(
--        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
--      ),
--      body := jsonb_build_object('manual', true)
--    );
-- ----------------------------------------------------------------------
