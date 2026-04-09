-- ============================================================================
-- GUARDS: Prevención de contaminación futura de seed en cuentas reales
-- Aplicar MANUALMENTE en Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. Función helper: verifica que un user sea demo antes de insertar seed
CREATE OR REPLACE FUNCTION public.assert_demo_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = target_user_id AND is_demo = TRUE
  ) THEN
    RAISE EXCEPTION 'SEED_GUARD: El usuario % no es demo. No se permite insertar datos de seed en cuentas reales.', target_user_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.assert_demo_user IS
  'Lanza excepción si se intenta insertar datos de seed en un usuario que no es demo. Usar al inicio de scripts de seed.';

-- 2. Trigger en pets: rechaza inserción de mascotas con nombres seed en users no-demo
CREATE OR REPLACE FUNCTION public.guard_seed_pet_names()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  seed_names TEXT[] := ARRAY['Pelusa','Bruno','Luli','Capitán','Coco','Chocolate','Bella','Cachorro Curioso'];
  user_is_demo BOOLEAN;
BEGIN
  -- Solo chequear si el nombre es un nombre conocido de seed
  IF NEW.name = ANY(seed_names) THEN
    SELECT is_demo INTO user_is_demo FROM profiles WHERE id = NEW.owner_id;
    IF user_is_demo IS NOT TRUE THEN
      RAISE EXCEPTION 'SEED_GUARD: Intentando insertar mascota con nombre seed "%" en cuenta real (owner_id=%)', NEW.name, NEW.owner_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_seed_pets ON pets;
CREATE TRIGGER trg_guard_seed_pets
  BEFORE INSERT ON pets
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_seed_pet_names();

-- 3. Asegurar que is_demo esté marcado para todos los users @demo.pawfriend.cl
UPDATE profiles
SET is_demo = TRUE
WHERE id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@demo.pawfriend.cl'
)
AND is_demo = FALSE;

UPDATE service_providers
SET is_demo = TRUE
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@demo.pawfriend.cl'
)
AND is_demo = FALSE;
