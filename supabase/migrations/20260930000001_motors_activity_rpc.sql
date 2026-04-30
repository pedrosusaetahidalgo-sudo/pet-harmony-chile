-- Paquete E Observabilidad — RPC compute_motors_activity()
--
-- Devuelve estado de actividad de los 7 motores Revenue Master Plan.
-- Diferencia con compute_risk_signals: este NO es alerta (pasa-no-pasa
-- threshold). Es un panel de observabilidad continua que muestra
-- last_activity + counts 24h/7d por motor, para que admin (Pedro) sepa
-- cuál motor esta vivo y cuál duerme silenciosamente.
--
-- Diseño:
--   - 1 row por motor (7 totales)
--   - status: 'active' (count_24h > 0), 'recent' (count_7d > 0),
--     'silent' (count_30d = 0), 'inactive' (count_lifetime = 0)
--   - last_activity_at: max timestamp de la tabla relevante
--   - count_24h, count_7d, count_30d
--
-- Motor → tabla source:
--   #1 Pharma B2B → b2b_api_usage (uso de API)
--   #2 Aseguradoras → insurance_leads (leads creados)
--   #3 Retail → retail_clicks (clicks generados)
--   #4 Gobierno → pitch_applications WHERE kind='gobierno_municipio'
--   #5 Banca → pitch_applications WHERE kind='banca'
--   #6 Edificios → pitch_applications WHERE kind='edificios'
--   #7 Long-tail → pitch_applications WHERE kind='longtail'

BEGIN;

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
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Solo admin puede ver esto.
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Solo admins pueden consultar compute_motors_activity';
  END IF;

  -- Motor #1 — Pharma B2B (b2b_api_usage)
  RETURN QUERY
  SELECT
    'pharma'::TEXT,
    'Pharma B2B (API)'::TEXT,
    CASE
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '24 hours') > 0 THEN 'active'
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '7 days') > 0 THEN 'recent'
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '30 days') > 0 THEN 'silent'
      WHEN COUNT(*) > 0 THEN 'silent'
      ELSE 'inactive'
    END::TEXT,
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '24 hours')::INT,
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '7 days')::INT,
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '30 days')::INT,
    COUNT(*)::INT
  FROM public.b2b_api_usage;

  -- Motor #2 — Aseguradoras (insurance_leads no revocados)
  RETURN QUERY
  SELECT
    'seguros'::TEXT,
    'Aseguradoras (leads)'::TEXT,
    CASE
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '24 hours') > 0 THEN 'active'
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '7 days') > 0 THEN 'recent'
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '30 days') > 0 THEN 'silent'
      WHEN COUNT(*) > 0 THEN 'silent'
      ELSE 'inactive'
    END::TEXT,
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '24 hours')::INT,
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '7 days')::INT,
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '30 days')::INT,
    COUNT(*)::INT
  FROM public.insurance_leads
  WHERE revoked_at IS NULL;

  -- Motor #3 — Retail (retail_clicks)
  RETURN QUERY
  SELECT
    'retail'::TEXT,
    'Retail (clicks)'::TEXT,
    CASE
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '24 hours') > 0 THEN 'active'
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '7 days') > 0 THEN 'recent'
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '30 days') > 0 THEN 'silent'
      WHEN COUNT(*) > 0 THEN 'silent'
      ELSE 'inactive'
    END::TEXT,
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '24 hours')::INT,
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '7 days')::INT,
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '30 days')::INT,
    COUNT(*)::INT
  FROM public.retail_clicks;

  -- Motor #4 — Gobierno (pitch_applications gobierno_municipio)
  RETURN QUERY
  SELECT
    'gobierno'::TEXT,
    'Gobierno municipios'::TEXT,
    CASE
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '24 hours') > 0 THEN 'active'
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '7 days') > 0 THEN 'recent'
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '30 days') > 0 THEN 'silent'
      WHEN COUNT(*) > 0 THEN 'silent'
      ELSE 'inactive'
    END::TEXT,
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '24 hours')::INT,
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '7 days')::INT,
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '30 days')::INT,
    COUNT(*)::INT
  FROM public.pitch_applications
  WHERE kind = 'gobierno_municipio';

  -- Motor #5 — Banca
  RETURN QUERY
  SELECT
    'banca'::TEXT,
    'Banca premium'::TEXT,
    CASE
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '24 hours') > 0 THEN 'active'
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '7 days') > 0 THEN 'recent'
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '30 days') > 0 THEN 'silent'
      WHEN COUNT(*) > 0 THEN 'silent'
      ELSE 'inactive'
    END::TEXT,
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '24 hours')::INT,
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '7 days')::INT,
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '30 days')::INT,
    COUNT(*)::INT
  FROM public.pitch_applications
  WHERE kind = 'banca';

  -- Motor #6 — Edificios
  RETURN QUERY
  SELECT
    'edificios'::TEXT,
    'Inmobiliarias / edificios'::TEXT,
    CASE
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '24 hours') > 0 THEN 'active'
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '7 days') > 0 THEN 'recent'
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '30 days') > 0 THEN 'silent'
      WHEN COUNT(*) > 0 THEN 'silent'
      ELSE 'inactive'
    END::TEXT,
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '24 hours')::INT,
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '7 days')::INT,
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '30 days')::INT,
    COUNT(*)::INT
  FROM public.pitch_applications
  WHERE kind = 'edificios';

  -- Motor #7 — Long-tail
  RETURN QUERY
  SELECT
    'longtail'::TEXT,
    'Long-tail (academia, aerolíneas)'::TEXT,
    CASE
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '24 hours') > 0 THEN 'active'
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '7 days') > 0 THEN 'recent'
      WHEN COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '30 days') > 0 THEN 'silent'
      WHEN COUNT(*) > 0 THEN 'silent'
      ELSE 'inactive'
    END::TEXT,
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '24 hours')::INT,
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '7 days')::INT,
    COUNT(*) FILTER (WHERE created_at > v_now - INTERVAL '30 days')::INT,
    COUNT(*)::INT
  FROM public.pitch_applications
  WHERE kind = 'longtail';

END;
$$;

GRANT EXECUTE ON FUNCTION public.compute_motors_activity() TO authenticated;

-- Smoke test inline (regla 9.2.1)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'compute_motors_activity'
      AND pronargs = 0
  ) THEN
    RAISE EXCEPTION 'compute_motors_activity no se creo correctamente';
  END IF;
END $$;

COMMIT;
