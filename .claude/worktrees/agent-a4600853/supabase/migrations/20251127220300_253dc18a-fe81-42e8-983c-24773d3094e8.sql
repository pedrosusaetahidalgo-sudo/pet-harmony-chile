-- ============================================
-- SISTEMA DE ROLES Y VERIFICACIÓN
-- ============================================

-- Enum de roles de aplicación
CREATE TYPE public.app_role AS ENUM ('admin', 'veterinarian', 'dog_walker', 'user');

-- Tabla de roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función de seguridad para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Tabla de solicitudes de verificación
CREATE TABLE public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role public.app_role NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobado', 'rechazado')),
  documents JSONB, -- URLs de documentos de verificación
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- GAMIFICACIÓN COMPLETA
-- ============================================

-- Tabla de actividades (checklist)
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'paseo', 'juego', 'cuidado', 'social', 'salud'
  points INTEGER NOT NULL DEFAULT 10,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Tabla de actividades completadas por usuarios
CREATE TABLE public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  photo_url TEXT
);

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Tabla de desafíos diarios
CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL, -- 'caminar', 'jugar', 'socializar', 'cuidar'
  target_value INTEGER NOT NULL, -- ej: 5000 pasos, 3 juegos, etc
  points INTEGER NOT NULL DEFAULT 50,
  valid_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- Tabla de progreso de desafíos de usuarios
CREATE TABLE public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Tabla de recorridos virtuales
CREATE TABLE public.virtual_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  total_distance INTEGER NOT NULL, -- en metros
  checkpoints JSONB NOT NULL, -- [{name, distance, reward}]
  rewards JSONB, -- recompensas al completar
  points INTEGER NOT NULL DEFAULT 100,
  difficulty TEXT NOT NULL DEFAULT 'fácil' CHECK (difficulty IN ('fácil', 'medio', 'difícil')),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.virtual_routes ENABLE ROW LEVEL SECURITY;

-- Tabla de progreso de recorridos de usuarios
CREATE TABLE public.user_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.virtual_routes(id) ON DELETE CASCADE,
  current_checkpoint INTEGER NOT NULL DEFAULT 0,
  total_progress INTEGER NOT NULL DEFAULT 0, -- distancia acumulada
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, route_id)
);

ALTER TABLE public.user_routes ENABLE ROW LEVEL SECURITY;

-- Tabla de recompensas canjeables
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  reward_type TEXT NOT NULL, -- 'descuento', 'producto', 'servicio', 'badge'
  value TEXT, -- ej: "20% descuento", "Producto gratis"
  partner_name TEXT, -- nombre del comercio asociado
  partner_logo TEXT,
  terms TEXT, -- términos y condiciones
  expiry_days INTEGER, -- días de validez después de canjear
  stock INTEGER, -- cantidad disponible (null = ilimitado)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Tabla de recompensas de usuarios
CREATE TABLE public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  code TEXT, -- código único para canjear
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASEADORES DE PERROS
-- ============================================

-- Tabla de perfiles de paseadores
CREATE TABLE public.dog_walker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT,
  experience_years INTEGER,
  certifications JSONB, -- [{name, url}]
  coverage_zones JSONB NOT NULL, -- [{name, radius}]
  available_hours JSONB NOT NULL, -- {lunes: [{start, end}], ...}
  price_per_hour INTEGER NOT NULL, -- en CLP
  price_per_walk INTEGER NOT NULL, -- en CLP
  max_dogs INTEGER NOT NULL DEFAULT 3,
  services JSONB, -- ['paseo corto', 'paseo largo', 'socialización', 'entrenamiento']
  photos TEXT[],
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_walks INTEGER DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.dog_walker_profiles ENABLE ROW LEVEL SECURITY;

-- Tabla de reservas de paseos
CREATE TABLE public.walk_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  walker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_ids UUID[] NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  service_type TEXT NOT NULL, -- 'corto', 'largo', 'socialización'
  pickup_address TEXT NOT NULL,
  pickup_latitude NUMERIC,
  pickup_longitude NUMERIC,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmado', 'en_curso', 'completado', 'cancelado')),
  total_price INTEGER NOT NULL, -- en CLP
  payment_status TEXT NOT NULL DEFAULT 'pendiente' CHECK (payment_status IN ('pendiente', 'pagado', 'reembolsado')),
  stripe_payment_intent_id TEXT,
  special_instructions TEXT,
  canceled_by UUID REFERENCES auth.users(id),
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.walk_bookings ENABLE ROW LEVEL SECURITY;

