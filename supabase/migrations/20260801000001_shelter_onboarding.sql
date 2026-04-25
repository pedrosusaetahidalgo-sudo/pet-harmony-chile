-- Refactor flujo adopción 2026-04-24 (REFACTOR_ADOPCION_2026_04_24.md, Bloque 2 §3.4)
--
-- Track del onboarding del refugio para mostrar tour solo la primera vez.

BEGIN;

ALTER TABLE public.adoption_centers
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMIT;

DO $$
BEGIN
  PERFORM 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'adoption_centers'
      AND column_name = 'onboarding_completed_at';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Columna onboarding_completed_at no se creó';
  END IF;
  RAISE NOTICE 'Smoke test OK';
END $$;
