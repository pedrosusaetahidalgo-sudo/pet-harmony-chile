-- ══════════════════════════════════════════════════════════════════════════
-- Research consent opt-in (Refactor Maestro Fase 2 §7.3)
-- ══════════════════════════════════════════════════════════════════════════
-- Bloqueante para vender insights agregados a Pharma / aseguradoras / academia.
-- Sin este campo, no podemos defender legalmente que la data anonima usada
-- en estudios proviene de usuarios que dieron consentimiento explicito.
--
-- Estados:
--   NULL  = nunca se pregunto al usuario (default seguro: NO incluir)
--   TRUE  = opt-in explicito (incluir en agregados B2B)
--   FALSE = opt-out explicito (excluir aunque cumpla otros criterios)
--
-- Las RPCs de insights agregados (public_breed_stats, public_species_stats,
-- futuras pharma views) deben filtrar por
--   profiles.anonymous_data_research_consent = TRUE
-- antes de incluir las mascotas del usuario en cualquier agregado vendible.
--
-- IMPORTANTE: El campo NO afecta los insights publicos /insights/* que ya
-- estan en prod. Esos siguen siendo data agregada con threshold privacy de
-- 50 mascotas (anonimato por k-anonymity, no por consent). Este flag se
-- aplica solo para data MÁS especifica: estudios cohorte Pharma, score
-- individual a aseguradoras, exports custom. El threshold k-anonymity es
-- defensa minima; este flag es defensa adicional para flujos B2B mas
-- sensibles.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS anonymous_data_research_consent BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN public.profiles.anonymous_data_research_consent IS
  'Opt-in explicito del dueno para incluir su data anonima en insights agregados '
  'B2B (Pharma, aseguradoras, estudios academicos). NULL = no preguntado, '
  'TRUE = opt-in, FALSE = opt-out. Refactor Maestro Fase 2 §7.3.';

-- Tracking: cuando dio el consent (para auditoria y para poder mostrar al
-- usuario "consentiste el ...")
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS research_consent_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.profiles.research_consent_at IS
  'Timestamp cuando el dueno tomo decision sobre research consent (true o false). '
  'NULL si nunca decidio. Refactor Maestro Fase 2 §7.3.';

-- Indice util para futuras queries B2B que filtran por consent + atributos
CREATE INDEX IF NOT EXISTS idx_profiles_research_consent
  ON public.profiles(anonymous_data_research_consent)
  WHERE anonymous_data_research_consent = TRUE;

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- Smoke test: confirmar que la columna existe y RLS sigue funcionando
-- (las policies existentes de profiles permiten al owner leer/escribir
-- todos sus campos, asi que no hace falta policy nueva)
-- ══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  PERFORM 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'anonymous_data_research_consent';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Columna anonymous_data_research_consent no se creo';
  END IF;

  PERFORM 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'research_consent_at';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Columna research_consent_at no se creo';
  END IF;

  RAISE NOTICE 'Smoke test OK: research consent columnas creadas';
END $$;
