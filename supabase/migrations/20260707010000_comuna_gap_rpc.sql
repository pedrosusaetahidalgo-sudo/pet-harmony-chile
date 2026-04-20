-- ==========================================================================
-- RPC admin: gap por comuna (demanda vs oferta)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d outreach B2B):
-- Para priorizar outreach a vets (INIT-09), necesitamos saber dónde hay
-- más dueños y menos vets disponibles. Comunas con alta demanda + baja
-- oferta = prioridad outreach.
--
-- Output:
--   - owners_count: dueños activos en esa comuna (profiles.commune).
--   - vets_count: vets approved + visibles en el directorio.
--   - gap_ratio: owners/vets (mayor = más prioridad outreach).
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.rpc_comuna_demand_supply()
RETURNS TABLE (
  comuna TEXT,
  owners_count INTEGER,
  vets_count INTEGER,
  gap_ratio NUMERIC,
  pets_count INTEGER
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
  WITH
  owners_by_comuna AS (
    SELECT
      COALESCE(NULLIF(TRIM(p.comuna), ''), 'Sin comuna') AS comuna,
      COUNT(DISTINCT p.id)::INTEGER AS count
    FROM public.profiles p
    WHERE p.comuna IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.pets pt WHERE pt.owner_id = p.id)
    GROUP BY 1
  ),
  vets_by_comuna AS (
    SELECT
      COALESCE(NULLIF(TRIM(sp.commune), ''), 'Sin comuna') AS comuna,
      COUNT(*)::INTEGER AS count
    FROM public.service_providers sp
    WHERE sp.status IN ('approved', 'active')
      AND sp.is_directory_visible = TRUE
    GROUP BY 1
  ),
  pets_by_comuna AS (
    SELECT
      COALESCE(NULLIF(TRIM(p.comuna), ''), 'Sin comuna') AS comuna,
      COUNT(pt.id)::INTEGER AS count
    FROM public.profiles p
    LEFT JOIN public.pets pt ON pt.owner_id = p.id
    WHERE p.comuna IS NOT NULL
    GROUP BY 1
  ),
  all_comunas AS (
    SELECT comuna FROM owners_by_comuna
    UNION
    SELECT comuna FROM vets_by_comuna
    UNION
    SELECT comuna FROM pets_by_comuna
  )
  SELECT
    ac.comuna,
    COALESCE(o.count, 0) AS owners_count,
    COALESCE(v.count, 0) AS vets_count,
    CASE
      WHEN COALESCE(v.count, 0) = 0 AND COALESCE(o.count, 0) > 0 THEN 999.0::NUMERIC
      WHEN COALESCE(v.count, 0) = 0 THEN 0::NUMERIC
      ELSE ROUND(COALESCE(o.count, 0)::NUMERIC / v.count, 2)
    END AS gap_ratio,
    COALESCE(pt.count, 0) AS pets_count
  FROM all_comunas ac
  LEFT JOIN owners_by_comuna o ON o.comuna = ac.comuna
  LEFT JOIN vets_by_comuna v ON v.comuna = ac.comuna
  LEFT JOIN pets_by_comuna pt ON pt.comuna = ac.comuna
  WHERE ac.comuna != 'Sin comuna'
  ORDER BY
    CASE WHEN COALESCE(v.count, 0) = 0 AND COALESCE(o.count, 0) > 0 THEN 0 ELSE 1 END,
    gap_ratio DESC,
    owners_count DESC
  LIMIT 50;
END;
$$;

COMMENT ON FUNCTION public.rpc_comuna_demand_supply() IS
  'Gap demanda/oferta por comuna: owners activos, vets visibles, gap_ratio=owners/vets. Priorizacion outreach B2B INIT-09.';

GRANT EXECUTE ON FUNCTION public.rpc_comuna_demand_supply() TO authenticated;
