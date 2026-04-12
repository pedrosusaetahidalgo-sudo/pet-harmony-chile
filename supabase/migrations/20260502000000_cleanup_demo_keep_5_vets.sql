-- ============================================================================
-- MIGRACIÓN: Limpieza de usuarios demo — conservar solo 5 vets nombrados
-- Aplicar MANUALMENTE en Supabase Dashboard > SQL Editor
-- Fecha: 2026-04-12
-- Ver: ANALISIS_LIMPIEZA_DEMO_USERS.md para contexto completo
-- ============================================================================
-- SEGURO: Solo toca datos de demo users (is_demo = true / @demo.pawfriend.cl).
--         NUNCA borra datos de usuarios reales.
--         Conserva los 5 perfiles de vets demo (DEMO001-DEMO005) y sus reseñas.
-- ============================================================================

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- PASO 0: Verificacion pre-limpieza (ejecutar y anotar resultados)
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

DO $$ BEGIN
  RAISE NOTICE '=== PRE-LIMPIEZA: Conteo de usuarios ===';
  RAISE NOTICE 'Usuarios reales: %', (SELECT COUNT(*) FROM profiles WHERE is_demo = false OR is_demo IS NULL);
  RAISE NOTICE 'Usuarios demo: %', (SELECT COUNT(*) FROM profiles WHERE is_demo = true);
  RAISE NOTICE 'Providers demo (total): %', (SELECT COUNT(*) FROM service_providers WHERE is_demo = true);
  RAISE NOTICE 'Providers demo DEMO001-005: %', (SELECT COUNT(*) FROM service_providers WHERE license_number IN ('DEMO001','DEMO002','DEMO003','DEMO004','DEMO005'));
END $$;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- PASO 1: LIMPIEZA DE USUARIOS DEMO (excluyendo los 5 vets nombrados)
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

DO $$
DECLARE
  -- UUIDs de los 5 vets demo que se CONSERVAN
  v_keep_provider_user_ids uuid[];
  -- UUIDs de los service_providers que se CONSERVAN (id, no user_id)
  v_keep_provider_ids uuid[];
  -- UUIDs de todos los demo users a ELIMINAR
  demo_uuids uuid[];
