-- =====================================================
-- SISTEMA CENTRALIZADO DE PROVEEDORES DE SERVICIOS
-- =====================================================

-- Crear enum para tipos de servicio
DO $$ BEGIN
  CREATE TYPE public.service_type AS ENUM (
    'dog_walker',
    'dogsitter', 
    'veterinarian',
    'trainer',
    'grooming'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Crear enum para estado del proveedor
DO $$ BEGIN
  CREATE TYPE public.provider_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabla principal unificada de proveedores
CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  
  -- Datos de perfil público
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  
  -- Ubicación
  city TEXT,
  commune TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  coverage_radius_km INTEGER DEFAULT 10,
  coverage_zones JSONB DEFAULT '[]'::jsonb,
  
  -- Información profesional
  experience_years INTEGER DEFAULT 0,
  certifications JSONB DEFAULT '[]'::jsonb,
  photos TEXT[] DEFAULT '{}',
  
  -- Estado y verificación
  status TEXT DEFAULT 'approved', -- AUTO-APROBACIÓN: cambiado de 'pending' a 'approved' para fase inicial
  is_verified BOOLEAN DEFAULT false,
  verification_documents TEXT[] DEFAULT '{}',
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  rejection_reason TEXT,
  
  -- Métricas agregadas (se actualizan con triggers)
  rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_services_completed INTEGER DEFAULT 0,
  
  -- Disponibilidad general
  available_hours JSONB DEFAULT '{}'::jsonb,
  accepts_emergency BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabla de servicios ofrecidos por cada proveedor
CREATE TABLE IF NOT EXISTS public.provider_service_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  
  -- Tipo de servicio
  service_type TEXT NOT NULL, -- 'dog_walker', 'dogsitter', 'veterinarian', 'trainer', 'grooming'
  
  -- Precios
  price_base INTEGER NOT NULL, -- Precio en CLP
  price_unit TEXT DEFAULT 'hour', -- 'hour', 'session', 'day', 'night', 'visit', 'walk'
  price_per_additional_pet INTEGER, -- Precio adicional por mascota extra
  
  -- Detalles del servicio
  description TEXT,
  specialties JSONB DEFAULT '[]'::jsonb,
  services_included JSONB DEFAULT '[]'::jsonb,
  
  -- Capacidad
  max_pets INTEGER DEFAULT 3,
  accepts_puppies BOOLEAN DEFAULT true,
  accepts_senior_pets BOOLEAN DEFAULT true,
  accepted_pet_sizes TEXT[] DEFAULT ARRAY['pequeño', 'mediano', 'grande'],
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Un proveedor solo puede tener un registro por tipo de servicio
  UNIQUE(provider_id, service_type)
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON public.service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_status ON public.service_providers(status);
CREATE INDEX IF NOT EXISTS idx_service_providers_location ON public.service_providers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_service_providers_rating ON public.service_providers(rating DESC);
CREATE INDEX IF NOT EXISTS idx_provider_service_offerings_provider_id ON public.provider_service_offerings(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_service_offerings_service_type ON public.provider_service_offerings(service_type);
CREATE INDEX IF NOT EXISTS idx_provider_service_offerings_active ON public.provider_service_offerings(is_active) WHERE is_active = true;

-- Habilitar RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_service_offerings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS PARA service_providers
-- =====================================================

-- Proveedores aprobados son visibles por todos los usuarios autenticados
CREATE POLICY "Approved providers visible to all"
ON public.service_providers
FOR SELECT
USING (status = 'approved' OR user_id = auth.uid());

-- Los usuarios pueden crear su propio perfil de proveedor
CREATE POLICY "Users can create their own provider profile"
ON public.service_providers
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update their own provider profile"
ON public.service_providers
FOR UPDATE
USING (user_id = auth.uid());

-- Los usuarios pueden eliminar su propio perfil
CREATE POLICY "Users can delete their own provider profile"
ON public.service_providers
FOR DELETE
USING (user_id = auth.uid());

-- Admins pueden ver y gestionar todos los proveedores
CREATE POLICY "Admins can manage all providers"
ON public.service_providers
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- POLÍTICAS RLS PARA provider_service_offerings
-- =====================================================

-- Servicios activos de proveedores aprobados son visibles
CREATE POLICY "Active services from approved providers visible"
ON public.provider_service_offerings
FOR SELECT
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM public.service_providers sp 
    WHERE sp.id = provider_id 
    AND (sp.status = 'approved' OR sp.user_id = auth.uid())
  )
);

-- Proveedores pueden gestionar sus propios servicios
CREATE POLICY "Providers can manage their own services"
ON public.provider_service_offerings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.service_providers sp 
    WHERE sp.id = provider_id 
    AND sp.user_id = auth.uid()
  )
);

-- Admins pueden gestionar todos los servicios
CREATE POLICY "Admins can manage all services"
ON public.provider_service_offerings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- FUNCIÓN PARA ACTUALIZAR TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_service_provider_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers para actualizar timestamps
DROP TRIGGER IF EXISTS update_service_providers_timestamp ON public.service_providers;
CREATE TRIGGER update_service_providers_timestamp
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_service_provider_timestamp();

