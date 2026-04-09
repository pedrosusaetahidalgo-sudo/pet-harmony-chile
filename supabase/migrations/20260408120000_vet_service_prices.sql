-- ============================================================
-- Paw Friend — Estimador de precios veterinarios por comuna
-- 2026-04-08
--
-- Tabla con precios reales por servicio publicados por los propios
-- veterinarios + vista agregada por comuna que alimenta la pagina
-- publica /precios-veterinarios. Este es el 4to diferenciador unico
-- del MVP segun ESTRATEGIA_MVP_2026.md (transparencia de precios).
--
-- PENDIENTE DE APLICAR — el dueño debe correr esta migracion en
-- Supabase y luego regenerar src/integrations/supabase/types.ts.
-- ============================================================

-- 1. Tabla de precios por servicio
CREATE TABLE IF NOT EXISTS vet_service_prices (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  uuid NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN (
    'consulta_general',
    'vacuna',
    'desparasitacion',
    'cirugia_menor',
    'peluqueria',
    'urgencia',
    'teleconsulta',
    'control_sano'
  )),
  price_clp    integer NOT NULL CHECK (price_clp > 0),
  is_estimate  boolean DEFAULT false,
  notes        text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE (provider_id, service_type)
);

CREATE INDEX IF NOT EXISTS idx_vet_service_prices_service ON vet_service_prices (service_type);
CREATE INDEX IF NOT EXISTS idx_vet_service_prices_provider ON vet_service_prices (provider_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_vet_service_prices_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vet_service_prices_updated_at ON vet_service_prices;
CREATE TRIGGER trg_vet_service_prices_updated_at
  BEFORE UPDATE ON vet_service_prices
  FOR EACH ROW EXECUTE FUNCTION update_vet_service_prices_updated_at();

-- 2. RLS
ALTER TABLE vet_service_prices ENABLE ROW LEVEL SECURITY;

-- SELECT: publico (feature SEO)
DROP POLICY IF EXISTS "Public can read vet service prices" ON vet_service_prices;
CREATE POLICY "Public can read vet service prices"
  ON vet_service_prices FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT: solo el provider dueño
DROP POLICY IF EXISTS "Provider can insert own prices" ON vet_service_prices;
CREATE POLICY "Provider can insert own prices"
  ON vet_service_prices FOR INSERT
  TO authenticated
  WITH CHECK (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- UPDATE: solo el provider dueño
DROP POLICY IF EXISTS "Provider can update own prices" ON vet_service_prices;
CREATE POLICY "Provider can update own prices"
  ON vet_service_prices FOR UPDATE
  TO authenticated
  USING (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- DELETE: solo el provider dueño
DROP POLICY IF EXISTS "Provider can delete own prices" ON vet_service_prices;
CREATE POLICY "Provider can delete own prices"
  ON vet_service_prices FOR DELETE
  TO authenticated
  USING (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- 3. Vista agregada por comuna
-- Decision: vista NORMAL (no materializada) porque el volumen inicial
-- es bajo y queremos datos en tiempo real cuando un vet publica sus
-- precios. Si el volumen crece se puede convertir a materialized view
-- con refresh programado.
--
-- HAVING COUNT(*) >= 3 garantiza muestras estadisticamente utiles
-- (con 1-2 datos los percentiles son ruido).
--
-- La columna comuna ya existe en service_providers (campo `commune`,
-- agregado en la migracion 20251201194846). Usamos esa.
CREATE OR REPLACE VIEW vet_prices_by_comuna AS
SELECT
  sp.commune                                                             AS comuna,
  vsp.service_type                                                       AS service_type,
  COUNT(*)::integer                                                      AS sample_size,
  MIN(vsp.price_clp)::integer                                            AS min_price,
  MAX(vsp.price_clp)::integer                                            AS max_price,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY vsp.price_clp)::integer   AS p25_price,
  PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY vsp.price_clp)::integer   AS median_price,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY vsp.price_clp)::integer   AS p75_price
FROM vet_service_prices vsp
JOIN service_providers sp ON sp.id = vsp.provider_id
WHERE sp.is_directory_visible = true
  AND sp.commune IS NOT NULL
GROUP BY sp.commune, vsp.service_type
HAVING COUNT(*) >= 3;

GRANT SELECT ON vet_prices_by_comuna TO anon, authenticated;

COMMENT ON TABLE vet_service_prices IS 'Precios por servicio publicados por los veterinarios. Alimenta el comparador publico /precios-veterinarios.';
COMMENT ON VIEW vet_prices_by_comuna IS 'Agregado de precios por comuna y tipo de servicio. Solo aparecen combinaciones con >= 3 muestras.';
