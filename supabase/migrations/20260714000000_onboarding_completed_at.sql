-- ==========================================================================
-- B.1 — Onboarding post-signup (auditoría top-tier 2026-04-20)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Objetivo:
--   Conectar los flujos `OnboardingDuenoMinimal`, `OnboardingVetMinimal`
--   y `OnboardingShelter` que hoy son rutas huérfanas: un usuario recién
--   registrado entra directo a /home sin pasar por el wizard.
--
--   Este gate aplica únicamente al rol `owner` (default). Los roles
--   `provider` y `shelter` tienen su propio registro inline vía
--   BecomeProviderDialog / BecomeShelterDialog y no usan este flag.
--
-- Idempotente:
--   - ADD COLUMN IF NOT EXISTS
--   - UPDATE solo backfillea filas con NULL
--   - Usuarios ya registrados ANTES de este gate se consideran
--     "onboardeados de facto": seteamos onboarding_completed_at=created_at
--     para que no caigan en el redirect loop.
--
-- Regla 9.7 del CLAUDE.md (protección de usuarios existentes): cumplida.
-- ==========================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.onboarding_completed_at IS
  'NULL = el user nunca completó el onboarding de dueño. NON-NULL = timestamp en que lo terminó o hizo skip explícito. Gate frontend lo usa para redirigir post-signup (rol owner).';

-- Backfill: usuarios existentes NO deben caer en el onboarding porque ya
-- "se onboardearon" navegando la app por su cuenta. Seteamos con created_at
-- como marca de ese momento.
UPDATE public.profiles
  SET onboarding_completed_at = created_at
  WHERE onboarding_completed_at IS NULL;

-- Index parcial: queries del gate solo buscan NULLs (users que aún no
-- completaron). Full scan sería caro en tablas grandes.
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_pending
  ON public.profiles (id)
  WHERE onboarding_completed_at IS NULL;

-- ──────────────────────────────────────────────────────────────────────────
-- Verificación post-apply:
--
--   -- Todos los users actuales deberían tener onboarding_completed_at
--   SELECT count(*) FROM public.profiles WHERE onboarding_completed_at IS NULL;
--   -- ↑ debe ser 0 inmediatamente después de aplicar.
--
--   -- Simular nuevo signup:
--   UPDATE public.profiles
--     SET onboarding_completed_at = NULL
--     WHERE id = '<user-id-de-prueba>';
--   -- Al refrescar la app, el user debería ser redirigido a /onboarding-mascota.
--
--   -- Rollback del test:
--   UPDATE public.profiles
--     SET onboarding_completed_at = now()
--     WHERE id = '<user-id-de-prueba>';
-- ──────────────────────────────────────────────────────────────────────────
