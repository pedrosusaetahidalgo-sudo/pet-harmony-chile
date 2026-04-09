-- ============================================================================
-- CLEANUP: Contaminación de seed demo en cuentas reales
-- Aplicar MANUALMENTE en Supabase Dashboard > SQL Editor
-- IMPORTANTE: Ejecutar primero las queries de diagnóstico en
--   audits/SEED_CONTAMINATION_REPORT_2026_04_09.md para confirmar el alcance
-- ============================================================================

BEGIN;

-- 1. Eliminar medical_records con strings basura en cuentas reales
DELETE FROM medical_records
WHERE pet_id IN (
  SELECT p.id FROM pets p
  JOIN auth.users u ON u.id = p.owner_id
  WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
)
AND (
  title IN ('JKKSNFKEUFJNNS L', 'SADSAD')
  OR notes IN ('SADSAD', 'test', 'asdf')
  OR (length(notes) > 10 AND notes ~* '^[a-z]{15,}$')
  OR title ~* '^[A-Z]{5,}$'
);

-- 2. Eliminar recordatorios seed en cuentas reales (rango 07-09 abril)
DELETE FROM pet_reminders
WHERE owner_id IN (
  SELECT id FROM auth.users WHERE email NOT LIKE '%@demo.pawfriend.cl'
)
AND title ~* '(baño.*peluquería|revisar vacunas de kai)'
AND created_at BETWEEN '2026-04-07' AND '2026-04-09';

-- 3. Eliminar pets seed en cuentas reales (por nombre + fecha de creación)
DELETE FROM pets
WHERE owner_id IN (
  SELECT id FROM auth.users WHERE email NOT LIKE '%@demo.pawfriend.cl'
)
AND name IN ('Pelusa', 'Bruno', 'Luli', 'Capitán', 'Coco', 'Chocolate', 'Bella', 'Cachorro Curioso')
AND created_at BETWEEN '2026-04-07' AND '2026-04-09';

-- 4. Eliminar feed posts seed de cuentas reales
DELETE FROM posts
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email NOT LIKE '%@demo.pawfriend.cl'
)
AND content ~* '(tuvo un paseo|tuvo una visita al vet|tuvo un baño|tuvo una vacuna)'
AND created_at BETWEEN '2026-04-07' AND '2026-04-09';

-- 5. Limpiar microchips en ceros
UPDATE pets
SET microchip_number = NULL
WHERE microchip_number ~ '^0+$';

-- 6. Limpiar microchips con largo inválido (no 15 dígitos)
UPDATE pets
SET microchip_number = NULL
WHERE microchip_number IS NOT NULL
  AND length(microchip_number) > 0
  AND length(microchip_number) < 15;

COMMIT;
