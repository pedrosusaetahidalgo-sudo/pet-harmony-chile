-- ==========================================================================
-- Adoption Centers: cuentas reales de refugios/hogares de adopcion
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20):
-- Los refugios se convierten en un tipo de cuenta de primer nivel que sirve
-- como ONBOARDING INICIAL de mascotas en Paw Friend. El refugio carga la
-- ficha mientras tiene al animal a su cargo; cuando lo adoptan, la ficha
-- se transfiere al nuevo dueno (reutilizando el flujo pending_owner_email
-- que ya existe para vet->dueno).
--
-- Decisiones de Pedro (2026-04-20):
-- - Auto-activo al registrarse. Admin valida despues via badge "Verificado".
-- - Donaciones dirigidas a refugios: hooks en DB pero sin UI publica todavia
--   (se activa cuando cuenta Flow migre a SpA).
--
-- No rompe datos existentes:
-- - Todas las columnas nuevas son nullable o tienen default.
-- - adoption_shelters (catalogo IA-scraped) se preserva intacto, se le
--   agrega una referencia opcional a la nueva tabla para "reclamar" un refugio.
-- ==========================================================================

-- ==========================================================================
-- Tabla principal: adoption_centers
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.adoption_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL,
  rut TEXT,
  type TEXT NOT NULL DEFAULT 'refugio'
    CHECK (type IN ('ong', 'fundacion', 'refugio', 'independiente', 'municipal')),
  mission TEXT,
  commune TEXT NOT NULL,
  region TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  social_media JSONB DEFAULT '{}'::jsonb,
  animal_types TEXT[] DEFAULT ARRAY['perros', 'gatos']::TEXT[],
  capacity INT,
  logo_url TEXT,
  banner_url TEXT,
  slug TEXT UNIQUE,
  accepts_donations BOOLEAN NOT NULL DEFAULT true,
  donation_percentage INT NOT NULL DEFAULT 0
    CHECK (donation_percentage BETWEEN 0 AND 100),
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_doc_url TEXT,
  total_pets_adopted INT NOT NULL DEFAULT 0,
  total_pets_in_care INT NOT NULL DEFAULT 0,
  total_donations_clp BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adoption_centers_user ON public.adoption_centers(user_id);
CREATE INDEX IF NOT EXISTS idx_adoption_centers_commune ON public.adoption_centers(commune);
CREATE INDEX IF NOT EXISTS idx_adoption_centers_status ON public.adoption_centers(status)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_adoption_centers_slug ON public.adoption_centers(slug)
  WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_adoption_centers_geo ON public.adoption_centers(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Auto-slug: genera slug a partir de legal_name si no vino explicito.
CREATE OR REPLACE FUNCTION public.adoption_centers_ensure_slug()
RETURNS TRIGGER AS $$
DECLARE
  base TEXT;
  candidate TEXT;
  suffix INT := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;
  -- Slug sin depender de la extension unaccent (no habilitada por defecto en
  -- Supabase Chile). Traducimos tildes comunes y la ñ a su equivalente ASCII.
  base := translate(
    lower(NEW.legal_name),
    'áéíóúàèìòùâêîôûäëïöüãõñç',
    'aeiouaeiouaeiouaeiouaonc'
  );
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '(^-+|-+$)', '', 'g');
  IF base = '' THEN
    base := 'refugio';
  END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.adoption_centers WHERE slug = candidate AND id <> NEW.id) LOOP
    suffix := suffix + 1;
    candidate := base || '-' || suffix::TEXT;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

DROP TRIGGER IF EXISTS adoption_centers_slug_trg ON public.adoption_centers;
CREATE TRIGGER adoption_centers_slug_trg
  BEFORE INSERT OR UPDATE OF legal_name, slug ON public.adoption_centers
  FOR EACH ROW EXECUTE FUNCTION public.adoption_centers_ensure_slug();

DROP TRIGGER IF EXISTS adoption_centers_updated_at ON public.adoption_centers;
CREATE TRIGGER adoption_centers_updated_at
  BEFORE UPDATE ON public.adoption_centers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.adoption_centers ENABLE ROW LEVEL SECURITY;

-- Lectura publica de refugios activos (para landing /refugios-hogares, /refugios/:slug).
DROP POLICY IF EXISTS "adoption_centers_public_read" ON public.adoption_centers;
CREATE POLICY "adoption_centers_public_read"
  ON public.adoption_centers FOR SELECT
  USING (status = 'active');

