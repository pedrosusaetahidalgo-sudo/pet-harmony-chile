-- ==========================================================================
-- Cron backup semanal + RPC admin para ver migraciones aplicadas
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto:
-- 1. Cron: domingo 04:00 UTC llama edge fn backup-weekly-snapshot que
--    genera JSON con counts + metrics + samples y lo sube a Storage.
-- 2. RPC: expone supabase_migrations.schema_migrations a admin para
--    visualizar qué migraciones están aplicadas en prod (vital antes de
--    aplicar nuevas).
--
-- REQUISITO cron: edge fn backup-weekly-snapshot deployada +
-- app.settings.service_role_key configurada + bucket `backups` creable
-- por service_role.
-- ==========================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ----------------------------------------------------------------------
-- 1. Cron backup semanal: domingo 04:00 UTC
-- ----------------------------------------------------------------------
DO $$
BEGIN
  PERFORM cron.unschedule('backup-weekly-snapshot');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'backup-weekly-snapshot',
  '0 4 * * 0',  -- Domingo 04:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/backup-weekly-snapshot',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('scheduled', true)
  );
  $$
);

-- ----------------------------------------------------------------------
-- 2. RPC admin: lista de migraciones aplicadas
-- ----------------------------------------------------------------------
-- Supabase CLI guarda las migraciones aplicadas en supabase_migrations.schema_migrations.
-- Este RPC expone el timestamp + name de las 100 mas recientes para que el
-- admin pueda verificar que lo que esta en /supabase/migrations/ esta en prod.
CREATE OR REPLACE FUNCTION public.rpc_applied_migrations()
RETURNS TABLE (
  version TEXT,
  name TEXT,
  statements_count INTEGER,
  inserted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, supabase_migrations
STABLE
AS $$
BEGIN
  IF NOT public.is_active_admin(auth.uid()) THEN
    RETURN;
  END IF;

  -- supabase_migrations.schema_migrations puede no existir si Supabase
  -- no uso su migration runner. Manejamos el caso gracefully.
  BEGIN
    RETURN QUERY
    SELECT
      sm.version::TEXT,
      COALESCE(sm.name, 'unnamed')::TEXT,
      CASE
        WHEN sm.statements IS NULL THEN 0
        ELSE array_length(sm.statements, 1)
      END AS statements_count,
      sm.inserted_at
    FROM supabase_migrations.schema_migrations sm
    ORDER BY sm.version DESC
    LIMIT 100;
  EXCEPTION WHEN undefined_table THEN
    -- Fallback: sin tabla de migraciones — retornar vacio
    RETURN;
  END;
END;
$$;

COMMENT ON FUNCTION public.rpc_applied_migrations() IS
  'Lista las ultimas 100 migraciones aplicadas en supabase_migrations.schema_migrations. Admin-only.';

GRANT EXECUTE ON FUNCTION public.rpc_applied_migrations() TO authenticated;

-- ----------------------------------------------------------------------
-- Verificacion post-apply:
-- 1. Cron:
--    SELECT jobid, jobname, schedule, active FROM cron.job
--    WHERE jobname = 'backup-weekly-snapshot';
-- 2. RPC:
--    SELECT * FROM public.rpc_applied_migrations() LIMIT 10;
-- 3. Forzar backup manual:
--    SELECT net.http_post(
--      url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/backup-weekly-snapshot',
--      headers := jsonb_build_object(
--        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
--      ),
--      body := jsonb_build_object('manual', true)
--    );
-- ----------------------------------------------------------------------
