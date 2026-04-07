-- ============================================================
-- Triggers de notificaciones + Perfiles de peluqueros
-- 2026-04-08
-- ============================================================
-- NOTA: La tabla `notifications` ya existe. Esta migración solo agrega
-- triggers nuevos sobre tablas existentes y crea `groomer_profiles`.

-- ============================================================
-- 1. Trigger: notificar al vet cuando recibe una reseña
-- ============================================================
CREATE OR REPLACE FUNCTION notify_provider_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_provider_name text;
BEGIN
  SELECT user_id, display_name INTO v_user_id, v_provider_name
  FROM service_providers
  WHERE id = NEW.provider_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
  VALUES (
    v_user_id,
    'review_received',
    'Recibiste una nueva reseña',
    format('Te dejaron una calificación de %s estrellas%s',
      NEW.rating::text,
      CASE WHEN NEW.title IS NOT NULL THEN ': "' || NEW.title || '"' ELSE '' END
    ),
    '/provider/dashboard',
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_new_review ON service_reviews;
CREATE TRIGGER notify_on_new_review
  AFTER INSERT ON service_reviews
  FOR EACH ROW
  WHEN (NEW.is_visible = true)
  EXECUTE FUNCTION notify_provider_on_review();

-- ============================================================
-- 2. Trigger: notificar al vet cuando aprueban verificación Colmevet
-- ============================================================
CREATE OR REPLACE FUNCTION notify_provider_on_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (OLD.is_verified IS DISTINCT FROM NEW.is_verified) AND NEW.is_verified = true THEN
    INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
    VALUES (
      NEW.user_id,
      'verification_approved',
      '¡Tu perfil fue verificado!',
      'Ahora apareces con el badge ✓ Verificado en tu perfil público.',
      CASE WHEN NEW.slug IS NOT NULL THEN '/veterinarios/' || NEW.slug ELSE '/provider/dashboard' END,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_provider_verified ON service_providers;
CREATE TRIGGER notify_on_provider_verified
  AFTER UPDATE ON service_providers
  FOR EACH ROW
  EXECUTE FUNCTION notify_provider_on_verification();

-- ============================================================
-- 3. GROOMER PROFILES (peluqueros)
-- ============================================================
CREATE TABLE IF NOT EXISTS groomer_profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  business_name       text,
  bio                 text,
  experience_years    integer,
  base_price_clp      integer,
  services_offered    text[] DEFAULT '{}',
  accepts_cats        boolean DEFAULT true,
  accepts_dogs        boolean DEFAULT true,
  accepts_long_hair   boolean DEFAULT true,
  mobile_service      boolean DEFAULT false,
  city                text,
  commune             text,
  address             text,
  latitude            numeric,
  longitude           numeric,
  service_areas       text[] DEFAULT '{}',
  avg_rating          numeric DEFAULT 0,
  total_reviews       integer DEFAULT 0,
  total_services      integer DEFAULT 0,
  status              text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groomers_status_rating
  ON groomer_profiles(status, avg_rating DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_groomers_commune
  ON groomer_profiles(commune) WHERE status = 'approved';

ALTER TABLE groomer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read approved groomers" ON groomer_profiles;
CREATE POLICY "Public can read approved groomers"
  ON groomer_profiles FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

DROP POLICY IF EXISTS "Owners can read own groomer profile" ON groomer_profiles;
CREATE POLICY "Owners can read own groomer profile"
  ON groomer_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can manage own groomer profile" ON groomer_profiles;
CREATE POLICY "Owners can manage own groomer profile"
  ON groomer_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
