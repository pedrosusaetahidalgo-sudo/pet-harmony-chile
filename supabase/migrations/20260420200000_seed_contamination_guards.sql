-- Guards para prevenir contaminación de seed en cuentas reales
-- Aplicar en Supabase Dashboard > SQL Editor

-- 1. Flag is_demo en profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- 2. Marcar usuarios demo existentes
UPDATE profiles SET is_demo = TRUE
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@demo.pawfriend.cl'
);

-- 3. Marcar service_providers demo
UPDATE service_providers SET is_active = FALSE
WHERE license_number LIKE 'DEMO%';

-- 4. Función guard que valida que seeds solo toquen usuarios demo
CREATE OR REPLACE FUNCTION guard_demo_only()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el owner_id/user_id NO es demo, y la operación viene de un seed context, rechazar
  -- Solo aplica a inserts con metadata que indique seed
  IF NEW.owner_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = NEW.owner_id AND is_demo = TRUE
  ) THEN
    -- Solo bloquear si el registro tiene indicadores de seed
    IF TG_TABLE_NAME = 'pets' AND NEW.name IN ('Pelusa', 'Bruno', 'Luli', 'Capitán', 'Coco', 'Chocolate', 'Bella', 'Cachorro Curioso') THEN
      RAISE EXCEPTION 'SEED GUARD: intento de insertar dato demo en cuenta real (user_id: %)', NEW.owner_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger en pets para detectar seeds en cuentas reales
DROP TRIGGER IF EXISTS trg_guard_demo_pets ON pets;
CREATE TRIGGER trg_guard_demo_pets
  BEFORE INSERT ON pets
  FOR EACH ROW
  EXECUTE FUNCTION guard_demo_only();

-- 6. Índice para queries rápidas de is_demo
CREATE INDEX IF NOT EXISTS idx_profiles_is_demo ON profiles(is_demo) WHERE is_demo = TRUE;
