-- ══════════════════════════════════════════════════════════════════════════
-- Public Insights — landings SEO con data agregada anonima
-- ══════════════════════════════════════════════════════════════════════════
-- Refactor Maestro Fase 1 §6.5.
--
-- Genera stats agregadas (peso promedio, edad promedio, prevalencia de
-- razas, etc.) por raza+especie+comuna. Las landings publicas /insights/*
-- consumen estas vistas. Threshold minimo de 50 pets por insight para
-- evitar identificabilidad (privacy).
--
-- Las views son MATERIALIZED para que la lectura publica sea instantanea
-- y no recalcule en cada request. Refresh manual via cron (1x/dia) o
-- cuando masa critica cambie significativamente.
--
-- Uso desde frontend:
--   SELECT * FROM public_breed_stats WHERE breed = 'Golden Retriever';
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Vista materializada: stats por raza + especie
-- Solo incluye razas con >=50 mascotas (threshold privacy).
CREATE MATERIALIZED VIEW IF NOT EXISTS public.public_breed_stats AS
SELECT
  COALESCE(NULLIF(TRIM(p.breed), ''), 'Sin raza') AS breed,
  p.species,
  COUNT(*)::INT                                   AS pet_count,
  ROUND(AVG(p.weight)::numeric, 1)                AS avg_weight_kg,
  ROUND(MIN(p.weight)::numeric, 1)                AS min_weight_kg,
  ROUND(MAX(p.weight)::numeric, 1)                AS max_weight_kg,
  ROUND(AVG(EXTRACT(YEAR FROM AGE(p.birth_date)))::numeric, 1) AS avg_age_years,
  COUNT(*) FILTER (WHERE p.gender = 'macho')::INT  AS count_male,
  COUNT(*) FILTER (WHERE p.gender = 'hembra')::INT AS count_female,
  COUNT(*) FILTER (WHERE p.neutered IS TRUE)::INT  AS count_neutered,
  NOW() AS refreshed_at
FROM public.pets p
WHERE p.breed IS NOT NULL
  AND p.species IS NOT NULL
  AND p.owner_id IS NOT NULL  -- excluir mascotas huerfanas (sin owner real)
GROUP BY 1, 2
HAVING COUNT(*) >= 50;          -- threshold privacy

CREATE UNIQUE INDEX IF NOT EXISTS uniq_public_breed_stats_breed_species
  ON public.public_breed_stats(breed, species);

COMMENT ON MATERIALIZED VIEW public.public_breed_stats IS
  'Stats agregadas por raza+especie. Threshold >=50 pets por privacy. Refresh manual con REFRESH MATERIALIZED VIEW (cron 1x/dia recomendado).';

-- 2. RLS: lectura publica
ALTER MATERIALIZED VIEW public.public_breed_stats OWNER TO postgres;
GRANT SELECT ON public.public_breed_stats TO authenticated, anon;

-- 3. RPC para que el frontend liste insights disponibles + counter total
CREATE OR REPLACE FUNCTION public.list_public_insights()
RETURNS TABLE (
  slug TEXT,
  title TEXT,
  breed TEXT,
  species TEXT,
  pet_count INT,
  avg_weight_kg NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- slug url-friendly: 'peso-promedio-golden-retriever-chile'
    'peso-promedio-' || LOWER(REGEXP_REPLACE(breed, '[^a-zA-Z0-9]+', '-', 'g'))
      || '-chile' AS slug,
    'Peso promedio ' || breed || ' en Chile' AS title,
    breed,
    species,
    pet_count,
    avg_weight_kg
  FROM public.public_breed_stats
  WHERE pet_count >= 50
  ORDER BY pet_count DESC
  LIMIT 50;
$$;

REVOKE ALL ON FUNCTION public.list_public_insights() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_insights() TO authenticated, anon;

-- 4. RPC para que landing /insights/:slug lea su data
CREATE OR REPLACE FUNCTION public.get_public_insight(p_slug TEXT)
RETURNS TABLE (
  slug TEXT,
  title TEXT,
  breed TEXT,
  species TEXT,
  pet_count INT,
  avg_weight_kg NUMERIC,
  min_weight_kg NUMERIC,
  max_weight_kg NUMERIC,
  avg_age_years NUMERIC,
  count_male INT,
  count_female INT,
  count_neutered INT,
  refreshed_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    'peso-promedio-' || LOWER(REGEXP_REPLACE(breed, '[^a-zA-Z0-9]+', '-', 'g'))
      || '-chile' AS slug,
    'Peso promedio ' || breed || ' en Chile' AS title,
    breed,
    species,
    pet_count,
    avg_weight_kg,
    min_weight_kg,
    max_weight_kg,
    avg_age_years,
    count_male,
    count_female,
    count_neutered,
    refreshed_at
  FROM public.public_breed_stats
  WHERE 'peso-promedio-' || LOWER(REGEXP_REPLACE(breed, '[^a-zA-Z0-9]+', '-', 'g'))
        || '-chile' = p_slug
    AND pet_count >= 50
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_insight(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_insight(TEXT) TO authenticated, anon;

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- Smoke test
-- ══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_view_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_matviews
    WHERE schemaname = 'public' AND matviewname = 'public_breed_stats'
  ) INTO v_view_exists;
  IF NOT v_view_exists THEN
    RAISE EXCEPTION 'Materialized view public_breed_stats no se creo';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'list_public_insights';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'list_public_insights no se creo';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'get_public_insight';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'get_public_insight no se creo';
  END IF;

  RAISE NOTICE 'Smoke test OK: public_breed_stats + 2 RPCs creados. Refresh inicial: REFRESH MATERIALIZED VIEW public.public_breed_stats;';
END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- Refresh inicial (puede ser vacio si todavia no hay 50+ pets por raza)
-- ══════════════════════════════════════════════════════════════════════════
REFRESH MATERIALIZED VIEW public.public_breed_stats;
