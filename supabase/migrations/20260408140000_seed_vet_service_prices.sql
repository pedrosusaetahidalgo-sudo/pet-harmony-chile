-- Seed inicial de precios para activar /precios-veterinarios.
-- Estrategia: tomar todos los providers visibles en el directorio
-- agrupados por comuna y poblar 4 servicios core (consulta_general,
-- vacuna, control_sano, desparasitacion) con precios pseudo-aleatorios
-- en rangos realistas chilenos 2025/2026.
--
-- Idempotente: usa ON CONFLICT (provider_id, service_type) DO NOTHING
-- para no pisar precios reales que el vet ya cargo manualmente.
--
-- Rangos base por comuna (CLP) — basados en investigacion 2025:
--   Las Condes / Vitacura / Lo Barnechea  -> tier alto (premium)
--   Providencia / Nunoa / La Reina        -> tier medio-alto
--   Santiago / Recoleta / Indep / Macul   -> tier medio
--   Maipu / La Florida / Puente Alto      -> tier medio-bajo
--   Otras comunas                         -> tier base
--
-- Para no inflar la pagina con precios falsos cuando haya pocos vets,
-- el seed solo aplica si hay >= 3 vets visibles por comuna (mismo
-- threshold que la vista vet_prices_by_comuna).

DO $$
DECLARE
  v_provider_id uuid;
  v_commune text;
  v_tier_multiplier numeric;
  v_consulta_base int := 28000;
  v_vacuna_base int := 18000;
  v_control_base int := 22000;
  v_despara_base int := 15000;
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
    v_tier_multiplier := CASE
      WHEN v_commune IN ('Las Condes','Vitacura','Lo Barnechea') THEN 1.40
      WHEN v_commune IN ('Providencia','Ñuñoa','La Reina') THEN 1.20
      WHEN v_commune IN ('Santiago','Recoleta','Independencia','Macul','San Miguel') THEN 1.00
      WHEN v_commune IN ('Maipú','La Florida','Puente Alto','Peñalolén') THEN 0.85
      ELSE 0.95
    END;

    -- Variacion +-10% por provider para que no todos tengan exactamente
    -- el mismo precio (sino la mediana == p25 == p75 y la barra se ve plana)
    INSERT INTO vet_service_prices (provider_id, service_type, price_clp, is_estimate, notes)
    VALUES
      (v_provider_id, 'consulta_general',
       round(v_consulta_base * v_tier_multiplier * (0.9 + random() * 0.2)),
       true, 'Estimacion inicial Paw Friend'),
      (v_provider_id, 'vacuna',
       round(v_vacuna_base * v_tier_multiplier * (0.9 + random() * 0.2)),
       true, NULL),
      (v_provider_id, 'control_sano',
       round(v_control_base * v_tier_multiplier * (0.9 + random() * 0.2)),
       true, NULL),
      (v_provider_id, 'desparasitacion',
       round(v_despara_base * v_tier_multiplier * (0.9 + random() * 0.2)),
       true, NULL)
    ON CONFLICT (provider_id, service_type) DO NOTHING;
  END LOOP;
END $$;

-- Marca: este seed pone is_estimate=true para que en el UI podamos
-- distinguir precios "oficiales del vet" vs "estimacion Paw Friend".
-- El vet siempre puede sobrescribir desde su panel y se reseteara
-- is_estimate=false (definir esa logica en el editor del vet, fuera
-- de scope del seed).
COMMENT ON COLUMN vet_service_prices.is_estimate IS
  'true = precio sembrado por Paw Friend, false = precio publicado por el vet desde su panel';
