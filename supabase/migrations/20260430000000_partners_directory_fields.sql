-- Agrega campos de directorio a la tabla partners
-- Para que partners funcione como directorio de negocios (no solo ads)
-- con contacto y geodatos compatibles con Maps/Leaflet.

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS commune TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}'::jsonb;

-- Comentarios para documentar
COMMENT ON COLUMN public.partners.contact_phone IS 'Telefono publico del partner';
COMMENT ON COLUMN public.partners.contact_email IS 'Email publico del partner';
COMMENT ON COLUMN public.partners.website IS 'URL del sitio web del partner (separado de ad_link)';
COMMENT ON COLUMN public.partners.address IS 'Direccion fisica';
COMMENT ON COLUMN public.partners.commune IS 'Comuna (para filtro geografico)';
COMMENT ON COLUMN public.partners.city IS 'Ciudad';
COMMENT ON COLUMN public.partners.latitude IS 'Latitud para mapa Leaflet';
COMMENT ON COLUMN public.partners.longitude IS 'Longitud para mapa Leaflet';
COMMENT ON COLUMN public.partners.social_media IS 'JSONB con redes sociales: { instagram, facebook, tiktok }';
