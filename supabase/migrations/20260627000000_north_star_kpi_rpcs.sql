-- ==========================================================================
-- North Star + KPI RPCs (admin-only)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d INIT-02 + INIT-03):
-- El plan de exito define un North Star ("fichas clinicas descargadas o
-- compartidas por dueno activo 30d") y un widget admin con 5 KPIs top.
-- Para no depender 100% de PostHog en el dashboard, creamos RPCs
-- SECURITY DEFINER que leen directo de Supabase y son accesibles solo
-- para admins activos.
--
-- Proxies usados (sin depender de PostHog):
--   - NSM 30d: owners distintos con share token con last_accessed_at 30d
--              + owners distintos con medical_records creados 30d.
--     (Cuando PostHog tenga el evento real clinical_pdf_downloaded,
--      se puede comparar y ajustar.)
--   - MAU owners 30d: profiles con updated_at 30d + >=1 pet owned.
--   - MRR B2B: SUM(monthly_price) de service_providers con plan != free
--              y status != suspended.
--   - Paw Members: count profiles.is_premium=true (hoy 0 real, proxy).
--
-- Cada RPC valida is_active_admin(auth.uid()); si falla, devuelve 0/NULL.
-- ==========================================================================

-- ----------------------------------------------------------------------
-- RPC: North Star 30d
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_nsm_30d()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT public.is_active_admin(auth.uid()) THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(DISTINCT owner_id)
  INTO v_count
  FROM (
    -- Owners cuyos share tokens fueron accedidos en ultimos 30d
    SELECT owner_id
    FROM public.medical_share_tokens
    WHERE last_accessed_at >= NOW() - INTERVAL '30 days'
      AND owner_id IS NOT NULL
    UNION
    -- Owners cuyas mascotas tuvieron medical_records nuevos en 30d
    -- (proxy de actividad medica, apunta a descarga de PDF futura)
    SELECT p.owner_id
    FROM public.pets p
    JOIN public.medical_records mr ON mr.pet_id = p.id
    WHERE mr.created_at >= NOW() - INTERVAL '30 days'
      AND p.owner_id IS NOT NULL
  ) AS owners_activos;

  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION public.rpc_nsm_30d() IS
  'North Star 30d: owners distintos con share token abierto O con medical_record creado en 30d. Proxy conservador de PostHog clinical_pdf_downloaded.';

-- ----------------------------------------------------------------------
-- RPC: MAU owners 30d
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_mau_owners_30d()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT public.is_active_admin(auth.uid()) THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(DISTINCT pr.id)
  INTO v_count
  FROM public.profiles pr
  WHERE pr.updated_at >= NOW() - INTERVAL '30 days'
    AND EXISTS (
      SELECT 1 FROM public.pets p WHERE p.owner_id = pr.id
    );

  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION public.rpc_mau_owners_30d() IS
  'MAU owners 30d: profiles con updated_at 30d y >=1 mascota vinculada.';

-- ----------------------------------------------------------------------
-- RPC: MRR B2B (CLP)
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_mrr_b2b_clp()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_mrr BIGINT;
BEGIN
  IF NOT public.is_active_admin(auth.uid()) THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(
    CASE
      WHEN provider_plan = 'provider_premium'         THEN 9900
      WHEN provider_plan = 'provider_clinic_starter'  THEN 19900
      WHEN provider_plan = 'provider_pro_max'         THEN 29900
      -- Aliases legacy tambien
      WHEN provider_plan = 'provider_individual'      THEN 9900
      WHEN provider_plan = 'provider_clinic_basic'    THEN 19900
      WHEN provider_plan = 'provider_clinic_pro'      THEN 29900
      ELSE 0
    END
  ), 0)
  INTO v_mrr
  FROM public.service_providers
  WHERE status IN ('approved', 'active', 'pending')
    AND provider_plan IS NOT NULL
    AND provider_plan <> 'provider_free';

  RETURN v_mrr;
END;
$$;

