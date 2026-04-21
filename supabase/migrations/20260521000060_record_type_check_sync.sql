-- ==========================================================================
-- Sincroniza medical_records.record_type CHECK con MEDICAL_RECORD_TYPES
-- del frontend (src/lib/medicalRecordTypes.ts).
-- 2026-05-21 (bug report Pedro 2026-04-21: "vacuna no funciona")
--
-- Problema:
-- La mig 20260421000000_expand_medical_record_types.sql (cronologicamente
-- posterior a 20260416210000_vaccine_antiparasitic_fields.sql) redefinio
-- el CHECK y accidentalmente dejo FUERA 'antiparasitario' (dejo solo los
-- legacy 'desparasitacion' y 'antipulgas'). El frontend sin embargo sigue
-- ofreciendo 'antiparasitario' en el Select.
--
-- Esta migracion consolida el CHECK con TODOS los valores que el frontend
-- puede enviar hoy, preservando los valores legacy para no invalidar filas
-- existentes. Idempotente.
--
-- NO aplicar automaticamente. Pedro aplica desde Supabase Dashboard > SQL Editor.
-- ==========================================================================

ALTER TABLE public.medical_records
  DROP CONSTRAINT IF EXISTS medical_records_record_type_check;

ALTER TABLE public.medical_records
  ADD CONSTRAINT medical_records_record_type_check
  CHECK (record_type IN (
    -- Consultas (frontend + legacy 'consulta')
    'consulta', 'consulta_general', 'control_sano',
    'urgencia', 'seguimiento', 'segunda_opinion',

    -- Vacunas y prevención (incluye 'antiparasitario' canonico + legacy)
    'vacuna',
    'antiparasitario',
    'desparasitacion',
    'antipulgas',

    -- Procedimientos
    'cirugia', 'cirugía',
    'esterilizacion', 'limpieza_dental',
    'ecografia', 'rayos_x',
    'examen_sangre', 'examen_orina',

    -- Tratamientos
    'tratamiento', 'quimioterapia', 'rehabilitacion', 'hospitalizacion',

    -- Registros
    'alergia', 'peso', 'microchip',

    -- Otros
    'otro'
  ));

COMMENT ON CONSTRAINT medical_records_record_type_check ON public.medical_records IS
  'Sincronizado con src/lib/medicalRecordTypes.ts (2026-05-21). Si agregas un tipo en el frontend, agregalo aqui tambien.';
