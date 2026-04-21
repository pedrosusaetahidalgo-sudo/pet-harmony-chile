-- ══════════════════════════════════════════════════════════════
-- Smoke test post-migracion — Paw Friend
-- ══════════════════════════════════════════════════════════════
-- Prevencion #1 (2026-04-21, raiz del bug de "crear mascota").
--
-- Que hace: ejercita los triggers criticos en pets + pet_reminders +
-- pet_co_owners + payment_events con fixtures realistas. Si algun
-- CHECK constraint o trigger choca, la ejecucion aborta inmediatamente
-- con el error exacto — sabes el bug ANTES que un usuario real.
--
-- Como correr:
--   Supabase Dashboard > SQL Editor > pegar este archivo entero > Run.
--
-- Cuando correr:
--   DESPUES de aplicar cualquier migracion que:
--     - Modifica una tabla con triggers INSERT (pets, pet_co_owners,
--       bookings, payment_events)
--     - Crea triggers nuevos
--     - Cambia CHECK constraints
--
-- Caracteristicas:
--   - TODO dentro de BEGIN/ROLLBACK. No deja rastros.
--   - Si algun test falla, el RAISE EXCEPTION + ROLLBACK limpia.
--   - Si todos pasan, veras "TODOS LOS SMOKE TESTS PASARON" al final.
--
-- Nota: el trigger new_pet_drip_d0 puede encolar un email en drip_queue,
-- pero el ROLLBACK lo revierte. Los tests NO mandan emails reales.
-- ══════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
  v_owner_id UUID;
  v_pet_id UUID;
  v_reminder_count INT;
  v_deworming_count INT;
  v_antiparasitic_count INT;
