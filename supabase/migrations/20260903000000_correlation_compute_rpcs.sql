-- ══════════════════════════════════════════════════════════════════════════
-- Correlation compute RPCs (Refactor Maestro Fase 3 §2.9)
-- ══════════════════════════════════════════════════════════════════════════
-- Pueblan correlation_observations desde data real de pets/medical/profiles.
--
-- 2 correlations computables hoy con la data que tenemos:
--   1. razas-mas-longevas-chile-vs-mundo (memorial_events + breed)
--   2. edad-esterilizacion-por-comuna-chile (profiles.location + pets.neutered_date)
--
-- Las otras 4 del seed (paseo-vs-longevidad, alimento-seco, cuidado-vs-obesidad,
-- vets-outcomes) requieren features que no estan implementadas todavia
-- (GPS tracking, food_type, surgery outcomes). Se computan cuando lleguen.
--
-- Privacy:
--   - SOLO pets cuyo owner tiene anonymous_data_research_consent = TRUE
--   - Threshold k-anonymity inline: si bucket tiene <50 pets, no se inserta
--   - SECURITY DEFINER porque cruza tablas con RLS estricto
--
-- Pedro corre desde admin panel boton "Recomputar". Cuando un bucket
-- llega a >=50, su correlation queda lista para pasar a 'published'.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. compute_breed_lifespan_correlation
-- Para la def 'razas-mas-longevas-chile-vs-mundo'
-- Bucket: { "breed": "Golden Retriever" }
-- Output: years_lived avg/stddev/min/max
CREATE OR REPLACE FUNCTION public.compute_breed_lifespan_correlation()
RETURNS TABLE (
  buckets_inserted INT,
  buckets_below_threshold INT,
  total_pets_scanned INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_def_id UUID;
  v_inserted INT := 0;
  v_below INT := 0;
  v_total INT := 0;
BEGIN
  -- Permission: solo admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Solo admins pueden computar correlations';
  END IF;

  -- Resolver definition_id
  SELECT id INTO v_def_id
  FROM public.correlation_definitions
  WHERE slug = 'razas-mas-longevas-chile-vs-mundo';

  IF v_def_id IS NULL THEN
    RAISE EXCEPTION 'Definition slug=razas-mas-longevas-chile-vs-mundo no existe';
  END IF;

  -- Limpiar observations previas de esta correlation
  DELETE FROM public.correlation_observations WHERE definition_id = v_def_id;

  -- Compute: por cada raza, calcular years_lived de pets memorial.
  -- "passing event" se infiere de pets.lifecycle_status='memorial' + updated_at
  -- como aproximacion de fecha de fallecimiento (memorial_events tiene mas
  -- fidelidad pero requiere subquery y la mayoria de pets memorial tiene 1
  -- evento passing_registered).
  WITH eligible_pets AS (
    SELECT
      p.id,
      p.breed,
      p.birth_date,
      -- Fecha de fallecimiento: el memorial_events.passing_registered mas reciente
      -- o updated_at si no hay event
      COALESCE(
        (
          SELECT MIN(me.created_at)
          FROM public.memorial_events me
          WHERE me.pet_id = p.id
            AND me.event_type IN ('passing_registered', 'passing_unregistered')
        ),
        p.updated_at
      ) AS passing_date
    FROM public.pets p
    JOIN public.profiles pr ON pr.id = p.owner_id
    WHERE p.lifecycle_status = 'memorial'
      AND p.birth_date IS NOT NULL
      AND p.breed IS NOT NULL
      AND TRIM(p.breed) != ''
      AND pr.anonymous_data_research_consent = TRUE
  ),
  per_breed AS (
    SELECT
      breed,
      COUNT(*)::INT AS sample_size,
      ROUND(AVG(EXTRACT(EPOCH FROM (passing_date - birth_date)) / 31557600.0)::numeric, 2) AS avg_years,
      ROUND(STDDEV(EXTRACT(EPOCH FROM (passing_date - birth_date)) / 31557600.0)::numeric, 2) AS stddev_years,
      ROUND(MIN(EXTRACT(EPOCH FROM (passing_date - birth_date)) / 31557600.0)::numeric, 2) AS min_years,
      ROUND(MAX(EXTRACT(EPOCH FROM (passing_date - birth_date)) / 31557600.0)::numeric, 2) AS max_years
    FROM eligible_pets
    GROUP BY breed
  ),
  inserted AS (
    INSERT INTO public.correlation_observations (
      definition_id, bucket, sample_size,
      output_value, output_stddev, output_min, output_max,
      confidence_level
    )
    SELECT
      v_def_id,
      jsonb_build_object('breed', pb.breed),
      pb.sample_size,
      pb.avg_years,
      pb.stddev_years,
      pb.min_years,
      pb.max_years,
      CASE
        WHEN pb.sample_size >= 200 THEN 'high'
        WHEN pb.sample_size >= 100 THEN 'medium'
        ELSE 'low'
      END
    FROM per_breed pb
    WHERE pb.sample_size >= 50  -- threshold k-anonymity
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO v_inserted FROM inserted;

  SELECT COUNT(*)::INT INTO v_below
  FROM (
    SELECT 1 FROM public.pets p
    JOIN public.profiles pr ON pr.id = p.owner_id
    WHERE p.lifecycle_status = 'memorial'
      AND p.breed IS NOT NULL
      AND pr.anonymous_data_research_consent = TRUE
    GROUP BY p.breed
    HAVING COUNT(*) < 50
  ) t;

  SELECT COUNT(*)::INT INTO v_total
  FROM public.pets p
  JOIN public.profiles pr ON pr.id = p.owner_id
  WHERE p.lifecycle_status = 'memorial'
    AND pr.anonymous_data_research_consent = TRUE;

  RETURN QUERY SELECT v_inserted, v_below, v_total;
END $$;

REVOKE ALL ON FUNCTION public.compute_breed_lifespan_correlation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_breed_lifespan_correlation() TO authenticated;

COMMENT ON FUNCTION public.compute_breed_lifespan_correlation() IS
  'Refactor Maestro Fase 3 §2.9. Computa correlation_observations para '
  'razas-mas-longevas-chile-vs-mundo. Solo pets con consent=true. '
  'Threshold k-anonymity 50 inline. Admin-only.';

-- 2. compute_neuter_age_by_comuna_correlation
-- Para la def 'edad-esterilizacion-por-comuna-chile'
-- Bucket: { "comuna": "Las Condes", "species": "perro" }
-- Output: avg_age_at_neuter_months
CREATE OR REPLACE FUNCTION public.compute_neuter_age_by_comuna_correlation()
RETURNS TABLE (
  buckets_inserted INT,
  buckets_below_threshold INT,
  total_pets_scanned INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_def_id UUID;
  v_inserted INT := 0;
  v_below INT := 0;
  v_total INT := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Solo admins pueden computar correlations';
  END IF;

  SELECT id INTO v_def_id
  FROM public.correlation_definitions
  WHERE slug = 'edad-esterilizacion-por-comuna-chile';

  IF v_def_id IS NULL THEN
    RAISE EXCEPTION 'Definition slug=edad-esterilizacion-por-comuna-chile no existe';
  END IF;

  DELETE FROM public.correlation_observations WHERE definition_id = v_def_id;

  -- profiles.location se usa como proxy de comuna. Normalizamos a TRIM+lower.
  WITH eligible_pets AS (
    SELECT
      p.id,
      p.species,
      LOWER(TRIM(pr.location)) AS comuna,
      EXTRACT(EPOCH FROM (p.neutered_date - p.birth_date)) / 2629800.0 AS age_months_at_neuter
    FROM public.pets p
    JOIN public.profiles pr ON pr.id = p.owner_id
    WHERE p.neutered = TRUE
      AND p.neutered_date IS NOT NULL
      AND p.birth_date IS NOT NULL
      AND p.neutered_date >= p.birth_date
      AND pr.location IS NOT NULL
      AND TRIM(pr.location) != ''
      AND pr.anonymous_data_research_consent = TRUE
  ),
  per_comuna_species AS (
    SELECT
      comuna,
      species,
      COUNT(*)::INT AS sample_size,
      ROUND(AVG(age_months_at_neuter)::numeric, 1) AS avg_months,
      ROUND(STDDEV(age_months_at_neuter)::numeric, 1) AS stddev_months,
      ROUND(MIN(age_months_at_neuter)::numeric, 1) AS min_months,
      ROUND(MAX(age_months_at_neuter)::numeric, 1) AS max_months
    FROM eligible_pets
    GROUP BY comuna, species
  ),
  inserted AS (
    INSERT INTO public.correlation_observations (
      definition_id, bucket, sample_size,
      output_value, output_stddev, output_min, output_max,
      confidence_level
    )
    SELECT
      v_def_id,
      jsonb_build_object('comuna', pcs.comuna, 'species', pcs.species),
      pcs.sample_size,
      pcs.avg_months,
      pcs.stddev_months,
      pcs.min_months,
      pcs.max_months,
      CASE
        WHEN pcs.sample_size >= 200 THEN 'high'
        WHEN pcs.sample_size >= 100 THEN 'medium'
        ELSE 'low'
      END
    FROM per_comuna_species pcs
    WHERE pcs.sample_size >= 50
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO v_inserted FROM inserted;

  SELECT COUNT(*)::INT INTO v_below
  FROM (
    SELECT 1 FROM public.pets p
    JOIN public.profiles pr ON pr.id = p.owner_id
    WHERE p.neutered = TRUE
      AND p.neutered_date IS NOT NULL
      AND p.birth_date IS NOT NULL
      AND TRIM(COALESCE(pr.location, '')) != ''
      AND pr.anonymous_data_research_consent = TRUE
    GROUP BY LOWER(TRIM(pr.location)), p.species
    HAVING COUNT(*) < 50
  ) t;

  SELECT COUNT(*)::INT INTO v_total
  FROM public.pets p
  JOIN public.profiles pr ON pr.id = p.owner_id
  WHERE p.neutered = TRUE
    AND p.neutered_date IS NOT NULL
    AND pr.anonymous_data_research_consent = TRUE;

  RETURN QUERY SELECT v_inserted, v_below, v_total;
END $$;

REVOKE ALL ON FUNCTION public.compute_neuter_age_by_comuna_correlation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_neuter_age_by_comuna_correlation() TO authenticated;

COMMENT ON FUNCTION public.compute_neuter_age_by_comuna_correlation() IS
  'Refactor Maestro Fase 3 §2.9. Computa correlation_observations para '
  'edad-esterilizacion-por-comuna-chile. profiles.location como proxy de '
  'comuna. Solo pets con consent=true. Threshold k-anonymity 50.';

COMMIT;

-- Smoke test
DO $$
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'compute_breed_lifespan_correlation';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'compute_breed_lifespan_correlation no creada';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'compute_neuter_age_by_comuna_correlation';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'compute_neuter_age_by_comuna_correlation no creada';
  END IF;

  RAISE NOTICE 'Smoke test OK: 2 RPCs compute_correlation creadas';
END $$;
