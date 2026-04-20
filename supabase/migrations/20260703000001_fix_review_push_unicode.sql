-- ==========================================================================
-- Fix: unicode escapes literales en send_pending_review_pushes
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20):
-- La migracion 20260703000000_review_push_and_device_cleanup.sql se
-- aplico con los caracteres escapados literalmente (\u00f1a en vez de ña,
-- \u00bf en vez de ¿). Resultado: los push salen con texto roto estilo
-- "Deja tu rese\u00f1a para...".
--
-- Este patch reemplaza la funcion con el texto UTF-8 correcto.
-- No cambia logica — solo copy de title/body.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.send_pending_review_pushes()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending RECORD;
  v_count_sent INT := 0;
  v_count_skipped INT := 0;
  v_vet_name TEXT;
  v_pet_name TEXT;
  v_title TEXT;
  v_body TEXT;
BEGIN
  FOR v_pending IN
    SELECT pr.id, pr.user_id, pr.target_user_id, pr.pet_id, pr.transaction_id
    FROM public.pending_reviews pr
    WHERE pr.completed_at IS NULL
      AND pr.notification_sent_at IS NULL
      AND pr.created_at BETWEEN (NOW() - INTERVAL '48 hours')
                           AND (NOW() - INTERVAL '24 hours')
      AND pr.expires_at > NOW()
      AND EXISTS (
        SELECT 1 FROM public.device_tokens dt
        WHERE dt.user_id = pr.user_id AND dt.enabled = TRUE
      )
  LOOP
    SELECT COALESCE(display_name, 'tu veterinario') INTO v_vet_name
      FROM public.profiles WHERE id = v_pending.target_user_id;
    SELECT name INTO v_pet_name FROM public.pets WHERE id = v_pending.pet_id;

    v_title := '¿Cómo fue la consulta?';
    v_body := 'Deja tu reseña para ' || v_vet_name
              || CASE WHEN v_pet_name IS NOT NULL THEN ' (consulta de ' || v_pet_name || ')' ELSE '' END
              || '. Ayuda a otros dueños.';

    BEGIN
      PERFORM net.http_post(
        url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'user_ids', jsonb_build_array(v_pending.user_id::text),
          'title', v_title,
          'body', v_body,
          'data', jsonb_build_object(
            'route', '/home',
            'pending_review_id', v_pending.id::text,
            'kind', 'review_pending'
          )
        )
      );

      UPDATE public.pending_reviews
      SET notification_sent_at = NOW()
      WHERE id = v_pending.id;

      v_count_sent := v_count_sent + 1;
    EXCEPTION WHEN OTHERS THEN
      v_count_skipped := v_count_skipped + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'sent', v_count_sent,
    'skipped', v_count_skipped,
    'ran_at', NOW()
  );
END;
$$;

COMMENT ON FUNCTION public.send_pending_review_pushes() IS
  'Push a usuarios con pending_review creada hace 24-48h sin notificacion y sin completar. Fix unicode 2026-04-20.';