BEGIN
  -- Usar un owner existente (cualquier profile no-demo). Evita tener
  -- que crear un auth.users temporal (FK constraint).
  SELECT id INTO v_owner_id FROM profiles WHERE is_demo IS NOT TRUE LIMIT 1;
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'SMOKE SETUP: no hay profiles en DB. Ejecutar con al menos 1 user real.';
  END IF;
  RAISE NOTICE 'Usando owner_id = %', v_owner_id;

  -- ──────────────────────────────────────────────────────────────
  -- Test 1: perro ADULTO con birth_date
  -- Ejercita: generate_full_vaccine_schedule (insert reminders de
  -- refuerzos + antiparasitarios con type='deworming' y 'antiparasitic')
  -- ──────────────────────────────────────────────────────────────
  INSERT INTO pets (owner_id, name, species, birth_date, is_public)
  VALUES (
    v_owner_id,
    '__SMOKE_PerroAdulto_' || substr(md5(random()::text), 1, 4),
    'perro',
    '2023-01-15',
    true
  )
  RETURNING id INTO v_pet_id;

  SELECT count(*) INTO v_reminder_count
    FROM pet_reminders WHERE pet_id = v_pet_id;
  SELECT count(*) INTO v_deworming_count
    FROM pet_reminders WHERE pet_id = v_pet_id AND type = 'deworming';
  SELECT count(*) INTO v_antiparasitic_count
    FROM pet_reminders WHERE pet_id = v_pet_id AND type = 'antiparasitic';

  IF v_reminder_count = 0 THEN
    RAISE EXCEPTION 'SMOKE FAIL #1: perro adulto no genero reminders';
  END IF;
  IF v_deworming_count = 0 THEN
    RAISE EXCEPTION 'SMOKE FAIL #1: no se crearon reminders type=deworming (CHECK constraint roto?)';
  END IF;
  IF v_antiparasitic_count = 0 THEN
    RAISE EXCEPTION 'SMOKE FAIL #1: no se crearon reminders type=antiparasitic';
  END IF;
  RAISE NOTICE 'OK #1 perro adulto: % reminders (% deworming, % antiparasitic)',
    v_reminder_count, v_deworming_count, v_antiparasitic_count;

  -- ──────────────────────────────────────────────────────────────
  -- Test 2: gato CACHORRO (< 4 semanas)
  -- Ejercita generate_full_vaccine_schedule con serie inicial.
  -- ──────────────────────────────────────────────────────────────
  INSERT INTO pets (owner_id, name, species, birth_date, is_public)
  VALUES (
    v_owner_id,
    '__SMOKE_GatoCachorro_' || substr(md5(random()::text), 1, 4),
    'gato',
    CURRENT_DATE - 30,
    true
  )
  RETURNING id INTO v_pet_id;

  SELECT count(*) INTO v_reminder_count
    FROM pet_reminders WHERE pet_id = v_pet_id;
  IF v_reminder_count = 0 THEN
    RAISE EXCEPTION 'SMOKE FAIL #2: gato cachorro no genero reminders';
  END IF;
  RAISE NOTICE 'OK #2 gato cachorro: % reminders', v_reminder_count;

  -- ──────────────────────────────────────────────────────────────
  -- Test 3: pet SIN birth_date. El trigger tiene WHEN que lo skipea;
  -- pero el INSERT base debe pasar sin triggers de vacuna.
  -- ──────────────────────────────────────────────────────────────
  INSERT INTO pets (owner_id, name, species, is_public)
  VALUES (
    v_owner_id,
    '__SMOKE_SinBirth_' || substr(md5(random()::text), 1, 4),
    'perro',
    true
  )
  RETURNING id INTO v_pet_id;
  RAISE NOTICE 'OK #3 pet sin birth_date: INSERT pasa (trigger vacuna skipea)';

  -- ──────────────────────────────────────────────────────────────
  -- Test 4: species 'otro' con birth_date. WHEN del trigger no cumple.
  -- Cubre el caso Paw Cards + auto_paw_card_id + updated_at.
  -- ──────────────────────────────────────────────────────────────
  INSERT INTO pets (owner_id, name, species, birth_date, is_public)
  VALUES (
    v_owner_id,
    '__SMOKE_Conejo_' || substr(md5(random()::text), 1, 4),
    'otro',
    '2024-01-01',
    true
  );
  RAISE NOTICE 'OK #4 species=otro con birth_date: INSERT pasa';

  -- ──────────────────────────────────────────────────────────────
  -- Test 5: pet_co_owners insert. Ejercita trigger
  -- notify_co_owner_on_invite (mig 20260721000000). Self-invite
  -- (user_id=invited_by) evita notificar pero el INSERT debe pasar.
  -- ──────────────────────────────────────────────────────────────
  INSERT INTO pet_co_owners (
    pet_id, user_id, role, permissions, invited_by, invited_email, status
  )
  VALUES (
    v_pet_id,
    v_owner_id,
    'co_owner',
    ARRAY['view_record', 'add_records', 'edit_pet'],
    v_owner_id,
    '__smoke_test@nomail.cl',
    'pending'
  );
  RAISE NOTICE 'OK #5 pet_co_owners INSERT: trigger notify_co_owner_on_invite no rompe';

  -- ──────────────────────────────────────────────────────────────
  -- Test 6: payment_events idempotencia (P0-2, mig 20260713000000)
  -- ──────────────────────────────────────────────────────────────
  INSERT INTO payment_events (flow_token, status_code, payload_summary)
  VALUES (
    '__SMOKE_token_' || substr(md5(random()::text), 1, 6),
    2,
    '{"smoke": true}'::jsonb
  );
  RAISE NOTICE 'OK #6 payment_events INSERT pasa';

  -- ──────────────────────────────────────────────────────────────
  -- Test 7: ip_request_quota RPC (P0-3, mig 20260713000001)
  -- ──────────────────────────────────────────────────────────────
  PERFORM public.check_and_increment_ip_quota(
    '__smoke.1.2.3.4'::text, 'log_error', 30, 60
  );
  RAISE NOTICE 'OK #7 check_and_increment_ip_quota RPC ejecuta sin error';

  -- ──────────────────────────────────────────────────────────────
  -- Test 8: user_can_receive_notification RPC (D.4, mig 20260723000000)
  -- ──────────────────────────────────────────────────────────────
  PERFORM public.user_can_receive_notification(
    v_owner_id, 'transactional', 'push'
  );
  RAISE NOTICE 'OK #8 user_can_receive_notification RPC ejecuta sin error';

  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════';
  RAISE NOTICE '  TODOS LOS SMOKE TESTS PASARON (8/8)';
  RAISE NOTICE '══════════════════════════════════════════════';
END $$;

ROLLBACK;

-- ──────────────────────────────────────────────────────────────
-- Verificacion final: NO debe haber residuos. Los counts son = 0.
-- ──────────────────────────────────────────────────────────────
SELECT
  (SELECT count(*) FROM pets WHERE name LIKE '__SMOKE_%') AS residuo_pets,
  (SELECT count(*) FROM pet_reminders
     WHERE pet_id IN (SELECT id FROM pets WHERE name LIKE '__SMOKE_%')) AS residuo_reminders,
  (SELECT count(*) FROM pet_co_owners WHERE invited_email LIKE '__smoke%') AS residuo_co_owners,
  (SELECT count(*) FROM payment_events WHERE flow_token LIKE '__SMOKE_%') AS residuo_events,
  (SELECT count(*) FROM ip_request_quota WHERE ip LIKE '__smoke%') AS residuo_ip_quota;
-- Todos deben ser 0. Si no, el ROLLBACK no limpio algo.
