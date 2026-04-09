-- Limpieza de contaminación de seed en cuentas reales
-- EJECUTAR DESPUÉS de 20260420200000_seed_contamination_guards.sql
-- Aplicar en Supabase Dashboard > SQL Editor
-- REVISAR los SELECTs de diagnóstico antes de ejecutar los DELETEs

-- ============================================
-- PASO 1: DIAGNÓSTICO (ejecutar primero, revisar output)
-- ============================================

-- 1a. Mascotas con nombres seed en cuentas reales
-- SELECT p.owner_id, p.name as pet_name, p.created_at
-- FROM pets p
-- JOIN profiles pr ON pr.id = p.owner_id
-- WHERE pr.is_demo = FALSE
--   AND p.name IN ('Pelusa', 'Bruno', 'Luli', 'Capitán', 'Coco', 'Chocolate', 'Bella', 'Cachorro Curioso');

-- 1b. Recordatorios seed en cuentas reales
-- SELECT r.owner_id, r.title, r.created_at
-- FROM pet_reminders r
-- JOIN profiles pr ON pr.id = r.owner_id
-- WHERE pr.is_demo = FALSE
--   AND r.title ~* '(baño.*peluquería|revisar vacunas de kai)';

-- 1c. Feed posts seed en cuentas reales
-- SELECT fp.user_id, fp.content, fp.created_at
-- FROM posts fp
-- JOIN profiles pr ON pr.id = fp.user_id
-- WHERE pr.is_demo = FALSE
--   AND fp.content ~* '(tuvo un paseo|tuvo una visita al vet|tuvo un baño|tuvo una vacuna)';

-- ============================================
-- PASO 2: LIMPIEZA (ejecutar solo después de revisar diagnóstico)
-- ============================================

-- 2a. Eliminar mascotas seed de cuentas reales
DELETE FROM pets
WHERE owner_id IN (
  SELECT id FROM profiles WHERE is_demo = FALSE
)
AND name IN ('Pelusa', 'Bruno', 'Luli', 'Capitán', 'Coco', 'Chocolate', 'Bella', 'Cachorro Curioso')
AND created_at BETWEEN '2026-04-07' AND '2026-04-09';

-- 2b. Eliminar reviews de vets demo
DELETE FROM service_reviews
WHERE provider_id IN (
  SELECT id FROM service_providers WHERE license_number LIKE 'DEMO%'
);

-- 2c. Eliminar feed posts seed de cuentas reales
DELETE FROM posts
WHERE user_id IN (
  SELECT id FROM profiles WHERE is_demo = FALSE
)
AND content ~* '(tuvo un paseo|tuvo una visita al vet|tuvo un baño|tuvo una vacuna)'
AND created_at BETWEEN '2026-04-07' AND '2026-04-09';

-- 2d. Limpiar microchips en 0s
UPDATE pets
SET microchip_number = NULL
WHERE microchip_number ~ '^0+$';
