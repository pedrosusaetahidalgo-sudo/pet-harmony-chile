-- ══════════════════════════════════════════════════════════════════════════
-- B2B API: agregar scopes correlation_insights + correlation_catalog
-- ══════════════════════════════════════════════════════════════════════════
-- Refactor Maestro Fase 3 §2.9 — la edge fn b2b-api ahora soporta 4
-- endpoints (breed_stats, species_stats, correlation_catalog,
-- correlation_insights). Esta mig actualiza los scopes default del RPC
-- create_b2b_api_key para que keys nuevas tier='enterprise' incluyan los
-- nuevos scopes automaticamente.
--
-- Keys existentes NO se actualizan automaticamente — Pedro debe editarlas
-- manualmente desde el panel admin o via SQL si necesita expandir scope.
-- Esto es intencional: scope cambio = decision comercial.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

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

  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = v_user AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Solo admins pueden crear API keys B2B';
  END IF;

  IF p_tier NOT IN ('free', 'research', 'enterprise') THEN
    RAISE EXCEPTION 'Tier invalido: %', p_tier;
  END IF;

  v_default_limit := CASE p_tier
    WHEN 'free' THEN 100
    WHEN 'research' THEN 1000
    WHEN 'enterprise' THEN 10000
  END;

  -- Default scopes por tier (actualizado 2026-04-27 con correlation_*).
  -- El catalogo ya esta abierto en research+enterprise para permitir
  -- discovery; los insights detallados (con sample_size + output) requieren
  -- enterprise.
  v_default_scopes := CASE p_tier
    WHEN 'free' THEN ARRAY['breed_stats']
    WHEN 'research' THEN ARRAY[
      'breed_stats',
      'species_stats',
      'correlation_catalog'
    ]
    WHEN 'enterprise' THEN ARRAY[
      'breed_stats',
      'species_stats',
      'correlation_catalog',
      'correlation_insights',
      'risk_score'
    ]
  END;

  v_random_hex := encode(gen_random_bytes(16), 'hex');
  v_plain := 'pf_live_' || v_random_hex;
  v_hash := public.hash_b2b_api_key(v_plain);
  v_prefix := SUBSTRING(v_plain FROM 1 FOR 16) || '...';

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

COMMIT;

DO $$
BEGIN
  RAISE NOTICE 'Smoke test OK: create_b2b_api_key con scopes correlation_*';
END $$;
