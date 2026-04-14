-- DELETE policy para vet_clinical_notes + UNIQUE en subscriptions + RPC atómico para puntos
-- Hallazgo de auditoría backend 2026-04-14

-- =============================================
-- 1. DELETE policies para vet_clinical_notes
-- =============================================

-- El dueño puede borrar notas de sus mascotas
CREATE POLICY "Pet owner can delete vet notes"
  ON public.vet_clinical_notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = vet_clinical_notes.pet_id
        AND pets.owner_id = auth.uid()
    )
  );

-- El proveedor puede borrar sus propias notas
CREATE POLICY "Provider can delete own notes"
  ON public.vet_clinical_notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE service_providers.id = vet_clinical_notes.provider_id
        AND service_providers.user_id = auth.uid()
    )
  );

-- =============================================
-- 2. UNIQUE constraint en subscriptions para idempotencia de pagos
-- =============================================
-- Evita doble cobro por race condition en flow-create-subscription
-- Primero limpiar duplicados pending antiguos (mantener solo el más reciente)
DELETE FROM public.subscriptions s
WHERE s.status = 'pending'
  AND s.id NOT IN (
    SELECT DISTINCT ON (user_id, plan_type) id
    FROM public.subscriptions
    WHERE status = 'pending'
    ORDER BY user_id, plan_type, created_at DESC
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_plan_pending
  ON public.subscriptions (user_id, plan_type)
  WHERE status = 'pending';

-- =============================================
-- 3. RPC atómico para award_points (evita race condition)
-- =============================================
CREATE OR REPLACE FUNCTION public.award_points_atomic(
  p_user_id UUID,
  p_points INT,
  p_action TEXT,
  p_transaction_type TEXT DEFAULT 'earn'
)
RETURNS TABLE(awarded BOOLEAN, points INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar transacción
  INSERT INTO paw_point_transactions (user_id, points_amount, transaction_type, source_type)
  VALUES (p_user_id, p_points, p_transaction_type, p_action);

  -- Actualizar contador atómicamente (sin read-then-write)
  INSERT INTO user_guardian_progress (user_id, total_paw_points)
  VALUES (p_user_id, p_points)
  ON CONFLICT (user_id)
  DO UPDATE SET total_paw_points = user_guardian_progress.total_paw_points + EXCLUDED.total_paw_points;

  RETURN QUERY SELECT TRUE, p_points;
END;
$$;