-- Tabla de rutas de paseos (seguimiento GPS)
CREATE TABLE public.walk_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.walk_bookings(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  route_points JSONB NOT NULL, -- [{lat, lon, timestamp}]
  total_distance INTEGER, -- en metros
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.walk_routes ENABLE ROW LEVEL SECURITY;

-- Tabla de informes de paseos
CREATE TABLE public.walk_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.walk_bookings(id) ON DELETE CASCADE,
  activities JSONB, -- ['corrió', 'jugó con otros perros', 'hizo necesidades']
  behavior_notes TEXT,
  photos TEXT[],
  health_observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

ALTER TABLE public.walk_reports ENABLE ROW LEVEL SECURITY;

-- Tabla de reseñas de paseadores
CREATE TABLE public.walk_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.walk_bookings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  walker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

ALTER TABLE public.walk_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VETERINARIOS A DOMICILIO
-- ============================================

-- Tabla de perfiles de veterinarios
CREATE TABLE public.vet_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT,
  specialties JSONB, -- ['medicina general', 'cirugía', 'dermatología']
  license_number TEXT NOT NULL,
  certifications JSONB, -- [{name, url}]
  coverage_zones JSONB NOT NULL,
  available_hours JSONB NOT NULL,
  services JSONB NOT NULL, -- [{name, description, price}]
  consultation_fee INTEGER NOT NULL, -- precio base en CLP
  emergency_available BOOLEAN NOT NULL DEFAULT false,
  emergency_fee INTEGER,
  photos TEXT[],
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.vet_profiles ENABLE ROW LEVEL SECURITY;

-- Tabla de reservas veterinarias
CREATE TABLE public.vet_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vet_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ NOT NULL,
  service_type TEXT NOT NULL,
  visit_address TEXT NOT NULL,
  visit_latitude NUMERIC,
  visit_longitude NUMERIC,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmado', 'en_curso', 'completado', 'cancelado')),
  is_emergency BOOLEAN NOT NULL DEFAULT false,
  symptoms TEXT,
  total_price INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pendiente' CHECK (payment_status IN ('pendiente', 'pagado', 'reembolsado')),
  stripe_payment_intent_id TEXT,
  canceled_by UUID REFERENCES auth.users(id),
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_bookings ENABLE ROW LEVEL SECURITY;

-- Tabla de visitas veterinarias (seguimiento)
CREATE TABLE public.vet_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.vet_bookings(id) ON DELETE CASCADE,
  diagnosis TEXT,
  treatment TEXT,
  prescriptions JSONB, -- [{medication, dosage, duration}]
  next_visit_recommendation DATE,
  notes TEXT,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

ALTER TABLE public.vet_visits ENABLE ROW LEVEL SECURITY;

-- Tabla de documentos veterinarios
CREATE TABLE public.vet_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.vet_bookings(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'receta', 'estudio', 'certificado'
  document_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_documents ENABLE ROW LEVEL SECURITY;

-- Tabla de reseñas de veterinarios
CREATE TABLE public.vet_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.vet_bookings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vet_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

ALTER TABLE public.vet_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- GESTIÓN DE DOCUMENTOS DE MASCOTAS
-- ============================================

-- Tabla de documentos oficiales de mascotas
CREATE TABLE public.pet_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'vacuna', 'microchip', 'certificado', 'identificación'
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  issued_date DATE,
  expiry_date DATE,
  issuer TEXT, -- veterinario, institución
  notes TEXT,
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_days_before INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Bucket para documentos de verificación
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket para documentos de mascotas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pet-documents', 'pet-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket para fotos de paseadores y veterinarios
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-providers', 'service-providers', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket para fotos de paseos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('walk-photos', 'walk-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS POLICIES - USER ROLES
-- ============================================

CREATE POLICY "Usuarios pueden ver sus propios roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins pueden gestionar roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES - VERIFICACIÓN
-- ============================================

CREATE POLICY "Usuarios pueden ver sus solicitudes"
ON public.verification_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuarios pueden crear solicitudes"
ON public.verification_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins pueden actualizar solicitudes"
ON public.verification_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES - GAMIFICACIÓN
-- ============================================

CREATE POLICY "Actividades visibles por todos"
ON public.activities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios pueden ver sus actividades"
ON public.user_activities FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden registrar actividades"
ON public.user_activities FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Desafíos visibles por todos"
ON public.daily_challenges FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios pueden ver su progreso"
ON public.user_challenges FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su progreso"
ON public.user_challenges FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Recorridos visibles por todos"
ON public.virtual_routes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios pueden ver su progreso de recorridos"
ON public.user_routes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su progreso de recorridos"
ON public.user_routes FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Recompensas visibles por todos"
ON public.rewards FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Usuarios pueden ver sus recompensas"
ON public.user_rewards FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden canjear recompensas"
ON public.user_rewards FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - PASEADORES
-- ============================================

CREATE POLICY "Perfiles de paseadores visibles por todos"
ON public.dog_walker_profiles FOR SELECT
TO authenticated
USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "Paseadores pueden gestionar su perfil"
ON public.dog_walker_profiles FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden ver sus reservas de paseos"
ON public.walk_bookings FOR SELECT
TO authenticated
USING (auth.uid() = owner_id OR auth.uid() = walker_id);

CREATE POLICY "Dueños pueden crear reservas"
ON public.walk_bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Participantes pueden actualizar reservas"
ON public.walk_bookings FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id OR auth.uid() = walker_id);

CREATE POLICY "Paseadores pueden ver rutas de sus paseos"
ON public.walk_routes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.walk_bookings
    WHERE id = walk_routes.booking_id 
    AND (walker_id = auth.uid() OR owner_id = auth.uid())
  )
);

