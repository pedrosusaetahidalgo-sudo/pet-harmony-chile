-- Crear tabla de publicaciones de adopción
CREATE TABLE public.adoption_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  age_years INTEGER,
  age_months INTEGER,
  gender TEXT,
  size TEXT,
  description TEXT NOT NULL,
  reason_for_adoption TEXT,
  health_status TEXT,
  temperament TEXT[] DEFAULT '{}',
  good_with_kids BOOLEAN DEFAULT false,
  good_with_dogs BOOLEAN DEFAULT false,
  good_with_cats BOOLEAN DEFAULT false,
  photos TEXT[] DEFAULT '{}',
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disponible',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  views_count INTEGER DEFAULT 0,
  interests_count INTEGER DEFAULT 0
);

-- Crear tabla de intereses en adopciones
CREATE TABLE public.adoption_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adoption_post_id UUID NOT NULL REFERENCES public.adoption_posts(id) ON DELETE CASCADE,
  interested_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(adoption_post_id, interested_user_id)
);

-- Crear tabla de mensajes de adopción
CREATE TABLE public.adoption_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adoption_interest_id UUID NOT NULL REFERENCES public.adoption_interests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.adoption_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para adoption_posts
CREATE POLICY "Publicaciones de adopción son visibles por todos"
ON public.adoption_posts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios pueden crear publicaciones de adopción"
ON public.adoption_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus publicaciones"
ON public.adoption_posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus publicaciones"
ON public.adoption_posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Políticas para adoption_interests
CREATE POLICY "Usuarios ven intereses de sus publicaciones"
ON public.adoption_interests FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM public.adoption_posts WHERE id = adoption_post_id
  ) OR auth.uid() = interested_user_id
);

CREATE POLICY "Usuarios pueden expresar interés"
ON public.adoption_interests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = interested_user_id);

CREATE POLICY "Usuarios pueden actualizar su interés"
ON public.adoption_interests FOR UPDATE
TO authenticated
USING (auth.uid() = interested_user_id OR auth.uid() IN (
  SELECT user_id FROM public.adoption_posts WHERE id = adoption_post_id
));

-- Políticas para adoption_messages
CREATE POLICY "Usuarios ven mensajes de sus conversaciones"
ON public.adoption_messages FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR
  auth.uid() IN (
    SELECT interested_user_id FROM public.adoption_interests WHERE id = adoption_interest_id
  ) OR
  auth.uid() IN (
    SELECT ap.user_id 
    FROM public.adoption_interests ai
    JOIN public.adoption_posts ap ON ai.adoption_post_id = ap.id
    WHERE ai.id = adoption_interest_id
  )
);

CREATE POLICY "Usuarios pueden enviar mensajes"
ON public.adoption_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_adoption_posts_updated_at
BEFORE UPDATE ON public.adoption_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_adoption_interests_updated_at
BEFORE UPDATE ON public.adoption_interests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();