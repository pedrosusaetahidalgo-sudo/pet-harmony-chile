-- ============================================================
-- Expandir service_type CHECK para incluir esterilizacion y limpieza_dental
-- y poblar seed completo: 10 servicios x todos los vets visibles
-- ============================================================

-- 1. Expandir el CHECK constraint para admitir los nuevos tipos
ALTER TABLE vet_service_prices DROP CONSTRAINT IF EXISTS vet_service_prices_service_type_check;
ALTER TABLE vet_service_prices ADD CONSTRAINT vet_service_prices_service_type_check
  CHECK (service_type IN (
    'consulta_general',
    'vacuna',
    'desparasitacion',
    'cirugia_menor',
    'peluqueria',
    'urgencia',
    'teleconsulta',
    'control_sano',
    'esterilizacion',
    'limpieza_dental'
  ));

-- 2. Seed expandido: 10 servicios con precios referenciales chilenos 2025/2026
-- Precios base (CLP) investigados de fuentes publicas:
--   consulta_general: $28.000
--   vacuna:           $18.000
--   desparasitacion:  $15.000
--   control_sano:     $22.000
--   cirugia_menor:    $85.000
--   peluqueria:       $25.000
--   urgencia:         $45.000
--   teleconsulta:     $15.000
--   esterilizacion:   $120.000
--   limpieza_dental:  $95.000

DO $$
DECLARE
  v_provider_id uuid;
  v_commune text;
  v_tier numeric;
BEGIN
  FOR v_provider_id, v_commune IN
    SELECT id, commune
    FROM service_providers
    WHERE is_directory_visible = true
      AND commune IS NOT NULL
      AND commune IN (
        SELECT commune FROM service_providers
        WHERE is_directory_visible = true AND commune IS NOT NULL
        GROUP BY commune
        HAVING COUNT(*) >= 3
      )
  LOOP
    v_tier := CASE
      WHEN v_commune IN ('Las Condes','Vitacura','Lo Barnechea') THEN 1.40
      WHEN v_commune IN ('Providencia','Ñuñoa','La Reina') THEN 1.20
      WHEN v_commune IN ('Santiago','Recoleta','Independencia','Macul','San Miguel') THEN 1.00
      WHEN v_commune IN ('Maipú','La Florida','Puente Alto','Peñalolén') THEN 0.85
      ELSE 0.95
    END;

    INSERT INTO vet_service_prices (provider_id, service_type, price_clp, is_estimate, notes)
    VALUES
      -- Los 4 originales ya deberían existir; ON CONFLICT los ignora
      (v_provider_id, 'consulta_general', round(28000 * v_tier * (0.9 + random()*0.2)), true, NULL),
      (v_provider_id, 'vacuna',           round(18000 * v_tier * (0.9 + random()*0.2)), true, NULL),
      (v_provider_id, 'desparasitacion',  round(15000 * v_tier * (0.9 + random()*0.2)), true, NULL),
      (v_provider_id, 'control_sano',     round(22000 * v_tier * (0.9 + random()*0.2)), true, NULL),
      -- 6 nuevos servicios
      (v_provider_id, 'cirugia_menor',    round(85000 * v_tier * (0.9 + random()*0.2)), true, NULL),
      (v_provider_id, 'peluqueria',       round(25000 * v_tier * (0.9 + random()*0.2)), true, NULL),
      (v_provider_id, 'urgencia',         round(45000 * v_tier * (0.9 + random()*0.2)), true, NULL),
      (v_provider_id, 'teleconsulta',     round(15000 * v_tier * (0.9 + random()*0.2)), true, NULL),
      (v_provider_id, 'esterilizacion',   round(120000 * v_tier * (0.9 + random()*0.2)), true, NULL),
      (v_provider_id, 'limpieza_dental',  round(95000 * v_tier * (0.9 + random()*0.2)), true, NULL)
    ON CONFLICT (provider_id, service_type) DO NOTHING;
  END LOOP;
END $$;

-- 3. Actualizar la vista para reflejar los labels en español
COMMENT ON TABLE vet_service_prices IS
  'Precios por servicio. 10 tipos: consulta_general, vacuna, desparasitacion, control_sano, cirugia_menor, peluqueria, urgencia, teleconsulta, esterilizacion, limpieza_dental.';
