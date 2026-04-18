-- ==========================================================================
-- Limpieza de breed con prefijo "otro:" en datos pre-existentes.
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-17):
-- El ComboboxWithOther antiguo guardaba valores como "otro:Tabby" en DB.
-- El refactor de src/components/ui/combobox-with-other.tsx los guarda
-- limpios ("Tabby"). Esta migracion limpia los registros existentes.
--
-- Casos:
--   - "otro:" (vacio, usuario eligio "Otro" sin escribir) -> NULL
--   - "otro:Tabby" -> "Tabby"
-- ==========================================================================

-- Valores "otro:" vacios -> NULL (pet queda sin breed, como debe ser).
UPDATE public.pets
SET breed = NULL, updated_at = now()
WHERE breed = 'otro:' OR trim(breed) = 'otro:';

-- Valores "otro:texto" -> "texto" (sin prefijo).
UPDATE public.pets
SET breed = substring(breed FROM 6),
    updated_at = now()
WHERE breed LIKE 'otro:_%';

-- Mismo cleanup en adoption_posts.
UPDATE public.adoption_posts
SET breed = NULL
WHERE breed = 'otro:' OR trim(breed) = 'otro:';

UPDATE public.adoption_posts
SET breed = substring(breed FROM 6)
WHERE breed LIKE 'otro:_%';
