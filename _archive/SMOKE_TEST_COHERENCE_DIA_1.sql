-- ==========================================================================
-- SMOKE TEST — Dia 1 del PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN
-- ==========================================================================
-- Pegar TODO este archivo en Supabase Dashboard > SQL Editor > Run.
-- Deberia devolver 8 filas. Esperado:
--   - Filas 1 a 6: status = 'OK'
--   - Fila 7: status = 'INFO' (muestra distribucion de reminders por tipo)
--   - Fila 8: status = 'OK' (sin duplicados) o 'WARN' si hay dupes remanentes
-- Si alguna fila tiene status = 'FAIL', la columna `detail` indica que
-- revisar y/o reaplicar.
-- ==========================================================================

WITH
-- ──────────────────────────────────────────────────────────────────────
-- Check 1: mig-30 fix notify_adoption_interest (sin JOIN pets)
-- ──────────────────────────────────────────────────────────────────────
chk1 AS (
  SELECT
    '1. mig-30 notify_adoption_interest sin JOIN pets' AS check_name,
    CASE
      WHEN p.prosrc IS NULL THEN 'FAIL'
      WHEN p.prosrc LIKE '%JOIN pets%' THEN 'FAIL'
      WHEN p.prosrc NOT LIKE '%pet_name%' THEN 'FAIL'
      ELSE 'OK'
    END AS status,
    COALESCE(
      CASE
        WHEN p.prosrc IS NULL THEN 'funcion no existe → aplicar mig 20260521000030'
        WHEN p.prosrc LIKE '%JOIN pets%' THEN 'aun contiene JOIN pets (mig no aplicada o v2 sobrescrita)'
        WHEN p.prosrc NOT LIKE '%pet_name%' THEN 'no usa pet_name directo'
        ELSE 'funcion v2 activa'
      END,
      'funcion no existe'
    ) AS detail
  FROM (
    SELECT prosrc
    FROM pg_proc
    WHERE proname = 'notify_adoption_interest'
    LIMIT 1
  ) p
  RIGHT JOIN (SELECT 1) dummy ON TRUE
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 2: mig-40 CHECK pet_reminders_type_check amplio + sin antiparasitic
-- ──────────────────────────────────────────────────────────────────────
chk2 AS (
  SELECT
    '2. mig-40 CHECK pet_reminders_type_check canonico' AS check_name,
    CASE
      WHEN c.def IS NULL THEN 'FAIL'
      WHEN c.def LIKE '%''flea''%'
       AND c.def LIKE '%''deworming''%'
       AND c.def LIKE '%''dental''%'
       AND c.def NOT LIKE '%''antiparasitic''%'
      THEN 'OK'
      ELSE 'FAIL'
    END AS status,
    COALESCE(c.def, 'constraint no existe → aplicar mig 20260521000040') AS detail
  FROM (
    SELECT pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conname = 'pet_reminders_type_check'
    LIMIT 1
  ) c
  RIGHT JOIN (SELECT 1) dummy ON TRUE
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 3: mig-40 back-fill de filas 'antiparasitic' = 0
-- ──────────────────────────────────────────────────────────────────────
chk3 AS (
  SELECT
    '3. mig-40 back-fill (antiparasitic = 0 filas)' AS check_name,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'FAIL' END AS status,
    'filas con type=antiparasitic: ' || COUNT(*)::text AS detail
  FROM public.pet_reminders
  WHERE type = 'antiparasitic'
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 4: mig-40 create_vaccine_reminder v2 usa flea/deworming
-- ──────────────────────────────────────────────────────────────────────
chk4 AS (
  SELECT
    '4. mig-40 create_vaccine_reminder v2 canonico' AS check_name,
    CASE
      WHEN p.prosrc IS NULL THEN 'FAIL'
      WHEN p.prosrc LIKE '%v_type := ''antiparasitic''%' THEN 'FAIL'
      WHEN p.prosrc NOT LIKE '%''flea''%' THEN 'FAIL'
      WHEN p.prosrc NOT LIKE '%''deworming''%' THEN 'FAIL'
      ELSE 'OK'
    END AS status,
    CASE
      WHEN p.prosrc IS NULL THEN 'funcion no existe → aplicar mig 20260521000040'
      WHEN p.prosrc LIKE '%v_type := ''antiparasitic''%' THEN 'aun asigna v_type=antiparasitic (v1 activa)'
      WHEN p.prosrc NOT LIKE '%''flea''%' THEN 'no contiene flea (v2 no aplicada)'
      ELSE 'funcion v2 activa'
    END AS detail
  FROM (
    SELECT prosrc
    FROM pg_proc
    WHERE proname = 'create_vaccine_reminder'
    LIMIT 1
  ) p
  RIGHT JOIN (SELECT 1) dummy ON TRUE
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 5: mig-50 trigger_booking_reminder_on_confirm existe en vet_bookings
-- ──────────────────────────────────────────────────────────────────────
chk5 AS (
  SELECT
    '5. mig-50 trigger_booking_reminder_on_confirm existe' AS check_name,
    CASE WHEN COUNT(*) = 1 THEN 'OK' ELSE 'FAIL' END AS status,
    'triggers encontrados: ' || COUNT(*)::text AS detail
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  WHERE t.tgname = 'trigger_booking_reminder_on_confirm'
    AND c.relname = 'vet_bookings'
    AND NOT t.tgisinternal
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 6: mig-50 funcion create_booking_reminder existe
-- ──────────────────────────────────────────────────────────────────────
chk6 AS (
  SELECT
    '6. mig-50 create_booking_reminder existe' AS check_name,
    CASE WHEN COUNT(*) = 1 THEN 'OK' ELSE 'FAIL' END AS status,
    CASE WHEN COUNT(*) = 0 THEN 'funcion no existe → aplicar mig 20260521000050'
         ELSE 'funcion definida' END AS detail
  FROM pg_proc
  WHERE proname = 'create_booking_reminder'
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 7 (info): distribucion actual de pet_reminders por tipo
-- ──────────────────────────────────────────────────────────────────────
chk7 AS (
  SELECT
    '7. info: pet_reminders por tipo' AS check_name,
    'INFO' AS status,
    COALESCE(
      string_agg(type || '=' || cnt::text, ', ' ORDER BY type),
      'sin reminders aun'
    ) AS detail
  FROM (
    SELECT type, COUNT(*) AS cnt
    FROM public.pet_reminders
    GROUP BY type
  ) sub
),

-- ──────────────────────────────────────────────────────────────────────
-- Check 8: mig-40 dedupe (sin reminders duplicados activos)
-- ──────────────────────────────────────────────────────────────────────
chk8 AS (
  SELECT
    '8. mig-40 dedupe: sin reminders duplicados activos' AS check_name,
    CASE WHEN COALESCE(SUM(dup_count), 0) = 0 THEN 'OK' ELSE 'WARN' END AS status,
    'grupos de duplicados pendientes: '
      || COALESCE(SUM(dup_count), 0)::text AS detail
  FROM (
    SELECT COUNT(*) - 1 AS dup_count
    FROM public.pet_reminders
    WHERE is_completed = FALSE
    GROUP BY pet_id, type, due_date
    HAVING COUNT(*) > 1
  ) dups
)

-- ──────────────────────────────────────────────────────────────────────
-- Resultado final
-- ──────────────────────────────────────────────────────────────────────
SELECT * FROM chk1
UNION ALL SELECT * FROM chk2
UNION ALL SELECT * FROM chk3
UNION ALL SELECT * FROM chk4
UNION ALL SELECT * FROM chk5
UNION ALL SELECT * FROM chk6
UNION ALL SELECT * FROM chk7
UNION ALL SELECT * FROM chk8
ORDER BY check_name;
