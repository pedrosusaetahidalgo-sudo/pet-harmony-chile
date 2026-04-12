-- Permitir que otros usuarios vean las colecciones de Paw Cards de otros
-- Esto habilita la experiencia social: ver qué cards ha coleccionado otro usuario
-- NO aplicar automaticamente. El dueno aplica manualmente desde Supabase Dashboard > SQL Editor.

-- Política SELECT pública para colecciones (solo lectura entre usuarios autenticados)
CREATE POLICY "Authenticated users can view any collection"
  ON paw_card_collections FOR SELECT
  USING (auth.role() = 'authenticated');

-- Eliminar la política anterior que solo permitía ver la colección propia
-- (la nueva política la subsume)
DROP POLICY IF EXISTS "Users can view own collection" ON paw_card_collections;