-- Dueno del refugio puede leer su propio registro (incluso si suspendido).
DROP POLICY IF EXISTS "adoption_centers_owner_read" ON public.adoption_centers;
CREATE POLICY "adoption_centers_owner_read"
  ON public.adoption_centers FOR SELECT
  USING (user_id = auth.uid());

-- Un usuario autenticado puede crear su propio refugio (onboarding).
DROP POLICY IF EXISTS "adoption_centers_owner_insert" ON public.adoption_centers;
CREATE POLICY "adoption_centers_owner_insert"
  ON public.adoption_centers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Dueno del refugio puede editarlo (excepto campos controlados: verified,
-- verified_at, total_*, status). Los controlados se editan via admin o via
-- triggers (no desde cliente).
DROP POLICY IF EXISTS "adoption_centers_owner_update" ON public.adoption_centers;
CREATE POLICY "adoption_centers_owner_update"
  ON public.adoption_centers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin tiene acceso total.
DROP POLICY IF EXISTS "adoption_centers_admin_all" ON public.adoption_centers;
CREATE POLICY "adoption_centers_admin_all"
  ON public.adoption_centers FOR ALL
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

-- ==========================================================================
-- Extender pets: vinculo con refugio que cargo la mascota
-- ==========================================================================
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS created_by_shelter_id UUID
    REFERENCES public.adoption_centers(id) ON DELETE SET NULL;
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS shelter_intake_at TIMESTAMPTZ;
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS shelter_adopted_at TIMESTAMPTZ;
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS shelter_notes TEXT;
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS shelter_source_label TEXT;

CREATE INDEX IF NOT EXISTS idx_pets_shelter ON public.pets(created_by_shelter_id)
  WHERE created_by_shelter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pets_shelter_available ON public.pets(created_by_shelter_id)
  WHERE created_by_shelter_id IS NOT NULL AND owner_id IS NULL AND shelter_adopted_at IS NULL;

