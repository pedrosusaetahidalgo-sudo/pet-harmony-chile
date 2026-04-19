-- ==========================================================================
-- Paw Fundadores: tier especial pre-lanzamiento para Companys + Voices
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-19) - Pre-lanzamiento 1 mayo:
-- Estrategia "Paw Fundadores" (ver docs-raiz/marketing/outreach/
-- ESTRATEGIA_LAUNCH_SUPPORTERS.md) ofrece tier especial a los primeros 5
-- sponsors y 6 creators con prioridad historica permanente, even si no
-- upgrade a tier pagado despues.
--
-- Cambios:
--   - paw_companys.is_founder BOOLEAN DEFAULT false
--   - paw_voices.is_founder BOOLEAN DEFAULT false
--   - Index para listar primero a fundadores en /donaciones y /paw-voices
--   - Comentarios para que el admin sepa que es
--
-- NO rompe datos existentes (default false). Admin marca manualmente a
-- quienes corresponde via AdminPawCompanys / AdminPawVoices.
-- ==========================================================================

-- Paw Companys (ya existe tabla desde 20260604010000_paw_companys.sql)
ALTER TABLE public.paw_companys
  ADD COLUMN IF NOT EXISTS is_founder BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.paw_companys.is_founder IS
  'Empresa "Paw Fundadora": entro pre-lanzamiento 2026-05 con tier especial $0 los primeros 3 meses. Maximo 5 slots. Prioridad visual permanente en /donaciones incluso si dejan de ser activas.';

-- Index: priorizar fundadores en listados publicos.
DROP INDEX IF EXISTS idx_paw_companys_active;
CREATE INDEX IF NOT EXISTS idx_paw_companys_active
  ON public.paw_companys(is_founder DESC, featured DESC, tier, name)
  WHERE is_active = true;

-- Paw Voices (ya existe tabla desde 20260609000000_paw_voices_and_ads.sql)
ALTER TABLE public.paw_voices
  ADD COLUMN IF NOT EXISTS is_founder BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.paw_voices.is_founder IS
  'Creator "Paw Voice Fundador/a": entro pre-lanzamiento 2026-05 con prioridad historica, 1 reel co-creado con Kai/Ema de bienvenida, y primer acceso garantizado a Paw Voice Pro con 2x engagement bonus cuando se active. Maximo 6 slots.';

-- Index para listar primero a fundadores.
DROP INDEX IF EXISTS idx_paw_voices_active;
CREATE INDEX IF NOT EXISTS idx_paw_voices_active
  ON public.paw_voices(is_founder DESC, featured DESC, followers_estimated DESC NULLS LAST, name)
  WHERE status = 'active';

-- ==========================================================================
-- Fin migracion 20260614000000
-- ==========================================================================
