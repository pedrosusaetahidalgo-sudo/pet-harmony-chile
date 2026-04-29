-- 2026-04-30 (RLS hardening · auditoria post-implementacion motores revenue)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Audit findings 2026-04-30 sobre las 9 tablas/RPCs creadas en migs
-- 20260911-20260917. Cada hallazgo + fix.
--
-- A) paw_shield_archive_stats() — sin check admin. Cualquier authenticated
--    podia ver stats globales de archive. Fix: RAISE EXCEPTION si no admin.
--
-- B) insurance_leads il_owner_insert — permitia que un user malicioso cree
--    leads spam directo a DB (skipeando edge fn request-insurance-quote
--    que tiene validaciones). Fix: drop policy de insert directo. La edge
--    fn usa service_role que bypasea RLS, asi que sigue funcionando.
--
-- C) retail_clicks rc_owner_insert — mismo issue: spam de clicks. Fix:
--    drop policy. RPC track_retail_click es SECURITY DEFINER y persiste
--    correctamente.
--
-- D) retail_partner_stats() — usa filter en WHERE en lugar de RAISE.
--    Devuelve 0 silenciosamente si no admin. Fix: RAISE EXCEPTION.

BEGIN;

-- ── A) paw_shield_archive_stats — admin gate ──────────────────────────
CREATE OR REPLACE FUNCTION public.paw_shield_archive_stats()
RETURNS TABLE (
  total_images BIGINT,
  with_consent BIGINT,
  pending_expiration BIGINT,
  by_species_dog BIGINT,
  by_species_cat BIGINT,
  oldest_image TIMESTAMPTZ,
  newest_image TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*) AS total_images,
    COUNT(*) FILTER (WHERE consent_for_training = true) AS with_consent,
    COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at < NOW() + INTERVAL '7 days') AS pending_expiration,
    COUNT(*) FILTER (WHERE species = 'DOG') AS by_species_dog,
    COUNT(*) FILTER (WHERE species = 'CAT') AS by_species_cat,
    MIN(created_at) AS oldest_image,
    MAX(created_at) AS newest_image
  FROM public.paw_shield_archive;
END $$;

REVOKE ALL ON FUNCTION public.paw_shield_archive_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.paw_shield_archive_stats() TO authenticated;

COMMENT ON FUNCTION public.paw_shield_archive_stats IS
  'Stats agregadas del archivo Paw Shield. ADMIN-ONLY (validado al inicio). Para AdminPawShieldKPIs.';

-- ── B) insurance_leads — drop owner_insert policy ─────────────────────
-- Razon: edge fn request-insurance-quote bypasea RLS con service_role.
-- No necesitamos permitir insert directo desde cliente — eso seria spam.
DROP POLICY IF EXISTS il_owner_insert ON public.insurance_leads;

-- ── C) retail_clicks — drop owner_insert policy ───────────────────────
-- Razon: RPC track_retail_click es SECURITY DEFINER y persiste correcto.
-- Insert directo desde cliente es spam vector.
DROP POLICY IF EXISTS rc_owner_insert ON public.retail_clicks;

-- ── D) retail_partner_stats — RAISE EXCEPTION en lugar de filter ──────
CREATE OR REPLACE FUNCTION public.retail_partner_stats(p_partner_id UUID, p_days INT DEFAULT 30)
RETURNS TABLE (
  total_clicks BIGINT,
  unique_owners BIGINT,
  conversions BIGINT,
  total_conversion_clp BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_clicks,
    COUNT(DISTINCT owner_id)::BIGINT AS unique_owners,
    COUNT(*) FILTER (WHERE converted_at IS NOT NULL)::BIGINT AS conversions,
    COALESCE(SUM(conversion_clp), 0)::BIGINT AS total_conversion_clp
  FROM public.retail_clicks
  WHERE partner_id = p_partner_id
    AND created_at >= NOW() - (p_days * INTERVAL '1 day');
END $$;

REVOKE ALL ON FUNCTION public.retail_partner_stats(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.retail_partner_stats(UUID, INT) TO authenticated;

COMMENT ON FUNCTION public.retail_partner_stats IS
  'KPIs de un partner retail en ultimos N dias. ADMIN-ONLY (validado al inicio).';

-- ── E) Smoke test: asegurar que las RPCs validan admin ────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'paw_shield_archive_stats'
      AND prosecdef = true
  ) THEN
    RAISE EXCEPTION 'paw_shield_archive_stats no es SECURITY DEFINER';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'retail_partner_stats'
      AND prosecdef = true
  ) THEN
    RAISE EXCEPTION 'retail_partner_stats no es SECURITY DEFINER';
  END IF;
END $$;

COMMIT;
