-- 2026-04-30 (Fix bug runtime + agregar timeline para partner dashboard)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Bug encontrado al hacer audit-readiness 2026-04-30:
-- mig 20260912000000 creo get_b2b_self_stats() referenciando
-- u.window_start, pero la columna real en b2b_api_usage es u.hour_bucket
-- (mig 20260902300000). El RPC existente fallaria al runtime con
-- "column window_start does not exist" para cualquier key con uso.
--
-- Hoy NO ha fallado en prod porque ningun cliente B2B real ha
-- consumido la API. Pero la primera vez que un partner pegue su key
-- en /b2b → exception → mala primera impresion.
--
-- Esta mig:
-- 1. Reemplaza get_b2b_self_stats() con la columna correcta
-- 2. Agrega get_b2b_usage_timeline(p_api_key, p_hours) para chart 24h/7d

BEGIN;

-- ── Fix RPC con columna correcta ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_b2b_self_stats(p_api_key TEXT)
RETURNS TABLE (
  name TEXT,
  tier TEXT,
  scopes TEXT[],
  rate_limit_per_hour INT,
  is_active BOOLEAN,
  expires_at TIMESTAMPTZ,
  total_requests BIGINT,
  last_used_at TIMESTAMPTZ,
  last_24h_requests BIGINT,
  last_7d_requests BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
DECLARE
  v_hash TEXT;
  v_key_id UUID;
BEGIN
  IF p_api_key IS NULL OR LENGTH(p_api_key) < 16 THEN
    RAISE EXCEPTION 'Invalid api key';
  END IF;

  v_hash := public.hash_b2b_api_key(p_api_key);

  SELECT id INTO v_key_id
  FROM public.b2b_api_keys
  WHERE key_hash = v_hash AND is_active = true;

  IF v_key_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or revoked api key';
  END IF;

  RETURN QUERY
  SELECT
    k.name,
    k.tier,
    k.scopes,
    k.rate_limit_per_hour,
    k.is_active,
    k.expires_at,
    k.total_requests,
    k.last_used_at,
    COALESCE(SUM(u.request_count) FILTER (WHERE u.hour_bucket >= NOW() - INTERVAL '24 hours'), 0)::BIGINT AS last_24h_requests,
    COALESCE(SUM(u.request_count) FILTER (WHERE u.hour_bucket >= NOW() - INTERVAL '7 days'), 0)::BIGINT AS last_7d_requests
  FROM public.b2b_api_keys k
  LEFT JOIN public.b2b_api_usage u ON u.api_key_id = k.id
  WHERE k.id = v_key_id
  GROUP BY k.id, k.name, k.tier, k.scopes, k.rate_limit_per_hour, k.is_active,
           k.expires_at, k.total_requests, k.last_used_at;
END $$;

REVOKE ALL ON FUNCTION public.get_b2b_self_stats(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_b2b_self_stats(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.get_b2b_self_stats IS
  'Endpoint publico para que un cliente B2B consulte su propio uso. Recibe la API key plaintext, valida hash, devuelve solo sus stats. Fix 2026-04-30: columna hour_bucket (era window_start, bug latente).';

-- ── Nueva RPC: timeline para chart ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_b2b_usage_timeline(
  p_api_key TEXT,
  p_hours INT DEFAULT 24
)
RETURNS TABLE (
  hour_bucket TIMESTAMPTZ,
  request_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
DECLARE
  v_hash TEXT;
  v_key_id UUID;
  v_hours INT;
BEGIN
  IF p_api_key IS NULL OR LENGTH(p_api_key) < 16 THEN
    RAISE EXCEPTION 'Invalid api key';
  END IF;

  -- Clamp p_hours entre 1 y 720 (30 dias) para evitar abuse.
  v_hours := GREATEST(1, LEAST(COALESCE(p_hours, 24), 720));

  v_hash := public.hash_b2b_api_key(p_api_key);

  SELECT id INTO v_key_id
  FROM public.b2b_api_keys
  WHERE key_hash = v_hash AND is_active = true;

  IF v_key_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or revoked api key';
  END IF;

  RETURN QUERY
  SELECT
    u.hour_bucket,
    u.request_count
  FROM public.b2b_api_usage u
  WHERE u.api_key_id = v_key_id
    AND u.hour_bucket >= NOW() - (v_hours * INTERVAL '1 hour')
  ORDER BY u.hour_bucket ASC;
END $$;

REVOKE ALL ON FUNCTION public.get_b2b_usage_timeline(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_b2b_usage_timeline(TEXT, INT) TO anon, authenticated;

COMMENT ON FUNCTION public.get_b2b_usage_timeline IS
  'Timeline hourly de uso de la API para una key especifica. Para chart en /b2b portal. Default 24h, max 720h (30d).';

COMMIT;
