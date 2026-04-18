-- ==========================================================================
-- Normalizacion de razas y comunas a catalogo oficial
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-18):
-- El audit export detecto datos viejos fuera de catalogo (pre Combobox
-- del commit 2e30b04e del 2026-04-17). El Combobox ya impide nuevos
-- casos, pero las filas existentes quedaron con capitalizacion rara,
-- espacios, typos o strings libres.
--
-- Principio: normalizar solo valores claramente mapeables al catalogo.
-- Preservar datos reales ambiguos (ej. 'Madrid' es una usuaria en Espana).
-- ==========================================================================

-- -----------------------------
-- 1. Razas fuera de catalogo → slug canonico
-- -----------------------------
-- 'Tabby' no es raza (es patron de pelaje). Mapear a mestizo.
UPDATE public.pets SET breed = 'mestizo'
  WHERE breed = 'Tabby';

-- 'Quiltri' es forma chilena informal de 'quiltro' = mestizo.
UPDATE public.pets SET breed = 'mestizo'
  WHERE breed IN ('Quiltri', 'Quiltro', 'quiltri', 'quiltro');

-- Capitalizacion: 'Mestizo' → 'mestizo'
UPDATE public.pets SET breed = 'mestizo'
  WHERE breed = 'Mestizo';

-- Capitalizacion: 'Chihuahua' → 'chihuahua'
UPDATE public.pets SET breed = 'chihuahua'
  WHERE breed = 'Chihuahua';

-- 'Border Collie' (con y sin trailing space) → 'border_collie'
UPDATE public.pets SET breed = 'border_collie'
  WHERE TRIM(breed) = 'Border Collie';

-- '´pastor suizo' (typo con acento mal) → 'pastor_suizo'
UPDATE public.pets SET breed = 'pastor_suizo'
  WHERE breed ILIKE '%pastor suizo%' AND breed NOT IN ('pastor_suizo', 'pastor_suizo_blanco');

-- -----------------------------
-- 2. Comunas fuera de catalogo RM
-- -----------------------------
-- 'chile' (generico, sin comuna) → NULL
UPDATE public.profiles SET location = NULL
  WHERE location = 'chile';

-- 'Las cndes' (typo) → 'Las Condes'
UPDATE public.profiles SET location = 'Las Condes'
  WHERE location = 'Las cndes';

-- 'Santiago, chile' → 'Santiago' (el campo location es una sola comuna)
UPDATE public.profiles SET location = 'Santiago'
  WHERE location = 'Santiago, chile';

-- 'Madrid' se preserva: es usuaria real viviendo en Espana.
-- El catalogo RM no aplica a ella; no tocar.

-- -----------------------------
-- 3. Log de cambios aplicados
-- -----------------------------
-- Resumen esperado:
--  pets.breed: ~8 filas actualizadas (Tabby, Quiltri, ´pastor suizo, 2x Border Collie, Chihuahua, Mestizo x2)
--  profiles.location: ~3 filas actualizadas (chile, Las cndes, Santiago, chile)
