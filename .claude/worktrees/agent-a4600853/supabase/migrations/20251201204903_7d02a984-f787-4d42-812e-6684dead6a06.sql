-- Cambiar el valor por defecto de status a 'approved' para auto-aprobación
ALTER TABLE service_providers 
ALTER COLUMN status SET DEFAULT 'approved';

-- También actualizar is_verified por defecto a true
ALTER TABLE service_providers 
ALTER COLUMN is_verified SET DEFAULT true;

-- Aprobar cualquier proveedor existente que esté pendiente
UPDATE service_providers 
SET status = 'approved', is_verified = true 
WHERE status = 'pending' OR status IS NULL;