-- 2026-04-30 (Vet check-in biometrico · #2 RICE 126)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Spec: docs-raiz/PAW_SHIELD_IDEAS_BANK.md §2.
--
-- Componentes:
--   1. Tabla vet_api_keys — keys per-vet con scope limitado (solo identify
--      en pacientes que tienen al vet en su ficha). NO heredamos b2b_api_keys
--      porque el scope es distinto (un vet ve sus pacientes; un B2B partner
--      ve stats agregadas).
--   2. Tabla vet_checkin_log — audit trail de cada checkin.
--   3. RPC verify_vet_api_key(plain_key) — valida key + devuelve provider_id.
--   4. RPC create_vet_api_key(provider_id, name) — admin-only, genera key.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. vet_api_keys ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vet_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  -- Tier: free (solo checkin del vet) | pro (checkin + crear evento timeline)
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro')) DEFAULT 'free',
  rate_limit_per_hour INT NOT NULL DEFAULT 200,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  total_requests BIGINT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

COMMENT ON TABLE public.vet_api_keys IS
  'API keys per-vet para el endpoint /vet-checkin-identify. Scope: solo pacientes que tienen al vet en su ficha. Usado por widget embebido en software del vet.';

CREATE INDEX IF NOT EXISTS idx_vet_keys_provider
  ON public.vet_api_keys(service_provider_id) WHERE is_active = true;

ALTER TABLE public.vet_api_keys ENABLE ROW LEVEL SECURITY;

-- Solo admin lee/escribe (verify usa SECURITY DEFINER).
DROP POLICY IF EXISTS vk_admin ON public.vet_api_keys;
CREATE POLICY vk_admin
  ON public.vet_api_keys FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = true)
  );

-- El vet propietario puede ver sus keys (no plaintext, solo metadata).
DROP POLICY IF EXISTS vk_vet_select ON public.vet_api_keys;
CREATE POLICY vk_vet_select
  ON public.vet_api_keys FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_providers sp
      WHERE sp.id = vet_api_keys.service_provider_id
        AND sp.user_id = auth.uid()
    )
  );

-- ── 2. vet_checkin_log ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vet_checkin_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_api_key_id UUID NOT NULL REFERENCES public.vet_api_keys(id) ON DELETE CASCADE,
  service_provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  match_score NUMERIC(5,2),
  result TEXT NOT NULL CHECK (result IN ('matched', 'no_match', 'low_confidence', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vcl_provider_time
  ON public.vet_checkin_log(service_provider_id, created_at DESC);

ALTER TABLE public.vet_checkin_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vcl_admin ON public.vet_checkin_log;
CREATE POLICY vcl_admin
  ON public.vet_checkin_log FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS vcl_vet_select ON public.vet_checkin_log;
CREATE POLICY vcl_vet_select
  ON public.vet_checkin_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_providers sp
      WHERE sp.id = vet_checkin_log.service_provider_id
        AND sp.user_id = auth.uid()
    )
  );

-- ── 3. Hash helper (reusa el patron de b2b_api_keys) ──────────────────
CREATE OR REPLACE FUNCTION public.hash_vet_api_key(p_plain TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(digest(p_plain, 'sha256'), 'hex');
$$;

-- ── 4. RPC verify_vet_api_key (publica, lee plain key) ────────────────
CREATE OR REPLACE FUNCTION public.verify_vet_api_key(p_plain_key TEXT)
RETURNS TABLE (
  api_key_id UUID,
  service_provider_id UUID,
  tier TEXT,
  rate_limit_per_hour INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  IF p_plain_key IS NULL OR LENGTH(p_plain_key) < 16 THEN
    RAISE EXCEPTION 'invalid api key';
  END IF;
  v_hash := public.hash_vet_api_key(p_plain_key);

  RETURN QUERY
  SELECT k.id, k.service_provider_id, k.tier, k.rate_limit_per_hour
  FROM public.vet_api_keys k
  WHERE k.key_hash = v_hash
    AND k.is_active = true
    AND (k.expires_at IS NULL OR k.expires_at > NOW());
END $$;

REVOKE ALL ON FUNCTION public.verify_vet_api_key(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_vet_api_key(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.verify_vet_api_key IS
  'Valida vet API key plaintext (SHA256 hash match). Devuelve api_key_id + provider_id si activa. Usado por edge fn vet-checkin-identify.';

-- ── 5. RPC create_vet_api_key (admin-only, genera plain key una vez) ──
CREATE OR REPLACE FUNCTION public.create_vet_api_key(
  p_service_provider_id UUID,
  p_name TEXT,
  p_tier TEXT DEFAULT 'free',
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
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_random TEXT;
  v_plain TEXT;
  v_hash TEXT;
  v_prefix TEXT;
  v_id UUID;
  v_rate INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access WHERE user_id = v_user AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Solo admins pueden crear vet API keys';
  END IF;

  IF p_tier NOT IN ('free', 'pro') THEN
    RAISE EXCEPTION 'Tier invalido: %', p_tier;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.service_providers WHERE id = p_service_provider_id) THEN
    RAISE EXCEPTION 'service_provider_id no existe';
  END IF;

  v_rate := CASE p_tier WHEN 'free' THEN 200 WHEN 'pro' THEN 1000 END;
  v_random := encode(gen_random_bytes(16), 'hex');
  v_plain := 'pf_vet_' || v_random;
  v_hash := public.hash_vet_api_key(v_plain);
  v_prefix := SUBSTRING(v_plain FROM 1 FOR 16) || '...';

  INSERT INTO public.vet_api_keys
    (service_provider_id, key_hash, key_prefix, name, tier, rate_limit_per_hour, expires_at, created_by, notes)
  VALUES
    (p_service_provider_id, v_hash, v_prefix, p_name, p_tier, v_rate, p_expires_at, v_user, p_notes)
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, v_plain, v_prefix;
END $$;

REVOKE ALL ON FUNCTION public.create_vet_api_key(UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_vet_api_key(UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT) TO authenticated;

COMMENT ON FUNCTION public.create_vet_api_key IS
  'Genera vet API key plaintext UNA VEZ. Admin-only. Devuelve plain key al admin para enviar al vet.';

COMMIT;
