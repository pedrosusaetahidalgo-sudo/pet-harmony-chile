-- Agregar campos de horarios de atención y emergencia a service_providers
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS opening_hours jsonb;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS emergency_available boolean DEFAULT false;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS emergency_phone text;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS emergency_surcharge_pct int;

-- Comentarios para documentar la estructura de opening_hours:
-- opening_hours es un JSON con la siguiente estructura:
-- {
--   "lun": { "open": "09:00", "close": "18:00" },
--   "mar": { "open": "09:00", "close": "18:00" },
--   "mie": { "open": "09:00", "close": "18:00" },
--   "jue": { "open": "09:00", "close": "18:00" },
--   "vie": { "open": "09:00", "close": "17:00" },
--   "sab": { "open": "10:00", "close": "14:00" },
--   "dom": null  -- cerrado
-- }

-- Actualizar providers demo con horarios de ejemplo
UPDATE service_providers
SET
  opening_hours = '{
    "lun": {"open": "09:00", "close": "19:00"},
    "mar": {"open": "09:00", "close": "19:00"},
    "mie": {"open": "09:00", "close": "19:00"},
    "jue": {"open": "09:00", "close": "19:00"},
    "vie": {"open": "09:00", "close": "18:00"},
    "sab": {"open": "10:00", "close": "14:00"},
    "dom": null
  }'::jsonb,
  emergency_available = true,
  emergency_phone = public_phone,
  emergency_surcharge_pct = 30
WHERE is_demo = true
  AND slug IN ('dra-javiera-munoz', 'dr-matias-fernandez');

-- Los otros demos no atienden emergencias
UPDATE service_providers
SET
  opening_hours = '{
    "lun": {"open": "08:30", "close": "20:00"},
    "mar": {"open": "08:30", "close": "20:00"},
    "mie": {"open": "08:30", "close": "20:00"},
    "jue": {"open": "08:30", "close": "20:00"},
    "vie": {"open": "08:30", "close": "19:00"},
    "sab": {"open": "09:00", "close": "15:00"},
    "dom": {"open": "10:00", "close": "13:00"}
  }'::jsonb,
  emergency_available = false
WHERE is_demo = true
  AND slug IN ('clinica-veterinaria-patitas', 'clinica-veterinaria-altamira');
