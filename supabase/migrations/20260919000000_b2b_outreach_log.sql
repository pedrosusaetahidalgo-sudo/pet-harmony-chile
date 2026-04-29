-- 2026-04-30 (B2B outreach log · Task #8 audit-readiness)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Tabla para trackear envios de outreach masivo a prospectos B2B desde
-- el admin (AdminB2BOutreach). El edge fn send-b2b-outreach hace insert
-- por cada email enviado exitosamente.
--
-- Permite:
--  - Auditoria de cuantos correos se enviaron y a quien
--  - Detectar duplicados (mismo email contactado <30 dias)
--  - Reporting por audience (pharma, seguros, retail, etc.)

BEGIN;

CREATE TABLE IF NOT EXISTS public.b2b_outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience TEXT NOT NULL CHECK (
    audience IN ('pharma', 'seguros', 'retail', 'gobierno', 'banca', 'edificios', 'longtail')
  ),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_company TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'bounced', 'replied', 'opted_out')),
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reply_received_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_b2b_outreach_log_audience ON public.b2b_outreach_log (audience);
CREATE INDEX IF NOT EXISTS idx_b2b_outreach_log_email ON public.b2b_outreach_log (recipient_email);
CREATE INDEX IF NOT EXISTS idx_b2b_outreach_log_sent_at ON public.b2b_outreach_log (sent_at DESC);

ALTER TABLE public.b2b_outreach_log ENABLE ROW LEVEL SECURITY;

-- Solo admin puede leer/escribir. El edge fn usa service_role.
CREATE POLICY b2b_outreach_log_admin_all ON public.b2b_outreach_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

COMMENT ON TABLE public.b2b_outreach_log IS
  'Log de outreach masivo a prospectos B2B (pharma/seguros/retail/etc). Insert via edge fn send-b2b-outreach. Solo admin lee.';

-- ── Stats RPC para AdminB2BOutreach widget ────────────────────────
CREATE OR REPLACE FUNCTION public.b2b_outreach_stats(p_days INT DEFAULT 30)
RETURNS TABLE (
  audience TEXT,
  total_sent BIGINT,
  total_replied BIGINT,
  reply_rate NUMERIC,
  last_sent TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  RETURN QUERY
  SELECT
    bol.audience,
    COUNT(*)::BIGINT AS total_sent,
    COUNT(*) FILTER (WHERE bol.reply_received_at IS NOT NULL)::BIGINT AS total_replied,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE bol.reply_received_at IS NOT NULL) / COUNT(*),
          2
        )
      ELSE 0
    END AS reply_rate,
    MAX(bol.sent_at) AS last_sent
  FROM public.b2b_outreach_log bol
  WHERE bol.sent_at >= NOW() - (p_days * INTERVAL '1 day')
  GROUP BY bol.audience
  ORDER BY total_sent DESC;
END $$;

REVOKE ALL ON FUNCTION public.b2b_outreach_stats(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.b2b_outreach_stats(INT) TO authenticated;

COMMENT ON FUNCTION public.b2b_outreach_stats IS
  'Stats agregadas de outreach B2B en ultimos N dias por audience. ADMIN-ONLY.';

COMMIT;
