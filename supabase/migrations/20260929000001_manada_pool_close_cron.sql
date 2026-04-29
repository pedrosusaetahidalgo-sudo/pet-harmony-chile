-- Manada Pool Close · cron mensual de cierre del fondo refugios.
--
-- Plan v5 Opcion 3 ejecutado 2026-04-29. Complementa la mig
-- 20260929000000_manada_fondo_refugios.sql con:
--   1. RPC close_manada_pool_for_previous_month() — consolida los aportes
--      del mes anterior en una fila de manada_fondo_pool y asigna pool_id
--      a cada aporte log.
--   2. Cron mensual que la ejecuta el dia 1 de cada mes a las 03:00 UTC
--      (00:00 hora Chile en horario de invierno; suficiente para que
--      cualquier cobro Flow del fin de mes anterior haya completado).
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.

BEGIN;

-- ── RPC: close_manada_pool_for_previous_month ─────────────────────────
-- Idempotente: si el pool del mes anterior ya esta cerrado, no hace
-- nada. Solo procesa aportes con pool_id IS NULL.
CREATE OR REPLACE FUNCTION public.close_manada_pool_for_previous_month()
RETURNS TABLE (
  pool_year INT,
  pool_month INT,
  total_aportes_clp BIGINT,
  active_subs INT,
  pool_id UUID,
  closed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_year INT;
  v_target_month INT;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_total_clp BIGINT;
  v_active_subs INT;
  v_pool_id UUID;
BEGIN
  -- Calcular mes anterior (manejo de borde: enero → diciembre del ano anterior)
  v_target_year := EXTRACT(YEAR FROM (NOW() - INTERVAL '1 month'))::INT;
  v_target_month := EXTRACT(MONTH FROM (NOW() - INTERVAL '1 month'))::INT;

  v_period_start := MAKE_TIMESTAMPTZ(v_target_year, v_target_month, 1, 0, 0, 0);
  v_period_end := v_period_start + INTERVAL '1 month';

  -- Si ya existe pool cerrado para ese mes, devolver info sin reprocesar
  SELECT id INTO v_pool_id
  FROM public.manada_fondo_pool
  WHERE year = v_target_year AND month = v_target_month;

  IF v_pool_id IS NOT NULL THEN
    SELECT COUNT(*)::INT INTO v_active_subs
    FROM public.subscriptions
    WHERE plan_type = 'paw_manada' AND status = 'active'
      AND start_date < v_period_end;

    SELECT COALESCE(SUM(amount_clp), 0)::BIGINT INTO v_total_clp
    FROM public.manada_aportes_log
    WHERE pool_id = v_pool_id;

    RETURN QUERY SELECT v_target_year, v_target_month, v_total_clp, v_active_subs, v_pool_id, FALSE;
    RETURN;
  END IF;

  -- Calcular totales del periodo
  SELECT COALESCE(SUM(amount_clp), 0)::BIGINT INTO v_total_clp
  FROM public.manada_aportes_log
  WHERE charged_at >= v_period_start
    AND charged_at < v_period_end
    AND pool_id IS NULL;

  SELECT COUNT(*)::INT INTO v_active_subs
  FROM public.subscriptions
  WHERE plan_type = 'paw_manada' AND status = 'active'
    AND start_date < v_period_end;

  -- Crear el pool
  INSERT INTO public.manada_fondo_pool (
    year, month, total_clp, active_subscriptions, status, closed_at
  ) VALUES (
    v_target_year, v_target_month, v_total_clp, v_active_subs, 'pending', NOW()
  )
  RETURNING id INTO v_pool_id;

  -- Asignar pool_id a los aportes del periodo
  UPDATE public.manada_aportes_log
  SET pool_id = v_pool_id
  WHERE charged_at >= v_period_start
    AND charged_at < v_period_end
    AND pool_id IS NULL;

  RETURN QUERY SELECT v_target_year, v_target_month, v_total_clp, v_active_subs, v_pool_id, TRUE;
END $$;

REVOKE ALL ON FUNCTION public.close_manada_pool_for_previous_month() FROM PUBLIC;
-- Solo admin puede invocar manualmente (el cron lo llama via service_role)
GRANT EXECUTE ON FUNCTION public.close_manada_pool_for_previous_month() TO service_role;

-- ── Cron mensual ────────────────────────────────────────────────────
-- Schedule: dia 1 de cada mes, 03:00 UTC (00:00 hora Chile invierno).
-- Ejecuta la RPC sin parametros — calcula automaticamente el mes anterior.
-- Idempotente: si Pedro la ejecuta manualmente antes, el cron no hace nada.
DO $$
BEGIN
  -- pg_cron debe estar habilitado en el proyecto Supabase
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Eliminar schedule previo si existe (idempotencia)
    PERFORM cron.unschedule('manada-pool-monthly-close')
    WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'manada-pool-monthly-close'
    );

    -- Re-registrar
    PERFORM cron.schedule(
      'manada-pool-monthly-close',
      '0 3 1 * *',
      'SELECT public.close_manada_pool_for_previous_month();'
    );

    RAISE NOTICE 'Cron manada-pool-monthly-close registrado (1ro de mes 03:00 UTC)';
  ELSE
    RAISE NOTICE 'pg_cron no esta habilitado — Pedro debe activarlo desde Supabase Dashboard > Database > Extensions, luego re-aplicar esta mig.';
  END IF;
END $$;

-- ── Smoke test (regla 9.2.1 CLAUDE.md) ────────────────────────────────
-- Verifica que la RPC se haya creado correctamente.
DO $$
DECLARE
  v_func_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'close_manada_pool_for_previous_month'
  ) INTO v_func_exists;

  IF NOT v_func_exists THEN
    RAISE EXCEPTION 'manada pool close mig smoke failed: RPC no encontrada';
  END IF;

  RAISE NOTICE 'Manada Pool Close mig OK — RPC + cron registrados';
END $$;

COMMIT;

-- ── Acciones manuales pendientes para Pedro ──────────────────────────
-- 1. Si pg_cron no estaba habilitado, activar la extension desde
--    Supabase Dashboard > Database > Extensions y re-ejecutar esta mig.
--
-- 2. Workflow operacional cuando el cron cierra el pool:
--    a. El cron crea fila en manada_fondo_pool con status='pending'.
--    b. Pedro recibe (manual al inicio, futuro automatizado) notificacion.
--    c. Pedro consulta:
--         SELECT * FROM manada_fondo_pool WHERE status='pending';
--         SELECT shelter_id_at_charge, SUM(amount_clp) AS subtotal
--         FROM manada_aportes_log
--         WHERE pool_id = '<pool_uuid>'
--         GROUP BY shelter_id_at_charge;
--    d. Pedro hace transferencias bancarias a refugios (proporcional o pool).
--    e. Pedro UPDATE manada_fondo_pool SET status='distributed',
--       distributed_at=NOW() WHERE id='<pool_uuid>'.
--    f. Pedro UPDATE manada_aportes_log SET distributed_at=NOW()
--       WHERE pool_id='<pool_uuid>'.
--
-- 3. Para ejecutar la RPC manualmente (testing):
--      SELECT * FROM public.close_manada_pool_for_previous_month();
--
-- 4. Para verificar el cron registrado:
--      SELECT * FROM cron.job WHERE jobname='manada-pool-monthly-close';