COMMENT ON FUNCTION public.rpc_mrr_b2b_clp() IS
  'MRR B2B en CLP: suma monthly_price por provider_plan de service_providers con plan pagado. Incluye aliases legacy.';

-- ----------------------------------------------------------------------
-- RPC: Vets pagando (count por plan)
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_vets_paying_breakdown()
RETURNS TABLE (
  premium_count INTEGER,
  clinic_starter_count INTEGER,
  pro_max_count INTEGER,
  total_paying INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF NOT public.is_active_admin(auth.uid()) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE provider_plan IN ('provider_premium', 'provider_individual'))::INTEGER AS premium_count,
    COUNT(*) FILTER (WHERE provider_plan IN ('provider_clinic_starter', 'provider_clinic_basic'))::INTEGER AS clinic_starter_count,
    COUNT(*) FILTER (WHERE provider_plan IN ('provider_pro_max', 'provider_clinic_pro'))::INTEGER AS pro_max_count,
    COUNT(*) FILTER (WHERE provider_plan IS NOT NULL AND provider_plan <> 'provider_free')::INTEGER AS total_paying
  FROM public.service_providers
  WHERE status IN ('approved', 'active', 'pending');
END;
$$;

COMMENT ON FUNCTION public.rpc_vets_paying_breakdown() IS
  'Count de vets pagando desglosado por tier (Premium / Clinic Starter / Pro Max).';

-- ----------------------------------------------------------------------
-- RPC: Paw Members activos (count)
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_paw_members_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT public.is_active_admin(auth.uid()) THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*)
  INTO v_count
  FROM public.profiles
  WHERE is_premium = true
    AND plan_id = 'premium';

  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION public.rpc_paw_members_count() IS
  'Count de profiles con is_premium=true AND plan_id=premium. Hoy refleja Paw Members badge-only (USER_PREMIUM=false).';

-- ----------------------------------------------------------------------
-- RPC: Donaciones 30d (CLP)
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_donations_30d_clp()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_total BIGINT;
BEGIN
  IF NOT public.is_active_admin(auth.uid()) THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(amount_clp), 0)
  INTO v_total
  FROM public.donations
  WHERE status = 'paid'
    AND COALESCE(paid_at, created_at) >= NOW() - INTERVAL '30 days';

  RETURN v_total;
END;
$$;

COMMENT ON FUNCTION public.rpc_donations_30d_clp() IS
  'Suma donaciones paid en ultimos 30d (CLP). Basado en paid_at con fallback a created_at.';

-- ----------------------------------------------------------------------
-- RPC unificada: snapshot North Star + 5 KPIs (para widget admin)
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_north_star_snapshot()
RETURNS TABLE (
  nsm_30d INTEGER,
  mau_owners_30d INTEGER,
  vets_paying_total INTEGER,
  mrr_b2b_clp BIGINT,
  donations_30d_clp BIGINT,
  paw_members INTEGER,
  captured_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF NOT public.is_active_admin(auth.uid()) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    public.rpc_nsm_30d(),
    public.rpc_mau_owners_30d(),
    (SELECT total_paying FROM public.rpc_vets_paying_breakdown()),
    public.rpc_mrr_b2b_clp(),
    public.rpc_donations_30d_clp(),
    public.rpc_paw_members_count(),
    NOW();
END;
$$;

COMMENT ON FUNCTION public.rpc_north_star_snapshot() IS
  'Snapshot unificado para widget AdminNorthStarHeader. Llama a cada RPC individual y devuelve 1 fila.';

-- ----------------------------------------------------------------------
-- Grants: solo authenticated (los RPCs validan admin internamente)
-- ----------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.rpc_nsm_30d() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_mau_owners_30d() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_mrr_b2b_clp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_vets_paying_breakdown() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_paw_members_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_donations_30d_clp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_north_star_snapshot() TO authenticated;

-- Nota: los RPCs devuelven NULL para no-admin (no fallan).
-- El frontend debe manejar el caso NULL como "sin acceso".
