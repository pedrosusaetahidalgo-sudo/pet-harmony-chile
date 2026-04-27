-- ══════════════════════════════════════════════════════════════════════════
-- pet_health_alerts: tracking de emails enviados
-- ══════════════════════════════════════════════════════════════════════════
-- Soporta la edge fn `notify-health-alerts` que envia email al dueño cuando
-- detecta una alerta severity='high' (vacuna >90d vencida, peso baja >=20%,
-- etc). Es el complemento del banner in-app: cuando es urgente, no
-- esperamos a que el dueño abra la app.
--
-- Idempotencia: la edge fn solo procesa alertas con email_sent_at IS NULL
-- y marca timestamp tras enviar. Si el email falla, sigue NULL y reintenta
-- en el siguiente cron tick.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.pet_health_alerts
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.pet_health_alerts.email_sent_at IS
  'Timestamp del envio de email al dueño cuando severity=high. NULL si no '
  'se envio todavia (o si la severity no amerita email). Usado por la edge '
  'fn notify-health-alerts para idempotencia.';

-- Indice para acelerar el query del cron (filtra severity='high' AND
-- email_sent_at IS NULL). Cuando la tabla crezca, sin indice el cron tendria
-- que escanear toda la tabla cada vez.
CREATE INDEX IF NOT EXISTS idx_pet_health_alerts_email_pending
  ON public.pet_health_alerts(created_at)
  WHERE severity = 'high'
    AND email_sent_at IS NULL
    AND dismissed_at IS NULL;

COMMIT;

-- Smoke test
DO $$
BEGIN
  PERFORM 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'pet_health_alerts'
    AND column_name = 'email_sent_at';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Columna email_sent_at no se creo';
  END IF;
  RAISE NOTICE 'Smoke test OK: email_sent_at column';
END $$;
