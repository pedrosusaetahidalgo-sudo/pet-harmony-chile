-- ══════════════════════════════════════════════════════════════════════════
-- API B2B v1 — keys + rate limiting (Refactor Maestro Fase 2 §7.5)
-- ══════════════════════════════════════════════════════════════════════════
-- Scaffolding tecnico para que cuando aparezca el primer cliente B2B
-- (vet grande, aseguradora, ONG, universidad), podamos crear una API key
-- en 30 segundos via SQL desde el admin panel y entregarles documentacion.
--
-- Sin esto, cada conversacion comercial requiere 2 semanas de devops antes
-- de poder demo nada.
--
-- Diseño:
--   b2b_api_keys     — keys hasheadas con scope, tier y rate limit
--   b2b_api_usage    — contador por (key, hora) para rate limiting
--   verify_b2b_api_key(plain_key) → row de la key si valida
--   increment_b2b_api_usage(key_id) → check + incrementa atomic
--
-- Formato de key publico: pf_live_<32 hex random>
-- Hash interno: SHA256 (Postgres pgcrypto)
--
-- Tier inicial:
--   free        — 100 req/h, scope solo public_breed_stats
--   research    — 1000 req/h, agregar public_species_stats
--   enterprise  — 10000 req/h + endpoints futuros (risk_score, etc)
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- pgcrypto para gen_random_bytes y digest
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabla de keys
CREATE TABLE IF NOT EXISTS public.b2b_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Hash SHA256 de la key plain. Nunca guardamos la key directa.
  key_hash TEXT NOT NULL UNIQUE,
  -- Prefijo visible para identificacion en panel admin (ej: 'pf_live_a1b2c3...')
  key_prefix TEXT NOT NULL,
  -- Nombre humano: "Mapfre Pet (research)" o "Universidad de Chile - dermato"
  name TEXT NOT NULL,
  -- Email del contacto del cliente
  contact_email TEXT NOT NULL,
  -- Tier: free / research / enterprise
  tier TEXT NOT NULL CHECK (tier IN ('free', 'research', 'enterprise')) DEFAULT 'free',
  -- Scopes: array de endpoints permitidos
  scopes TEXT[] NOT NULL DEFAULT ARRAY['breed_stats'],
  -- Rate limit por hora (cap; el tier lo define pero se puede override)
  rate_limit_per_hour INT NOT NULL DEFAULT 100,
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  -- Tracking
  last_used_at TIMESTAMPTZ,
  total_requests BIGINT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

COMMENT ON TABLE public.b2b_api_keys IS
  'API keys del programa B2B (Refactor Maestro §7.5). Cada cliente recibe '
  '1+ keys con tier y scope definidos. La key plain NO se guarda — solo el SHA256.';

CREATE INDEX IF NOT EXISTS idx_b2b_api_keys_active
  ON public.b2b_api_keys(is_active, expires_at) WHERE is_active = true;

-- RLS: solo admin puede leer/escribir; el verify usa SECURITY DEFINER
ALTER TABLE public.b2b_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_b2b_keys"
  ON public.b2b_api_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- 2. Tabla de uso por hora (para rate limit)
CREATE TABLE IF NOT EXISTS public.b2b_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES public.b2b_api_keys(id) ON DELETE CASCADE,
  hour_bucket TIMESTAMPTZ NOT NULL,
  request_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (api_key_id, hour_bucket)
);

CREATE INDEX IF NOT EXISTS idx_b2b_api_usage_key_hour
  ON public.b2b_api_usage(api_key_id, hour_bucket DESC);

-- Cleanup: borra rows > 7 dias (no necesitamos historial detallado)
CREATE INDEX IF NOT EXISTS idx_b2b_api_usage_cleanup
  ON public.b2b_api_usage(hour_bucket)
  WHERE hour_bucket < NOW() - INTERVAL '7 days';

ALTER TABLE public.b2b_api_usage ENABLE ROW LEVEL SECURITY;
-- Sin policies para clients; solo SECURITY DEFINER de las RPCs accede

