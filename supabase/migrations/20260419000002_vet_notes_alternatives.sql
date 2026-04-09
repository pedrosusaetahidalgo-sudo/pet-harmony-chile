-- ============================================================================
-- DIFERENCIADOR: Campo alternatives_discussed en notas clínicas del vet
-- Gap 81/73 PetSmart-Gallup: 81% de vets dicen ofrecer alternativas,
--   pero 73% de dueños dicen que nunca recibieron una.
-- Aplicar MANUALMENTE en Supabase Dashboard > SQL Editor
-- ============================================================================

ALTER TABLE public.vet_clinical_notes
  ADD COLUMN IF NOT EXISTS alternatives_discussed TEXT,
  ADD COLUMN IF NOT EXISTS alternative_offered BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.vet_clinical_notes.alternatives_discussed IS
  'Texto libre describiendo alternativas de tratamiento/costo ofrecidas al dueño.';

COMMENT ON COLUMN public.vet_clinical_notes.alternative_offered IS
  'TRUE si el vet marcó que ofreció al menos una alternativa más económica.';
