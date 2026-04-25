-- ══════════════════════════════════════════════════════════════════════════
-- Public Insights v2: más slugs SEO
-- ══════════════════════════════════════════════════════════════════════════
-- Refactor Maestro Fase 1 §6.5 — sumar variedad para llegar a >=20 landings.
--
-- Nuevas vistas y RPCs (las viejas siguen funcionando):
--   - public_species_stats: stats agregadas por especie (sin distinguir raza)
--   - list_public_insights_v2: dispatcher que une los 3 tipos de slugs
--   - get_public_species_insight(slug): resuelve "mascotas-perro-chile"
--   - get_public_breeds_by_species(species): top razas para cada especie
--
-- Threshold privacy: pet_count >= 50 en TODAS las vistas.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Vista materializada: stats por ESPECIE (perros/gatos/conejos/etc)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.public_species_stats AS
SELECT
  p.species,
  COUNT(*)::INT                                      AS pet_count,
  ROUND(AVG(p.weight)::numeric, 1)                   AS avg_weight_kg,
  ROUND(MIN(p.weight)::numeric, 1)                   AS min_weight_kg,
  ROUND(MAX(p.weight)::numeric, 1)                   AS max_weight_kg,
  ROUND(AVG(EXTRACT(YEAR FROM AGE(p.birth_date)))::numeric, 1) AS avg_age_years,
  COUNT(*) FILTER (WHERE p.gender = 'macho')::INT     AS count_male,
  COUNT(*) FILTER (WHERE p.gender = 'hembra')::INT    AS count_female,
  COUNT(*) FILTER (WHERE p.neutered IS TRUE)::INT     AS count_neutered,
  COUNT(DISTINCT NULLIF(TRIM(p.breed), ''))::INT      AS distinct_breeds,
  NOW() AS refreshed_at
FROM public.pets p
WHERE p.species IS NOT NULL
  AND p.owner_id IS NOT NULL
GROUP BY p.species
HAVING COUNT(*) >= 50;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_public_species_stats_species
  ON public.public_species_stats(species);

GRANT SELECT ON public.public_species_stats TO authenticated, anon;

-- 2. RPC dispatcher: lista TODOS los slugs disponibles (3 tipos)
CREATE OR REPLACE FUNCTION public.list_public_insights_v2()
RETURNS TABLE (
  slug TEXT,
  title TEXT,
  kind TEXT,
  primary_label TEXT,
  pet_count INT,
  highlight TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Tipo 1: peso por raza (vista vieja)
  SELECT
    'peso-promedio-' || LOWER(REGEXP_REPLACE(breed, '[^a-zA-Z0-9]+', '-', 'g'))
      || '-chile'                                        AS slug,
    'Peso promedio ' || breed || ' en Chile'             AS title,
    'breed'                                              AS kind,
    breed                                                AS primary_label,
    pet_count,
    avg_weight_kg::text || ' kg'                         AS highlight
  FROM public.public_breed_stats
  WHERE pet_count >= 50

  UNION ALL

  -- Tipo 2: overview por especie
  SELECT
    'mascotas-' || LOWER(species) || '-chile'            AS slug,
    INITCAP(species) || 's en Chile'                     AS title,
    'species'                                            AS kind,
    species                                              AS primary_label,
    pet_count,
    pet_count::text || ' registrados'                    AS highlight
  FROM public.public_species_stats
  WHERE pet_count >= 50

  UNION ALL

  -- Tipo 3: top razas por especie
  SELECT
    'top-razas-' || LOWER(species) || '-chile'           AS slug,
    'Razas más comunes de ' || species || 's en Chile'   AS title,
    'breed_rank'                                         AS kind,
    species                                              AS primary_label,
    pet_count,
    distinct_breeds::text || ' razas distintas'          AS highlight
  FROM public.public_species_stats
  WHERE pet_count >= 50

  ORDER BY pet_count DESC
  LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.list_public_insights_v2() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_insights_v2() TO authenticated, anon;

-- 3. RPC: detalle de insight por especie ("mascotas-perro-chile")
CREATE OR REPLACE FUNCTION public.get_public_species_insight(p_slug TEXT)
RETURNS TABLE (
  slug TEXT,
  title TEXT,
  species TEXT,
  pet_count INT,
  avg_weight_kg NUMERIC,
  min_weight_kg NUMERIC,
  max_weight_kg NUMERIC,
  avg_age_years NUMERIC,
  count_male INT,
  count_female INT,
  count_neutered INT,
  distinct_breeds INT,
  refreshed_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    'mascotas-' || LOWER(species) || '-chile'            AS slug,
    INITCAP(species) || 's en Chile'                     AS title,
    species,
    pet_count,
    avg_weight_kg,
    min_weight_kg,
    max_weight_kg,
    avg_age_years,
    count_male,
    count_female,
    count_neutered,
    distinct_breeds,
    refreshed_at
  FROM public.public_species_stats
  WHERE 'mascotas-' || LOWER(species) || '-chile' = p_slug
    AND pet_count >= 50
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_species_insight(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_species_insight(TEXT)
  TO authenticated, anon;

-- 4. RPC: top razas por especie ("top-razas-perro-chile")
-- Devuelve top 10 razas + count para esa especie.
CREATE OR REPLACE FUNCTION public.get_public_breeds_by_species(p_slug TEXT)
RETURNS TABLE (
  slug TEXT,
  title TEXT,
  species TEXT,
  total_pets INT,
  total_breeds INT,
  rank INT,
  breed TEXT,
  breed_count INT,
  avg_weight_kg NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH parsed AS (
    SELECT
      REGEXP_REPLACE(p_slug, '^top-razas-(.+)-chile$', '\1') AS species_lower
  ),
  parent AS (
    SELECT
      ss.species,
      ss.pet_count AS total_pets,
      ss.distinct_breeds AS total_breeds
    FROM public.public_species_stats ss, parsed
    WHERE LOWER(ss.species) = parsed.species_lower
      AND ss.pet_count >= 50
  )
  SELECT
    p_slug AS slug,
    'Razas más comunes de ' || p.species || 's en Chile' AS title,
    p.species,
    p.total_pets,
    p.total_breeds,
    ROW_NUMBER() OVER (ORDER BY bs.pet_count DESC)::INT AS rank,
    bs.breed,
    bs.pet_count AS breed_count,
    bs.avg_weight_kg
  FROM parent p
  JOIN public.public_breed_stats bs ON bs.species = p.species
  WHERE bs.pet_count >= 50
  ORDER BY bs.pet_count DESC
  LIMIT 10;
$$;

REVOKE ALL ON FUNCTION public.get_public_breeds_by_species(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_breeds_by_species(TEXT)
  TO authenticated, anon;

COMMIT;

-- Refresh inicial
REFRESH MATERIALIZED VIEW public.public_species_stats;

-- ══════════════════════════════════════════════════════════════════════════
-- Smoke test
-- ══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  PERFORM 1 FROM pg_matviews
    WHERE schemaname = 'public' AND matviewname = 'public_species_stats';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'public_species_stats no se creo';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'list_public_insights_v2';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'list_public_insights_v2 no se creo';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'get_public_species_insight';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'get_public_species_insight no se creo';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'get_public_breeds_by_species';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'get_public_breeds_by_species no se creo';
  END IF;

  RAISE NOTICE 'Smoke test OK: public_species_stats + 3 RPCs creados';
END $$;
