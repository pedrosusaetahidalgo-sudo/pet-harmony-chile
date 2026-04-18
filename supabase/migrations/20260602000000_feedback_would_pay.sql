-- ==========================================================================
-- Feedback: voluntad de pago + RPC segura para que el usuario puntue su feedback
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-18):
-- Despues de enviar feedback mostramos un paso con 5 estrellas y la pregunta
-- "Pagarias por esta app?". Necesitamos:
--   1) Columna would_pay (yes | maybe | no) en feedback_in_app
--   2) Una RPC SECURITY DEFINER para que el usuario pueda escribir SOLO
--      app_rating y would_pay sobre su propio feedback. No queremos abrir
--      UPDATE general en RLS porque dejaria editar cualquier campo.
--
-- Null = no contesto. Valor != null = ya respondio la recepcion.
-- ==========================================================================

ALTER TABLE public.feedback_in_app
  ADD COLUMN IF NOT EXISTS would_pay TEXT
    CHECK (would_pay IS NULL OR would_pay IN ('yes', 'maybe', 'no'));

COMMENT ON COLUMN public.feedback_in_app.would_pay IS
  'Respuesta a ¿Pagarias por Paw Friend? (yes/maybe/no). NULL = sin responder.';

CREATE INDEX IF NOT EXISTS idx_feedback_in_app_would_pay
  ON public.feedback_in_app(would_pay)
  WHERE would_pay IS NOT NULL;

-- ----------------------------------------------------------------------
-- RPC: el usuario puntua su propio feedback (estrellas + voluntad de pago).
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_feedback_rating(
  p_feedback_id UUID,
  p_rating SMALLINT DEFAULT NULL,
  p_would_pay TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_rating IS NOT NULL AND (p_rating < 1 OR p_rating > 5) THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  IF p_would_pay IS NOT NULL AND p_would_pay NOT IN ('yes', 'maybe', 'no') THEN
    RAISE EXCEPTION 'Invalid would_pay value';
  END IF;

  SELECT user_id INTO v_owner
  FROM public.feedback_in_app
  WHERE id = p_feedback_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Feedback not found';
  END IF;

  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.feedback_in_app
  SET app_rating = COALESCE(p_rating, app_rating),
      would_pay  = COALESCE(p_would_pay, would_pay),
      updated_at = now()
  WHERE id = p_feedback_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_feedback_rating(UUID, SMALLINT, TEXT)
  TO authenticated;

-- Cierre: nadie mas debe ejecutar esta RPC (anon/public).
REVOKE EXECUTE ON FUNCTION public.submit_feedback_rating(UUID, SMALLINT, TEXT)
  FROM PUBLIC, anon;
