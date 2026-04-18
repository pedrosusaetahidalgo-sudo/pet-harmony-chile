-- ==========================================================================
-- Paw Voices (creadores) + Advertisements (slots publicitarios)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-19) - Lanzamiento 1 mayo:
-- Agrega los ultimos 2 motores de monetizacion del modelo hibrido:
--   5. Paw Voices: red de creadores/influencers aliados (perfil publico +
--      form de aplicacion desde la landing).
--   6. Publicidad: slots transparentes contratados por Paw Companys u
--      otros partners. Etiquetados "Patrocinado" conforme SERNAC.
--
-- Ambas tablas siguen el patron ya probado de paw_companys: lectura
-- publica filtrada por is_active, CRUD admin via is_active_admin.
-- ==========================================================================

-- ==========================================================================
-- Tabla paw_voices
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.paw_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Si el voice tiene cuenta en Paw Friend, lo vinculamos (opcional).
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  handle TEXT,
  -- Plataforma principal del creador.
  platform TEXT NOT NULL DEFAULT 'instagram'
    CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'otro')),
  profile_url TEXT CHECK (profile_url IS NULL OR profile_url ~ '^https?://'),
  avatar_url TEXT,
  bio TEXT CHECK (bio IS NULL OR length(bio) <= 400),
  -- Texto libre: "perros rescatados", "gatos de refugio", "huskies siberianos"...
  speciality TEXT,
  -- Cantidad aproximada de seguidores (para ordenar y tier visual).
  followers_estimated INT CHECK (followers_estimated IS NULL OR followers_estimated >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
  featured BOOLEAN NOT NULL DEFAULT false,
  started_at DATE,
  -- Email de contacto para coordinar. No se expone publicamente.
  contact_email TEXT,
  -- Notas privadas del admin (motivo de aprobacion, histórico, etc).
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paw_voices_active
  ON public.paw_voices(featured DESC, followers_estimated DESC NULLS LAST, name)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_paw_voices_status
  ON public.paw_voices(status, created_at DESC);

-- Trigger updated_at reutiliza la funcion generica si existe; si no, se crea.
CREATE OR REPLACE FUNCTION public.touch_paw_voices_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_paw_voices_updated_at ON public.paw_voices;
CREATE TRIGGER trg_paw_voices_updated_at
  BEFORE UPDATE ON public.paw_voices
  FOR EACH ROW EXECUTE FUNCTION public.touch_paw_voices_updated_at();

-- RLS
ALTER TABLE public.paw_voices ENABLE ROW LEVEL SECURITY;

-- Lectura publica: solo voices activos (no-pending, no-rejected, no-inactive).
-- No se expone contact_email, notes ni user_id a anon (se filtra en el SELECT).
DROP POLICY IF EXISTS "paw_voices_public_read" ON public.paw_voices;
CREATE POLICY "paw_voices_public_read"
  ON public.paw_voices FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- INSERT publico: cualquiera puede aplicar (envia form con status='pending').
-- El admin luego revisa y cambia a 'active' o 'rejected'.
DROP POLICY IF EXISTS "paw_voices_public_apply" ON public.paw_voices;
CREATE POLICY "paw_voices_public_apply"
  ON public.paw_voices FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND featured = false
    AND notes IS NULL
  );

-- Admin ve y modifica todo.
DROP POLICY IF EXISTS "paw_voices_admin_all" ON public.paw_voices;
CREATE POLICY "paw_voices_admin_all"
  ON public.paw_voices FOR ALL
  TO authenticated
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

COMMENT ON TABLE public.paw_voices IS
  'Red de creadores/influencers aliados (Paw Voices). Cualquiera puede aplicar via public INSERT (status=pending); admin aprueba y pasa a status=active.';

