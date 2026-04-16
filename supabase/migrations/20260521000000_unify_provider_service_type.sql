-- ==========================================================================
-- Unificar categorización de proveedores con primary_service_type
--
-- Problema: los proveedores se registran en service_providers pero no se
-- categorizan con un tipo de servicio. Las tablas legacy (vet_profiles,
-- dog_walker_profiles, etc.) están desconectadas de service_providers.
--
-- Solución: agregar primary_service_type a service_providers como campo
-- canónico que identifica qué tipo de profesional es (vet, groomer, etc.).
-- También agregar campos específicos de groomer para no depender de
-- groomer_profiles como tabla separada.
--
-- NO aplicar automáticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.
-- ==========================================================================

-- 1. Agregar primary_service_type a service_providers
ALTER TABLE service_providers
  ADD COLUMN IF NOT EXISTS primary_service_type TEXT;

COMMENT ON COLUMN service_providers.primary_service_type
  IS 'Tipo principal de servicio: veterinarian, grooming, dog_walker, dogsitter, trainer';

-- 2. CHECK constraint para primary_service_type
ALTER TABLE service_providers
  DROP CONSTRAINT IF EXISTS service_providers_primary_service_type_check;

ALTER TABLE service_providers
  ADD CONSTRAINT service_providers_primary_service_type_check
  CHECK (
    primary_service_type IS NULL
    OR primary_service_type IN ('veterinarian', 'grooming', 'dog_walker', 'dogsitter', 'trainer')
  );

-- 3. Agregar campos de grooming para unificar groomer_profiles en service_providers
ALTER TABLE service_providers
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS services_offered TEXT[],
  ADD COLUMN IF NOT EXISTS accepts_cats BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS accepts_dogs BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS accepts_long_hair BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS mobile_service BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS base_price_clp INTEGER;

COMMENT ON COLUMN service_providers.business_name
  IS 'Nombre comercial del negocio (usado por groomers y clínicas)';
COMMENT ON COLUMN service_providers.services_offered
  IS 'Lista de sub-servicios ofrecidos (ej. Baño, Corte, Limpieza dental)';
COMMENT ON COLUMN service_providers.base_price_clp
  IS 'Precio base en CLP (alternativa a price_from para servicios no-vet)';

-- 4. Backfill: vets existentes que tienen specialties o license_number
UPDATE service_providers
SET primary_service_type = 'veterinarian'
WHERE primary_service_type IS NULL
  AND (license_number IS NOT NULL OR specialties IS NOT NULL OR provider_type IS NOT NULL);

-- 5. Backfill: groomers existentes desde groomer_profiles
-- Insertar en service_providers los groomers que no tienen ya un registro
INSERT INTO service_providers (
  user_id, display_name, bio, commune, service_areas,
  experience_years, status, primary_service_type,
  business_name, services_offered, accepts_cats, accepts_dogs,
  accepts_long_hair, mobile_service, base_price_clp,
  provider_plan, is_directory_visible, rating, total_reviews
)
SELECT
  gp.user_id,
  COALESCE(gp.business_name, p.display_name, 'Peluquero'),
  gp.bio,
  gp.commune,
  gp.service_areas,
  gp.experience_years,
  gp.status,
  'grooming',
  gp.business_name,
  gp.services_offered,
  gp.accepts_cats,
  gp.accepts_dogs,
  gp.accepts_long_hair,
  gp.mobile_service,
  gp.base_price_clp,
  'provider_free',
  (gp.status = 'approved'),
  COALESCE(gp.avg_rating, 0),
  COALESCE(gp.total_reviews, 0)
FROM groomer_profiles gp
LEFT JOIN profiles p ON p.id = gp.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM service_providers sp WHERE sp.user_id = gp.user_id
)
ON CONFLICT (user_id) DO UPDATE SET
  primary_service_type = 'grooming',
  business_name = EXCLUDED.business_name,
  services_offered = EXCLUDED.services_offered,
  accepts_cats = EXCLUDED.accepts_cats,
  accepts_dogs = EXCLUDED.accepts_dogs,
  accepts_long_hair = EXCLUDED.accepts_long_hair,
  mobile_service = EXCLUDED.mobile_service,
  base_price_clp = EXCLUDED.base_price_clp;

-- 6. Auto-crear provider_service_offerings para vets que no tienen uno
INSERT INTO provider_service_offerings (provider_id, service_type, price_base, price_unit, is_active)
SELECT sp.id, 'veterinarian', COALESCE(sp.price_from, 0), 'session', true
FROM service_providers sp
WHERE sp.primary_service_type = 'veterinarian'
  AND NOT EXISTS (
    SELECT 1 FROM provider_service_offerings pso
    WHERE pso.provider_id = sp.id AND pso.service_type = 'veterinarian'
  );

-- 7. Auto-crear provider_service_offerings para groomers que no tienen uno
INSERT INTO provider_service_offerings (provider_id, service_type, price_base, price_unit, is_active)
SELECT sp.id, 'grooming', COALESCE(sp.base_price_clp, sp.price_from, 0), 'session', true
FROM service_providers sp
WHERE sp.primary_service_type = 'grooming'
  AND NOT EXISTS (
    SELECT 1 FROM provider_service_offerings pso
    WHERE pso.provider_id = sp.id AND pso.service_type = 'grooming'
  );

-- 8. Índice para filtrar por primary_service_type
CREATE INDEX IF NOT EXISTS idx_providers_primary_service_type
  ON service_providers (primary_service_type)
  WHERE primary_service_type IS NOT NULL;
