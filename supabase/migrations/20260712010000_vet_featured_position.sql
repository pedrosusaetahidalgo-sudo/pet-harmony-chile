-- ==========================================================================
-- Lote A.2 — Featured position en directorio de vets
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Auditoría E2E pre-launch):
-- plans.ts declaraba feature `featured_position: true` para Premium+ pero
-- no existia columna ni ordenamiento. Este patch crea featured_until
-- (timestamp hasta cuando el vet es destacado) + index ordenado.
-- El flow-webhook (lote B) setea featured_until = plan_expires_at al
-- activar un plan pago.
--
-- Idempotente.
-- ==========================================================================

ALTER TABLE public.service_providers
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

COMMENT ON COLUMN public.service_providers.featured_until IS
  'Destacado en directorio hasta esta fecha. Seteado al activar plan pago (mirror de plan_expires_at). NULL = no destacado.';

-- Index parcial: solo destaca vets activos y con featured futuro.
CREATE INDEX IF NOT EXISTS idx_service_providers_featured
  ON public.service_providers(featured_until DESC NULLS LAST, avg_rating DESC)
  WHERE is_directory_visible = true
    AND featured_until IS NOT NULL
    AND featured_until > NOW();

-- Sin trigger automatico — la activacion la hace flow-webhook (lote B).
-- Al downgrade (cron downgrade_expired_vet_plans) featured_until vuelve a NULL.
-- Si quieres forzar que el cron tambien limpie featured, extiende esa funcion
-- en un patch posterior (hoy se limpia pasivamente porque el query usa > NOW()).

-- ----------------------------------------------------------------------
-- Verificacion post-apply:
-- SELECT COUNT(*) FROM service_providers WHERE featured_until IS NOT NULL;
-- \d service_providers   -- verificar que la columna aparece
-- ----------------------------------------------------------------------