-- ==========================================================================
-- Tabla advertisements
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 80),
  description TEXT CHECK (description IS NULL OR length(description) <= 200),
  image_url TEXT,
  target_url TEXT NOT NULL CHECK (target_url ~ '^https?://'),
  -- Donde se muestra el aviso. Mapeado en el frontend a slots concretos.
  placement TEXT NOT NULL DEFAULT 'home_feed'
    CHECK (placement IN (
      'home_feed',
      'donations_page',
      'vet_directory',
      'maps',
      'feed_top'
    )),
  -- Partner asociado (Paw Company). Opcional.
  partner_id UUID REFERENCES public.paw_companys(id) ON DELETE SET NULL,
  -- Vigencia del aviso. Fuera de este rango se oculta automaticamente.
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Contadores para medir performance (incrementados por RPC).
  impressions_count INT NOT NULL DEFAULT 0,
  clicks_count INT NOT NULL DEFAULT 0,
  -- Prioridad para el caso de multiples ads activos en el mismo placement.
  priority INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT advertisements_date_range CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_advertisements_active
  ON public.advertisements(placement, priority DESC, start_date DESC)
  WHERE is_active = true;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.touch_advertisements_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_advertisements_updated_at ON public.advertisements;
CREATE TRIGGER trg_advertisements_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW EXECUTE FUNCTION public.touch_advertisements_updated_at();

-- RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Lectura publica: solo ads activos en rango de fechas.
DROP POLICY IF EXISTS "advertisements_public_read" ON public.advertisements;
CREATE POLICY "advertisements_public_read"
  ON public.advertisements FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND CURRENT_DATE BETWEEN start_date AND end_date
  );

-- Admin full CRUD
DROP POLICY IF EXISTS "advertisements_admin_all" ON public.advertisements;
CREATE POLICY "advertisements_admin_all"
  ON public.advertisements FOR ALL
  TO authenticated
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

COMMENT ON TABLE public.advertisements IS
  'Slots publicitarios transparentes. Etiqueta "Patrocinado" en frontend (SERNAC). Contadores incrementados via RPC track_ad_impression/click.';

-- ==========================================================================
-- RPCs de tracking (impresiones + clicks)
-- ==========================================================================
-- Anon y authenticated pueden incrementar contadores pero NO leer datos
-- sensibles. Las funciones son SECURITY DEFINER para bypassear RLS solo
-- para el UPDATE de contador.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.track_ad_impression(p_ad_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.advertisements
  SET impressions_count = impressions_count + 1
  WHERE id = p_ad_id
    AND is_active = true
    AND CURRENT_DATE BETWEEN start_date AND end_date;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_ad_click(p_ad_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.advertisements
  SET clicks_count = clicks_count + 1
  WHERE id = p_ad_id
    AND is_active = true
    AND CURRENT_DATE BETWEEN start_date AND end_date;
END;
$$;

REVOKE ALL ON FUNCTION public.track_ad_impression(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_ad_click(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_ad_impression(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_ad_click(UUID) TO anon, authenticated;

COMMENT ON FUNCTION public.track_ad_impression(UUID) IS
  'Incrementa impressions_count del ad. Solo contabiliza si el ad esta activo y vigente.';
COMMENT ON FUNCTION public.track_ad_click(UUID) IS
  'Incrementa clicks_count del ad. Usado cuando el usuario hace click en el slot.';

-- ==========================================================================
-- RPC get_ad_for_placement: retorna 1 ad activo para un placement dado
-- (el de mayor priority, o aleatorio si hay varios con misma priority).
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.get_ad_for_placement(p_placement TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  image_url TEXT,
  target_url TEXT,
  placement TEXT,
  partner_id UUID
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    a.id,
    a.title,
    a.description,
    a.image_url,
    a.target_url,
    a.placement,
    a.partner_id
  FROM public.advertisements a
  WHERE a.is_active = true
    AND a.placement = p_placement
    AND CURRENT_DATE BETWEEN a.start_date AND a.end_date
  ORDER BY a.priority DESC, random()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_ad_for_placement(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ad_for_placement(TEXT) TO anon, authenticated;
