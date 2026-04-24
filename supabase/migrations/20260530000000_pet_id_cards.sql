-- ══════════════════════════════════════════════════════════════════════════
-- PET ID CARDS — Refactor Maestro 2026-04-23 Fase 0
-- ══════════════════════════════════════════════════════════════════════════
-- Contexto: la Pet ID Card es el pilar 1 de la Trinidad del Corazon.
-- Cedula digital de la mascota estilo cedula chilena con datos criticos +
-- QR que resuelve a la ficha segun modo de visibilidad del dueño.
--
-- Esta tabla NO duplica datos que ya estan en `pets` (nombre, raza, etc.).
-- Guarda:
--   - card_number: ID unico generado (formato PF-YYYY-XXXXXXXX)
--   - version: se incrementa cuando cambian datos criticos (dueño, chip, etc.)
--   - URLs de los 3 renders (SVG, PNG, PDF)
--   - metadata JSONB: snapshot de datos al momento de generar
--
-- Ademas creamos la RPC `resolve_pet_identity` que permite resolver un
-- pet_id a partir de cualquiera de los 3 identificadores (card_number,
-- microchip, nose_print hash). Ver plan maestro seccion 2.4.1.
--
-- 100% ADITIVA. No toca pets ni otras tablas. Idempotente.
-- Aplicar manualmente desde Supabase Dashboard > SQL Editor.
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Tabla pet_id_cards
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pet_id_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,

  -- Identificador unico visible en la cedula. Formato: PF-YYYY-XXXXXXXX
  card_number TEXT NOT NULL UNIQUE,

  -- Version de la card (regenerada al cambiar datos criticos)
  version INT NOT NULL DEFAULT 1,

  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,  -- Normalmente NULL (no expira), util si un dia se introduce refresh

  -- URLs en storage de los 3 renders
  svg_url TEXT,
  png_url TEXT,           -- 300 DPI imprimible
  pdf_url TEXT,           -- Tamaño cedula CR-80 (85.6 x 53.98 mm)
  wallet_pass_url TEXT,   -- Apple/Google Wallet pass (Fase 2)

  -- Snapshot de los datos al generar (para auditoria de versiones)
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Modo de visibilidad del QR por default
  default_qr_mode TEXT NOT NULL DEFAULT 'emergency'
    CHECK (default_qr_mode IN ('emergency', 'shared', 'public', 'owner_only')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Solo una card activa por mascota a la vez
  CONSTRAINT one_active_card_per_pet UNIQUE (pet_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_pet_id_cards_card_number ON public.pet_id_cards(card_number);
CREATE INDEX IF NOT EXISTS idx_pet_id_cards_pet_id ON public.pet_id_cards(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_id_cards_active
  ON public.pet_id_cards(pet_id, version DESC)
  WHERE is_active = TRUE;

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Trigger updated_at
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_pet_id_cards_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_pet_id_cards_updated_at ON public.pet_id_cards;
CREATE TRIGGER trg_update_pet_id_cards_updated_at
  BEFORE UPDATE ON public.pet_id_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_pet_id_cards_updated_at();

-- ──────────────────────────────────────────────────────────────────────────
-- 3. RLS
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE public.pet_id_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pet owners manage their id cards" ON public.pet_id_cards;
CREATE POLICY "Pet owners manage their id cards"
  ON public.pet_id_cards
  FOR ALL
  TO authenticated
  USING (pet_id IN (SELECT id FROM public.pets WHERE owner_id = auth.uid()))
  WITH CHECK (pet_id IN (SELECT id FROM public.pets WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Co-owners read id cards" ON public.pet_id_cards;
CREATE POLICY "Co-owners read id cards"
  ON public.pet_id_cards
  FOR SELECT
  TO authenticated
  USING (
    pet_id IN (
      SELECT pet_id FROM public.pet_co_owners
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

-- Lectura anonima por card_number (para QR publicos en modo emergency)
DROP POLICY IF EXISTS "Anon read id card by number" ON public.pet_id_cards;
CREATE POLICY "Anon read id card by number"
  ON public.pet_id_cards
  FOR SELECT
  TO anon
  USING (is_active = TRUE);

-- ──────────────────────────────────────────────────────────────────────────
-- 4. Funcion para generar card_number unico
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_pet_id_card_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  charset TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  year_prefix TEXT;
  suffix TEXT;
  candidate TEXT;
  attempt INT := 0;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');

  LOOP
    suffix := '';
    FOR i IN 1..8 LOOP
      suffix := suffix || substr(charset, floor(random() * length(charset) + 1)::int, 1);
    END LOOP;
    candidate := 'PF-' || year_prefix || '-' || suffix;

    IF NOT EXISTS (SELECT 1 FROM public.pet_id_cards WHERE card_number = candidate) THEN
      RETURN candidate;
    END IF;

    attempt := attempt + 1;
    IF attempt > 10 THEN
      RAISE EXCEPTION 'Could not generate unique pet_id_card number after 10 attempts';
    END IF;
  END LOOP;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────────
-- 5. RPC resolve_pet_identity
-- ──────────────────────────────────────────────────────────────────────────
-- Resuelve un pet_id a partir de cualquiera de los 3 identificadores:
--   - card_number (ej: PF-2026-A4F29XAB)
--   - microchip (15 digitos ISO 11784/11785)
--   - nose_print short_hash (ej: NP-A4F29X12, solo cuando tabla nose_prints exista en Fase 1)
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.resolve_pet_identity(
  p_input TEXT,
  p_input_type TEXT DEFAULT NULL  -- 'card_number' | 'microchip' | 'nose_print' | NULL=auto
)
RETURNS TABLE (pet_id UUID, match_type TEXT, confidence REAL)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  detected_type TEXT;
  nose_prints_exists BOOLEAN;
BEGIN
  -- Auto-detectar tipo si no se especifica
  IF p_input_type IS NULL THEN
    IF p_input ~ '^PF-\d{4}-[A-Z0-9]{8}$' THEN
      detected_type := 'card_number';
    ELSIF p_input ~ '^\d{15}$' THEN
      detected_type := 'microchip';
    ELSIF p_input ~ '^NP-[A-Z0-9]+-?[A-Z0-9]*$' THEN
      detected_type := 'nose_print';
    ELSE
      RAISE EXCEPTION 'Formato no reconocido para identifier: %', p_input;
    END IF;
  ELSE
    detected_type := p_input_type;
  END IF;

  -- Resolver segun tipo
  IF detected_type = 'card_number' THEN
    RETURN QUERY
      SELECT pic.pet_id, 'card_number'::TEXT, 1.0::REAL
      FROM public.pet_id_cards pic
      WHERE pic.card_number = p_input AND pic.is_active = TRUE
      LIMIT 1;

  ELSIF detected_type = 'microchip' THEN
    RETURN QUERY
      SELECT p.id, 'microchip'::TEXT, 1.0::REAL
      FROM public.pets p
      WHERE p.microchip_number = p_input
      LIMIT 1;

  ELSIF detected_type = 'nose_print' THEN
    -- Verificar si la tabla nose_prints existe (Fase 1)
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'nose_prints'
    ) INTO nose_prints_exists;

    IF nose_prints_exists THEN
      -- Usar SQL dinamico para evitar error de parseo si la tabla no existe al crear la funcion
      RETURN QUERY EXECUTE
        'SELECT np.pet_id, ''nose_print''::TEXT, 1.0::REAL
         FROM public.nose_prints np
         WHERE np.short_hash = $1 AND np.is_primary = TRUE
         LIMIT 1'
      USING p_input;
    ELSE
      -- nose_prints aun no existe (antes de Fase 1) → retorna vacio
      RETURN;
    END IF;

  ELSE
    RAISE EXCEPTION 'Tipo de identifier no soportado: %', detected_type;
  END IF;
END;
$$;

-- Grant para ejecucion desde edge functions (service role) y usuarios auth
GRANT EXECUTE ON FUNCTION public.resolve_pet_identity(TEXT, TEXT) TO authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────
-- 6. Smoke test (regla CLAUDE.md §9.2.1)
-- ──────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_test_pet_id UUID;
  v_test_card_id UUID;
  v_test_card_number TEXT;
  v_resolved RECORD;
BEGIN
  SELECT id INTO v_test_pet_id FROM public.pets WHERE owner_id IS NOT NULL LIMIT 1;
  IF v_test_pet_id IS NULL THEN
    RAISE NOTICE 'Smoke skip: no hay mascotas para testear';
    RETURN;
  END IF;

  -- Generar card_number y crear card
  v_test_card_number := generate_pet_id_card_number();

  INSERT INTO public.pet_id_cards (pet_id, card_number, metadata)
  VALUES (v_test_pet_id, v_test_card_number, '{"smoke_test": true}'::jsonb)
  RETURNING id INTO v_test_card_id;

  RAISE NOTICE 'Smoke: created card % (id=%) for pet %', v_test_card_number, v_test_card_id, v_test_pet_id;

  -- Resolver por card_number
  SELECT * INTO v_resolved FROM public.resolve_pet_identity(v_test_card_number);
  IF v_resolved.pet_id = v_test_pet_id THEN
    RAISE NOTICE 'Smoke: resolve_pet_identity OK (pet_id match)';
  ELSE
    RAISE EXCEPTION 'Smoke FAILED: resolve_pet_identity no matchea pet_id';
  END IF;

  -- Rollback del test
  DELETE FROM public.pet_id_cards WHERE id = v_test_card_id;
  RAISE NOTICE 'Smoke cleanup OK';

EXCEPTION WHEN OTHERS THEN
  -- Intentar cleanup si el INSERT funciono pero el resolve fallo
  IF v_test_card_id IS NOT NULL THEN
    DELETE FROM public.pet_id_cards WHERE id = v_test_card_id;
  END IF;
  RAISE EXCEPTION 'Smoke test FAILED: %', SQLERRM;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- Verificacion post-apply
-- ──────────────────────────────────────────────────────────────────────────
-- SELECT COUNT(*) FROM public.pet_id_cards;  -- Debe ser 0
-- SELECT generate_pet_id_card_number();       -- Debe retornar algo como PF-2026-A4F29X12
-- \df public.resolve_pet_identity              -- Ver signatura de la RPC
-- ──────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE public.pet_id_cards IS
  'Pet ID Card digital (pilar 1 Trinidad del Corazon, Refactor Maestro 2026-04-23). Cedula estilo chilena con QR al dashboard, versionada cuando cambian datos criticos.';

COMMENT ON FUNCTION public.resolve_pet_identity(TEXT, TEXT) IS
  'Resuelve pet_id a partir de card_number (PF-YYYY-XXXXXXXX), microchip (15 digitos ISO) o nose print short_hash (NP-XXXX-XX). Auto-detecta tipo si no se especifica. Usado por edge functions y componente PetIdCard.';
