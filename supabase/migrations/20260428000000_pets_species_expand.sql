-- Ampliar el CHECK de pets.species para soportar las 8 especies del formulario.
--
-- Bug: la migración original (20251127152253) creó:
--   species TEXT NOT NULL CHECK (species IN ('perro', 'gato', 'otro'))
-- pero el formulario AddPet ofrece 8 opciones (perro, gato, conejo, hamster,
-- ave, tortuga, pez, otro). Resultado: usuarios que crean conejo/hámster/ave/
-- tortuga/pez reciben "Error al agregar mascota" porque el INSERT viola el
-- CHECK constraint (Postgres 23514).
--
-- Esta migración:
--   1) Normaliza datos existentes que pudieran haber quedado inconsistentes
--      (cualquier valor fuera de la lista nueva se mapea a 'otro').
--   2) Reemplaza el CHECK por uno que admita las 8 especies soportadas en UI.

-- 1. Normalizar valores inesperados a 'otro' para no romper el ALTER
UPDATE public.pets
SET species = 'otro'
WHERE species NOT IN ('perro', 'gato', 'conejo', 'hamster', 'ave', 'tortuga', 'pez', 'otro');

-- 2. Reemplazar el CHECK constraint
--    Postgres nombra el CHECK auto como "<table>_<column>_check".
ALTER TABLE public.pets
  DROP CONSTRAINT IF EXISTS pets_species_check;

ALTER TABLE public.pets
  ADD CONSTRAINT pets_species_check
  CHECK (species IN ('perro', 'gato', 'conejo', 'hamster', 'ave', 'tortuga', 'pez', 'otro'));
