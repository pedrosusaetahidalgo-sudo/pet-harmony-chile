-- Deshabilitar auto-aprobación de proveedores veterinarios
-- Ahora TODOS los nuevos proveedores empiezan con status 'pending'.
-- Solo admin puede aprobar manualmente desde el panel.
--
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.

-- 1. Cambiar el DEFAULT de la columna status a 'pending'
ALTER TABLE public.service_providers
  ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Actualizar get_or_create_service_provider para usar 'pending' en vez de 'approved'
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
      status
    ) VALUES (
      p_user_id,
      COALESCE(p_display_name, v_profile.display_name),
      v_profile.avatar_url,
      COALESCE(p_bio, v_profile.bio),
      'pending'  -- APROBACIÓN MANUAL: requiere acción de admin
    )
    RETURNING id INTO v_provider_id;
  END IF;

  RETURN v_provider_id;
END;
$$;

-- 3. Actualizar comentarios para reflejar el cambio
COMMENT ON TABLE public.service_providers IS 'Tabla centralizada de todos los proveedores de servicios. APROBACIÓN MANUAL: Nuevos proveedores empiezan con status pending.';
COMMENT ON COLUMN public.service_providers.status IS 'Estado del proveedor: pending, approved, rejected, suspended. Nuevos proveedores siempre empiezan como pending.';
COMMENT ON FUNCTION public.get_or_create_service_provider IS 'Obtiene o crea un proveedor con status pending. Requiere aprobación admin para aparecer en directorio.';