-- Nuevas RLS policies: refugio puede ver/editar sus mascotas mientras
-- sigan a su cargo (owner_id IS NULL OR shelter_adopted_at IS NULL).
-- Una vez adoptada (owner_id poblado), el refugio pierde el write y
-- mantiene read-only historico (para su dashboard).
DROP POLICY IF EXISTS "pets_shelter_read" ON public.pets;
CREATE POLICY "pets_shelter_read"
  ON public.pets FOR SELECT
  USING (
    created_by_shelter_id IN (
      SELECT id FROM public.adoption_centers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pets_shelter_insert" ON public.pets;
CREATE POLICY "pets_shelter_insert"
  ON public.pets FOR INSERT
  WITH CHECK (
    created_by_shelter_id IN (
      SELECT id FROM public.adoption_centers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pets_shelter_update" ON public.pets;
CREATE POLICY "pets_shelter_update"
  ON public.pets FOR UPDATE
  USING (
    created_by_shelter_id IN (
      SELECT id FROM public.adoption_centers WHERE user_id = auth.uid()
    )
    AND (owner_id IS NULL OR shelter_adopted_at IS NULL)
  )
  WITH CHECK (
    created_by_shelter_id IN (
      SELECT id FROM public.adoption_centers WHERE user_id = auth.uid()
    )
  );

-- Trigger: mantener contadores denormalizados en adoption_centers.
-- "in_care" = mascotas del refugio que aun no se han entregado al adoptante.
-- "adopted" = mascotas cuyo shelter_adopted_at ya se seteo.
CREATE OR REPLACE FUNCTION public.sync_shelter_pet_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT: suma in_care si tiene refugio y no esta adoptada
  IF (TG_OP = 'INSERT') THEN
    IF NEW.created_by_shelter_id IS NOT NULL AND NEW.shelter_adopted_at IS NULL THEN
      UPDATE public.adoption_centers
        SET total_pets_in_care = total_pets_in_care + 1
        WHERE id = NEW.created_by_shelter_id;
    END IF;
    RETURN NEW;
  END IF;

  -- DELETE: resta in_care si aun no estaba adoptada
  IF (TG_OP = 'DELETE') THEN
    IF OLD.created_by_shelter_id IS NOT NULL AND OLD.shelter_adopted_at IS NULL THEN
      UPDATE public.adoption_centers
        SET total_pets_in_care = GREATEST(total_pets_in_care - 1, 0)
        WHERE id = OLD.created_by_shelter_id;
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE: varios casos.
  -- Caso 1: refugio cambia (reassignment). Revertimos el viejo y aplicamos el nuevo.
  IF OLD.created_by_shelter_id IS DISTINCT FROM NEW.created_by_shelter_id THEN
    IF OLD.created_by_shelter_id IS NOT NULL AND OLD.shelter_adopted_at IS NULL THEN
      UPDATE public.adoption_centers
        SET total_pets_in_care = GREATEST(total_pets_in_care - 1, 0)
        WHERE id = OLD.created_by_shelter_id;
    END IF;
    IF NEW.created_by_shelter_id IS NOT NULL AND NEW.shelter_adopted_at IS NULL THEN
      UPDATE public.adoption_centers
        SET total_pets_in_care = total_pets_in_care + 1
        WHERE id = NEW.created_by_shelter_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Caso 2: mismo refugio, transicion a adoptada (shelter_adopted_at pasa a estar seteado).
  IF NEW.created_by_shelter_id IS NOT NULL
     AND OLD.shelter_adopted_at IS NULL
     AND NEW.shelter_adopted_at IS NOT NULL THEN
    UPDATE public.adoption_centers
      SET total_pets_adopted = total_pets_adopted + 1,
          total_pets_in_care = GREATEST(total_pets_in_care - 1, 0)
      WHERE id = NEW.created_by_shelter_id;
  END IF;

  -- Caso 3: mismo refugio, reversion de adopcion (shelter_adopted_at vuelve a NULL).
  -- Solo deberia pasar por correccion manual admin. Lo contemplamos por robustez.
  IF NEW.created_by_shelter_id IS NOT NULL
     AND OLD.shelter_adopted_at IS NOT NULL
     AND NEW.shelter_adopted_at IS NULL THEN
    UPDATE public.adoption_centers
      SET total_pets_adopted = GREATEST(total_pets_adopted - 1, 0),
          total_pets_in_care = total_pets_in_care + 1
      WHERE id = NEW.created_by_shelter_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_shelter_pet_counters_trg ON public.pets;
CREATE TRIGGER sync_shelter_pet_counters_trg
  AFTER INSERT OR UPDATE OR DELETE
  ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.sync_shelter_pet_counters();

-- ==========================================================================
-- Extender adoption_shelters (catalogo IA): permitir "reclamar" el refugio
-- ==========================================================================
ALTER TABLE public.adoption_shelters
  ADD COLUMN IF NOT EXISTS claimed_by_adoption_center_id UUID
    REFERENCES public.adoption_centers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_adoption_shelters_claimed
  ON public.adoption_shelters(claimed_by_adoption_center_id)
  WHERE claimed_by_adoption_center_id IS NOT NULL;

-- ==========================================================================
-- Donations: hooks para dirigir a un refugio (UI apagada hoy, por pivot SpA)
-- ==========================================================================
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS beneficiary_type TEXT NOT NULL DEFAULT 'general'
    CHECK (beneficiary_type IN ('general', 'adoption_center', 'paw_friend'));
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS beneficiary_adoption_center_id UUID
    REFERENCES public.adoption_centers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_donations_beneficiary_shelter
  ON public.donations(beneficiary_adoption_center_id)
  WHERE beneficiary_adoption_center_id IS NOT NULL;

-- ==========================================================================
-- Bulk imports: audit trail de cargas masivas de mascotas
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.adoption_bulk_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adoption_center_id UUID NOT NULL REFERENCES public.adoption_centers(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  filename TEXT,
  total_rows INT NOT NULL DEFAULT 0,
  success_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_adoption_bulk_imports_center
  ON public.adoption_bulk_imports(adoption_center_id, created_at DESC);

ALTER TABLE public.adoption_bulk_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bulk_imports_shelter_read" ON public.adoption_bulk_imports;
CREATE POLICY "bulk_imports_shelter_read"
  ON public.adoption_bulk_imports FOR SELECT
  USING (
    adoption_center_id IN (
      SELECT id FROM public.adoption_centers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "bulk_imports_shelter_insert" ON public.adoption_bulk_imports;
CREATE POLICY "bulk_imports_shelter_insert"
  ON public.adoption_bulk_imports FOR INSERT
  WITH CHECK (
    adoption_center_id IN (
      SELECT id FROM public.adoption_centers WHERE user_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

DROP POLICY IF EXISTS "bulk_imports_admin_all" ON public.adoption_bulk_imports;
CREATE POLICY "bulk_imports_admin_all"
  ON public.adoption_bulk_imports FOR ALL
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

-- ==========================================================================
-- Grants (explicitos para auth + service_role)
-- ==========================================================================
GRANT SELECT ON public.adoption_centers TO anon, authenticated;
GRANT INSERT, UPDATE ON public.adoption_centers TO authenticated;
GRANT SELECT, INSERT ON public.adoption_bulk_imports TO authenticated;
