-- ══════════════════════════════════════════════════════════════════════════
-- Correlation insights — Fase 3 §2.9 (el moat de data)
-- ══════════════════════════════════════════════════════════════════════════
-- Scaffolding para el verdadero moat: data longitudinal correlacionada que
-- ningun competidor en Chile/LATAM tendra en 24-36 meses.
--
-- Las correlaciones reales (raza X + condicion Y → outcome Z) requieren
-- volumen, longitudinalidad y consent. Hoy no llegamos al threshold para
-- publicar nada, pero ESCRIBIR la infraestructura ahora significa:
--   - El primer dia que crucemos n=50 con consent=true para una correlacion
--     interesante, podemos publicarla sin trabajo adicional.
--   - Pedro puede demo el "shape" de los insights a un Pharma/aseguradora
--     antes de tener data, mostrando "asi se va a ver el dashboard".
--
-- Tablas:
--   correlation_definitions  — catalogo de correlaciones de interes (Pedro define)
--   correlation_observations — view materializada que computa cada def (refresh nightly)
--
-- Privacy:
--   - Solo pets cuyo owner tenga anonymous_data_research_consent = TRUE
--   - Threshold k-anonymity: pet_count >= 50 en cada bucket
--   - SECURITY DEFINER en RPCs publicas, GRANT solo a service_role + admin
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Catalogo de correlaciones definidas
CREATE TABLE IF NOT EXISTS public.correlation_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Slug humano-legible: 'esperanza-vida-vs-paseo-golden-retriever'
  slug TEXT NOT NULL UNIQUE,
  -- Pregunta en lenguaje natural (la del plan §2.9.1)
  question TEXT NOT NULL,
  -- Hipotesis a validar
  hypothesis TEXT,
  -- Categoria: 'longevity' | 'nutrition' | 'health' | 'behavior' | 'spend'
  category TEXT NOT NULL,
  -- Variables de input (raza, edad, comuna, etc) y output (peso, dias_vivido)
  input_dimensions TEXT[] NOT NULL,  -- ej: ['breed', 'walk_hours_weekly']
  output_metric TEXT NOT NULL,        -- ej: 'years_lived'
  -- Quien podria pagar por este insight
  potential_buyers TEXT[],            -- ej: ['Pharma', 'Petfood', 'Insurance']
  estimated_price_usd NUMERIC,        -- estimacion del plan §2.9.1
  -- Estado
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',          -- definido pero no computable todavia
    'computing',      -- esperando volumen de data
    'published',      -- ya tiene n>=50 y se puede consultar
    'archived'        -- decidimos no perseguirla
  )),
  -- Tracking
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

COMMENT ON TABLE public.correlation_definitions IS
  'Refactor Maestro Fase 3 §2.9.1. Catalogo de correlaciones que valdrian '
  'plata para Pharma/Insurers/etc. Pedro las define a priori; cuando una '
  'cruza el threshold de volumen + consent, status pasa a published.';

CREATE INDEX IF NOT EXISTS idx_correlation_definitions_status
  ON public.correlation_definitions(status);

-- RLS: admin lee/escribe; pblico lee solo published
ALTER TABLE public.correlation_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_correlation_definitions"
  ON public.correlation_definitions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "anyone_reads_published_correlation_definitions"
  ON public.correlation_definitions FOR SELECT
  USING (status = 'published');

-- 2. Tabla de observaciones (la vista materializada con buckets)
-- En vez de view materializada compleja, usamos tabla simple poblada por
-- la RPC compute_correlation. Mas portable y debugeable.
CREATE TABLE IF NOT EXISTS public.correlation_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id UUID NOT NULL REFERENCES public.correlation_definitions(id) ON DELETE CASCADE,
  -- Bucket: combinacion de inputs (ej: {"breed":"Golden","walk_hours":"<3"})
  bucket JSONB NOT NULL,
  -- N de mascotas en el bucket (k-anonymity threshold)
  sample_size INT NOT NULL,
  -- Metric output
  output_value NUMERIC,
  output_stddev NUMERIC,
  output_min NUMERIC,
  output_max NUMERIC,
  -- Confidence indicator
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  -- Computado en
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (definition_id, bucket)
);

CREATE INDEX IF NOT EXISTS idx_correlation_observations_def
  ON public.correlation_observations(definition_id, sample_size DESC);

ALTER TABLE public.correlation_observations ENABLE ROW LEVEL SECURITY;

-- Solo admin lee directamente. La consulta publica para clientes B2B
-- pasa por RPC con threshold check.
CREATE POLICY "admin_reads_correlation_observations"
  ON public.correlation_observations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- 3. RPC para clientes B2B: lee observations con threshold privacy.
