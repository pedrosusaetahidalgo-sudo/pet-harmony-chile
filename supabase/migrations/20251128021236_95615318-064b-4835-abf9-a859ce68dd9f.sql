-- Crear tabla de perfiles de dogsitters
CREATE TABLE IF NOT EXISTS public.dogsitter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  bio TEXT,
  experience_years INTEGER,
  certifications JSONB,
  home_type TEXT,
  has_yard BOOLEAN DEFAULT false,
  max_dogs INTEGER NOT NULL DEFAULT 2,
  accepts_puppies BOOLEAN DEFAULT true,
  accepts_senior_dogs BOOLEAN DEFAULT true,
  price_per_night INTEGER NOT NULL,
  price_per_day INTEGER NOT NULL,
  available_hours JSONB NOT NULL,
  coverage_zones JSONB NOT NULL,
  services JSONB,
  amenities JSONB,
  photos TEXT[],
  rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla de reservas de dogsitter
CREATE TABLE IF NOT EXISTS public.dogsitter_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  dogsitter_id UUID NOT NULL,
  pet_ids UUID[] NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  service_type TEXT NOT NULL,
  drop_off_address TEXT NOT NULL,
  drop_off_latitude NUMERIC,
  drop_off_longitude NUMERIC,
  special_instructions TEXT,
  total_price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  payment_status TEXT NOT NULL DEFAULT 'pendiente',
  stripe_payment_intent_id TEXT,
  canceled_by UUID,
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla de reportes de dogsitter
CREATE TABLE IF NOT EXISTS public.dogsitter_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE,
  daily_notes JSONB,
  activities JSONB,
  feeding_times JSONB,
  behavior_notes TEXT,
  health_observations TEXT,
  photos TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla de reseñas de dogsitter
CREATE TABLE IF NOT EXISTS public.dogsitter_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE,
  owner_id UUID NOT NULL,
  dogsitter_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla de mensajes de dogsitter
CREATE TABLE IF NOT EXISTS public.dogsitter_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.dogsitter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogsitter_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogsitter_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogsitter_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogsitter_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para dogsitter_profiles
CREATE POLICY "Perfiles de dogsitters visibles por todos"
  ON public.dogsitter_profiles FOR SELECT
  USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "Dogsitters pueden gestionar su perfil"
  ON public.dogsitter_profiles FOR ALL
  USING (auth.uid() = user_id);

-- Políticas RLS para dogsitter_bookings
CREATE POLICY "Usuarios pueden ver sus reservas de dogsitter"
  ON public.dogsitter_bookings FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = dogsitter_id);

CREATE POLICY "Dueños pueden crear reservas de dogsitter"
  ON public.dogsitter_bookings FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Participantes pueden actualizar reservas de dogsitter"
  ON public.dogsitter_bookings FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = dogsitter_id);

-- Políticas RLS para dogsitter_reports
CREATE POLICY "Participantes pueden ver reportes de dogsitter"
  ON public.dogsitter_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dogsitter_bookings
      WHERE dogsitter_bookings.id = dogsitter_reports.booking_id
        AND (dogsitter_bookings.dogsitter_id = auth.uid() OR dogsitter_bookings.owner_id = auth.uid())
    )
  );

CREATE POLICY "Dogsitters pueden crear reportes"
  ON public.dogsitter_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dogsitter_bookings
      WHERE dogsitter_bookings.id = dogsitter_reports.booking_id
        AND dogsitter_bookings.dogsitter_id = auth.uid()
    )
  );

-- Políticas RLS para dogsitter_reviews
CREATE POLICY "Reseñas de dogsitters visibles por todos"
  ON public.dogsitter_reviews FOR SELECT
  USING (true);

CREATE POLICY "Dueños pueden crear reseñas de dogsitter"
  ON public.dogsitter_reviews FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Políticas RLS para dogsitter_messages
CREATE POLICY "Usuarios pueden ver mensajes de sus conversaciones"
  ON public.dogsitter_messages FOR SELECT
  USING (
    auth.uid() = sender_id OR
    EXISTS (
      SELECT 1 FROM public.dogsitter_bookings
      WHERE dogsitter_bookings.id = dogsitter_messages.booking_id
        AND (dogsitter_bookings.owner_id = auth.uid() OR dogsitter_bookings.dogsitter_id = auth.uid())
    )
  );

CREATE POLICY "Usuarios pueden enviar mensajes"
  ON public.dogsitter_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Función para actualizar el rating del dogsitter
CREATE OR REPLACE FUNCTION public.update_dogsitter_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dogsitter_profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.dogsitter_reviews
      WHERE dogsitter_id = NEW.dogsitter_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.dogsitter_reviews
      WHERE dogsitter_id = NEW.dogsitter_id
    )
  WHERE user_id = NEW.dogsitter_id;
  RETURN NEW;
END;
$$;

-- Trigger para actualizar rating cuando se crea una reseña
CREATE TRIGGER update_dogsitter_rating_trigger
  AFTER INSERT ON public.dogsitter_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dogsitter_rating();

-- Función para actualizar estadísticas del dogsitter
CREATE OR REPLACE FUNCTION public.update_dogsitter_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completado' AND OLD.status != 'completado' THEN
    UPDATE public.dogsitter_profiles
    SET total_bookings = total_bookings + 1
    WHERE user_id = NEW.dogsitter_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para actualizar estadísticas
CREATE TRIGGER update_dogsitter_stats_trigger
  AFTER UPDATE ON public.dogsitter_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dogsitter_stats();

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_dogsitter_profiles_user_id ON public.dogsitter_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_dogsitter_bookings_owner_id ON public.dogsitter_bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_dogsitter_bookings_dogsitter_id ON public.dogsitter_bookings(dogsitter_id);
CREATE INDEX IF NOT EXISTS idx_dogsitter_bookings_status ON public.dogsitter_bookings(status);
CREATE INDEX IF NOT EXISTS idx_dogsitter_reviews_dogsitter_id ON public.dogsitter_reviews(dogsitter_id);
CREATE INDEX IF NOT EXISTS idx_dogsitter_messages_booking_id ON public.dogsitter_messages(booking_id);

-- Actualizar el enum de roles para incluir dogsitter
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'veterinarian', 'dog_walker', 'dogsitter', 'user');
  ELSE
    -- Si el tipo ya existe, agregar el nuevo valor si no está
    BEGIN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dogsitter';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;