DROP TRIGGER IF EXISTS update_provider_service_offerings_timestamp ON public.provider_service_offerings;
CREATE TRIGGER update_provider_service_offerings_timestamp
  BEFORE UPDATE ON public.provider_service_offerings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_service_provider_timestamp();

-- =====================================================
-- FUNCIÓN PARA OBTENER O CREAR PROVEEDOR
-- Esta función se usa cuando un usuario quiere registrarse como proveedor
-- AUTO-APROBACIÓN: El status por defecto es 'approved'
-- PARA CAMBIAR A APROBACIÓN MANUAL: Cambiar el DEFAULT a 'pending'
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_or_create_service_provider(
  p_user_id UUID,
  p_display_name TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id UUID;
  v_profile RECORD;
BEGIN
  -- Buscar si ya existe
  SELECT id INTO v_provider_id
  FROM public.service_providers
  WHERE user_id = p_user_id;
  
  -- Si no existe, crear uno nuevo
  IF v_provider_id IS NULL THEN
    -- Obtener datos del perfil del usuario
    SELECT display_name, avatar_url, bio INTO v_profile
    FROM public.profiles
    WHERE id = p_user_id;
    
    INSERT INTO public.service_providers (
      user_id,
      display_name,
      avatar_url,
      bio,
      status -- AUTO-APROBACIÓN: usa el DEFAULT 'approved'
    ) VALUES (
      p_user_id,
      COALESCE(p_display_name, v_profile.display_name),
      v_profile.avatar_url,
      COALESCE(p_bio, v_profile.bio),
      'approved' -- CAMBIAR A 'pending' PARA APROBACIÓN MANUAL
    )
    RETURNING id INTO v_provider_id;
  END IF;
  
  RETURN v_provider_id;
END;
$$;

-- =====================================================
-- FUNCIÓN PARA AGREGAR SERVICIO A UN PROVEEDOR
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_provider_service(
  p_user_id UUID,
  p_service_type TEXT,
  p_price_base INTEGER,
  p_price_unit TEXT DEFAULT 'hour',
  p_description TEXT DEFAULT NULL,
  p_max_pets INTEGER DEFAULT 3,
  p_specialties JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id UUID;
  v_service_id UUID;
BEGIN
  -- Obtener o crear el proveedor
  v_provider_id := public.get_or_create_service_provider(p_user_id);
  
  -- Insertar o actualizar el servicio
  INSERT INTO public.provider_service_offerings (
    provider_id,
    service_type,
    price_base,
    price_unit,
    description,
    max_pets,
    specialties,
    is_active
  ) VALUES (
    v_provider_id,
    p_service_type,
    p_price_base,
    p_price_unit,
    p_description,
    p_max_pets,
    p_specialties,
    true
  )
  ON CONFLICT (provider_id, service_type) 
  DO UPDATE SET
    price_base = EXCLUDED.price_base,
    price_unit = EXCLUDED.price_unit,
    description = EXCLUDED.description,
    max_pets = EXCLUDED.max_pets,
    specialties = EXCLUDED.specialties,
    is_active = true,
    updated_at = now()
  RETURNING id INTO v_service_id;
  
  RETURN v_service_id;
END;
$$;

-- =====================================================
-- VISTA PARA CONSULTAR PROVEEDORES CON SUS SERVICIOS
-- Esta vista facilita las consultas desde el frontend
-- =====================================================

CREATE OR REPLACE VIEW public.providers_with_services AS
SELECT 
  sp.id,
  sp.user_id,
  sp.display_name,
  sp.avatar_url,
  sp.bio,
  sp.city,
  sp.commune,
  sp.latitude,
  sp.longitude,
  sp.coverage_radius_km,
  sp.experience_years,
  sp.certifications,
  sp.photos,
  sp.status,
  sp.is_verified,
  sp.rating,
  sp.total_reviews,
  sp.total_services_completed,
  sp.available_hours,
  sp.accepts_emergency,
  sp.created_at,
  sp.updated_at,
  -- Agregar array de servicios ofrecidos
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', pso.id,
          'service_type', pso.service_type,
          'price_base', pso.price_base,
          'price_unit', pso.price_unit,
          'description', pso.description,
          'max_pets', pso.max_pets,
          'specialties', pso.specialties,
          'is_active', pso.is_active
        )
      )
      FROM public.provider_service_offerings pso
      WHERE pso.provider_id = sp.id AND pso.is_active = true
    ),
    '[]'::jsonb
  ) AS services
FROM public.service_providers sp
WHERE sp.status = 'approved';

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.service_providers IS 'Tabla centralizada de todos los proveedores de servicios. AUTO-APROBACIÓN ACTIVA: Nuevos proveedores se aprueban automáticamente.';
COMMENT ON COLUMN public.service_providers.status IS 'Estado del proveedor: pending, approved, rejected, suspended. PARA APROBACIÓN MANUAL: Cambiar DEFAULT a pending';
COMMENT ON TABLE public.provider_service_offerings IS 'Servicios específicos ofrecidos por cada proveedor con precios y configuración';
COMMENT ON FUNCTION public.get_or_create_service_provider IS 'Obtiene o crea un proveedor. AUTO-APROBACIÓN: Cambia el status a pending para requerir aprobación manual';
COMMENT ON FUNCTION public.add_provider_service IS 'Agrega un servicio a un proveedor existente o lo crea si no existe';