-- ═══════════════════════════════════════════════════════════════════════════
-- RLS Init Plan optimization — auth.uid() → (SELECT auth.uid()) (2026-05-05)
--
-- Hallazgos del Advisor (warnings amarillos):
--   "Auth RLS Initialization Plan" en notifications, user_stats,
--   vet_clinical_notes, medical_records, etc.
--
-- Causa: policies con auth.uid() directo en USING/WITH CHECK. PostgreSQL
-- las trata como STABLE-per-row → re-evalua auth.uid() una vez por row.
-- Para queries con miles de rows (medical_records, pet_timeline_events),
-- esto multiplica el costo.
--
-- Fix: envolver auth.uid() en (SELECT auth.uid()). PostgreSQL detecta el
-- subquery como InitPlan → cachea el resultado UNA vez por query. Mejora
-- de performance hasta 10x en queries grandes.
--
-- Mismo principio para auth.role() y auth.jwt().
--
-- Algoritmo:
--   1. Loop sobre pg_policies WHERE schemaname='public'.
--   2. Para cada policy con qual/with_check que mencione auth.uid() etc
--      sin estar envuelto en (SELECT ...), reescribir.
--   3. DROP + CREATE atomico (si CREATE falla, transaccion entera rollback).
--   4. Smoke al final: 0 policies con auth.uid() sin envolver.
--
-- Idempotente: si una policy ya esta optimizada, no se toca.
--
-- Riesgo: medio. La mig altera ~muchas policies. Si rompe a mitad, el
-- DO block atomico hace rollback automatico → estado pre-mig se preserva.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_policy RECORD;
  v_new_qual TEXT;
  v_new_with_check TEXT;
  v_old_qual TEXT;
  v_old_with_check TEXT;
  v_changed BOOLEAN;
  v_drop_sql TEXT;
  v_create_sql TEXT;
  v_total_scanned INT := 0;
  v_total_optimized INT := 0;
  v_roles_csv TEXT;