BEGIN
  RAISE NOTICE '=== INICIO LIMPIEZA DEMO (conservando 5 vets) ===';

  -- Obtener user_ids de los 5 vets demo nombrados que se conservan
  SELECT COALESCE(array_agg(user_id), ARRAY[]::uuid[]) INTO v_keep_provider_user_ids
  FROM service_providers
  WHERE license_number IN ('DEMO001','DEMO002','DEMO003','DEMO004','DEMO005');

  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO v_keep_provider_ids
  FROM service_providers
  WHERE license_number IN ('DEMO001','DEMO002','DEMO003','DEMO004','DEMO005');

  RAISE NOTICE 'Vets demo a conservar (user_ids): %', v_keep_provider_user_ids;
  RAISE NOTICE 'Vets demo a conservar (provider_ids): %', v_keep_provider_ids;

  -- Recoger TODOS los demo users EXCEPTO los vinculados a los 5 vets
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO demo_uuids
  FROM profiles
  WHERE is_demo = true
    AND id != ALL(v_keep_provider_user_ids);

  -- Tambien incluir los 8 UUIDs hardcodeados originales (solo si no son reales ni vets conservados)
  demo_uuids := demo_uuids || ARRAY(
    SELECT u.id FROM (VALUES
      ('a1b2c3d4-1111-4000-a000-000000000001'::uuid),
      ('a1b2c3d4-2222-4000-a000-000000000002'::uuid),
      ('a1b2c3d4-3333-4000-a000-000000000003'::uuid),
      ('a1b2c3d4-4444-4000-a000-000000000004'::uuid),
      ('a1b2c3d4-5555-4000-a000-000000000005'::uuid),
      ('a1b2c3d4-6666-4000-a000-000000000006'::uuid),
      ('a1b2c3d4-7777-4000-a000-000000000007'::uuid),
      ('a1b2c3d4-8888-4000-a000-000000000008'::uuid)
    ) AS u(id)
    WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id AND p.is_demo = false)
      AND u.id != ALL(v_keep_provider_user_ids)
  );

  -- Incluir emails @demo.pawfriend.cl y @demo.cl que no sean los 5 vets conservados
  demo_uuids := demo_uuids || ARRAY(
    SELECT au.id FROM auth.users au
    WHERE (au.email LIKE '%@demo.pawfriend.cl' OR au.email LIKE '%@demo.cl')
      AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = au.id AND p.is_demo = false)
      AND au.id != ALL(v_keep_provider_user_ids)
  );

  -- Dedup
  demo_uuids := ARRAY(SELECT DISTINCT unnest(demo_uuids));

  IF demo_uuids IS NULL OR array_length(demo_uuids, 1) IS NULL THEN
    RAISE NOTICE 'No hay demo users a eliminar. Saltando limpieza.';
  ELSE
    RAISE NOTICE 'Eliminando % demo users...', array_length(demo_uuids, 1);

    -- SAFETY CHECK: verificar que ningun UUID sea de usuario real
    IF EXISTS (SELECT 1 FROM profiles WHERE id = ANY(demo_uuids) AND is_demo = false) THEN
      RAISE EXCEPTION 'ABORTADO: Hay UUIDs demo que pertenecen a usuarios reales (is_demo=false). Revisar manualmente.';
    END IF;

    -- SAFETY CHECK: verificar que no estamos borrando los 5 vets conservados
    IF EXISTS (SELECT 1 FROM unnest(demo_uuids) d(id) WHERE d.id = ANY(v_keep_provider_user_ids)) THEN
      RAISE EXCEPTION 'ABORTADO: Se intenta borrar un user vinculado a los 5 vets demo conservados.';
    END IF;

    -- ============================================================
    -- ELIMINACION EN ORDEN DE DEPENDENCIAS (hoja -> raiz)
    -- ============================================================

    -- 1. Notificaciones
    DELETE FROM notifications WHERE user_id = ANY(demo_uuids);

    -- 2. Notas clinicas vet (via share tokens)
    DELETE FROM vet_clinical_notes
    WHERE share_token_id IN (SELECT id FROM medical_share_tokens WHERE owner_id = ANY(demo_uuids));

    -- 3. Share tokens
    DELETE FROM medical_share_tokens WHERE owner_id = ANY(demo_uuids);

    -- 4. Service promotions
    DELETE FROM service_promotions WHERE user_id = ANY(demo_uuids);

    -- 5. Mission progress
    DELETE FROM user_mission_progress WHERE user_id = ANY(demo_uuids);

    -- 6. User badges
    DELETE FROM user_paw_badges WHERE user_id = ANY(demo_uuids);

    -- 7. Pet activities + cheers
    DELETE FROM pet_activity_cheers WHERE activity_id IN (SELECT id FROM pet_activities WHERE owner_id = ANY(demo_uuids));
    DELETE FROM pet_activity_cheers WHERE user_id = ANY(demo_uuids);
    DELETE FROM pet_activities WHERE owner_id = ANY(demo_uuids);

    -- 8. User activities
    DELETE FROM user_activities WHERE user_id = ANY(demo_uuids);

    -- 9. Chat (solo entre demo users — no borrar conversaciones con usuarios reales)
    DELETE FROM messages WHERE conversation_id IN (
      SELECT id FROM conversations
      WHERE participant1_id = ANY(demo_uuids) AND participant2_id = ANY(demo_uuids)
    );
    DELETE FROM conversations
    WHERE participant1_id = ANY(demo_uuids) AND participant2_id = ANY(demo_uuids);

    -- Limpiar mensajes huerfanos de demo users en convos con reales
    DELETE FROM messages WHERE sender_id = ANY(demo_uuids);

    -- Limpiar convos donde un participante es demo (pero no borrar mensajes del real)
    DELETE FROM conversations
    WHERE participant1_id = ANY(demo_uuids) OR participant2_id = ANY(demo_uuids);

    -- 10. Social
    DELETE FROM user_follows WHERE follower_id = ANY(demo_uuids) OR following_id = ANY(demo_uuids);
    DELETE FROM post_likes WHERE user_id = ANY(demo_uuids);
    DELETE FROM post_likes WHERE post_id IN (SELECT id FROM posts WHERE user_id = ANY(demo_uuids));
    DELETE FROM post_comments WHERE user_id = ANY(demo_uuids);
    DELETE FROM post_comments WHERE post_id IN (SELECT id FROM posts WHERE user_id = ANY(demo_uuids));
    DELETE FROM posts WHERE user_id = ANY(demo_uuids);

    -- 11. Vet service prices de providers demo (NO los 5 conservados)
    DELETE FROM vet_service_prices
    WHERE is_estimate = true
      AND provider_id IN (
        SELECT id FROM service_providers
        WHERE is_demo = true
          AND id != ALL(v_keep_provider_ids)
      );

    -- 12. Shop redemptions
    DELETE FROM user_shop_redemptions WHERE user_id = ANY(demo_uuids);

    -- 13. Service reviews de providers demo (NO los 5 conservados)
    DELETE FROM service_reviews
    WHERE reviewer_id = ANY(demo_uuids)
      AND provider_id != ALL(v_keep_provider_ids);

    -- Tambien reviews HECHAS POR demo users a providers reales
    DELETE FROM service_reviews WHERE reviewer_id = ANY(demo_uuids);

    -- 14. Medical records
    DELETE FROM medical_records WHERE owner_id = ANY(demo_uuids);

    -- 15. Pet reminders
    DELETE FROM pet_reminders WHERE owner_id = ANY(demo_uuids);

    -- 16. Paw point transactions
    DELETE FROM paw_point_transactions WHERE user_id = ANY(demo_uuids);

    -- 17. Guardian progress
    DELETE FROM user_guardian_progress WHERE user_id = ANY(demo_uuids);

    -- 18. User stats
    DELETE FROM user_stats WHERE user_id = ANY(demo_uuids);

    -- 19. Adoption
    DELETE FROM adoption_interests WHERE interested_user_id = ANY(demo_uuids);
    DELETE FROM adoption_interests WHERE adoption_post_id IN (SELECT id FROM adoption_posts WHERE user_id = ANY(demo_uuids));
    DELETE FROM adoption_posts WHERE user_id = ANY(demo_uuids);

    -- 20. Adoption shelters demo
    DELETE FROM adoption_shelters WHERE name LIKE '%Demo%' OR name LIKE '%demo%';

    -- 21. Lost pets
    DELETE FROM lost_pets WHERE reporter_id = ANY(demo_uuids);

    -- 22. Bookings (tabla puede no existir)
    BEGIN
      DELETE FROM bookings WHERE user_id = ANY(demo_uuids);
      DELETE FROM bookings WHERE provider_id IN (
        SELECT user_id FROM service_providers WHERE is_demo = true AND id != ALL(v_keep_provider_ids)
      );
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    -- 23. Service slots de providers demo (NO los 5 conservados)
    BEGIN
      DELETE FROM service_slots WHERE provider_id IN (
        SELECT id FROM service_providers WHERE is_demo = true AND id != ALL(v_keep_provider_ids)
      );
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    -- 24. Review invitations de providers demo (NO los 5 conservados)
    DELETE FROM review_invitations WHERE provider_id IN (
      SELECT id FROM service_providers WHERE is_demo = true AND id != ALL(v_keep_provider_ids)
    );

    -- 25. Specialized profiles
    DELETE FROM groomer_profiles WHERE user_id = ANY(demo_uuids);
    DELETE FROM dog_walker_profiles WHERE user_id = ANY(demo_uuids);
    DELETE FROM trainer_profiles WHERE user_id = ANY(demo_uuids);
    DELETE FROM dogsitter_profiles WHERE user_id = ANY(demo_uuids);

    -- 26. Paw cards de pets demo
    BEGIN
      DELETE FROM paw_cards WHERE pet_id IN (SELECT id FROM pets WHERE owner_id = ANY(demo_uuids));
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    -- 27. Pets
    DELETE FROM pets WHERE owner_id = ANY(demo_uuids);

    -- 28. Service providers demo (NO los 5 conservados)
    DELETE FROM service_providers
    WHERE user_id = ANY(demo_uuids)
      AND id != ALL(v_keep_provider_ids);

    -- 29. Profiles demo
    DELETE FROM profiles WHERE id = ANY(demo_uuids);

    -- 30. Auth users demo
    DELETE FROM auth.users WHERE id = ANY(demo_uuids);

    RAISE NOTICE 'Eliminados % demo users exitosamente.', array_length(demo_uuids, 1);
  END IF;

  -- ============================================================
  -- RECONCILIAR: Actualizar contadores de providers reales + conservados
  -- ============================================================
  UPDATE service_providers sp
  SET total_reviews = sub.cnt, avg_rating = sub.avg_r
  FROM (
    SELECT provider_id, COUNT(*) AS cnt, AVG(rating)::NUMERIC(3,2) AS avg_r
    FROM service_reviews GROUP BY provider_id
  ) sub
  WHERE sp.id = sub.provider_id;

  UPDATE service_providers
  SET total_reviews = 0, avg_rating = NULL
  WHERE id NOT IN (SELECT DISTINCT provider_id FROM service_reviews WHERE provider_id IS NOT NULL)
    AND (total_reviews > 0 OR avg_rating IS NOT NULL);

  RAISE NOTICE '=== LIMPIEZA DEMO COMPLETA (5 vets conservados) ===';
