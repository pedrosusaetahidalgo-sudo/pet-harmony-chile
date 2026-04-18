-- ==========================================================================
-- Muralla publica Paw Voices: exponer donaciones con is_public=true via RPC
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-19):
-- La pagina /donaciones muestra un Card "No solo necesitamos plata" que
-- promete una muralla de apoyos. Esta migracion crea el backend:
--   - RPC get_public_donations() con SECURITY DEFINER, expone solo
--     columnas seguras (id, donor_name, message, amount_clp, paid_at).
--   - Respeta la policy original: user_id, email, provider_id, commerce_order
--     NUNCA salen de la DB.
--   - Indice parcial para hacer la consulta O(log n) aunque crezca la tabla.
--
-- El RPC es callable por anon y authenticated. No hay que abrir la tabla
-- donations a anon: todo sigue canalizado por la funcion.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.get_public_donations(p_limit INT DEFAULT 30)
RETURNS TABLE (
  id UUID,
  donor_name TEXT,
  message TEXT,
  amount_clp INT,
  paid_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    d.id,
    COALESCE(NULLIF(TRIM(d.donor_name), ''), 'Amigue peludo') AS donor_name,
    d.message,
    d.amount_clp,
    d.paid_at
  FROM public.donations d
  WHERE d.status = 'paid'
    AND d.is_public = TRUE
    AND d.message IS NOT NULL
    AND LENGTH(TRIM(d.message)) > 0
  ORDER BY d.paid_at DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 30), 100));
$$;

REVOKE ALL ON FUNCTION public.get_public_donations(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_donations(INT) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_donations(INT) IS
  'Muralla publica Paw Voices: retorna donaciones pagadas con is_public=true y mensaje no vacio. Anonimiza donor_name nulos a "Amigue peludo". Uso: /donaciones (anon-safe).';

-- Indice parcial para la consulta de la muralla.
CREATE INDEX IF NOT EXISTS idx_donations_public_wall
  ON public.donations(paid_at DESC NULLS LAST)
  WHERE status = 'paid' AND is_public = TRUE;

-- ==========================================================================
-- KPI publico de transparencia: totales recaudados
-- ==========================================================================
-- RPC auxiliar para la tarjeta de transparencia en /donaciones.
-- Retorna solo agregados, nunca filas individuales sensibles.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.get_donations_public_stats()
RETURNS TABLE (
  total_clp BIGINT,
  month_clp BIGINT,
  donors_total INT,
  donors_month INT,
  first_donation_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(d.amount_clp), 0)::BIGINT AS total_clp,
    COALESCE(SUM(d.amount_clp) FILTER (
      WHERE d.paid_at >= date_trunc('month', NOW())
    ), 0)::BIGINT AS month_clp,
    COUNT(DISTINCT COALESCE(d.user_id::TEXT, d.commerce_order))::INT AS donors_total,
    COUNT(DISTINCT COALESCE(d.user_id::TEXT, d.commerce_order)) FILTER (
      WHERE d.paid_at >= date_trunc('month', NOW())
    )::INT AS donors_month,
    MIN(d.paid_at) AS first_donation_at
  FROM public.donations d
  WHERE d.status = 'paid';
$$;

REVOKE ALL ON FUNCTION public.get_donations_public_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_donations_public_stats() TO anon, authenticated;

COMMENT ON FUNCTION public.get_donations_public_stats() IS
  'KPI publico de transparencia. Retorna solo agregados (suma, conteo), nunca filas individuales. Uso: /donaciones tarjeta transparencia (anon-safe).';
