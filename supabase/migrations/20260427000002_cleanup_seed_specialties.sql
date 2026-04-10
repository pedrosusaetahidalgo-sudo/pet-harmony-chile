-- Remover especialidades que son procedimientos, no especialidades reales
UPDATE service_providers
SET specialties = array_remove(array_remove(specialties, 'Vacunación'), 'Esterilización')
WHERE 'Vacunación' = ANY(specialties) OR 'Esterilización' = ANY(specialties);
