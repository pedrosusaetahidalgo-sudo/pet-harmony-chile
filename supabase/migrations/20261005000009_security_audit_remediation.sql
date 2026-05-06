-- ═══════════════════════════════════════════════════════════════════════════
-- Security audit remediation — post-launch beta (2026-05-05)
--
-- Hallazgos del barrido completo (RLS + SECURITY DEFINER):
--
-- CRITICAL:
--   1. provider_balances: policy "USING (true) WITH CHECK (true)" permite
--      a cualquier authenticated leer/escribir saldos financieros.
--   2. award_points(p_user_id, ...): SECDEF granted a authenticated, no
--      valida que p_user_id = auth.uid() → cualquier user se regala
--      Paw Points o se los regala a otro user.
--   3. record_partner_event(p_partner_slug, ..., p_gmv_clp, p_commission_clp):
--      SECDEF granted a authenticated → cualquier user puede inflar GMV
--      y comisiones, envenenando AdminRevenueDashboard.
--   4. _motor_activity_for_table(p_table_name, p_where_clause): SECDEF
--      con SQL injection vector (concatena where_clause). Granted a
--      authenticated por mig 008 (catch-all GRANT).
--
-- HIGH:
--   5. profiles SELECT policy: USING(true) sin TO authenticated → anon
--      lee email/phone/PII. Riesgo Ley 19.628/21.719.
--   6. user_stats SELECT: idem.
--   7. get_user_donor_badge(p_user_id): SECDEF, no filtra por auth.uid()
--      → expone monto/conteo/fecha de donaciones de cualquier user.
--
-- MEDIUM:
--   8. compute_risk_signals(): SECDEF sin admin check → expone metricas
--      operativas internas (AI cost, error rate, B2B counts).
--   9. posts, post_likes, post_comments, places, shared_walks: SELECT
--      USING(true) → anon ve feed social y ubicaciones.
--
-- Cambios:
--   A. provider_balances: drop policy USING(true), recrear restricted to
--      service_role + provider-self.
--   B. award_points: agregar check al inicio que valide auth.uid().
--   C. record_partner_event: REVOKE FROM authenticated, solo service_role.
--   D. _motor_activity_for_table: REVOKE FROM authenticated.
--   E. profiles, user_stats: agregar TO authenticated en SELECT policy.
--   F. get_user_donor_badge: validar auth.uid() = p_user_id o admin.
--   G. compute_risk_signals: agregar admin check.
--   H. posts/place/shared_walks: TO authenticated en SELECT.
--
-- Idempotente. Aplicar desde Supabase Dashboard > SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- A. provider_balances — restringir saldos financieros
-- ─────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "System can manage provider balances" ON public.provider_balances;
DROP POLICY IF EXISTS "provider_balances_self_select" ON public.provider_balances;
DROP POLICY IF EXISTS "provider_balances_admin_all" ON public.provider_balances;
DROP POLICY IF EXISTS "provider_balances_service_all" ON public.provider_balances;

-- Provider ve su propio balance (read-only)
CREATE POLICY "provider_balances_self_select"
  ON public.provider_balances FOR SELECT
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM public.service_providers WHERE user_id = (SELECT auth.uid())
    )
  );

-- Admin ve todo
CREATE POLICY "provider_balances_admin_all"
  ON public.provider_balances FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = (SELECT auth.uid()) AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- Service role bypassa RLS naturalmente (no policy needed). Edge fns que
-- escriben balances (flow-webhook, etc.) ya usan service_role.

-- ─────────────────────────────────────────────────────────────────────────
-- B. award_points — validar caller
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_existing_args TEXT;
BEGIN
  -- Recuperar args actuales para no perder la firma
  SELECT pg_get_function_identity_arguments(p.oid) INTO v_existing_args
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'award_points'
  LIMIT 1;

  IF v_existing_args IS NULL THEN
    RAISE NOTICE 'award_points no existe, skip';
    RETURN;
  END IF;

  -- REVOKE EXECUTE de authenticated (lo invoca service_role o triggers).
  -- Si la app cliente la llamaba directo, hay que mover a edge fn.
  EXECUTE format('REVOKE EXECUTE ON FUNCTION public.award_points(%s) FROM authenticated', v_existing_args);
  EXECUTE format('REVOKE EXECUTE ON FUNCTION public.award_points(%s) FROM PUBLIC', v_existing_args);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.award_points(%s) TO service_role', v_existing_args);
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- C. record_partner_event — solo service_role
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_existing_args TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO v_existing_args
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'record_partner_event'
  LIMIT 1;

  IF v_existing_args IS NULL THEN
    RAISE NOTICE 'record_partner_event no existe, skip';
    RETURN;
  END IF;

  EXECUTE format('REVOKE EXECUTE ON FUNCTION public.record_partner_event(%s) FROM authenticated', v_existing_args);
  EXECUTE format('REVOKE EXECUTE ON FUNCTION public.record_partner_event(%s) FROM PUBLIC', v_existing_args);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.record_partner_event(%s) TO service_role', v_existing_args);
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- D. _motor_activity_for_table — vector SQL injection, solo service_role
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_existing_args TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO v_existing_args
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = '_motor_activity_for_table'
  LIMIT 1;

  IF v_existing_args IS NULL THEN RETURN; END IF;

  EXECUTE format('REVOKE EXECUTE ON FUNCTION public._motor_activity_for_table(%s) FROM authenticated', v_existing_args);
  EXECUTE format('REVOKE EXECUTE ON FUNCTION public._motor_activity_for_table(%s) FROM PUBLIC', v_existing_args);
  -- Solo service_role; la fn admin-only que la usa (compute_motors_activity)
  -- es SECDEF y mantiene su check interno.
  EXECUTE format('GRANT EXECUTE ON FUNCTION public._motor_activity_for_table(%s) TO service_role', v_existing_args);
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- E. profiles + user_stats — restringir SELECT a authenticated
--    (anon NO debe leer email/phone/PII).
--
--    NOTA: si /paw-card/:id o /qr/:token llaman a profiles desde anon,
--    crear vista pública whitelist de columnas en otra mig.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_old_qual TEXT;
  v_old_perm TEXT;
