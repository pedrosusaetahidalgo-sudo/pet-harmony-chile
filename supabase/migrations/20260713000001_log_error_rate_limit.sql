-- ==========================================================================
-- P0-3 — Rate limit persistente para log-error (auditoría top-tier 2026-04-20)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Problema resuelto:
--   supabase/functions/log-error/index.ts usaba un Map<string, ...> en
--   memoria para rate-limit por IP. Como las Edge Functions son
--   stateless y tienen cold starts frecuentes, el contador se resetea
--   entre invocaciones y la protección es prácticamente nula:
--     - Ataque distribuido por IPs múltiples → nula protección.
--     - Ataque monobote por cold-start cycling → muy debilitada.
--
--   Esta migración crea:
--     * tabla `public.ip_request_quota` (equivalente a
--       `payment_request_quota` pero indexada por IP, no por user_id).
--     * RPC `public.check_and_increment_ip_quota(p_ip, p_scope,
--       p_limit, p_window_seconds)` atómica, security definer.
--
--   Patrón idéntico a `check_and_increment_payment_quota`
--   (mig 20260414000000_flow_hardening.sql). La ventana es deslizante
--   por reset: cuando expira, arranca de cero en la siguiente request.
--
-- Idempotente: CREATE TABLE IF NOT EXISTS + CREATE OR REPLACE FUNCTION.
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.ip_request_quota (
  ip           TEXT        NOT NULL,
  scope        TEXT        NOT NULL DEFAULT 'log_error',
  count        INTEGER     NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ip, scope)
);

COMMENT ON TABLE public.ip_request_quota IS
  'Rate limit persistente por IP + scope. Usado inicialmente por log-error, extensible a otros endpoints anónimos.';

COMMENT ON COLUMN public.ip_request_quota.scope IS
  'Nombre de la edge fn o grupo de endpoints al que aplica la cuota (p.ej. log_error, sitemap, public_apply).';

CREATE INDEX IF NOT EXISTS idx_ip_request_quota_updated_at
  ON public.ip_request_quota (updated_at DESC);

-- RLS: solo service_role lee/escribe.
ALTER TABLE public.ip_request_quota ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ip_quota service role only" ON public.ip_request_quota;
CREATE POLICY "ip_quota service role only"
  ON public.ip_request_quota
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────────────────
-- RPC atómica: check_and_increment_ip_quota
-- Patrón: upsert + select-for-update + decisión, todo en una transacción.
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_and_increment_ip_quota(
  p_ip              TEXT,
  p_scope           TEXT    DEFAULT 'log_error',
  p_limit           INTEGER DEFAULT 30,
  p_window_seconds  INTEGER DEFAULT 60
)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_in_seconds INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ip_request_quota;
  v_now timestamptz := now();
BEGIN
  IF p_ip IS NULL OR length(p_ip) = 0 THEN
    p_ip := 'unknown';
  END IF;

  INSERT INTO public.ip_request_quota (ip, scope, count, window_start, updated_at)
  VALUES (p_ip, p_scope, 0, v_now, v_now)
  ON CONFLICT (ip, scope) DO NOTHING;

  SELECT * INTO v_row
    FROM public.ip_request_quota
   WHERE ip = p_ip AND scope = p_scope
   FOR UPDATE;

  -- Si la ventana venció, resetear contador.
  IF extract(epoch FROM (v_now - v_row.window_start)) >= p_window_seconds THEN
    UPDATE public.ip_request_quota
       SET count = 1, window_start = v_now, updated_at = v_now
     WHERE ip = p_ip AND scope = p_scope
     RETURNING * INTO v_row;

    RETURN QUERY SELECT TRUE, p_limit - 1, p_window_seconds;
    RETURN;
  END IF;

  -- Ventana viva: chequear si ya excedió.
  IF v_row.count >= p_limit THEN
    RETURN QUERY SELECT
      FALSE,
      0,
      GREATEST(0, p_window_seconds - extract(epoch FROM (v_now - v_row.window_start))::integer);
    RETURN;
  END IF;

  UPDATE public.ip_request_quota
     SET count = count + 1, updated_at = v_now
   WHERE ip = p_ip AND scope = p_scope
   RETURNING * INTO v_row;

  RETURN QUERY SELECT
    TRUE,
    p_limit - v_row.count,
    GREATEST(0, p_window_seconds - extract(epoch FROM (v_now - v_row.window_start))::integer);
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_increment_ip_quota(TEXT, TEXT, INTEGER, INTEGER) FROM public;
GRANT EXECUTE ON FUNCTION public.check_and_increment_ip_quota(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

-- ──────────────────────────────────────────────────────────────────────────
-- Cleanup: cron opcional para purgar rows >24h sin actividad.
-- (Comentado. Si pg_cron está activo y quieres habilitarlo, descomenta.)
-- ──────────────────────────────────────────────────────────────────────────
-- SELECT cron.schedule(
--   'ip-request-quota-cleanup',
--   '0 3 * * *',
--   $$DELETE FROM public.ip_request_quota WHERE updated_at < now() - interval '24 hours';$$
-- );

-- ──────────────────────────────────────────────────────────────────────────
-- Verificación post-apply:
--
--   -- Consumo normal (primera request):
--   SELECT * FROM public.check_and_increment_ip_quota('1.2.3.4', 'log_error', 10, 60);
--   -- allowed=true, remaining=9
--
--   -- Varias requests (loop 10 veces): la 11a debe ser allowed=false.
-- ──────────────────────────────────────────────────────────────────────────
