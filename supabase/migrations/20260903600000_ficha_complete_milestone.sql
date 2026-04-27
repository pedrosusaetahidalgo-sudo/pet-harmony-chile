-- ══════════════════════════════════════════════════════════════════════════
-- Ficha completa milestone (celebracion §14.bis.6 owner-side)
-- ══════════════════════════════════════════════════════════════════════════
-- RPC idempotente que el frontend llama cuando detecta que la mascota
-- cruzo el threshold "ficha completa". Si no se otorgo antes:
--   1. Inserta evento timeline tipo milestone con metadata event_kind=ficha_complete
--   2. Otorga 50 paw_points al owner via award_points_atomic
--   3. Devuelve already_awarded=false + points=50
-- Si ya se otorgo (existe evento previo), devuelve already_awarded=true sin
-- duplicar nada.
--
-- DB-side garantiza que solo se otorga UNA vez por mascota, sin importar
-- cuantas veces el frontend llame al RPC (ej: si LS se limpia).
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.claim_ficha_complete_milestone(p_pet_id UUID)
RETURNS TABLE (
  already_awarded BOOLEAN,
  points_awarded INT,
  qualifies BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_pet_name TEXT;
  v_event_count INT;
  v_category_count INT;
  v_has_id_card BOOLEAN;
  v_already_awarded BOOLEAN;
BEGIN
  -- 1. Validar que el caller es owner del pet
  SELECT owner_id, name INTO v_owner, v_pet_name
  FROM public.pets
  WHERE id = p_pet_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Pet not found';
  END IF;
  IF v_owner != auth.uid() THEN
    RAISE EXCEPTION 'Only owner can claim milestone';
  END IF;

  -- 2. Verificar threshold
  SELECT
    (SELECT COUNT(*)::INT FROM public.pet_timeline_events WHERE pet_id = p_pet_id),
    (SELECT COUNT(DISTINCT category)::INT FROM public.pet_timeline_events WHERE pet_id = p_pet_id),
    EXISTS (SELECT 1 FROM public.pet_id_cards WHERE pet_id = p_pet_id)
  INTO v_event_count, v_category_count, v_has_id_card;

  IF NOT (v_event_count >= 10 AND v_category_count >= 3 AND v_has_id_card) THEN
    RETURN QUERY SELECT FALSE, 0, FALSE;
    RETURN;
  END IF;

  -- 3. Idempotencia: existe evento ficha_complete previo?
  SELECT EXISTS (
    SELECT 1 FROM public.pet_timeline_events
    WHERE pet_id = p_pet_id
      AND data->>'event_kind' = 'ficha_complete'
  ) INTO v_already_awarded;

  IF v_already_awarded THEN
    RETURN QUERY SELECT TRUE, 0, TRUE;
    RETURN;
  END IF;

  -- 4. Insertar evento milestone
  INSERT INTO public.pet_timeline_events (
    pet_id, category, title, description, event_at,
    source, is_milestone, is_user_reported, recorded_by, data
  ) VALUES (
    p_pet_id,
    'milestone',
    FORMAT('Ficha completa de %s ✨', v_pet_name),
    FORMAT(
      '%s ya tiene historia rica: %s eventos en %s categorias + Pet ID Card. ' ||
      'Es la cota minima del proyecto Paw Friend (§14.bis.6).',
      v_pet_name, v_event_count, v_category_count
    ),
    NOW(),
    'auto_trigger',
    TRUE,
    FALSE,
    v_owner,
    jsonb_build_object(
      'auto_generated', true,
      'event_kind', 'ficha_complete',
      'event_count_at_milestone', v_event_count,
      'category_count_at_milestone', v_category_count
    )
  );

  -- 5. Otorgar 50 paw points (idempotente porque solo entra acá si no
  --    existia evento previo)
  PERFORM public.award_points_atomic(
    v_owner,
    50,
    'ficha_complete_milestone',
    'earn'
  );

  RETURN QUERY SELECT FALSE, 50, TRUE;
END $$;

REVOKE ALL ON FUNCTION public.claim_ficha_complete_milestone(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_ficha_complete_milestone(UUID) TO authenticated;

COMMENT ON FUNCTION public.claim_ficha_complete_milestone(UUID) IS
  'Refactor Maestro §14.bis.6 owner-side. Otorga UNA vez por pet 50 paw_points '
  '+ evento timeline cuando ficha cruza threshold (>=10 eventos / >=3 cats / '
  'Pet ID Card). Idempotente DB-side. Solo el owner puede llamar.';

COMMIT;

DO $$
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'claim_ficha_complete_milestone';
  IF NOT FOUND THEN RAISE EXCEPTION 'claim_ficha_complete_milestone no creada'; END IF;
  RAISE NOTICE 'Smoke test OK: ficha_complete milestone RPC';
END $$;
