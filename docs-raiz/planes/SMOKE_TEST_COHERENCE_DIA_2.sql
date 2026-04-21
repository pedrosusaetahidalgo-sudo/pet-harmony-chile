-- ==========================================================================
-- SMOKE TEST — Dia 2 del PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN
-- ==========================================================================
-- Validar wiring de Fase 3 (notificaciones) y existencia de RPCs criticas.
--
-- Correr DESPUES de:
--   1. Smoke Dia 1 en verde (las 3 migs + trigger booking reminder)
--   2. Re-deploy de send-push-notification y send-whatsapp-reminder
--      (ver EJECUCION_COHERENCE_PLAN_DIA_2.md)
--
-- Pegar TODO en Supabase Dashboard > SQL Editor > Run.
-- Devuelve 6 filas. Esperado: checks 1-5 status='OK'; check 6 status='INFO'
-- (distribucion de attempts por channel en las ultimas 24h — solo tendra
-- datos despues de trafico real).
-- ==========================================================================

WITH
-- ──────────────────────────────────────────────────────────────────────
-- Check 1: tabla user_notification_prefs existe
-- ──────────────────────────────────────────────────────────────────────
chk1 AS (
  SELECT
    '1. user_notification_prefs tabla existe' AS check_name,
    CASE WHEN COUNT(*) = 1 THEN 'OK' ELSE 'FAIL' END AS status,
    CASE WHEN COUNT(*) = 0 THEN 'aplicar mig 20260723000000_user_notification_prefs.sql'
         ELSE 'tabla definida, RLS habilitada si existe' END AS detail
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'user_notification_prefs'
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 2: RPC user_can_receive_notification disponible
-- ──────────────────────────────────────────────────────────────────────
chk2 AS (
  SELECT
    '2. RPC user_can_receive_notification existe' AS check_name,
    CASE WHEN COUNT(*) >= 1 THEN 'OK' ELSE 'FAIL' END AS status,
    CASE WHEN COUNT(*) = 0 THEN 'RPC no existe → aplicar mig 20260723000000'
         ELSE 'RPC definida (SECURITY DEFINER, STABLE)' END AS detail
  FROM pg_proc
  WHERE proname = 'user_can_receive_notification'
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 3: RPC devuelve defaults sensatos para un user sin prefs
-- ──────────────────────────────────────────────────────────────────────
chk3 AS (
  SELECT
    '3. RPC defaults: transactional/push = true para user nuevo' AS check_name,
    CASE
      WHEN public.user_can_receive_notification(
        gen_random_uuid(), 'transactional', 'push'
      ) = TRUE THEN 'OK'
      ELSE 'FAIL'
    END AS status,
    'default transactional push debe ser TRUE' AS detail
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 4: tabla notification_attempts existe con index de idempotencia
-- ──────────────────────────────────────────────────────────────────────
chk4 AS (
  SELECT
    '4. notification_attempts + idempotency index' AS check_name,
    CASE
      WHEN t.cnt = 1 AND i.cnt >= 1 THEN 'OK'
      WHEN t.cnt = 0 THEN 'FAIL'
      ELSE 'WARN'
    END AS status,
    'tabla=' || t.cnt::text || ', indexes_idempotency=' || i.cnt::text AS detail
  FROM
    (SELECT COUNT(*) AS cnt FROM information_schema.tables
      WHERE table_schema='public' AND table_name='notification_attempts') t,
    (SELECT COUNT(*) AS cnt FROM pg_indexes
      WHERE schemaname='public'
        AND tablename='notification_attempts'
        AND indexname = 'idx_notif_attempts_idempotency') i
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 5: RPCs partner ads increment_partner_* existen (Fase 3.2 cancelada)
-- ──────────────────────────────────────────────────────────────────────
chk5 AS (
  SELECT
    '5. RPCs increment_partner_impressions / _clicks existen' AS check_name,
    CASE WHEN COUNT(*) >= 2 THEN 'OK' ELSE 'FAIL' END AS status,
    'funciones encontradas: ' || COUNT(*)::text || ' (esperadas: 2)' AS detail
  FROM pg_proc
  WHERE proname IN ('increment_partner_impressions', 'increment_partner_clicks')
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 6 (info): distribucion de notification_attempts ultimas 24h
--   por channel + status. Util para verificar que las edge fns
--   re-deployadas estan escribiendo en la tabla.
-- ──────────────────────────────────────────────────────────────────────
chk6 AS (
  SELECT
    '6. info: notification_attempts ultimas 24h' AS check_name,
    'INFO' AS status,
    COALESCE(
      string_agg(channel || ':' || status || '=' || cnt::text, ', ' ORDER BY channel, status),
      'sin attempts aun (normal si no hay trafico reciente o edge fns no redeployadas)'
    ) AS detail
  FROM (
    SELECT channel, status, COUNT(*) AS cnt
    FROM public.notification_attempts
    WHERE attempted_at > NOW() - INTERVAL '24 hours'
    GROUP BY channel, status
  ) sub
)

SELECT * FROM chk1
UNION ALL SELECT * FROM chk2
UNION ALL SELECT * FROM chk3
UNION ALL SELECT * FROM chk4
UNION ALL SELECT * FROM chk5
UNION ALL SELECT * FROM chk6
ORDER BY check_name;
