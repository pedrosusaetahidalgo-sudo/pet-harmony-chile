-- Horarios de atención + emergencia para veterinarios
-- NO aplicar automáticamente. El dueño aplica manualmente desde Supabase Dashboard > SQL Editor.

-- 1. Campos nuevos en service_providers
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS opening_hours jsonb DEFAULT '{}';
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS emergency_available boolean DEFAULT false;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS emergency_phone text;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS emergency_surcharge_pct int;

-- opening_hours formato esperado:
-- {
--   "lun": { "open": "09:00", "close": "18:00" },
--   "mar": { "open": "09:00", "close": "18:00" },
--   "mie": { "open": "09:00", "close": "18:00" },
--   "jue": { "open": "09:00", "close": "18:00" },
--   "vie": { "open": "09:00", "close": "17:00" },
--   "sab": { "open": "10:00", "close": "14:00" },
--   "dom": null
-- }

COMMENT ON COLUMN service_providers.opening_hours IS 'JSON con horarios por día de la semana. null = cerrado ese día.';
COMMENT ON COLUMN service_providers.emergency_available IS 'Si atiende urgencias fuera de horario';
COMMENT ON COLUMN service_providers.emergency_phone IS 'Teléfono exclusivo para emergencias';
COMMENT ON COLUMN service_providers.emergency_surcharge_pct IS 'Recargo % por atención de urgencia';
