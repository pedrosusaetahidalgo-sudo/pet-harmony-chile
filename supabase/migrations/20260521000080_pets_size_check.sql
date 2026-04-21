-- ==========================================================================
-- Add CHECK constraint a pets.size para coincidir con dropdown frontend.
-- 2026-05-21 (audit post smoke manual)
--
-- Problema: pets.size es TEXT libre sin CHECK. El frontend solo ofrece
-- 'miniatura' | 'pequeño' | 'mediano' | 'grande' | 'gigante' pero si
-- algun script/migracion inserta otro valor, queda basura en la tabla.
--
-- Esta migracion:
-- 1. Back-fill valores no-canonicos a NULL (preserva data si hay algo raro).
-- 2. Agrega CHECK para futuros inserts.
--
-- Idempotente. NO aplicar automaticamente.
-- ==========================================================================

-- Paso 1: back-fill valores fuera del set canonico → NULL
UPDATE public.pets
SET size = NULL
WHERE size IS NOT NULL
  AND size NOT IN ('miniatura', 'pequeño', 'mediano', 'grande', 'gigante');

-- Paso 2: CHECK constraint (NULL permitido, valores canonicos solamente)
ALTER TABLE public.pets
  DROP CONSTRAINT IF EXISTS pets_size_check;

ALTER TABLE public.pets
  ADD CONSTRAINT pets_size_check
  CHECK (size IS NULL OR size IN (
    'miniatura', 'pequeño', 'mediano', 'grande', 'gigante'
  ));

COMMENT ON CONSTRAINT pets_size_check ON public.pets IS
  'Sincronizado con Select frontend en AddPet.tsx y CreateAdoptionPost.tsx. NULL permitido para backward compat.';
