-- ==========================================================================
-- Extender auto_fix_stale_verification_requests para capturar mas ruido.
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-17):
-- El audit export detecto 6 verification_requests stale (pending >7 dias)
-- con notas claramente random que el regex actual no estaba pillando:
--   - "Yduswhwv" (empieza mayuscula, 8 chars, sin espacios)
--   - "wdwdwjdnlkwjnw" (14 chars sin vocales)
--   - otros similares
--
-- REGLA DE ORO: el fixer solo toca ruido claro. Este cambio respeta eso:
--   - "Paseador de perros." (legitimo, tiene espacios) → NO se toca.
--   - "Veterinaria" (11 chars, 55% vocales) → NO se toca.
--   - "Yduswhwv" (12.5% vocales, sin espacios) → se auto-rechaza.
--
-- Heuristica agregada:
--   Cadenas de 8-25 chars SIN espacios Y con ratio de vocales < 20%
--   son practicamente siempre junk (teclado aleatorio).
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.auto_fix_stale_verification_requests()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_ids TEXT[];
BEGIN
  WITH junk_requests AS (
    SELECT id FROM public.verification_requests
    WHERE status = 'pendiente'
      AND created_at < now() - interval '7 days'
      AND (
        -- 1) Texto muy corto (< 5 chars)
        COALESCE(length(trim(notes)), 0) < 5
        -- 2) Prefijos de teclado aleatorio conocidos (case-insensitive)
        OR notes ~* '^(asd|qwe|test|prueba|jhq|wes|wed|hhh|bbb|yyy|ydus|wdwd|nknk|mnmn|zxcv|qaz|xyz|lorem)'
        -- 3) Solo letras lowercase hasta 8 chars (regex original)
        OR notes ~ '^[a-z ]{1,8}$'
        -- 4) NUEVO: 8-25 chars, sin espacios ni puntuacion, <20% vocales
        --    (teclado aleatorio tipico: "Yduswhwv", "wdwdwjdnlkwjnw")
        OR (
          length(trim(notes)) BETWEEN 8 AND 25
          AND trim(notes) !~ '[\s[:punct:]]'
          AND (
            length(regexp_replace(lower(trim(notes)), '[^aeiouáéíóú]', '', 'g'))::float
            / NULLIF(length(trim(notes)), 0)::float
          ) < 0.20
        )
      )
  ),
  updated AS (
    UPDATE public.verification_requests
    SET status = 'rechazado',
        reviewed_at = now(),
        notes = COALESCE(notes, '') || ' [auto-rechazado: testing data]'
    WHERE id IN (SELECT id FROM junk_requests)
    RETURNING id
  )
  SELECT count(*), array_agg(id::text) INTO v_count, v_ids FROM updated;

  RETURN jsonb_build_object(
    'fixer', 'stale_verification_requests',
    'applied_count', COALESCE(v_count, 0),
    'affected_ids', COALESCE(v_ids, ARRAY[]::text[])
  );
END;
$$;

-- Mantener permisos (solo service_role / admins via run_daily_auto_fixers).
REVOKE EXECUTE ON FUNCTION public.auto_fix_stale_verification_requests() FROM public, anon, authenticated;