CREATE POLICY "Paseadores pueden crear rutas"
ON public.walk_routes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.walk_bookings
    WHERE id = booking_id AND walker_id = auth.uid()
  )
);

CREATE POLICY "Participantes pueden ver informes"
ON public.walk_reports FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.walk_bookings
    WHERE id = walk_reports.booking_id 
    AND (walker_id = auth.uid() OR owner_id = auth.uid())
  )
);

CREATE POLICY "Paseadores pueden crear informes"
ON public.walk_reports FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.walk_bookings
    WHERE id = booking_id AND walker_id = auth.uid()
  )
);

CREATE POLICY "Reseñas de paseos visibles por todos"
ON public.walk_reviews FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Dueños pueden crear reseñas"
ON public.walk_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- ============================================
-- RLS POLICIES - VETERINARIOS
-- ============================================

CREATE POLICY "Perfiles de veterinarios visibles por todos"
ON public.vet_profiles FOR SELECT
TO authenticated
USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "Veterinarios pueden gestionar su perfil"
ON public.vet_profiles FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden ver sus reservas veterinarias"
ON public.vet_bookings FOR SELECT
TO authenticated
USING (auth.uid() = owner_id OR auth.uid() = vet_id);

CREATE POLICY "Dueños pueden crear reservas veterinarias"
ON public.vet_bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Participantes pueden actualizar reservas veterinarias"
ON public.vet_bookings FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id OR auth.uid() = vet_id);

CREATE POLICY "Participantes pueden ver visitas"
ON public.vet_visits FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vet_bookings
    WHERE id = vet_visits.booking_id 
    AND (vet_id = auth.uid() OR owner_id = auth.uid())
  )
);

CREATE POLICY "Veterinarios pueden crear visitas"
ON public.vet_visits FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vet_bookings
    WHERE id = booking_id AND vet_id = auth.uid()
  )
);

CREATE POLICY "Dueños pueden ver documentos veterinarios"
ON public.vet_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE id = vet_documents.pet_id AND owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.vet_bookings
    WHERE id = vet_documents.booking_id AND vet_id = auth.uid()
  )
);

CREATE POLICY "Veterinarios pueden subir documentos"
ON public.vet_documents FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vet_bookings
    WHERE id = booking_id AND vet_id = auth.uid()
  )
);

CREATE POLICY "Reseñas de veterinarios visibles por todos"
ON public.vet_reviews FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Dueños pueden crear reseñas veterinarias"
ON public.vet_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- ============================================
-- RLS POLICIES - DOCUMENTOS DE MASCOTAS
-- ============================================