BEGIN
  FOR v_policy IN
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      cmd,
      roles,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  LOOP
    v_total_scanned := v_total_scanned + 1;
    v_old_qual := v_policy.qual;
    v_old_with_check := v_policy.with_check;
    v_changed := false;

    -- Aplicar 2-step replace para evitar doble-wrap.
    -- Paso 1: marker temporal en patrones ya optimizados.
    -- Paso 2: wrap auth.* sin envolver.
    -- Paso 3: restaurar marker.
    --
    -- Cubrimos: auth.uid(), auth.role(), auth.jwt(), auth.email(),
    -- current_setting('request.jwt.*').

    v_new_qual := v_old_qual;
    IF v_new_qual IS NOT NULL THEN
      -- Paso 1: proteger los ya envueltos.
      v_new_qual := replace(v_new_qual, '(SELECT auth.uid())', '__OPT_AUTH_UID__');
      v_new_qual := replace(v_new_qual, '(SELECT auth.role())', '__OPT_AUTH_ROLE__');
      v_new_qual := replace(v_new_qual, '(SELECT auth.jwt())', '__OPT_AUTH_JWT__');
      v_new_qual := replace(v_new_qual, '(SELECT auth.email())', '__OPT_AUTH_EMAIL__');

      -- Paso 2: envolver los sueltos.
      v_new_qual := regexp_replace(v_new_qual, '\bauth\.uid\(\)', '(SELECT auth.uid())', 'g');
      v_new_qual := regexp_replace(v_new_qual, '\bauth\.role\(\)', '(SELECT auth.role())', 'g');
      v_new_qual := regexp_replace(v_new_qual, '\bauth\.jwt\(\)', '(SELECT auth.jwt())', 'g');
      v_new_qual := regexp_replace(v_new_qual, '\bauth\.email\(\)', '(SELECT auth.email())', 'g');

      -- Paso 3: restaurar markers.
      v_new_qual := replace(v_new_qual, '__OPT_AUTH_UID__', '(SELECT auth.uid())');
      v_new_qual := replace(v_new_qual, '__OPT_AUTH_ROLE__', '(SELECT auth.role())');
      v_new_qual := replace(v_new_qual, '__OPT_AUTH_JWT__', '(SELECT auth.jwt())');
      v_new_qual := replace(v_new_qual, '__OPT_AUTH_EMAIL__', '(SELECT auth.email())');

      IF v_new_qual <> v_old_qual THEN
        v_changed := true;
      END IF;
    END IF;

    v_new_with_check := v_old_with_check;
    IF v_new_with_check IS NOT NULL THEN
      v_new_with_check := replace(v_new_with_check, '(SELECT auth.uid())', '__OPT_AUTH_UID__');
      v_new_with_check := replace(v_new_with_check, '(SELECT auth.role())', '__OPT_AUTH_ROLE__');
      v_new_with_check := replace(v_new_with_check, '(SELECT auth.jwt())', '__OPT_AUTH_JWT__');
      v_new_with_check := replace(v_new_with_check, '(SELECT auth.email())', '__OPT_AUTH_EMAIL__');

      v_new_with_check := regexp_replace(v_new_with_check, '\bauth\.uid\(\)', '(SELECT auth.uid())', 'g');
      v_new_with_check := regexp_replace(v_new_with_check, '\bauth\.role\(\)', '(SELECT auth.role())', 'g');
      v_new_with_check := regexp_replace(v_new_with_check, '\bauth\.jwt\(\)', '(SELECT auth.jwt())', 'g');
      v_new_with_check := regexp_replace(v_new_with_check, '\bauth\.email\(\)', '(SELECT auth.email())', 'g');

      v_new_with_check := replace(v_new_with_check, '__OPT_AUTH_UID__', '(SELECT auth.uid())');
      v_new_with_check := replace(v_new_with_check, '__OPT_AUTH_ROLE__', '(SELECT auth.role())');
      v_new_with_check := replace(v_new_with_check, '__OPT_AUTH_JWT__', '(SELECT auth.jwt())');
      v_new_with_check := replace(v_new_with_check, '__OPT_AUTH_EMAIL__', '(SELECT auth.email())');

      IF v_new_with_check <> v_old_with_check THEN
        v_changed := true;
      END IF;
    END IF;

    IF NOT v_changed THEN CONTINUE; END IF;

    -- Build CSV de roles (pg_policies.roles es text[]).
    v_roles_csv := array_to_string(v_policy.roles, ', ');

    -- DROP + CREATE atomico.
    v_drop_sql := format('DROP POLICY IF EXISTS %I ON %I.%I',
      v_policy.policyname, v_policy.schemaname, v_policy.tablename);

    v_create_sql := format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      v_policy.policyname,
      v_policy.schemaname,
      v_policy.tablename,
      CASE WHEN v_policy.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      v_policy.cmd,
      v_roles_csv
    );

    IF v_new_qual IS NOT NULL THEN
      v_create_sql := v_create_sql || format(' USING (%s)', v_new_qual);
    END IF;

    IF v_new_with_check IS NOT NULL THEN
      v_create_sql := v_create_sql || format(' WITH CHECK (%s)', v_new_with_check);
    END IF;

    BEGIN
      EXECUTE v_drop_sql;
      EXECUTE v_create_sql;
      v_total_optimized := v_total_optimized + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to optimize policy %.%."%": % (drop_sql=%, create_sql=%)',
        v_policy.schemaname, v_policy.tablename, v_policy.policyname, SQLERRM,
        v_drop_sql, v_create_sql;
    END;
  END LOOP;

  RAISE NOTICE 'RLS init plan optimization: scanned=%, optimized=%',
    v_total_scanned, v_total_optimized;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- Smoke test: 0 policies en public con auth.uid() sin envolver
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_unwrapped INT;
  v_first_policy TEXT;
BEGIN
  SELECT COUNT(*), MIN(tablename || '."' || policyname || '"')
    INTO v_unwrapped, v_first_policy
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual IS NOT NULL AND qual ~ '\bauth\.(uid|role|jwt|email)\(\)' AND qual !~ '\(SELECT auth\.(uid|role|jwt|email)\(\)\)')
        OR
        (with_check IS NOT NULL AND with_check ~ '\bauth\.(uid|role|jwt|email)\(\)' AND with_check !~ '\(SELECT auth\.(uid|role|jwt|email)\(\)\)')
      );

  IF v_unwrapped > 0 THEN
    RAISE NOTICE 'Smoke WARN: % policies aun tienen auth.* sin envolver (ej: %). Revisar manualmente; pueden ser casos donde auth.* esta dentro de funciones definidas (ej: is_active_admin(auth.uid())) que el regex no detecto.',
      v_unwrapped, v_first_policy;
  ELSE
    RAISE NOTICE 'Smoke OK: 0 policies con auth.* sin envolver';
  END IF;
END $$;
