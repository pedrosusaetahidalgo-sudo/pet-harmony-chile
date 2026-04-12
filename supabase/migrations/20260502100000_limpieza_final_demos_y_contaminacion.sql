-- ============================================================================
-- MIGRACIÓN FINAL: Limpieza de usuarios demo @demo.cl + testcheck99
--                  + provider falso en cuenta de Pedro
-- Aplicar MANUALMENTE en Supabase Dashboard > SQL Editor
-- Fecha: 2026-04-12
-- ============================================================================
-- SEGURO: Solo toca usuarios demo confirmados y un provider falso en cuenta real.
--         NO toca: vetsofiarossi, psusaetah13, ni ningun otro usuario real.
-- ============================================================================

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- PASO 0: DIAGNOSTICO — ejecutar primero para verificar antes de borrar
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

DO $$ BEGIN
  RAISE NOTICE '=== DIAGNOSTICO PRE-LIMPIEZA ===';
  RAISE NOTICE 'Usuarios @demo.cl: %', (SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@demo.cl');
  RAISE NOTICE 'testcheck99: %', (SELECT COUNT(*) FROM auth.users WHERE email = 'testcheck99@test.cl');
  RAISE NOTICE 'Providers DEMO001-005: %', (SELECT COUNT(*) FROM service_providers WHERE license_number IN ('DEMO001','DEMO002','DEMO003','DEMO004','DEMO005'));
  RAISE NOTICE 'Provider en pedro.susaeta.hidalgo: %', (
    SELECT COALESCE(sp.display_name, 'NINGUNO')
    FROM auth.users au
    LEFT JOIN service_providers sp ON sp.user_id = au.id
    WHERE au.email = 'pedro.susaeta.hidalgo@gmail.com'
    LIMIT 1
  );
  RAISE NOTICE 'Total usuarios antes: %', (SELECT COUNT(*) FROM auth.users);
  RAISE NOTICE 'Total providers antes: %', (SELECT COUNT(*) FROM service_providers);
END $$;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- PASO 1: LIMPIAR PROVIDER FALSO DE PEDRO (sin tocar su usuario)
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

DO $$
DECLARE
  v_pedro_id uuid;
  v_pedro_provider_id uuid;
  v_pedro_provider_name text;
BEGIN
  SELECT au.id INTO v_pedro_id
  FROM auth.users au WHERE au.email = 'pedro.susaeta.hidalgo@gmail.com';

  IF v_pedro_id IS NULL THEN
    RAISE NOTICE 'Pedro no encontrado, saltando.';
    RETURN;
  END IF;

  SELECT sp.id, sp.display_name INTO v_pedro_provider_id, v_pedro_provider_name
  FROM service_providers sp WHERE sp.user_id = v_pedro_id;

  IF v_pedro_provider_id IS NULL THEN
    RAISE NOTICE 'Pedro no tiene provider, nada que limpiar.';
    RETURN;
  END IF;

  RAISE NOTICE 'Limpiando provider falso de Pedro: "%" (id: %)', v_pedro_provider_name, v_pedro_provider_id;

  -- Borrar datos vinculados al provider falso de Pedro
  DELETE FROM vet_service_prices WHERE provider_id = v_pedro_provider_id;
  DELETE FROM service_reviews WHERE provider_id = v_pedro_provider_id;
  DELETE FROM review_invitations WHERE provider_id = v_pedro_provider_id;
  DELETE FROM service_promotions WHERE user_id = v_pedro_id;

  BEGIN
    DELETE FROM service_slots WHERE provider_id = v_pedro_provider_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  BEGIN
    DELETE FROM bookings WHERE provider_id = v_pedro_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- Borrar perfiles especializados falsos si existen
  DELETE FROM groomer_profiles WHERE user_id = v_pedro_id;
  DELETE FROM dog_walker_profiles WHERE user_id = v_pedro_id;
  DELETE FROM trainer_profiles WHERE user_id = v_pedro_id;
  DELETE FROM dogsitter_profiles WHERE user_id = v_pedro_id;

  -- Borrar notas clinicas vinculadas al provider
  DELETE FROM vet_clinical_notes WHERE provider_id = v_pedro_id;

  -- Finalmente borrar el service_provider
  DELETE FROM service_providers WHERE id = v_pedro_provider_id;

  RAISE NOTICE 'Provider falso de Pedro eliminado. Su cuenta, mascotas y datos reales intactos.';
END $$;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- PASO 2: BORRAR LOS 8 USUARIOS @demo.cl + testcheck99 (completos)
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

DO $$
DECLARE
  v_delete_uuids uuid[];
BEGIN
  -- Recoger los 8 @demo.cl + testcheck99
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO v_delete_uuids
  FROM auth.users
  WHERE email LIKE '%@demo.cl'
     OR email = 'testcheck99@test.cl';

  IF v_delete_uuids IS NULL OR array_length(v_delete_uuids, 1) IS NULL THEN
    RAISE NOTICE 'No hay usuarios demo/@demo.cl/test a eliminar.';
    RETURN;
  END IF;

  RAISE NOTICE 'Eliminando % usuarios (8 @demo.cl + testcheck99)...', array_length(v_delete_uuids, 1);

  -- SAFETY: verificar que NO estamos tocando usuarios protegidos
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = ANY(v_delete_uuids)
      AND email IN (
        'pedro.susaeta.hidalgo@gmail.com',
        'psusaetah13@gmail.com',
        'p.susaeta95@gmail.com',
        'pawfriendcl@gmail.com',
        'vetsofiarossi@gmail.com',
        'anitasusaeta@gmail.com',
        'antosusaeta@gmail.com',
        'rsusaeta@gmail.com'
      )
  ) THEN
    RAISE EXCEPTION 'ABORTADO: Se intenta borrar un usuario protegido (Susaeta/Sofia).';
  END IF;

  -- ============================================================
  -- ELIMINACION EN ORDEN DE DEPENDENCIAS
  -- ============================================================

  -- 1. Notificaciones
  DELETE FROM notifications WHERE user_id = ANY(v_delete_uuids);

  -- 2. Notas clinicas vet
  DELETE FROM vet_clinical_notes
  WHERE share_token_id IN (SELECT id FROM medical_share_tokens WHERE owner_id = ANY(v_delete_uuids));
  DELETE FROM vet_clinical_notes WHERE provider_id = ANY(v_delete_uuids);

  -- 3. Share tokens
  DELETE FROM medical_share_tokens WHERE owner_id = ANY(v_delete_uuids);

  -- 4. Service promotions
  DELETE FROM service_promotions WHERE user_id = ANY(v_delete_uuids);

  -- 5. Mission progress
  DELETE FROM user_mission_progress WHERE user_id = ANY(v_delete_uuids);

  -- 6. User badges
  DELETE FROM user_paw_badges WHERE user_id = ANY(v_delete_uuids);

  -- 7. Pet activities + cheers
  DELETE FROM pet_activity_cheers WHERE activity_id IN (SELECT id FROM pet_activities WHERE owner_id = ANY(v_delete_uuids));
  DELETE FROM pet_activity_cheers WHERE user_id = ANY(v_delete_uuids);
  DELETE FROM pet_activities WHERE owner_id = ANY(v_delete_uuids);

  -- 8. User activities
  DELETE FROM user_activities WHERE user_id = ANY(v_delete_uuids);

  -- 9. Chat
  DELETE FROM messages WHERE conversation_id IN (
    SELECT id FROM conversations
    WHERE participant1_id = ANY(v_delete_uuids) OR participant2_id = ANY(v_delete_uuids)
  );
  DELETE FROM conversations
  WHERE participant1_id = ANY(v_delete_uuids) OR participant2_id = ANY(v_delete_uuids);

  -- 10. Social
  DELETE FROM user_follows WHERE follower_id = ANY(v_delete_uuids) OR following_id = ANY(v_delete_uuids);
  DELETE FROM post_likes WHERE user_id = ANY(v_delete_uuids);
  DELETE FROM post_likes WHERE post_id IN (SELECT id FROM posts WHERE user_id = ANY(v_delete_uuids));
  DELETE FROM post_comments WHERE user_id = ANY(v_delete_uuids);
  DELETE FROM post_comments WHERE post_id IN (SELECT id FROM posts WHERE user_id = ANY(v_delete_uuids));
  DELETE FROM posts WHERE user_id = ANY(v_delete_uuids);

  -- 11. Vet service prices
  DELETE FROM vet_service_prices WHERE provider_id IN (
    SELECT id FROM service_providers WHERE user_id = ANY(v_delete_uuids)
  );

  -- 12. Shop redemptions
  DELETE FROM user_shop_redemptions WHERE user_id = ANY(v_delete_uuids);

  -- 13. Service reviews (como reviewer Y como provider)
  DELETE FROM service_reviews WHERE reviewer_id = ANY(v_delete_uuids);
  DELETE FROM service_reviews WHERE provider_id IN (
    SELECT id FROM service_providers WHERE user_id = ANY(v_delete_uuids)
  );

  -- 14. Medical records
  DELETE FROM medical_records WHERE owner_id = ANY(v_delete_uuids);

  -- 15. Pet reminders
  DELETE FROM pet_reminders WHERE owner_id = ANY(v_delete_uuids);

  -- 16. Paw point transactions
  DELETE FROM paw_point_transactions WHERE user_id = ANY(v_delete_uuids);

  -- 17. Guardian progress
  DELETE FROM user_guardian_progress WHERE user_id = ANY(v_delete_uuids);

  -- 18. User stats
  DELETE FROM user_stats WHERE user_id = ANY(v_delete_uuids);

  -- 19. Adoption
  DELETE FROM adoption_interests WHERE interested_user_id = ANY(v_delete_uuids);
  DELETE FROM adoption_interests WHERE adoption_post_id IN (SELECT id FROM adoption_posts WHERE user_id = ANY(v_delete_uuids));
  DELETE FROM adoption_posts WHERE user_id = ANY(v_delete_uuids);

  -- 20. Lost pets
  DELETE FROM lost_pets WHERE reporter_id = ANY(v_delete_uuids);

  -- 21. Bookings
  BEGIN
    DELETE FROM bookings WHERE user_id = ANY(v_delete_uuids);
    DELETE FROM bookings WHERE provider_id IN (
      SELECT user_id FROM service_providers WHERE user_id = ANY(v_delete_uuids)
    );
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- 22. Service slots
  BEGIN
    DELETE FROM service_slots WHERE provider_id IN (
      SELECT id FROM service_providers WHERE user_id = ANY(v_delete_uuids)
    );
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- 23. Review invitations
  DELETE FROM review_invitations WHERE provider_id IN (
    SELECT id FROM service_providers WHERE user_id = ANY(v_delete_uuids)
  );

  -- 24. Specialized profiles
  DELETE FROM groomer_profiles WHERE user_id = ANY(v_delete_uuids);
  DELETE FROM dog_walker_profiles WHERE user_id = ANY(v_delete_uuids);
  DELETE FROM trainer_profiles WHERE user_id = ANY(v_delete_uuids);
  DELETE FROM dogsitter_profiles WHERE user_id = ANY(v_delete_uuids);

  -- 25. Paw cards
  BEGIN
    DELETE FROM paw_cards WHERE pet_id IN (SELECT id FROM pets WHERE owner_id = ANY(v_delete_uuids));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- 26. Pets
  DELETE FROM pets WHERE owner_id = ANY(v_delete_uuids);

  -- 27. Service providers
  DELETE FROM service_providers WHERE user_id = ANY(v_delete_uuids);

  -- 28. Profiles
  DELETE FROM profiles WHERE id = ANY(v_delete_uuids);

  -- 29. Auth users
  DELETE FROM auth.users WHERE id = ANY(v_delete_uuids);

  RAISE NOTICE 'Eliminados % usuarios demo/test exitosamente.', array_length(v_delete_uuids, 1);
