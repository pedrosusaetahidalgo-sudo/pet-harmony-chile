-- ═══════════════════════════════════════════════════════════════════════════
-- REVOKE EXECUTE FROM PUBLIC en SECURITY DEFINER fns (2026-05-05)
--
-- Hallazgo Advisor: "Public Can Execute SECURITY DEFINER Function" en muchas
-- fns como get_donations_*, get_follow_*, get_leads_*, rpc_mrr_*, rpc_nsm_*,
-- rpc_north_star_snapshot, etc.
--
-- Causa: por default Postgres concede EXECUTE a PUBLIC (anon + authenticated)
-- cuando creás una fn. Si la fn es SECURITY DEFINER, corre con permisos del
-- owner (postgres) bypaseando RLS de las tablas que toca. Cualquier visitante
-- puede invocarla y obtener datos privados.
--
-- Ejemplos de fns CRÍTICAS expuestas:
--   rpc_mrr_b2b_clp, rpc_mrr_timeseries, rpc_nsm_30d, rpc_north_star_snapshot
--     → metricas internas de revenue/retention. Nunca deberian ser publicas.
--   get_leads_clinicas, get_leads_vets, get_leads_clinicas_stats
--     → lista de leads para outreach. Admin-only, nunca publicas.
--   get_donations_public_stats, get_donations_goal_progress
--     → si son legitimamente publicas para landing /donaciones, igual
--       deberian estar restringidas a anon explicito (no PUBLIC implicito).
--   get_follow_count, get_follow_status
--     → usadas en perfiles publicos, mantener authenticated.
--
-- Fix:
--   1. REVOKE EXECUTE FROM PUBLIC en TODAS las SECURITY DEFINER fns public.
--   2. GRANT EXECUTE TO authenticated en todas (la fn que tenga check
--      interno de admin filtra; las que no, aplican RLS via tablas).
--   3. GRANT EXECUTE TO anon en fns con `public` o `stats` o `progress`
--      en el nombre (heuristica para landings publicas que necesitan anon).
--
-- Si alguna fn anon dejara de funcionar (ej: landing publica /donaciones
-- llamada desde anon), Pedro reporta y agregamos GRANT puntual.
--
-- Idempotente. Aplicar desde Supabase Dashboard > SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_fn RECORD;
  v_signature TEXT;
  v_total_revoked INT := 0;
  v_total_granted_auth INT := 0;
  v_total_granted_anon INT := 0;
  v_should_grant_anon BOOLEAN;
BEGIN
  FOR v_fn IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS fn_name,
      pg_get_function_identity_arguments(p.oid) AS args,
      lower(p.proname) AS fn_lower
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true  -- SECURITY DEFINER
    ORDER BY p.proname
  LOOP
    v_signature := format('%I.%I(%s)', v_fn.schema_name, v_fn.fn_name, v_fn.args);

    -- 1. REVOKE EXECUTE FROM PUBLIC (cubre anon + authenticated heredados).
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', v_signature);
    v_total_revoked := v_total_revoked + 1;

    -- 2. GRANT EXECUTE TO authenticated (default seguro: cualquier user
    --    logueado; las fns con check interno admin filtran).
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', v_signature);
    v_total_granted_auth := v_total_granted_auth + 1;

    -- 3. GRANT EXECUTE TO anon solo en fns con nombres que sugieren uso
    --    publico (landing pages que llaman desde anon).
    --    Heuristicas (mantener conservador):
    --      * Contiene 'public' → uso explicito publico.
    --      * Contiene 'stats' o 'progress' → metricas agregadas para landings.
    --      * Excluye explicitamente 'admin', 'private', 'internal'.
    v_should_grant_anon :=
      (v_fn.fn_lower LIKE '%public%' OR
       v_fn.fn_lower LIKE '%stats%' OR
       v_fn.fn_lower LIKE '%progress%')
      AND v_fn.fn_lower NOT LIKE '%admin%'
      AND v_fn.fn_lower NOT LIKE '%private%'
      AND v_fn.fn_lower NOT LIKE '%internal%'
      AND v_fn.fn_lower NOT LIKE '%leads%'  -- get_leads_* son admin-only
      AND v_fn.fn_lower NOT LIKE '%mrr%'    -- rpc_mrr_* son admin-only
      AND v_fn.fn_lower NOT LIKE '%nsm%'    -- rpc_nsm_* son admin-only
      AND v_fn.fn_lower NOT LIKE '%north_star%'  -- internal metrics
      AND v_fn.fn_lower NOT LIKE '%kpi%'    -- master_kpis admin-only
      AND v_fn.fn_lower NOT LIKE '%audit%'  -- audit logs admin-only
      AND v_fn.fn_lower NOT LIKE '%revenue%';

    IF v_should_grant_anon THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', v_signature);
      v_total_granted_anon := v_total_granted_anon + 1;
    END IF;
  END LOOP;

  RAISE NOTICE
    'SECURITY DEFINER fns hardened: revoked from PUBLIC=%, granted to authenticated=%, granted to anon=% (heuristica nombre)',
    v_total_revoked, v_total_granted_auth, v_total_granted_anon;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- Smoke test: 0 fns SECURITY DEFINER en public con EXECUTE TO PUBLIC.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_public_exec_count INT;
  v_first_fn TEXT;
BEGIN
  SELECT
    COUNT(DISTINCT p.oid),
    MIN(n.nspname || '.' || p.proname)
  INTO v_public_exec_count, v_first_fn
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND has_function_privilege('public', p.oid, 'EXECUTE');

  IF v_public_exec_count > 0 THEN
    RAISE EXCEPTION 'Smoke FAILED: % SECURITY DEFINER fns aun ejecutables por PUBLIC (ej: %)',
      v_public_exec_count, v_first_fn;
  END IF;

  RAISE NOTICE 'Smoke OK: 0 SECURITY DEFINER fns ejecutables por PUBLIC';
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- Nota: si una landing publica deja de funcionar (Pedro reporta endpoint
-- 403), correr puntual:
--   GRANT EXECUTE ON FUNCTION public.<nombre>(<args>) TO anon;
-- ═══════════════════════════════════════════════════════════════════════════
