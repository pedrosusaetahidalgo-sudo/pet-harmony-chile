-- Crear tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Profiles son visibles por todos"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden insertar su propio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Crear tabla de mascotas
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('perro', 'gato', 'otro')),
  breed TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('macho', 'hembra', 'desconocido')),
  weight DECIMAL(5,2),
  photo_url TEXT,
  bio TEXT,
  microchip_number TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para búsqueda por dueño
CREATE INDEX idx_pets_owner_id ON public.pets(owner_id);

-- Habilitar RLS en pets
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Políticas para pets
CREATE POLICY "Mascotas públicas son visibles por todos"
  ON public.pets FOR SELECT
  USING (is_public = true);

CREATE POLICY "Dueños pueden ver todas sus mascotas"
  ON public.pets FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Usuarios pueden insertar sus propias mascotas"
  ON public.pets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Dueños pueden actualizar sus mascotas"
  ON public.pets FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Dueños pueden eliminar sus mascotas"
  ON public.pets FOR DELETE
  USING (auth.uid() = owner_id);

-- Crear tabla de historial médico
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('vacuna', 'consulta', 'tratamiento', 'alergia', 'cirugía', 'otro')),
  title TEXT NOT NULL,
  description TEXT,
  veterinarian_name TEXT,
  clinic_name TEXT,
  date DATE NOT NULL,
  next_date DATE,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para búsqueda por mascota
CREATE INDEX idx_medical_records_pet_id ON public.medical_records(pet_id);

-- Habilitar RLS en medical_records
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Función helper para verificar propiedad de mascota
CREATE OR REPLACE FUNCTION public.is_pet_owner(pet_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pets
    WHERE id = pet_uuid AND owner_id = auth.uid()
  )
$$;

-- Políticas para medical_records
CREATE POLICY "Dueños pueden ver registros médicos de sus mascotas"
  ON public.medical_records FOR SELECT
  USING (public.is_pet_owner(pet_id));

CREATE POLICY "Dueños pueden insertar registros médicos"
  ON public.medical_records FOR INSERT
  WITH CHECK (public.is_pet_owner(pet_id));

CREATE POLICY "Dueños pueden actualizar registros médicos"
  ON public.medical_records FOR UPDATE
  USING (public.is_pet_owner(pet_id));

CREATE POLICY "Dueños pueden eliminar registros médicos"
  ON public.medical_records FOR DELETE
  USING (public.is_pet_owner(pet_id));

-- Crear tabla de citas/calendario
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('veterinario', 'peluquería', 'entrenamiento', 'vacuna', 'otro')),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  provider_name TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  reminder_sent BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'programada' CHECK (status IN ('programada', 'completada', 'cancelada')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para búsqueda por mascota y fecha
CREATE INDEX idx_appointments_pet_id ON public.appointments(pet_id);
CREATE INDEX idx_appointments_date ON public.appointments(scheduled_date);

-- Habilitar RLS en appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Políticas para appointments
CREATE POLICY "Dueños pueden ver citas de sus mascotas"
  ON public.appointments FOR SELECT
  USING (public.is_pet_owner(pet_id));

CREATE POLICY "Dueños pueden insertar citas"
  ON public.appointments FOR INSERT
  WITH CHECK (public.is_pet_owner(pet_id));

CREATE POLICY "Dueños pueden actualizar citas"
  ON public.appointments FOR UPDATE
  USING (public.is_pet_owner(pet_id));

CREATE POLICY "Dueños pueden eliminar citas"
  ON public.appointments FOR DELETE
  USING (public.is_pet_owner(pet_id));

-- Crear tabla de mascotas perdidas/encontradas
CREATE TABLE public.lost_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'perdida' CHECK (status IN ('perdida', 'encontrada', 'reunida')),
  report_type TEXT NOT NULL CHECK (report_type IN ('perdida', 'encontrada')),
  pet_name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  description TEXT NOT NULL,
  photo_url TEXT,
  last_seen_location TEXT NOT NULL,
  last_seen_date DATE NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  reward_offered BOOLEAN DEFAULT false,
  reward_amount DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsqueda
CREATE INDEX idx_lost_pets_status ON public.lost_pets(status);
CREATE INDEX idx_lost_pets_active ON public.lost_pets(is_active);
CREATE INDEX idx_lost_pets_location ON public.lost_pets(latitude, longitude);

-- Habilitar RLS en lost_pets
ALTER TABLE public.lost_pets ENABLE ROW LEVEL SECURITY;

-- Políticas para lost_pets
CREATE POLICY "Reportes activos son visibles por todos"
  ON public.lost_pets FOR SELECT
  USING (is_active = true);

CREATE POLICY "Usuarios pueden crear reportes"
  ON public.lost_pets FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporteros pueden actualizar sus reportes"
  ON public.lost_pets FOR UPDATE
  USING (auth.uid() = reporter_id);

CREATE POLICY "Reporteros pueden eliminar sus reportes"
  ON public.lost_pets FOR DELETE
  USING (auth.uid() = reporter_id);

-- Crear tabla de gamificación (puntos y logros)
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  points_earned INTEGER DEFAULT 0,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para búsqueda por usuario
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);

-- Habilitar RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Políticas para achievements
CREATE POLICY "Logros son visibles por todos"
  ON public.user_achievements FOR SELECT
  USING (true);

CREATE POLICY "Sistema puede insertar logros"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Crear tabla de estadísticas de usuario
CREATE TABLE public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  posts_count INTEGER DEFAULT 0,
  pets_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para user_stats
CREATE POLICY "Stats son visibles por todos"
  ON public.user_stats FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden actualizar sus propias stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pets_updated_at
  BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lost_pets_updated_at
  BEFORE UPDATE ON public.lost_pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();