-- ==========================================================================
-- Fix: approve_verification_request debe aceptar 'aprobado'/'rechazado'.
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-18):
-- El enum en DB tiene CHECK (status IN ('pendiente','aprobado','rechazado')).
-- El RPC original hacia IF p_status = 'approved' (ingles) para conceder
-- el rol. Resultado: nunca se concedia rol y si el UI mandaba 'approved'
-- el CHECK constraint rechazaba el UPDATE.
--
-- Fix escalable: aceptar ambos valores (legacy + nuevo) y normalizar a
-- espanol antes del UPDATE. Es idempotente y retrocompatible — edge
-- functions existentes que manden cualquiera de los dos siguen
-- funcionando.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.approve_verification_request(
  p_request_id UUID,
  p_reviewer_id UUID,
  p_status TEXT,   -- 'aprobado' | 'rechazado' (o legacy 'approved' | 'rejected')
  p_user_id UUID,
  p_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized_status TEXT;
BEGIN
  IF NOT is_active_admin(p_reviewer_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Normalizar a espanol (enum real). Acepta ingles por retrocompat.
  v_normalized_status := CASE
    WHEN p_status IN ('aprobado', 'approved') THEN 'aprobado'
    WHEN p_status IN ('rechazado', 'rejected') THEN 'rechazado'
    ELSE NULL
  END;

  IF v_normalized_status IS NULL THEN
    RAISE EXCEPTION 'Invalid status: %. Expected aprobado or rechazado.', p_status;
  END IF;

  UPDATE verification_requests
  SET status = v_normalized_status,
      reviewed_at = now(),
      reviewed_by = p_reviewer_id
  WHERE id = p_request_id;

  -- Grant role solo si aprobado
  IF v_normalized_status = 'aprobado' THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, p_role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN TRUE;
END;
$$;
