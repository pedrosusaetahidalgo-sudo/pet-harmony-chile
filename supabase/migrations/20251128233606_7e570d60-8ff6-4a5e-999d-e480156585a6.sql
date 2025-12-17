-- Asegurar que las publicaciones sean visibles para todos los usuarios autenticados
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;

CREATE POLICY "Posts are viewable by everyone" 
ON public.posts 
FOR SELECT 
USING (true);

-- Asegurar que las mascotas públicas sean visibles para todos
DROP POLICY IF EXISTS "Mascotas públicas son visibles por todos" ON public.pets;

CREATE POLICY "Public pets viewable by all" 
ON public.pets 
FOR SELECT 
USING (is_public = true OR auth.uid() = owner_id);