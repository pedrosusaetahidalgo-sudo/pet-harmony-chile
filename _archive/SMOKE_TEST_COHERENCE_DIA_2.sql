-- ==========================================================================
-- SMOKE TEST — Dia 2 del PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN
-- ==========================================================================
-- Valida que existen las piezas necesarias para el wiring de notificaciones
-- (Fase 3). Defensivo: no ejecuta funciones ni lee tablas condicionales,
-- solo chequea su existencia con catalogos del sistema (no crashea si faltan).
--
-- Correr DESPUES de:
--   1. Smoke Dia 1 en verde.
--   2. Si el check 1 o 4 salen FAIL, aplicar la migracion que indica `detail`.
--   3. Re-deploy de send-push-notification y send-whatsapp-reminder.
--
-- Devuelve 5 filas. Esperado: todas con status='OK'.
-- El comportamiento real (writes en notification_attempts, respuestas del
-- RPC) se valida con trafico real post-deploy, no en este smoke.
-- ==========================================================================

WITH
-- ──────────────────────────────────────────────────────────────────────
-- Check 1: tabla user_notification_prefs existe
-- ──────────────────────────────────────────────────────────────────────
chk1 AS (
  SELECT
    '1. user_notification_prefs tabla existe' AS check_name,
    CASE
      WHEN to_regclass('public.user_notification_prefs') IS NOT NULL THEN 'OK'
      ELSE 'FAIL'
    END AS status,
    CASE
      WHEN to_regclass('public.user_notification_prefs') IS NULL
        THEN 'aplicar mig 20260723000000_user_notification_prefs.sql'
      ELSE 'tabla definida'
    END AS detail
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 2: RPC user_can_receive_notification disponible
-- ──────────────────────────────────────────────────────────────────────
chk2 AS (
  SELECT
    '2. RPC user_can_receive_notification existe' AS check_name,
    CASE
      WHEN to_regprocedure('public.user_can_receive_notification(uuid,text,text)') IS NOT NULL
        THEN 'OK'
      ELSE 'FAIL'
    END AS status,
    CASE
      WHEN to_regprocedure('public.user_can_receive_notification(uuid,text,text)') IS NULL
        THEN 'RPC no existe → aplicar mig 20260723000000'
      ELSE 'RPC definida'
    END AS detail
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 3: tabla notification_attempts existe
-- ──────────────────────────────────────────────────────────────────────
chk3 AS (
  SELECT
    '3. notification_attempts tabla existe' AS check_name,
    CASE
      WHEN to_regclass('public.notification_attempts') IS NOT NULL THEN 'OK'
      ELSE 'FAIL'
    END AS status,
    CASE
      WHEN to_regclass('public.notification_attempts') IS NULL
        THEN 'aplicar mig 20260612000001_notification_attempts.sql'
      ELSE 'tabla definida'
    END AS detail
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 4: idempotency index en notification_attempts
-- ──────────────────────────────────────────────────────────────────────
chk4 AS (
  SELECT
    '4. notification_attempts: idx_notif_attempts_idempotency' AS check_name,
    CASE
      WHEN to_regclass('public.notification_attempts') IS NULL THEN 'SKIP'
      WHEN EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'notification_attempts'
          AND indexname = 'idx_notif_attempts_idempotency'
      ) THEN 'OK'
      ELSE 'FAIL'
    END AS status,
    CASE
      WHEN to_regclass('public.notification_attempts') IS NULL
        THEN 'skip: tabla no existe (ver check 3)'
      WHEN NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'notification_attempts'
          AND indexname = 'idx_notif_attempts_idempotency'
      ) THEN 'index falta → reaplicar mig 20260612000001'
      ELSE 'index OK (dedupe activo)'
    END AS detail
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 5: RPCs partner ads (verificacion Fase 3.2 cancelada)
-- ──────────────────────────────────────────────────────────────────────
chk5 AS (
  SELECT
    '5. RPCs increment_partner_impressions / _clicks' AS check_name,
    CASE WHEN COUNT(*) >= 2 THEN 'OK' ELSE 'FAIL' END AS status,
    CASE
      WHEN COUNT(*) = 0 THEN 'ambas RPCs faltan → aplicar mig 20251204000002'
      WHEN COUNT(*) = 1 THEN 'solo 1 de 2 existe → reaplicar mig 20251204000002'
      ELSE 'ambas RPCs definidas'
    END AS detail
  FROM pg_proc
  WHERE proname IN ('increment_partner_impressions', 'increment_partner_clicks')
)

SELECT * FROM chk1
UNION ALL SELECT * FROM chk2
UNION ALL SELECT * FROM chk3
UNION ALL SELECT * FROM chk4
UNION ALL SELECT * FROM chk5
ORDER BY check_name;
