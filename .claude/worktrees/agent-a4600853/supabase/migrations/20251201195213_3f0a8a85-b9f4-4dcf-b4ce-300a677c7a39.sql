-- Corregir la vista para usar SECURITY INVOKER en lugar de SECURITY DEFINER
DROP VIEW IF EXISTS public.providers_with_services;

-- Recrear la vista con SECURITY INVOKER (respeta RLS del usuario que consulta)
CREATE VIEW public.providers_with_services 
WITH (security_invoker = true)
AS
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

-- Agregar política SELECT que faltaba para provider_service_offerings (para servicios propios inactivos)
CREATE POLICY "Providers can view their own inactive services"
ON public.provider_service_offerings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.service_providers sp 
    WHERE sp.id = provider_id 
    AND sp.user_id = auth.uid()
  )
);