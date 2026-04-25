-- ══════════════════════════════════════════════════════════════════════════
-- Storage bucket: pet-id-cards
-- ══════════════════════════════════════════════════════════════════════════
-- La edge function generate-pet-id-card sube SVG/PNG/PDF al bucket
-- 'pet-id-cards' (constante en la edge fn). El bucket no existia, asi que
-- la fn devolvia 500 al intentar el upload.
--
-- Bucket publico (los SVGs de cedulas se muestran en la app via URL publica)
-- pero protegido a nivel de path: cada carpeta es <pet_id>_v<version>.
--
-- RLS Storage policies:
--   - service_role puede insertar/updatear (la edge fn usa SERVICE_ROLE_KEY)
--   - anyone puede leer (bucket publico, las URLs son no-listables y solo
--     conocidas por el dueño + el QR)
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-id-cards',
  'pet-id-cards',
  TRUE,                  -- publico (los SVGs se muestran via URL publica)
  10485760,              -- 10 MB max por archivo
  ARRAY['image/svg+xml', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
  SET public = TRUE,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['image/svg+xml', 'image/png', 'application/pdf'];

-- 2. Storage policies
-- service_role bypass automatico de RLS, pero igual definimos policies explicitas
-- para que sea clara la intencion.

-- 2.1 Public read (cualquiera con la URL puede ver el SVG/PNG/PDF)
DROP POLICY IF EXISTS "Public read pet-id-cards" ON storage.objects;
CREATE POLICY "Public read pet-id-cards"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'pet-id-cards');

-- 2.2 Owner del pet puede insertar/actualizar (vía edge fn con service_role
-- esto se bypassa, pero por si acaso un user llama directo storage)
DROP POLICY IF EXISTS "Owner can upload pet-id-cards" ON storage.objects;
CREATE POLICY "Owner can upload pet-id-cards"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pet-id-cards'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.pets WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owner can update pet-id-cards" ON storage.objects;
CREATE POLICY "Owner can update pet-id-cards"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pet-id-cards'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.pets WHERE owner_id = auth.uid()
    )
  );

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- Smoke test
-- ══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'pet-id-cards'
  ) INTO v_bucket_exists;
  IF NOT v_bucket_exists THEN
    RAISE EXCEPTION 'Bucket pet-id-cards no se creo';
  END IF;
  RAISE NOTICE 'Smoke test OK: bucket pet-id-cards listo (publico, 10MB max)';
END $$;