END $$;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- PASO 3: LIMPIAR PROVIDERS DEMO HUERFANOS (DEMO001-005 que puedan quedar)
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

DO $$
DECLARE
  v_orphan_count int;
BEGIN
  -- Reviews de providers DEMO huerfanos
  DELETE FROM service_reviews WHERE provider_id IN (
    SELECT id FROM service_providers WHERE license_number LIKE 'DEMO%'
  );
  DELETE FROM vet_service_prices WHERE provider_id IN (
    SELECT id FROM service_providers WHERE license_number LIKE 'DEMO%'
  );
  DELETE FROM review_invitations WHERE provider_id IN (
    SELECT id FROM service_providers WHERE license_number LIKE 'DEMO%'
  );

  DELETE FROM service_providers WHERE license_number LIKE 'DEMO%';
  GET DIAGNOSTICS v_orphan_count = ROW_COUNT;

  IF v_orphan_count > 0 THEN
    RAISE NOTICE 'Eliminados % providers DEMO huerfanos.', v_orphan_count;
  ELSE
    RAISE NOTICE 'No habia providers DEMO huerfanos.';
  END IF;
END $$;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- PASO 4: RECONCILIAR contadores de providers reales
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

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

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- PASO 5: VERIFICACION POST-LIMPIEZA
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

