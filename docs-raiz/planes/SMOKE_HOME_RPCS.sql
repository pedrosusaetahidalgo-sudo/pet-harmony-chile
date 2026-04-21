-- ==========================================================================
-- Diagnostico: RPCs del Home que devuelven 400
-- ==========================================================================
-- En F12 aparecia:
--   gwailbjlvevkhwcrovfd.supabase.co/rest/v1/rpc/rpc_user_care_streak:1  400
--   gwailbjlvevkhwcrovfd.supabase.co/rest/v1/rpc/rpc_pet_health_summary:1  400
--
-- Ambas RPCs estan definidas en migraciones:
--   - 20260708000000_care_streak_rpc.sql
--   - 20260709000000_pet_health_summary_rpc.sql
--
-- Si ahora devuelven 400, pueden ser 3 cosas:
-- 1. Migraciones NO aplicadas en prod.
-- 2. GRANT EXECUTE TO authenticated faltante.
-- 3. Internamente falla (ej: referencia a columna inexistente, igual que
--    el bug de sync_vaccination_status).
--
-- Este diagnostico revisa cada una por separado.
-- ==========================================================================

-- ============ Parte 1: existencia + permisos ============

SELECT
  '1. rpc_user_care_streak' AS check_name,
  CASE
    WHEN to_regprocedure('public.rpc_user_care_streak(uuid)') IS NOT NULL THEN 'OK'
    WHEN to_regprocedure('public.rpc_user_care_streak()') IS NOT NULL THEN 'OK_NOARGS'
    ELSE 'FAIL'
  END AS status,
  CASE
    WHEN to_regprocedure('public.rpc_user_care_streak(uuid)') IS NULL
     AND to_regprocedure('public.rpc_user_care_streak()') IS NULL
    THEN 'RPC no existe → aplicar mig 20260708000000'
    ELSE 'RPC definida'
  END AS detail
UNION ALL
SELECT
  '2. rpc_pet_health_summary' AS check_name,
  CASE
    WHEN to_regprocedure('public.rpc_pet_health_summary()') IS NOT NULL THEN 'OK'
    ELSE 'FAIL'
  END AS status,
  CASE
    WHEN to_regprocedure('public.rpc_pet_health_summary()') IS NULL
    THEN 'RPC no existe → aplicar mig 20260709000000'
    ELSE 'RPC definida'
  END AS detail
UNION ALL
SELECT
  '3. GRANT EXECUTE rpc_user_care_streak' AS check_name,
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'FAIL' END AS status,
  'GRANTs encontrados: ' || COUNT(*)::text AS detail
FROM information_schema.role_routine_grants
WHERE routine_schema = 'public'
  AND routine_name = 'rpc_user_care_streak'
  AND grantee = 'authenticated'
UNION ALL
SELECT
  '4. GRANT EXECUTE rpc_pet_health_summary' AS check_name,
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'FAIL' END AS status,
  'GRANTs encontrados: ' || COUNT(*)::text AS detail
FROM information_schema.role_routine_grants
WHERE routine_schema = 'public'
  AND routine_name = 'rpc_pet_health_summary'
  AND grantee = 'authenticated';

-- ============ Parte 2: ejecutar las RPCs como tu user ============
-- Pega tu user_id en las llamadas abajo (ab6737f8-d265-4aa8-b20a-ec19583ba78e).
-- Si sale error, me lo pegas.

-- (Este bloque solo funciona si estas autenticado como ese user via JWT;
-- desde el SQL Editor como admin, NO simula el RLS/JWT correctamente.
-- Pero puedes pasarle el uuid como argumento explicito para el primer caso.)

SELECT * FROM public.rpc_user_care_streak('ab6737f8-d265-4aa8-b20a-ec19583ba78e'::uuid);

-- rpc_pet_health_summary depende de auth.uid(); desde SQL editor dara
-- empty set, pero NO deberia dar 400. Si tira error, es que la funcion
-- tiene un bug interno.
SELECT * FROM public.rpc_pet_health_summary();
