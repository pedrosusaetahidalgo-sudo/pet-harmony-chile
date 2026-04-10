-- Ampliar los tipos permitidos en medical_records.record_type
-- Los tipos antiguos (vacuna, consulta, tratamiento, alergia, cirugía, otro) se mantienen para backward compat.
-- Se agregan tipos mas especificos para mejor calidad de datos.

ALTER TABLE medical_records
  DROP CONSTRAINT IF EXISTS medical_records_record_type_check;

ALTER TABLE medical_records
  ADD CONSTRAINT medical_records_record_type_check
  CHECK (record_type IN (
    -- Consultas
    'consulta', 'consulta_general', 'control_sano', 'urgencia', 'seguimiento', 'segunda_opinion',
    -- Vacunas y prevencion
    'vacuna', 'desparasitacion', 'antipulgas',
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