-- No expone slug interno; el cliente pasa definition_id (compartido en
-- documentacion del deal).
CREATE OR REPLACE FUNCTION public.get_correlation_insights(
  p_definition_id UUID,
  p_min_sample_size INT DEFAULT 50
)
RETURNS TABLE (
  bucket JSONB,
  sample_size INT,
  output_value NUMERIC,
  output_stddev NUMERIC,
  confidence_level TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.bucket,
    o.sample_size,
    o.output_value,
    o.output_stddev,
    o.confidence_level
  FROM public.correlation_observations o
  JOIN public.correlation_definitions d ON d.id = o.definition_id
  WHERE o.definition_id = p_definition_id
    AND d.status = 'published'
    AND o.sample_size >= GREATEST(p_min_sample_size, 50)  -- floor 50
  ORDER BY o.sample_size DESC;
$$;

REVOKE ALL ON FUNCTION public.get_correlation_insights(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_correlation_insights(UUID, INT) TO service_role;

COMMENT ON FUNCTION public.get_correlation_insights(UUID, INT) IS
  'Refactor Maestro Fase 3 §2.9.2. Endpoint principal del moat: clientes '
  'B2B (Pharma/Insurers) consultan correlaciones publicadas con threshold '
  'k-anonymity >=50. Solo definitions status=published.';

-- 4. Seed de 6 correlaciones del plan §2.9.1 en estado 'draft'
INSERT INTO public.correlation_definitions (
  slug, question, hypothesis, category, input_dimensions, output_metric,
  potential_buyers, estimated_price_usd, status, notes
) VALUES
  (
    'paseo-vs-longevidad-golden-retriever',
    'Cuantas horas de paseo semanal correlacionan con mayor esperanza de vida en Golden Retriever?',
    'Mas horas de paseo (>5h/sem) deberia correlacionar con +1.5 anos de esperanza vida vs <2h/sem',
    'longevity',
    ARRAY['breed', 'walk_hours_weekly'],
    'years_lived',
    ARRAY['Pharma', 'Petfood'],
    25000,
    'draft',
    'Requiere memorial_events + actividad GPS implementada (CASCADE_BIRTHDAY_AUTO + WALK_GPS_TRACKING).'
  ),
  (
    'alimento-seco-vs-cristaluria-gatos',
    'El tipo de alimento (seco vs humedo) correlaciona con incidencia de cristaluria en gatos?',
    'Alimento 100% seco aumenta cristaluria 2-3x vs mixto/humedo',
    'nutrition',
    ARRAY['food_type', 'water_intake'],
    'cristaluria_incidence',
    ARRAY['Pharma', 'Petfood'],
    35000,
    'draft',
    'Requiere campo food_type en pets + medical_records con diagnostico cristaluria.'
  ),
  (
    'edad-esterilizacion-por-comuna-chile',
    'A que edad promedio se esteriliza en cada comuna chilena?',
    NULL,
    'health',
    ARRAY['comuna', 'species'],
    'avg_age_at_neuter_months',
    ARRAY['Municipios', 'ONGs', 'Gobierno'],
    NULL,
    'draft',
    'Grants publicos. Requiere comuna en profiles + neuter_date en pets.'
  ),
  (
    'razas-mas-longevas-chile-vs-mundo',
    'Cuales razas viven mas tiempo en Chile que el promedio mundial?',
    'Clima templado + latitud media favorece longevidad en razas adaptadas frio',
    'longevity',
    ARRAY['breed', 'comuna_zone'],
    'years_lived',
    ARRAY['Universidades', 'Pharma'],
    20000,
    'draft',
    'Requiere memorial_events de >=50 mascotas por raza.'
  ),
  (
    'cuidado-vs-obesidad-canina',
    'Que patrones de cuidado correlacionan con menor incidencia de obesidad canina?',
    'Combinacion de >=4h paseo/sem + alimento porcionado + check-in vet 2x/anno reduce obesidad 40%',
    'health',
    ARRAY['walk_hours_weekly', 'food_portioned', 'vet_visits_annual'],
    'obesity_incidence',
    ARRAY['Insurance', 'Pharma'],
    50000,
    'draft',
    'Requiere weight_history + actividad + medical_records.'
  ),
  (
    'vets-outcomes-cirugias',
    'Que vets tienen mejores outcomes en cirugias especificas?',
    NULL,
    'health',
    ARRAY['vet_id', 'surgery_type'],
    'recovery_success_rate',
    ARRAY['Insurance', 'Owners'],
    NULL,
    'draft',
    'Sensible — requiere consent doble (owner + vet). Lo dejamos para Y3+.'
  )
ON CONFLICT (slug) DO NOTHING;

COMMIT;

-- Smoke test
DO $$
DECLARE
  v_count INT;
BEGIN
  PERFORM 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'correlation_definitions';
  IF NOT FOUND THEN RAISE EXCEPTION 'correlation_definitions no creada'; END IF;

  PERFORM 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'correlation_observations';
  IF NOT FOUND THEN RAISE EXCEPTION 'correlation_observations no creada'; END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'get_correlation_insights';
  IF NOT FOUND THEN RAISE EXCEPTION 'get_correlation_insights no creada'; END IF;

  SELECT COUNT(*) INTO v_count FROM public.correlation_definitions;
  IF v_count < 6 THEN
    RAISE EXCEPTION 'Seed de correlaciones no se inserto (count=%)', v_count;
  END IF;

  RAISE NOTICE 'Smoke test OK: correlation insights infra + 6 definitions seed';
END $$;
