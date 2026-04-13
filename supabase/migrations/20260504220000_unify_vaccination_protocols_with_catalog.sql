-- ============================================================
-- Unificar vaccination_protocols con el VACCINE_CATALOG de la UI
-- (src/lib/vaccines.ts) para que los nombres y especies sean
-- consistentes en toda la app.
--
-- NO aplicar automaticamente. Aplicar en Supabase Dashboard > SQL Editor.
-- ============================================================

-- Limpiar protocolos existentes (solo son seed, no data de usuario)
DELETE FROM vaccination_protocols;

-- Re-insertar con nombres consistentes con VACCINE_CATALOG
INSERT INTO vaccination_protocols (species, vaccine_name, applies_from_age_months, frequency_months, is_mandatory)
VALUES
  -- Perro
  ('perro', 'Séxtuple (DHPPI+L)',        2,  12, TRUE),
  ('perro', 'Antirrábica',               4,  12, TRUE),
  ('perro', 'Antiparasitario interno',   1,   3, TRUE),
  ('perro', 'KC (Kennel Cough)',        6,  12, FALSE),

  -- Gato
  ('gato', 'Triple felina (FVRCP)',      2,  12, TRUE),
  ('gato', 'Antirrábica',               4,  12, FALSE),
  ('gato', 'Leucemia felina (FeLV)',     2,  12, FALSE),
  ('gato', 'Antiparasitario interno',    1,   3, TRUE),

  -- Conejo
  ('conejo', 'Mixomatosis',             3,  12, TRUE),
  ('conejo', 'VHD (Hemorrágica)',       3,  12, TRUE)
;
