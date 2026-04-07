-- Sistema de Calificaciones Mejorado para servicios profesionales
-- Mejora las tablas de reviews existentes con fotos, verificación y respuestas del proveedor

-- 1. Mejorar walk_reviews
ALTER TABLE public.walk_reviews
ADD COLUMN photos text[] DEFAULT '{}',
ADD COLUMN is_verified boolean DEFAULT false,
ADD COLUMN helpful_count integer DEFAULT 0,
ADD COLUMN provider_response text,
ADD COLUMN provider_response_date timestamp with time zone,
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- 2. Mejorar dogsitter_reviews
ALTER TABLE public.dogsitter_reviews
ADD COLUMN photos text[] DEFAULT '{}',
ADD COLUMN is_verified boolean DEFAULT false,
ADD COLUMN helpful_count integer DEFAULT 0,
ADD COLUMN provider_response text,
ADD COLUMN provider_response_date timestamp with time zone,
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- 3. Mejorar vet_reviews
ALTER TABLE public.vet_reviews
ADD COLUMN photos text[] DEFAULT '{}',
ADD COLUMN is_verified boolean DEFAULT false,
ADD COLUMN helpful_count integer DEFAULT 0,
ADD COLUMN provider_response text,
ADD COLUMN provider_response_date timestamp with time zone,
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- 4. Crear tabla para marcar reviews como útiles
CREATE TABLE public.review_helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_type text NOT NULL CHECK (review_type IN ('walk', 'dogsitter', 'vet')),
  review_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(review_type, review_id, user_id)
);

ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can vote reviews as helpful"
ON public.review_helpful_votes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see all helpful votes"
ON public.review_helpful_votes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can remove their helpful votes"
ON public.review_helpful_votes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Actualizar políticas RLS para permitir respuestas del proveedor
CREATE POLICY "Paseadores pueden responder sus reseñas"
ON public.walk_reviews
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT walker_id FROM public.walk_bookings 
    WHERE walk_bookings.id = walk_reviews.booking_id
  )
);

CREATE POLICY "Dogsitters pueden responder sus reseñas"
ON public.dogsitter_reviews
FOR UPDATE
TO authenticated
USING (
  auth.uid() = dogsitter_id
);

CREATE POLICY "Veterinarios pueden responder sus reseñas"
ON public.vet_reviews
FOR UPDATE
TO authenticated
USING (
  auth.uid() = vet_id
);

-- 6. Función para actualizar contador de helpful
CREATE OR REPLACE FUNCTION public.update_review_helpful_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.review_type = 'walk' THEN
    UPDATE public.walk_reviews
    SET helpful_count = (
      SELECT COUNT(*) FROM public.review_helpful_votes
      WHERE review_type = 'walk' AND review_id = NEW.review_id
    )
    WHERE id = NEW.review_id;
  ELSIF NEW.review_type = 'dogsitter' THEN
    UPDATE public.dogsitter_reviews
    SET helpful_count = (
      SELECT COUNT(*) FROM public.review_helpful_votes
      WHERE review_type = 'dogsitter' AND review_id = NEW.review_id
    )
    WHERE id = NEW.review_id;
  ELSIF NEW.review_type = 'vet' THEN
    UPDATE public.vet_reviews
    SET helpful_count = (
      SELECT COUNT(*) FROM public.review_helpful_votes
      WHERE review_type = 'vet' AND review_id = NEW.review_id
    )
    WHERE id = NEW.review_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Trigger para actualizar contador cuando se añade voto
CREATE TRIGGER update_helpful_count_on_insert
AFTER INSERT ON public.review_helpful_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_review_helpful_count();

-- Trigger para actualizar contador cuando se elimina voto
CREATE TRIGGER update_helpful_count_on_delete
AFTER DELETE ON public.review_helpful_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_review_helpful_count();

-- 7. Índices para mejorar rendimiento
CREATE INDEX idx_review_helpful_votes_review ON public.review_helpful_votes(review_type, review_id);
CREATE INDEX idx_walk_reviews_helpful ON public.walk_reviews(helpful_count DESC);
CREATE INDEX idx_dogsitter_reviews_helpful ON public.dogsitter_reviews(helpful_count DESC);
CREATE INDEX idx_vet_reviews_helpful ON public.vet_reviews(helpful_count DESC);

-- 8. Comentarios para documentación
COMMENT ON TABLE public.review_helpful_votes IS 'Sistema de votación para marcar reseñas como útiles';
COMMENT ON COLUMN public.walk_reviews.is_verified IS 'Indica si la reseña fue verificada como servicio completado';
COMMENT ON COLUMN public.walk_reviews.provider_response IS 'Respuesta del paseador a la reseña del cliente';