BEGIN
  -- profiles
  SELECT qual INTO v_old_qual
  FROM pg_policies
  WHERE schemaname='public' AND tablename='profiles'
    AND cmd='SELECT'
    AND policyname IN ('Profiles son visibles por todos', 'profiles_public_select')
  LIMIT 1;

  IF v_old_qual IS NOT NULL THEN
    DROP POLICY IF EXISTS "Profiles son visibles por todos" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;

    CREATE POLICY "profiles_authenticated_select"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- user_stats
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_stats' AND cmd='SELECT'
  ) THEN
    -- Drop cualquier policy SELECT existente y recrear restringida
    FOR v_old_perm IN
      SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename='user_stats' AND cmd='SELECT'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_stats', v_old_perm);
    END LOOP;

    CREATE POLICY "user_stats_authenticated_select"
      ON public.user_stats FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- F. get_user_donor_badge — validar caller
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_existing_args TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO v_existing_args
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'get_user_donor_badge'
  LIMIT 1;

  IF v_existing_args IS NULL THEN RETURN; END IF;

  -- REVOKE de authenticated (la mig 008 grantio). Authenticated debe
  -- llamar una version sin args o la fn debe agregar check.
  EXECUTE format('REVOKE EXECUTE ON FUNCTION public.get_user_donor_badge(%s) FROM authenticated', v_existing_args);
  EXECUTE format('REVOKE EXECUTE ON FUNCTION public.get_user_donor_badge(%s) FROM PUBLIC', v_existing_args);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.get_user_donor_badge(%s) TO service_role', v_existing_args);
  -- Si el frontend la usa, hay que crear wrapper sin args que use auth.uid().
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- G. compute_risk_signals — admin only
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_existing_args TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO v_existing_args
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'compute_risk_signals'
  LIMIT 1;

  IF v_existing_args IS NULL THEN RETURN; END IF;

  EXECUTE format('REVOKE EXECUTE ON FUNCTION public.compute_risk_signals(%s) FROM authenticated', v_existing_args);
  EXECUTE format('REVOKE EXECUTE ON FUNCTION public.compute_risk_signals(%s) FROM PUBLIC', v_existing_args);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.compute_risk_signals(%s) TO service_role', v_existing_args);
  -- Admin desde la app debe usar wrapper RPC con admin check, no esta directa.
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- H. Feed social — restringir SELECT a authenticated
--    posts, post_likes, post_comments, places, shared_walks.
--    Si decides que /feed sea publico para anon, revertir caso por caso.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_table TEXT;
  v_policy_name TEXT;
BEGIN
  FOR v_table IN
    SELECT unnest(ARRAY['posts', 'post_likes', 'post_comments', 'places', 'shared_walks'])
  LOOP
    -- Solo si la tabla existe (algunas pueden ser deprecated).
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=v_table
    ) THEN
      CONTINUE;
    END IF;

    -- Drop policies SELECT existentes para esta tabla
    FOR v_policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename=v_table AND cmd='SELECT'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_policy_name, v_table);
    END LOOP;

    -- Recrear restringida a authenticated
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
      v_table || '_authenticated_select',
      v_table
    );
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- Smoke test: verificar 0 policies USING(true) sin TO authenticated en
-- las tablas afectadas.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_leak_count INT;
BEGIN
  SELECT COUNT(*) INTO v_leak_count
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename IN ('provider_balances', 'profiles', 'user_stats', 'posts', 'post_likes', 'post_comments', 'places', 'shared_walks')
    AND qual = 'true'
    AND NOT ('authenticated' = ANY(roles));

  IF v_leak_count > 0 THEN
    RAISE NOTICE 'Smoke WARN: % policies aun con USING(true) sin TO authenticated en tablas criticas', v_leak_count;
  ELSE
    RAISE NOTICE 'Smoke OK: tablas criticas con SELECT restringido a authenticated';
  END IF;
END $$;
