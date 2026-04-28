-- 2026-04-28 (Sprint 1 P1 BIZ-006)
--
-- Skeleton de renovacion recurrente Flow.cl. La integracion actual de Flow
-- (pago unico via Plus) NO tiene auto-renewal. Hasta migrar a Oneclick Mall,
-- el cron flow-renewal-reminders-cron envia recordatorios "Tu plan vence en
-- X dias" a usuarios con auto_renew=true.
--
-- Esta mig agrega la columna idempotente que el cron usa para no spammear:
-- last_renewal_reminder_at. Cooldown 7 dias por subscripcion.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS last_renewal_reminder_at timestamptz NULL;

COMMENT ON COLUMN public.subscriptions.last_renewal_reminder_at IS
  'Sprint 1 P1 BIZ-006: timestamp del ultimo recordatorio de renovacion enviado. NULL = nunca. Cooldown 7d antes del proximo.';

-- Index para acelerar la query del cron (filtra por end_date + auto_renew + status).
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_window
  ON public.subscriptions (end_date, auto_renew, status)
  WHERE auto_renew = true AND status = 'active';

COMMENT ON INDEX public.idx_subscriptions_renewal_window IS
  'Sprint 1 P1 BIZ-006: acelera la ventana de candidatos para flow-renewal-reminders-cron.';
