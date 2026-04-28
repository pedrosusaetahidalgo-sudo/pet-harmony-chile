-- 2026-04-28 (Sprint 0 P0 SEC-002)
--
-- Cierre fuga de privacidad Ley 19.628.
-- Antes: pets.is_public DEFAULT true + policy USING(is_public=true) → cualquier
-- visitante anonimo podia listar TODAS las mascotas con microchip, fotos y
-- medical_notes.
--
-- Ahora:
--   - is_public por defecto false (default privado).
--   - Backfill: actualizar TODAS las filas a false. La tabla esta en producción
--     con datos reales; ningun caso de uso real (memorial, adopcion) depende
--     hoy de is_public=true para visibilidad publica — esos casos viven en
--     tablas dedicadas (adoption_posts, memorial_visibility en pets).
--   - listed_for_adoption boolean nuevo separado para casos de adopcion legitima
--     listada en /refugios-hogares + /refugios/:slug.
--   - Policy publica reescrita: solo pets explicitamente listados en adopcion
--     son visibles a anon.
--
-- Datos de usuarios existentes (CLAUDE §9.7):
--   - El backfill setea is_public=false para todos. Mascotas en memoriales o
--     fichas compartidas siguen visibles por sus rutas dedicadas (memoria_publica
--     usa memorial_visibility, medical_share usa medical_share_tokens).
--   - Pets en adopcion: hoy aparecen en /adoption por la tabla adoption_posts,
--     no por pets.is_public. Esto NO rompe el feed de adopcion.

ALTER TABLE public.pets
  ALTER COLUMN is_public SET DEFAULT false;

-- Cerrar la fuga existente: cualquier mascota que era visible pasa a privada.
UPDATE public.pets
  SET is_public = false
  WHERE is_public = true;

-- Columna nueva opt-in para adopcion (uso futuro si se decide listar pets
-- directamente sin pasar por adoption_posts). Default false, no rompe nada.
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS listed_for_adoption boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.pets.is_public IS
  'DEPRECATED 2026-04-28 (SEC-002). Kept como backstop pero ya no es vector publico. Default false. Si se necesita exponer pets via API publica usar listed_for_adoption.';
COMMENT ON COLUMN public.pets.listed_for_adoption IS
  'Si true, la mascota esta listada activamente en adopcion (use-case directorio publico). NO confundir con adoption_posts (feed social) que sigue siendo el canal canonico hoy.';

-- Drop policies legacy publicas que asumian is_public como vector.
DROP POLICY IF EXISTS "Mascotas publicas son visibles por todos" ON public.pets;
DROP POLICY IF EXISTS "Public can view public pets" ON public.pets;

-- Re-crear policy publica acotada al campo nuevo. Owner sigue viendo todo via
-- las policies existentes ("Owners can view their own pets", etc).
CREATE POLICY "Adoption-listed pets are publicly visible"
  ON public.pets
  FOR SELECT
  USING (listed_for_adoption = true);

-- Smoke test (no requiere insert): verificar que el default es false ahora.
DO $$
BEGIN
  IF (SELECT column_default FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'pets'
        AND column_name = 'is_public') NOT ILIKE '%false%'
  THEN
    RAISE EXCEPTION 'pets.is_public default no fue cambiado a false';
  END IF;

  IF EXISTS (SELECT 1 FROM public.pets WHERE is_public = true) THEN
    RAISE EXCEPTION 'Backfill incompleto: aun hay pets con is_public=true';
  END IF;
END $$;
