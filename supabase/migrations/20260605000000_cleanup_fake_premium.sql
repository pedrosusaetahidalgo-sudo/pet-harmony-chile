-- ==========================================================================
-- Cleanup premium falsos: downgrade a free
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-19):
-- Los 2 usuarios con is_premium=true en prod son pruebas/falsos (no hay
-- pagos reales via Flow). Pedro autoriza explicitamente downgradear a free
-- para igualar la experiencia con el resto de usuarios.
--
-- Scope:
--   - profiles: is_premium=false, plan_id='free', premium_plan=NULL,
--     premium_start_date/premium_end_date limpiados.
--   - subscriptions: cancelar suscripciones activas de esos user_ids
--     (status='cancelled', cancelled_at=now, cancellation_reason explicit).
--     NO DELETE — mantenemos historial auditable.
--
-- Usuarios afectados (del audit export 2026-04-18):
--   - b248c4dc-ab36-4c46-aec7-afdedf5664f4  (Antonia Susaeta, yearly)
--   - 839d7626-7292-4bb1-92c6-e50ba551832e  ("Usuario", yearly)
--
-- Si en el futuro alguno de ellos compra Premium de verdad via Flow,
-- el webhook reactivara el perfil automaticamente.
-- ==========================================================================

BEGIN;

-- 1. Downgrade profiles a free
UPDATE public.profiles
SET
  is_premium = FALSE,
  plan_id = 'free',
  premium_plan = NULL,
  premium_start_date = NULL,
  premium_end_date = NULL,
  updated_at = NOW()
WHERE id IN (
  'b248c4dc-ab36-4c46-aec7-afdedf5664f4',
  '839d7626-7292-4bb1-92c6-e50ba551832e'
)
AND (
  is_premium = TRUE
  OR plan_id <> 'free'
  OR premium_plan IS NOT NULL
);

-- 2. Cancelar suscripciones "activas" falsas (mantiene historial)
UPDATE public.subscriptions
SET
  status = 'cancelled',
  cancelled_at = COALESCE(cancelled_at, NOW()),
  cancellation_reason = COALESCE(
    cancellation_reason,
    'Cleanup 2026-04-19: premium falso sin pago real via Flow'
  ),
  updated_at = NOW()
WHERE user_id IN (
  'b248c4dc-ab36-4c46-aec7-afdedf5664f4',
  '839d7626-7292-4bb1-92c6-e50ba551832e'
)
AND status <> 'cancelled';

COMMIT;

-- Verificacion rapida post-aplicacion (descomenta si queres correrlo):
-- SELECT id, display_name, is_premium, plan_id, premium_plan
-- FROM public.profiles
-- WHERE id IN (
--   'b248c4dc-ab36-4c46-aec7-afdedf5664f4',
--   '839d7626-7292-4bb1-92c6-e50ba551832e'
-- );
-- SELECT user_id, plan_type, status, cancelled_at, cancellation_reason
-- FROM public.subscriptions
-- WHERE user_id IN (
--   'b248c4dc-ab36-4c46-aec7-afdedf5664f4',
--   '839d7626-7292-4bb1-92c6-e50ba551832e'
-- );
