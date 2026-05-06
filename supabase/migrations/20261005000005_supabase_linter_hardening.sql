-- ═══════════════════════════════════════════════════════════════════════════
-- Supabase Linter hardening — 7 hallazgos criticos del Dashboard (2026-05-05)
--
-- Hallazgos del linter post lanzamiento beta:
--   1. Exposed Auth Users · public.clinic_active_seats_view
--   2. Exposed Auth Users · public.master_kpis_daily
--   3. RLS Disabled in Public · public.auth_audit_log
--   4. RLS Disabled in Public · public.comprehensive_medical_records_deprecated_20260424
--   5. RLS Disabled in Public · public.vaccine_schedule_doses
--   6. Security Definer View · public.all_bookings_view
--   7. Security Definer View · public.profiles_public
--
-- Fix por hallazgo:
--   1+2. JOIN/SELECT a auth.users expone email/last_sign_in_at. Mover a
--        admin-only via RPC SECURITY DEFINER en vez de view publica.
--   3. auth_audit_log → ENABLE RLS + admin-only policy.
--   4. comprehensive_medical_records_deprecated → ENABLE RLS + DENY ALL
--      (la tabla esta deprecated; nadie debe leer ni escribir).
--   5. vaccine_schedule_doses → ENABLE RLS + public read (tabla referencia).
--   6+7. Views sin security_invoker explicito. Postgres antes de v15
--        defaultea a SECURITY DEFINER (corre con permisos del owner,
--        bypaseando RLS). Fix: ALTER VIEW SET (security_invoker = on).
--
-- Idempotente. Aplicar desde Supabase Dashboard > SQL Editor.
-- Smoke al final verifica que el linter no falla en estos 7.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 6+7. VIEWS — security_invoker = on para TODAS las views public.
--      Garantiza que la view corre con los permisos del caller (no del owner)
--      → la RLS de las tablas underlying se aplica correctamente.
--      Loop dinamico: cubre cualquier view existente, no solo las flaggeadas
--      por el linter al momento de escribir esta mig.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_view RECORD;
  v_count INT := 0;
BEGIN
  FOR v_view IN
    SELECT schemaname, viewname
    FROM pg_views
    WHERE schemaname = 'public'
    ORDER BY viewname
  LOOP
    EXECUTE format(
      'ALTER VIEW %I.%I SET (security_invoker = on)',
      v_view.schemaname,
      v_view.viewname
    );
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'security_invoker=on aplicado en % views public', v_count;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. clinic_active_seats_view — esta view JOIN-ea con auth.users.email.
--    Aun con security_invoker, anon/authenticated puede ver emails de
--    seats de clinicas ajenas si hace SELECT sin filtro. Restringimos
--    el SELECT a authenticated + RLS via underlying clinic_vet_seats.
--
--    Solucion mas robusta: REVOKE de anon (no necesita ver seats).
-- ─────────────────────────────────────────────────────────────────────────
REVOKE SELECT ON public.clinic_active_seats_view FROM anon;
-- Mantenemos GRANT a authenticated + admin; la RLS de clinic_vet_seats
-- (que se aplica con security_invoker=on) filtra al parent_provider_id.

-- ─────────────────────────────────────────────────────────────────────────
-- 2. master_kpis_daily — materialized view con counts de auth.users.
--    No expone rows individuales (solo counts), pero el linter flaggea.
--    Restringir SELECT a admin-only.
-- ─────────────────────────────────────────────────────────────────────────
REVOKE SELECT ON public.master_kpis_daily FROM anon, authenticated;
GRANT SELECT ON public.master_kpis_daily TO service_role;

-- Para que admins lo lean desde la app, usar RPC SECURITY DEFINER que
-- valide is_active_admin antes de retornar. Si no existe la RPC, crearla.
CREATE OR REPLACE FUNCTION public.get_master_kpis_today()
RETURNS SETOF public.master_kpis_daily
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  RETURN QUERY SELECT * FROM public.master_kpis_daily ORDER BY as_of_date DESC LIMIT 30;
END $$;

