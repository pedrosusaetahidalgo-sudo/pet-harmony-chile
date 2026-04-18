-- ==========================================================================
-- Renombra el valor de raza 'quiltro_mestizo' -> 'mestizo'
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-17):
-- El catalogo src/lib/breeds.ts usaba 'quiltro_mestizo' como value del enum
-- y 'Quiltro (mestizo)' como label. Se simplifico a { value: 'mestizo',
-- label: 'Mestizo' } para unificar terminologia.
--
-- Esta migracion actualiza los 6 registros existentes que usaban
-- 'quiltro_mestizo' para que matcheen el nuevo catalogo. No toca valores
-- free-text ("Mestizo" capitalizado, "Quiltri", etc) — eso lo previene
-- el Combobox a futuro.
--
-- Regla 9.8: renombrar no romper. Preserva los datos del usuario, solo
-- cambia el string. No hay perdida de informacion (mascota sigue siendo
-- del mismo tipo conceptual).
-- ==========================================================================

UPDATE public.pets
SET breed = 'mestizo',
    updated_at = now()
WHERE breed = 'quiltro_mestizo';

-- Mismo cambio en adoption_posts (tiene campo breed separado).
UPDATE public.adoption_posts
SET breed = 'mestizo'
WHERE breed = 'quiltro_mestizo';
