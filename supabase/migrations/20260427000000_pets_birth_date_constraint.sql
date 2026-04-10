-- Constraint: fecha de nacimiento razonable (máximo 30 años en el pasado, no en el futuro)
-- Aplica a todas las especies — 30 años cubre tortugas longevas

-- 1. Limpiar datos existentes que violan el constraint
--    Fechas futuras → NULL
UPDATE pets SET birth_date = NULL WHERE birth_date > CURRENT_DATE;
--    Fechas anteriores a 30 años → NULL (dato claramente erróneo, ej: "kai 30 años")
UPDATE pets SET birth_date = NULL WHERE birth_date < CURRENT_DATE - INTERVAL '30 years';

-- 2. Ahora sí, aplicar el constraint
ALTER TABLE pets ADD CONSTRAINT pets_birth_date_reasonable
  CHECK (birth_date IS NULL OR (birth_date <= CURRENT_DATE AND birth_date >= CURRENT_DATE - INTERVAL '30 years'));
