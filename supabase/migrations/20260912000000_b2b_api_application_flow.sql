-- 2026-04-29 (B2B API onboarding flow)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Cierra el flujo /aplicar?tipo=b2b_api → admin approve → API key emitida.
--
-- Componentes:
--   1. Agregar 'b2b_api' al CHECK constraint de pitch_applications.kind
--   2. RPC approve_b2b_api_application: admin-only, dado un pitch app B2B,
--      crea la API key (via create_b2b_api_key) + actualiza la application
--      a status='approved' + payload con metadata. Devuelve la plain key.
--   3. RPC get_b2b_self_stats: publica via pg_settings de la key, devuelve
--      stats del propio partner sin exponer otras keys.

BEGIN;

-- ── 1. CHECK constraint kind incluye b2b_api ──────────────────────────
DO $$
BEGIN
  IF to_regclass('public.pitch_applications') IS NULL THEN
    RAISE EXCEPTION 'tabla pitch_applications no existe';
  END IF;

  -- Drop old constraint si existe.
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname LIKE '%pitch_applications_kind_check%'
  ) THEN
    ALTER TABLE public.pitch_applications
      DROP CONSTRAINT IF EXISTS pitch_applications_kind_check;
  END IF;

  ALTER TABLE public.pitch_applications
    ADD CONSTRAINT pitch_applications_kind_check
    CHECK (kind IN (
      'corfo',
      'startup_chile',
      'paw_companys',
      'angels_vc',
      'refugio',
      'paw_partners',
      'vet',
      'paw_voices',
      'b2b_api',
      'otro'
    ));
END $$;

-- ── 2. RPC approve_b2b_api_application (admin-only) ───────────────────
CREATE OR REPLACE FUNCTION public.approve_b2b_api_application(
  p_application_id UUID,
  p_tier TEXT DEFAULT 'free',
  p_rate_limit INT DEFAULT NULL,
  p_scopes TEXT[] DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  api_key_id UUID,
  plain_key TEXT,
  prefix TEXT,
  partner_name TEXT,
  partner_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_app RECORD;
  v_key_row RECORD;
BEGIN
  -- Auth check
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = v_user AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Solo admins pueden aprobar applications B2B';
  END IF;

  -- Validar tier
  IF p_tier NOT IN ('free', 'research', 'enterprise') THEN
    RAISE EXCEPTION 'Tier invalido: %', p_tier;
  END IF;

  -- Cargar la application
  SELECT * INTO v_app
  FROM public.pitch_applications
  WHERE id = p_application_id AND kind = 'b2b_api';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application no encontrada o no es de tipo b2b_api';
  END IF;

  IF v_app.status = 'approved' AND v_app.approved_entity_id IS NOT NULL THEN
    RAISE EXCEPTION 'Application ya fue aprobada (entity_id=%)', v_app.approved_entity_id;
  END IF;

  -- Crear API key via RPC existente. Devuelve la plain key UNA VEZ.
  SELECT * INTO v_key_row
  FROM public.create_b2b_api_key(
    p_name := COALESCE(v_app.organization_name, v_app.contact_name),
    p_contact_email := v_app.contact_email,
    p_tier := p_tier,
    p_rate_limit := p_rate_limit,
    p_scopes := p_scopes,
    p_expires_at := p_expires_at,
    p_notes := COALESCE(p_admin_notes, 'Auto-issued from pitch_applications ' || p_application_id::text)
  );

  -- Actualizar application
  UPDATE public.pitch_applications
     SET status = 'approved',
         reviewed_by = v_user,
         reviewed_at = NOW(),
         admin_notes = COALESCE(p_admin_notes, admin_notes),
         approved_entity_id = v_key_row.api_key_id,
         approved_entity_table = 'b2b_api_keys',
         updated_at = NOW()
   WHERE id = p_application_id;

  RETURN QUERY SELECT
    v_key_row.api_key_id,
    v_key_row.plain_key,
    v_key_row.prefix,
    COALESCE(v_app.organization_name, v_app.contact_name),
    v_app.contact_email;
END $$;

REVOKE ALL ON FUNCTION public.approve_b2b_api_application(UUID, TEXT, INT, TEXT[], TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_b2b_api_application(UUID, TEXT, INT, TEXT[], TIMESTAMPTZ, TEXT) TO authenticated;

COMMENT ON FUNCTION public.approve_b2b_api_application IS
  'Aprueba un pitch_application kind=b2b_api: crea API key, marca approved, devuelve plain key (UNA VEZ) al admin para que la copie y la mande al partner.';

-- ── 3. RPC get_b2b_self_stats (publica via API key) ───────────────────
-- El cliente B2B llama esta RPC pasando su api key plaintext. La RPC valida
-- el hash y devuelve solo SUS propias stats. No expone otras keys.
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
    COALESCE(SUM(u.request_count) FILTER (WHERE u.window_start >= NOW() - INTERVAL '24 hours'), 0)::BIGINT AS last_24h_requests,
    COALESCE(SUM(u.request_count) FILTER (WHERE u.window_start >= NOW() - INTERVAL '7 days'), 0)::BIGINT AS last_7d_requests
  FROM public.b2b_api_keys k
  LEFT JOIN public.b2b_api_usage u ON u.api_key_id = k.id
  WHERE k.id = v_key_id
  GROUP BY k.id, k.name, k.tier, k.scopes, k.rate_limit_per_hour, k.is_active,
           k.expires_at, k.total_requests, k.last_used_at;
END $$;

REVOKE ALL ON FUNCTION public.get_b2b_self_stats(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_b2b_self_stats(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.get_b2b_self_stats IS
  'Endpoint publico para que un cliente B2B consulte su propio uso. Recibe la API key plaintext, valida hash, devuelve solo sus stats. No expone otras keys.';

COMMIT;