CREATE POLICY "Dueños pueden ver documentos de sus mascotas"
ON public.pet_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE id = pet_documents.pet_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Dueños pueden gestionar documentos de sus mascotas"
ON public.pet_documents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE id = pet_documents.pet_id AND owner_id = auth.uid()
  )
);

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Políticas para verification-docs
CREATE POLICY "Usuarios pueden subir documentos de verificación"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuarios pueden ver sus documentos de verificación"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verification-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

-- Políticas para pet-documents
CREATE POLICY "Dueños pueden subir documentos de mascotas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pet-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Dueños pueden ver documentos de sus mascotas"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'pet-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas para service-providers (público)
CREATE POLICY "Proveedores pueden subir sus fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-providers');

CREATE POLICY "Fotos de proveedores son públicas"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'service-providers');

-- Políticas para walk-photos (público)
CREATE POLICY "Paseadores pueden subir fotos de paseos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'walk-photos');

CREATE POLICY "Fotos de paseos son públicas"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'walk-photos');

-- ============================================
-- TRIGGERS Y FUNCIONES
-- ============================================

-- Actualizar rating de paseadores
CREATE OR REPLACE FUNCTION update_walker_rating()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dog_walker_profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.walk_reviews
      WHERE walker_id = NEW.walker_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.walk_reviews
      WHERE walker_id = NEW.walker_id
    )
  WHERE user_id = NEW.walker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_walker_rating_trigger
AFTER INSERT ON public.walk_reviews
FOR EACH ROW
EXECUTE FUNCTION update_walker_rating();

-- Actualizar rating de veterinarios
CREATE OR REPLACE FUNCTION update_vet_rating()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vet_profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.vet_reviews
      WHERE vet_id = NEW.vet_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.vet_reviews
      WHERE vet_id = NEW.vet_id
    )
  WHERE user_id = NEW.vet_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vet_rating_trigger
AFTER INSERT ON public.vet_reviews
FOR EACH ROW
EXECUTE FUNCTION update_vet_rating();

-- Actualizar contador de paseos completados
CREATE OR REPLACE FUNCTION update_walker_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completado' AND OLD.status != 'completado' THEN
    UPDATE public.dog_walker_profiles
    SET total_walks = total_walks + 1
    WHERE user_id = NEW.walker_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_walker_stats_trigger
AFTER UPDATE ON public.walk_bookings
FOR EACH ROW
EXECUTE FUNCTION update_walker_stats();

-- Actualizar contador de visitas veterinarias completadas
CREATE OR REPLACE FUNCTION update_vet_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completado' AND OLD.status != 'completado' THEN
    UPDATE public.vet_profiles
    SET total_visits = total_visits + 1
    WHERE user_id = NEW.vet_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vet_stats_trigger
AFTER UPDATE ON public.vet_bookings
FOR EACH ROW
EXECUTE FUNCTION update_vet_stats();

-- Actualizar puntos de usuario al completar actividades
CREATE OR REPLACE FUNCTION award_activity_points()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  points_earned INTEGER;
BEGIN
  SELECT points INTO points_earned
  FROM public.activities
  WHERE id = NEW.activity_id;
  
  UPDATE public.user_stats
  SET total_points = total_points + points_earned
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER award_activity_points_trigger
AFTER INSERT ON public.user_activities
FOR EACH ROW
EXECUTE FUNCTION award_activity_points();

-- Actualizar puntos de usuario al completar desafíos
CREATE OR REPLACE FUNCTION award_challenge_points()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  points_earned INTEGER;
BEGIN
  IF NEW.completed = true AND OLD.completed = false THEN
    SELECT points INTO points_earned
    FROM public.daily_challenges
    WHERE id = NEW.challenge_id;
    
    UPDATE public.user_stats
    SET total_points = total_points + points_earned
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER award_challenge_points_trigger
AFTER UPDATE ON public.user_challenges
FOR EACH ROW
EXECUTE FUNCTION award_challenge_points();

-- Crear rol de usuario por defecto
CREATE OR REPLACE FUNCTION create_default_user_role()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_default_user_role_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_user_role();

-- Trigger para updated_at
CREATE TRIGGER update_dog_walker_profiles_updated_at
BEFORE UPDATE ON public.dog_walker_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vet_profiles_updated_at
BEFORE UPDATE ON public.vet_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_walk_bookings_updated_at
BEFORE UPDATE ON public.walk_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vet_bookings_updated_at
BEFORE UPDATE ON public.vet_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pet_documents_updated_at
BEFORE UPDATE ON public.pet_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_verification_requests_updated_at
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();