DO $$ BEGIN
  RAISE NOTICE '=== VERIFICACION POST-LIMPIEZA ===';
  RAISE NOTICE 'Total usuarios: %', (SELECT COUNT(*) FROM auth.users);
  RAISE NOTICE 'Usuarios @demo.cl restantes: %', (SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@demo.cl');
  RAISE NOTICE 'testcheck99 restante: %', (SELECT COUNT(*) FROM auth.users WHERE email = 'testcheck99@test.cl');
  RAISE NOTICE 'Providers DEMO restantes: %', (SELECT COUNT(*) FROM service_providers WHERE license_number LIKE 'DEMO%');
  RAISE NOTICE 'Pedro tiene provider: %', (
    SELECT COUNT(*) FROM service_providers sp
    JOIN auth.users au ON au.id = sp.user_id
    WHERE au.email = 'pedro.susaeta.hidalgo@gmail.com'
  );
  RAISE NOTICE 'Sofia Rossi intacta: %', (
    SELECT COUNT(*) FROM service_providers sp
    JOIN auth.users au ON au.id = sp.user_id
    WHERE au.email = 'vetsofiarossi@gmail.com'
  );
  RAISE NOTICE 'psusaetah13 intacto: %', (
    SELECT COUNT(*) FROM service_providers sp
    JOIN auth.users au ON au.id = sp.user_id
    WHERE au.email = 'psusaetah13@gmail.com'
  );
END $$;

-- Verificacion visual: todos los usuarios que quedan
SELECT au.email, p.display_name, p.is_admin,
       EXISTS(SELECT 1 FROM service_providers sp WHERE sp.user_id = au.id) AS tiene_provider
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
ORDER BY au.email;
