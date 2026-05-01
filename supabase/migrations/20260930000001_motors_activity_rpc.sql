-- Paquete E Observabilidad — RPC compute_motors_activity()
--
-- Devuelve estado de actividad de los 7 motores Revenue Master Plan.
-- Diferencia con compute_risk_signals: este NO es alerta (pasa-no-pasa
-- threshold). Es un panel de observabilidad continua que muestra
-- last_activity + counts 24h/7d por motor.
--
-- DEFENSIVE 2026-04-30: cada query se ejecuta con check `to_regclass()`
-- previo. Si la tabla source no existe (mig previa no aplicada todavía),
-- retorna 'inactive' con counts=0 en lugar de fallar. Permite aplicar
-- esta mig en cualquier orden sin dependencia hard de las migs:
--   - 20260902300000 (b2b_api_usage)
--   - 20260915000000 (insurance_leads)
--   - 20260916000000 (retail_clicks)
--   - 20260625000000 (pitch_applications)
--   - 20260930000000 (insurance_leads.revoked_at column)
--
-- Diseño:
--   - 1 row por motor (7 totales)
--   - status: 'active' (count_24h > 0), 'recent' (count_7d > 0),
--     'silent' (count_30d = 0 pero lifetime > 0),
--     'inactive' (lifetime = 0 o tabla missing)
--   - last_activity_at: max timestamp de la tabla relevante
--
-- Motor → tabla source:
--   #1 Pharma B2B → b2b_api_usage
--   #2 Aseguradoras → insurance_leads (revoked_at IS NULL si la columna existe)
--   #3 Retail → retail_clicks
--   #4 Gobierno → pitch_applications WHERE kind='gobierno_municipio'
--   #5 Banca → pitch_applications WHERE kind='banca'
--   #6 Edificios → pitch_applications WHERE kind='edificios'
--   #7 Long-tail → pitch_applications WHERE kind='longtail'

BEGIN;

-- Helper interno: dado nombre de tabla + filtro WHERE opcional, devuelve
-- (status, last_activity, count_24h, count_7d, count_30d, count_lifetime).
-- Si la tabla no existe, retorna 'inactive' con counts=0 (no falla).
CREATE OR REPLACE FUNCTION public._motor_activity_for_table(
  p_table_name TEXT,
  p_where_clause TEXT DEFAULT NULL
)
RETURNS TABLE (
  status TEXT,
  last_activity_at TIMESTAMPTZ,
  count_24h INT,
  count_7d INT,
  count_30d INT,
  count_lifetime INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sql TEXT;
  v_where TEXT := COALESCE(' WHERE ' || p_where_clause, '');
BEGIN
  -- Si la tabla no existe → motor inactivo con counts=0.
  IF to_regclass('public.' || p_table_name) IS NULL THEN
    RETURN QUERY SELECT 'inactive'::TEXT, NULL::TIMESTAMPTZ, 0, 0, 0, 0;
    RETURN;
  END IF;

  v_sql := format($q$
    SELECT
      CASE
        WHEN COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') > 0 THEN 'active'
        WHEN COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') > 0 THEN 'recent'
        WHEN COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') > 0 THEN 'silent'
        WHEN COUNT(*) > 0 THEN 'silent'
        ELSE 'inactive'
      END::TEXT,
      MAX(created_at),
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::INT,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::INT,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::INT,
      COUNT(*)::INT
    FROM public.%I %s
  $q$, p_table_name, v_where);

  RETURN QUERY EXECUTE v_sql;
END;
$$;

-- RPC principal expuesta a admin.
CREATE OR REPLACE FUNCTION public.compute_motors_activity()
RETURNS TABLE (
  motor_id TEXT,
  motor_name TEXT,
  status TEXT,
  last_activity_at TIMESTAMPTZ,
  count_24h INT,
  count_7d INT,
  count_30d INT,
  count_lifetime INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_revoked_at BOOLEAN;
BEGIN
  -- Solo admin puede ver esto.
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Solo admins pueden consultar compute_motors_activity';
  END IF;

  -- Motor #1 — Pharma B2B
  RETURN QUERY
  SELECT 'pharma'::TEXT, 'Pharma B2B (API)'::TEXT, m.*
  FROM public._motor_activity_for_table('b2b_api_usage') m;

  -- Motor #2 — Aseguradoras: filtrar revoked_at IS NULL solo si la columna
  -- existe (mig 20260930000000 puede no estar aplicada todavía).
  v_has_revoked_at := EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'insurance_leads'
      AND column_name = 'revoked_at'
  );
  IF v_has_revoked_at THEN
    RETURN QUERY
    SELECT 'seguros'::TEXT, 'Aseguradoras (leads)'::TEXT, m.*
    FROM public._motor_activity_for_table('insurance_leads', 'revoked_at IS NULL') m;
  ELSE
    RETURN QUERY
    SELECT 'seguros'::TEXT, 'Aseguradoras (leads)'::TEXT, m.*
    FROM public._motor_activity_for_table('insurance_leads') m;
  END IF;

  -- Motor #3 — Retail
  RETURN QUERY
  SELECT 'retail'::TEXT, 'Retail (clicks)'::TEXT, m.*
  FROM public._motor_activity_for_table('retail_clicks') m;

  -- Motor #4 — Gobierno
  RETURN QUERY
  SELECT 'gobierno'::TEXT, 'Gobierno municipios'::TEXT, m.*
  FROM public._motor_activity_for_table('pitch_applications', E'kind = ''gobierno_municipio''') m;

  -- Motor #5 — Banca
  RETURN QUERY
  SELECT 'banca'::TEXT, 'Banca premium'::TEXT, m.*
  FROM public._motor_activity_for_table('pitch_applications', E'kind = ''banca''') m;

  -- Motor #6 — Edificios
  RETURN QUERY
  SELECT 'edificios'::TEXT, 'Inmobiliarias / edificios'::TEXT, m.*
  FROM public._motor_activity_for_table('pitch_applications', E'kind = ''edificios''') m;

  -- Motor #7 — Long-tail
  RETURN QUERY
  SELECT 'longtail'::TEXT, 'Long-tail (academia, aerolíneas)'::TEXT, m.*
  FROM public._motor_activity_for_table('pitch_applications', E'kind = ''longtail''') m;

END;
$$;

GRANT EXECUTE ON FUNCTION public._motor_activity_for_table(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_motors_activity() TO authenticated;

-- Smoke test inline (regla 9.2.1)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'compute_motors_activity' AND pronargs = 0
  ) THEN
    RAISE EXCEPTION 'compute_motors_activity no se creo correctamente';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = '_motor_activity_for_table' AND pronargs = 2
  ) THEN
    RAISE EXCEPTION '_motor_activity_for_table no se creo correctamente';
  END IF;
END $$;

COMMIT;