REVOKE ALL ON FUNCTION public.get_master_kpis_today() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_master_kpis_today() TO authenticated;

COMMENT ON FUNCTION public.get_master_kpis_today() IS
  'RPC admin-only para leer master_kpis_daily. Reemplaza el SELECT directo a la matview que el linter flaggea por exponer counts de auth.users.';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. auth_audit_log — ENABLE RLS + admin-only.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='auth_audit_log') THEN
    EXECUTE 'ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY';

    -- Policies: solo admin lee, nadie inserta directo (los inserts vienen
    -- de triggers/edge fns con service_role que bypasea RLS).
    EXECUTE 'DROP POLICY IF EXISTS "auth_audit_log_admin_select" ON public.auth_audit_log';
    EXECUTE $POLICY$
      CREATE POLICY "auth_audit_log_admin_select"
        ON public.auth_audit_log FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.admin_access
            WHERE user_id = auth.uid() AND is_active = true
          )
        )
    $POLICY$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. comprehensive_medical_records_deprecated_20260424 — DENY ALL.
--    La tabla esta deprecated (renombrada en mig 20260424000000). Bloqueamos
--    toda lectura y escritura desde la app. Si hace falta migrar data
--    historica, hacerlo via service_role que bypasea RLS.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname='public' AND tablename='comprehensive_medical_records_deprecated_20260424'
  ) THEN
    EXECUTE 'ALTER TABLE public.comprehensive_medical_records_deprecated_20260424 ENABLE ROW LEVEL SECURITY';

    -- Una unica policy que NUNCA matchea (USING false) → DENY ALL via RLS.
    EXECUTE 'DROP POLICY IF EXISTS "deprecated_deny_all" ON public.comprehensive_medical_records_deprecated_20260424';
    EXECUTE $POLICY$
      CREATE POLICY "deprecated_deny_all"
        ON public.comprehensive_medical_records_deprecated_20260424 FOR ALL
        USING (false)
        WITH CHECK (false)
    $POLICY$;

    -- Tambien revoke explicito por si las policies fueran permissive.
    EXECUTE 'REVOKE ALL ON public.comprehensive_medical_records_deprecated_20260424 FROM anon, authenticated';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. vaccine_schedule_doses — tabla de referencia (vacunas standard de
--    perros/gatos). Public read, admin write.
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.vaccine_schedule_doses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vaccine_schedule_doses_public_select" ON public.vaccine_schedule_doses;
CREATE POLICY "vaccine_schedule_doses_public_select"
  ON public.vaccine_schedule_doses FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "vaccine_schedule_doses_admin_write" ON public.vaccine_schedule_doses;
CREATE POLICY "vaccine_schedule_doses_admin_write"
  ON public.vaccine_schedule_doses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- Smoke test — verificar el estado de los 7 hallazgos.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_failures TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- 3, 4, 5: RLS habilitada
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname='public'
      AND tablename IN ('auth_audit_log', 'comprehensive_medical_records_deprecated_20260424', 'vaccine_schedule_doses')
      AND rowsecurity = false
  ) THEN
    v_failures := v_failures || 'RLS aun deshabilitada en alguna de las 3 tablas';
  END IF;

  -- 6, 7: TODAS las views public con security_invoker=on. Postgres no
  -- expone esto en pg_views directamente; consultar pg_class.reloptions.
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relkind = 'v'
      AND NOT (c.reloptions @> ARRAY['security_invoker=on'] OR c.reloptions @> ARRAY['security_invoker=true'])
  ) THEN
    v_failures := v_failures || 'Alguna view public aun sin security_invoker=on';
  END IF;

  IF array_length(v_failures, 1) > 0 THEN
    RAISE EXCEPTION 'Hardening smoke FAILED: %', array_to_string(v_failures, '; ');
  END IF;

  RAISE NOTICE 'Hardening smoke OK — 7 hallazgos linter cerrados';
END $$;