END $$;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- PASO 2: Verificacion post-limpieza
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

DO $$ BEGIN
  RAISE NOTICE '=== POST-LIMPIEZA: Verificacion ===';
  RAISE NOTICE 'Usuarios reales restantes: %', (SELECT COUNT(*) FROM profiles WHERE is_demo = false OR is_demo IS NULL);
  RAISE NOTICE 'Usuarios demo restantes: %', (SELECT COUNT(*) FROM profiles WHERE is_demo = true);
  RAISE NOTICE 'Providers demo restantes (total): %', (SELECT COUNT(*) FROM service_providers WHERE is_demo = true);
  RAISE NOTICE 'Vets DEMO001-005 OK: %', (SELECT COUNT(*) FROM service_providers WHERE license_number IN ('DEMO001','DEMO002','DEMO003','DEMO004','DEMO005'));
  RAISE NOTICE 'Posts restantes: %', (SELECT COUNT(*) FROM posts);
  RAISE NOTICE 'Pets restantes: %', (SELECT COUNT(*) FROM pets);
END $$;

-- Verificar los 5 vets conservados
SELECT display_name, license_number, commune, provider_type, avg_rating, total_reviews, status
FROM service_providers
WHERE license_number IN ('DEMO001','DEMO002','DEMO003','DEMO004','DEMO005')
ORDER BY license_number;

-- Verificar que NO quedan providers demo genericos
SELECT COUNT(*) AS providers_demo_genericos_restantes
FROM service_providers
WHERE is_demo = true
  AND license_number NOT IN ('DEMO001','DEMO002','DEMO003','DEMO004','DEMO005');

-- Verificar integridad: no hay posts huerfanos
SELECT COUNT(*) AS posts_huerfanos
FROM posts po
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = po.user_id);

-- Verificar que funciones/triggers criticos existen
-- (generate-medical-summary es Edge Function Deno, no SQL RPC)
-- (ranking publico es policy RLS en user_guardian_progress, no funcion)
SELECT proname FROM pg_proc WHERE proname IN (
  'apply_premium',
  'generate_provider_slug',
  'get_medical_summary_data',
  'generate_paw_card_id_on_insert'
) ORDER BY proname;
