-- ============================================================
-- Paw Friend — Plan Individual + Directorio Público de Vets
-- 2026-04-06
-- ============================================================

-- 1. Constraint de provider_plan con los nuevos valores
ALTER TABLE service_providers DROP CONSTRAINT IF EXISTS service_providers_provider_plan_check;

-- Migrar datos legacy ANTES de aplicar el nuevo constraint
UPDATE service_providers SET provider_plan = 'provider_individual'   WHERE provider_plan IN ('provider_pro', 'pro');
UPDATE service_providers SET provider_plan = 'provider_clinic_basic' WHERE provider_plan IN ('provider_premium', 'premium');
UPDATE service_providers SET provider_plan = 'provider_free'         WHERE provider_plan IS NULL OR provider_plan = 'free';

ALTER TABLE service_providers
  ADD CONSTRAINT service_providers_provider_plan_check
  CHECK (provider_plan IN ('provider_free', 'provider_individual', 'provider_clinic_basic', 'provider_clinic_pro'));

ALTER TABLE service_providers ALTER COLUMN provider_plan SET DEFAULT 'provider_free';

-- 2. Nuevos campos del directorio público
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS slug                 text UNIQUE;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS specialties          text[] DEFAULT '{}';
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS service_areas        text[] DEFAULT '{}';
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS license_number       text;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS price_from           integer;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS provider_type        text DEFAULT 'individual'
  CHECK (provider_type IN ('individual', 'home_visit', 'clinic'));
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS is_directory_visible boolean DEFAULT false;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS directory_views      integer DEFAULT 0;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS public_email         text;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS public_phone         text;

-- 3. Generador de slug único a partir del nombre del negocio
CREATE OR REPLACE FUNCTION generate_provider_slug(provider_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- normaliza acentos básicos
  base_slug := lower(provider_name);
  base_slug := translate(base_slug, 'áéíóúñü', 'aeiounu');
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  IF base_slug = '' THEN base_slug := 'vet'; END IF;

  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM service_providers WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;

-- Backfill de slugs para providers existentes
UPDATE service_providers
SET slug = generate_provider_slug(COALESCE(display_name, 'vet'))
WHERE slug IS NULL;

-- 4. Función para incrementar vistas (RPC pública)
CREATE OR REPLACE FUNCTION increment_provider_views(provider_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE service_providers
  SET directory_views = COALESCE(directory_views, 0) + 1
  WHERE slug = provider_slug AND is_directory_visible = true;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_provider_views(text) TO anon, authenticated;

-- 5. Índices para el directorio
CREATE INDEX IF NOT EXISTS idx_providers_directory
  ON service_providers (is_directory_visible, avg_rating DESC NULLS LAST, total_reviews DESC NULLS LAST)
  WHERE is_directory_visible = true;

CREATE INDEX IF NOT EXISTS idx_providers_slug         ON service_providers (slug);
CREATE INDEX IF NOT EXISTS idx_providers_specialties  ON service_providers USING GIN (specialties);
CREATE INDEX IF NOT EXISTS idx_providers_service_area ON service_providers USING GIN (service_areas);
CREATE INDEX IF NOT EXISTS idx_providers_commune      ON service_providers (commune) WHERE is_directory_visible = true;

-- 6. RLS: lectura pública de providers visibles en el directorio (sin login)
DROP POLICY IF EXISTS "Public can read directory providers" ON service_providers;
CREATE POLICY "Public can read directory providers"
  ON service_providers FOR SELECT
  TO anon, authenticated
  USING (is_directory_visible = true);

-- Lectura pública de reseñas visibles
DROP POLICY IF EXISTS "Public can read visible reviews" ON service_reviews;
CREATE POLICY "Public can read visible reviews"
  ON service_reviews FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

-- 7. Tabla de invitaciones a reseña (para clientes off-platform del vet)
CREATE TABLE IF NOT EXISTS review_invitations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id      uuid REFERENCES service_providers(id) ON DELETE CASCADE NOT NULL,
  invitation_token text UNIQUE NOT NULL,
  client_email     text,
  client_name      text,
  is_used          boolean DEFAULT false,
  expires_at       timestamptz DEFAULT (now() + interval '30 days'),
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE review_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider can manage own invitations"
  ON review_invitations FOR ALL
  TO authenticated
  USING (provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid()))
  WITH CHECK (provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can read invitation by token"
  ON review_invitations FOR SELECT
  TO anon, authenticated
  USING (true);

-- service_reviews: campos de verificación / origen de la reseña
ALTER TABLE service_reviews ADD COLUMN IF NOT EXISTS verification_type text
  DEFAULT 'booking' CHECK (verification_type IN ('booking', 'invitation'));
ALTER TABLE service_reviews ADD COLUMN IF NOT EXISTS invitation_id uuid REFERENCES review_invitations(id);

-- booking_id ahora puede ser null cuando la reseña vino por invitación
ALTER TABLE service_reviews ALTER COLUMN booking_id DROP NOT NULL;

-- 8. Tabla de verificaciones profesionales (Colmevet)
CREATE TABLE IF NOT EXISTS provider_verifications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id           uuid REFERENCES service_providers(id) ON DELETE CASCADE NOT NULL,
  license_number        text NOT NULL,
  credential_image_url  text,
  status                text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  reviewed_by           uuid REFERENCES profiles(id),
  reviewed_at           timestamptz,
  rejection_reason      text,
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE provider_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider can read own verifications"
  ON provider_verifications FOR SELECT
  TO authenticated
  USING (provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid()));

CREATE POLICY "Provider can submit verifications"
  ON provider_verifications FOR INSERT
  TO authenticated
  WITH CHECK (provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid()));