-- 3. Helper: hashear key plaintext con SHA256 hex
CREATE OR REPLACE FUNCTION public.hash_b2b_api_key(p_plain_key TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(digest(p_plain_key, 'sha256'), 'hex');
$$;

-- 4. RPC: verify (para edge fn que recibe la key)
CREATE OR REPLACE FUNCTION public.verify_b2b_api_key(p_plain_key TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  tier TEXT,
  scopes TEXT[],
  rate_limit_per_hour INT,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  v_hash := public.hash_b2b_api_key(p_plain_key);

  RETURN QUERY
  SELECT
    k.id,
    k.name,
    k.tier,
    k.scopes,
    k.rate_limit_per_hour,
    (k.is_active = true AND (k.expires_at IS NULL OR k.expires_at > NOW())) AS is_valid
  FROM public.b2b_api_keys k
  WHERE k.key_hash = v_hash
  LIMIT 1;
END $$;

REVOKE ALL ON FUNCTION public.verify_b2b_api_key(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_b2b_api_key(TEXT) TO service_role;

-- 5. RPC: incrementar uso + check rate limit (atomic)
CREATE OR REPLACE FUNCTION public.increment_b2b_api_usage(p_api_key_id UUID)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INT,
  remaining INT,
  reset_in_seconds INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hour TIMESTAMPTZ;
  v_count INT;
  v_limit INT;
  v_reset INT;
BEGIN
  -- Hora truncada
  v_hour := DATE_TRUNC('hour', NOW());

  -- Limit del key
  SELECT rate_limit_per_hour INTO v_limit
  FROM public.b2b_api_keys
  WHERE id = p_api_key_id;

  IF v_limit IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, 0;
    RETURN;
  END IF;

  -- Upsert + return el contador actualizado
  INSERT INTO public.b2b_api_usage (api_key_id, hour_bucket, request_count)
  VALUES (p_api_key_id, v_hour, 1)
  ON CONFLICT (api_key_id, hour_bucket)
  DO UPDATE SET request_count = b2b_api_usage.request_count + 1
  RETURNING request_count INTO v_count;

  -- Tracking last_used + total
  UPDATE public.b2b_api_keys
  SET last_used_at = NOW(),
      total_requests = total_requests + 1
  WHERE id = p_api_key_id;

  -- Tiempo hasta proxima hora
  v_reset := EXTRACT(EPOCH FROM (v_hour + INTERVAL '1 hour' - NOW()))::INT;

  RETURN QUERY SELECT
    (v_count <= v_limit),
    v_count,
    GREATEST(v_limit - v_count, 0),
    v_reset;
END $$;

REVOKE ALL ON FUNCTION public.increment_b2b_api_usage(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_b2b_api_usage(UUID) TO service_role;

-- 6. Helper para Pedro: generar una nueva key (admin-only)
-- Devuelve la key plaintext UNA SOLA VEZ. El hash queda guardado en la tabla.
-- Pedro debe copiar la key al cliente inmediatamente; despues de cerrar el
-- panel no se puede recuperar (solo el prefix queda visible).
CREATE OR REPLACE FUNCTION public.create_b2b_api_key(
  p_name TEXT,
  p_contact_email TEXT,
  p_tier TEXT DEFAULT 'free',
  p_rate_limit INT DEFAULT NULL,
  p_scopes TEXT[] DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  api_key_id UUID,
  plain_key TEXT,
  prefix TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_random_hex TEXT;
  v_plain TEXT;
  v_hash TEXT;
  v_prefix TEXT;
  v_id UUID;
  v_default_limit INT;
  v_default_scopes TEXT[];
BEGIN
  v_user := auth.uid();

  -- Solo admin puede crear keys
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = v_user AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Solo admins pueden crear API keys B2B';
  END IF;

  -- Validar tier
  IF p_tier NOT IN ('free', 'research', 'enterprise') THEN
    RAISE EXCEPTION 'Tier invalido: %', p_tier;
  END IF;

  -- Default rate limit por tier
  v_default_limit := CASE p_tier
    WHEN 'free' THEN 100
    WHEN 'research' THEN 1000
    WHEN 'enterprise' THEN 10000
  END;

  -- Default scopes por tier
  v_default_scopes := CASE p_tier
    WHEN 'free' THEN ARRAY['breed_stats']
    WHEN 'research' THEN ARRAY['breed_stats', 'species_stats']
    WHEN 'enterprise' THEN ARRAY['breed_stats', 'species_stats', 'risk_score']
  END;

  -- Generar key plain: pf_live_<32 hex random>
  v_random_hex := encode(gen_random_bytes(16), 'hex');
  v_plain := 'pf_live_' || v_random_hex;
  v_hash := public.hash_b2b_api_key(v_plain);
  v_prefix := SUBSTRING(v_plain FROM 1 FOR 16) || '...';

  -- Insertar
  INSERT INTO public.b2b_api_keys (
    key_hash, key_prefix, name, contact_email, tier, scopes,
    rate_limit_per_hour, expires_at, created_by, notes
  )
  VALUES (
    v_hash, v_prefix, p_name, p_contact_email, p_tier,
    COALESCE(p_scopes, v_default_scopes),
    COALESCE(p_rate_limit, v_default_limit),
    p_expires_at, v_user, p_notes
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, v_plain, v_prefix;
END $$;

REVOKE ALL ON FUNCTION public.create_b2b_api_key(TEXT, TEXT, TEXT, INT, TEXT[], TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_b2b_api_key(TEXT, TEXT, TEXT, INT, TEXT[], TIMESTAMPTZ, TEXT) TO authenticated;

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- Smoke test
-- ══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_test_key TEXT := 'pf_live_test_smoke_' || encode(gen_random_bytes(8), 'hex');
  v_test_hash TEXT;
BEGIN
  -- Verificar que las funciones existen
  PERFORM 1 FROM pg_proc WHERE proname = 'hash_b2b_api_key';
  IF NOT FOUND THEN RAISE EXCEPTION 'hash_b2b_api_key no creada'; END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'verify_b2b_api_key';
  IF NOT FOUND THEN RAISE EXCEPTION 'verify_b2b_api_key no creada'; END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'increment_b2b_api_usage';
  IF NOT FOUND THEN RAISE EXCEPTION 'increment_b2b_api_usage no creada'; END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'create_b2b_api_key';
  IF NOT FOUND THEN RAISE EXCEPTION 'create_b2b_api_key no creada'; END IF;

  -- Verificar que hashing funciona deterministico
  v_test_hash := public.hash_b2b_api_key(v_test_key);
  IF v_test_hash != public.hash_b2b_api_key(v_test_key) THEN
    RAISE EXCEPTION 'hash_b2b_api_key no determinista';
  END IF;

  IF LENGTH(v_test_hash) != 64 THEN
    RAISE EXCEPTION 'hash SHA256 deberia ser 64 hex chars';
  END IF;

  RAISE NOTICE 'Smoke test OK: B2B API keys infra';
END $$;
