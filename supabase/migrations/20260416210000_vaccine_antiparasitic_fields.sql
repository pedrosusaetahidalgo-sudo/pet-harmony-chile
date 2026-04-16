-- ==========================================================================
-- Mejoras clinicas: antiparasitarios como record_type + campos adicionales
-- Feedback de Sofia (vet beta tester): separar antiparasitarios con tipo,
-- producto/marca, y recordatorio automatico.
--
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.
-- ==========================================================================

-- 1. Agregar columnas para antiparasitarios
--    antiparasitic_type: 'interno' (comprimidos/pasta), 'externo' (pipeta/collar), 'ambos' (ej. Bravecto)
--    product_brand: nombre comercial del producto (ej. Bravecto, Nexgard, Drontal)
ALTER TABLE medical_records
  ADD COLUMN IF NOT EXISTS antiparasitic_type TEXT,
  ADD COLUMN IF NOT EXISTS product_brand TEXT;

COMMENT ON COLUMN medical_records.antiparasitic_type
  IS 'Tipo de antiparasitario: interno, externo, o ambos';
COMMENT ON COLUMN medical_records.product_brand
  IS 'Nombre comercial del producto antiparasitario (ej. Bravecto, Nexgard, Drontal)';

-- 2. Agregar 'antiparasitario' al CHECK constraint de record_type
--    Mantiene backward compat con 'desparasitacion' y 'antipulgas' existentes.
ALTER TABLE medical_records
  DROP CONSTRAINT IF EXISTS medical_records_record_type_check;

ALTER TABLE medical_records
  ADD CONSTRAINT medical_records_record_type_check
  CHECK (record_type IN (
    -- Consultas
    'consulta', 'consulta_general', 'control_sano', 'urgencia', 'seguimiento', 'segunda_opinion',
    -- Vacunas y prevencion
    'vacuna', 'desparasitacion', 'antipulgas', 'antiparasitario',
    -- Procedimientos
    'cirugia', 'cirugía', 'esterilizacion', 'limpieza_dental',
    'ecografia', 'rayos_x', 'examen_sangre', 'examen_orina',
    -- Tratamientos
    'tratamiento', 'quimioterapia', 'rehabilitacion', 'hospitalizacion',
    -- Registros
    'alergia', 'peso', 'microchip',
    -- Otros
    'otro'
  ));

-- 3. Validar antiparasitic_type cuando se usa
ALTER TABLE medical_records
  ADD CONSTRAINT medical_records_antiparasitic_type_check
  CHECK (
    antiparasitic_type IS NULL
    OR antiparasitic_type IN ('interno', 'externo', 'ambos')
  );
