-- ============================================================================
-- MIGRACIÓN UNIFICADA: Limpieza total de demo/seed + re-seed 100 usuarios
-- Reemplaza las migraciones seed fragmentadas en una sola query ejecutable
-- Aplicar MANUALMENTE en Supabase Dashboard > SQL Editor
-- ============================================================================

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- PARTE 1: LIMPIEZA TOTAL DE DATOS DEMO/SEED
-- SEGURO: Solo toca datos de demo users o catálogos reemplazables.
--         NUNCA borra datos de usuarios reales.
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

DO $$
DECLARE
  demo_uuids uuid[];
BEGIN
  RAISE NOTICE '=== INICIO LIMPIEZA DEMO ===';

  -- Recoger TODOS los demo users (no solo los 8 originales)
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO demo_uuids
  FROM profiles WHERE is_demo = true;

  -- También incluir los 8 UUIDs hardcodeados originales (solo si no son usuarios reales)
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
  );

  -- Incluir emails @demo.pawfriend.cl (solo si son demo o no tienen perfil)
  demo_uuids := demo_uuids || ARRAY(
    SELECT au.id FROM auth.users au
    WHERE au.email LIKE '%@demo.pawfriend.cl'
      AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = au.id AND p.is_demo = false)
  );

  -- Dedup
  demo_uuids := ARRAY(SELECT DISTINCT unnest(demo_uuids));

  IF demo_uuids IS NULL OR array_length(demo_uuids, 1) IS NULL THEN
    RAISE NOTICE 'No hay demo users previos. Saltando limpieza.';
  ELSE
    RAISE NOTICE 'Limpiando % demo users...', array_length(demo_uuids, 1);

    -- SAFETY: verificar que ningún UUID sea de usuario real
    IF EXISTS (SELECT 1 FROM profiles WHERE id = ANY(demo_uuids) AND is_demo = false) THEN
      RAISE EXCEPTION 'ABORTADO: Hay UUIDs demo que pertenecen a usuarios reales (is_demo=false).';
    END IF;

    -- 1. Notificaciones
    DELETE FROM notifications WHERE user_id = ANY(demo_uuids);

    -- 2. Notas clínicas vet
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

    -- 9. Activities catalog: solo si no hay user_activities reales
    IF NOT EXISTS (SELECT 1 FROM user_activities LIMIT 1) THEN
      DELETE FROM activities;
    END IF;

    -- 10. Chat (solo entre demo users)
    DELETE FROM messages WHERE conversation_id IN (
      SELECT id FROM conversations WHERE participant1_id = ANY(demo_uuids) AND participant2_id = ANY(demo_uuids)
    );
    DELETE FROM conversations WHERE participant1_id = ANY(demo_uuids) AND participant2_id = ANY(demo_uuids);

    -- 11. Social
    DELETE FROM user_follows WHERE follower_id = ANY(demo_uuids);
    DELETE FROM post_likes WHERE user_id = ANY(demo_uuids);
    DELETE FROM post_likes WHERE post_id IN (SELECT id FROM posts WHERE user_id = ANY(demo_uuids));
    DELETE FROM post_comments WHERE user_id = ANY(demo_uuids);
    DELETE FROM post_comments WHERE post_id IN (SELECT id FROM posts WHERE user_id = ANY(demo_uuids));
    DELETE FROM posts WHERE user_id = ANY(demo_uuids);

    -- 12. Vet service prices (estimados de providers demo)
    DELETE FROM vet_service_prices WHERE is_estimate = true
      AND provider_id IN (SELECT id FROM service_providers WHERE is_demo = true);

    -- 13. Shop redemptions + rewards sin canjes reales
    DELETE FROM user_shop_redemptions WHERE user_id = ANY(demo_uuids);
    DELETE FROM paw_shop_rewards
    WHERE (partner_name IN ('Paw Friend','Tiendas partner','Refugios aliados') OR partner_name IS NULL)
      AND id NOT IN (SELECT DISTINCT reward_id FROM user_shop_redemptions WHERE user_id != ALL(demo_uuids));

    -- 14. Missions sin progreso real
    DELETE FROM paw_missions
    WHERE id NOT IN (
      SELECT DISTINCT mission_id FROM user_mission_progress
      WHERE user_id != ALL(demo_uuids) AND mission_id IS NOT NULL
    );

    -- 15. Badges sin asignaciones reales
    DELETE FROM paw_badges
    WHERE id NOT IN (
      SELECT DISTINCT badge_id FROM user_paw_badges
      WHERE user_id != ALL(demo_uuids) AND badge_id IS NOT NULL
    );

    -- 16. Consultation templates del sistema
    DELETE FROM consultation_templates WHERE is_system = TRUE;

    -- 17. Service reviews de demo users
    DELETE FROM service_reviews WHERE reviewer_id = ANY(demo_uuids);

    -- 18. Medical records de demo users
    DELETE FROM medical_records WHERE owner_id = ANY(demo_uuids);

    -- 19. Pet reminders de demo users
    DELETE FROM pet_reminders WHERE owner_id = ANY(demo_uuids);

    -- 20. Paw point transactions de demo users
    DELETE FROM paw_point_transactions WHERE user_id = ANY(demo_uuids);

    -- 21. Guardian progress de demo users
    DELETE FROM user_guardian_progress WHERE user_id = ANY(demo_uuids);

    -- 22. User stats de demo users
    DELETE FROM user_stats WHERE user_id = ANY(demo_uuids);

    -- 23. Adoption posts + interests de demo users
    DELETE FROM adoption_interests WHERE interested_user_id = ANY(demo_uuids);
    DELETE FROM adoption_interests WHERE adoption_post_id IN (SELECT id FROM adoption_posts WHERE user_id = ANY(demo_uuids));
    DELETE FROM adoption_posts WHERE user_id = ANY(demo_uuids);

    -- 24. Adoption shelters demo (por nombre)
    DELETE FROM adoption_shelters WHERE name LIKE '%Demo%' OR name LIKE '%demo%';

    -- 25. Lost pets de demo users
    DELETE FROM lost_pets WHERE reporter_id = ANY(demo_uuids);

    -- 26. Bookings de demo users (tabla puede no existir si fue creada manual)
    BEGIN
      DELETE FROM bookings WHERE user_id = ANY(demo_uuids);
      DELETE FROM bookings WHERE provider_id IN (SELECT user_id FROM service_providers WHERE is_demo = true);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    -- 27. Service slots de demo providers (tabla puede no existir)
    BEGIN
      DELETE FROM service_slots WHERE provider_id IN (SELECT id FROM service_providers WHERE is_demo = true);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    -- 28. Review invitations de demo providers
    DELETE FROM review_invitations WHERE provider_id IN (SELECT id FROM service_providers WHERE is_demo = true);

    -- 29. Specialized profiles de demo users
    DELETE FROM groomer_profiles WHERE user_id = ANY(demo_uuids);
    DELETE FROM dog_walker_profiles WHERE user_id = ANY(demo_uuids);
    DELETE FROM trainer_profiles WHERE user_id = ANY(demo_uuids);
    DELETE FROM dogsitter_profiles WHERE user_id = ANY(demo_uuids);

    -- 30. Guardian levels (catálogo, reinsertable)
    -- Solo borrar si no hay user_guardian_progress real
    IF NOT EXISTS (SELECT 1 FROM user_guardian_progress WHERE user_id != ALL(demo_uuids) LIMIT 1) THEN
      DELETE FROM guardian_levels;
    END IF;

    -- 31. Pets de demo users
    DELETE FROM pets WHERE owner_id = ANY(demo_uuids);

    -- 32. Service providers demo
    DELETE FROM service_providers WHERE user_id = ANY(demo_uuids);

    -- 33. Profiles demo
    DELETE FROM profiles WHERE id = ANY(demo_uuids);

    -- 25. Auth users demo
    DELETE FROM auth.users WHERE id = ANY(demo_uuids);

    -- 26. Reconciliar reviews de providers reales
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
  END IF;

  RAISE NOTICE '=== LIMPIEZA DEMO COMPLETA ===';
END $$;


-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- PARTE 2: RE-SEED COMPLETO — 100 usuarios demo con datos realistas
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- A. CHECK CONSTRAINT para 10 tipos de servicio vet
ALTER TABLE vet_service_prices DROP CONSTRAINT IF EXISTS vet_service_prices_service_type_check;
ALTER TABLE vet_service_prices ADD CONSTRAINT vet_service_prices_service_type_check
  CHECK (service_type IN (
    'consulta_general','vacuna','desparasitacion','cirugia_menor','peluqueria',
    'urgencia','teleconsulta','control_sano','esterilizacion','limpieza_dental'
  ));

-- B. Desactivar TODOS los triggers de usuario en tablas que causan problemas durante el seed
ALTER TABLE pets DISABLE TRIGGER USER;
ALTER TABLE vet_clinical_notes DISABLE TRIGGER USER;

-- ============================================================
-- C. CREAR 100 DEMO USERS + PROFILES + PETS + PROVIDERS + TODO
-- ============================================================
DO $$
DECLARE
  -- Arrays de datos chilenos
  v_first_names text[] := ARRAY[
    'Camila','Valentina','Francisca','Isidora','Catalina','Javiera','Fernanda',
    'Constanza','Antonia','Sofía','Martina','Florencia','Emilia','Agustina',
    'Josefa','Macarena','Carolina','Daniela','Alejandra','Bárbara',
    'Gabriela','Paula','Natalia','Rocío','Trinidad',
    'Matías','Sebastián','Nicolás','Tomás','Benjamín','Vicente','Diego',
    'Joaquín','Martín','Felipe','Ignacio','Cristóbal','Alonso','Agustín',
    'Renato','Lucas','Gabriel','Francisco','Pedro','Andrés',
    'Pablo','Daniel','Eduardo','Rodrigo','Maximiliano'
  ];
  v_last_names text[] := ARRAY[
    'Silva','Rojas','Muñoz','Díaz','Lagos','Herrera','Parra','González',
    'Rodríguez','López','Martínez','Hernández','Torres','Flores','Rivera',
    'Vargas','Castillo','Morales','Ortiz','Gutiérrez','Contreras','Soto',
    'Reyes','Ramírez','Fuentes','Bravo','Campos','Sandoval','Tapia','Vega',
    'Espinoza','Araya','Cárdenas','Figueroa','Núñez','Sepúlveda','Vera',
    'Valenzuela','Riquelme','Bustos','Navarro','Peña','Molina','Jara','Leiva',
    'Vergara','Aravena','Acuña','Pizarro','Meza'
  ];
  v_communes text[] := ARRAY[
    'Las Condes','Vitacura','Lo Barnechea','Providencia','Ñuñoa','La Reina',
    'Santiago','Recoleta','Independencia','Macul','San Miguel',
    'Maipú','La Florida','Puente Alto','Peñalolén','San Bernardo',
    'Huechuraba','Quilicura','Cerrillos','Estación Central'
  ];
  v_dog_breeds text[] := ARRAY[
    'Labrador','Golden Retriever','Pastor Alemán','Bulldog Francés','Poodle',
    'Chihuahua','Mestizo','Schnauzer','Beagle','Dachshund',
    'Cocker Spaniel','Border Collie','Husky Siberiano','Rottweiler',
    'Yorkshire','Boxer','Pug','Shih Tzu','Jack Russell','Pitbull'
  ];
  v_cat_breeds text[] := ARRAY[
    'Mestizo','Siamés','Persa','Angora','Ragdoll',
    'Maine Coon','Bengalí','Sphynx','British Shorthair','Scottish Fold'
  ];
  v_dog_names text[] := ARRAY[
    'Luna','Rocky','Thor','Max','Canela','Toby','Lola','Nala','Rex','Coco',
    'Buddy','Bella','Zeus','Mía','Rufus','Oso','Copito','Chispita',
    'Roco','Princesa','Otto','Kira','Bobby','Simba','Tango',
    'Fiona','Duke','Sasha','Romeo','Laika','Rayo','Nina','Brisa',
    'Charly','Duna','Bingo','Pepa','Rambo','Indie','Koda'
  ];
  v_cat_names text[] := ARRAY[
    'Miso','Mora','Café','Michifú','Salem','Michi','Bigotes','Felix',
    'Garfield','Pantera','Cleo','Milo','Oreo','Whiskers','Gatina',
    'Peluchín','Manchas','Nieve','Sombra','Misu'
  ];
  v_post_texts text[] := ARRAY[
    'Consejo: nunca le des chocolate a tu perro, es tóxico para ellos!',
    'Hoy cumple años mi peludo! Feliz cumpleaños campeón!',
    'Alguien conoce un buen vet en la zona? Necesito llevar a mi mascota.',
    'Aprendió a dar la patita! Estoy tan orgullosa.',
    'Los gatos son los mejores compañeros para trabajar desde casa.',
    'Sesión de fotos en el parque. Este peludo es pura fotogenia!',
    'Tip: la paciencia es la clave del entrenamiento. 15 min al día.',
    'Encontró un amigo nuevo en el parque! Qué sociable.',
    'Nadando en la piscina del tío. Ama el agua!',
    'Recordatorio: la desparasitación interna se hace cada 3 meses.',
    'Adoptar fue la mejor decisión de nuestras vidas.',
    'Después de 10km, los dos estamos muertos. Pero felices.',
    'Mi gato se sentó en el teclado otra vez. No me deja trabajar!',
    'Primer día en la playa. Le encantó correr por la arena.',
    'Vacunas al día! Mascota protegida es mascota feliz.',
    'Probamos un nuevo alimento y le encantó. Recomendado.',
    'Hoy fuimos al veterinario. Todo perfecto en el control anual.',
    'Descubrimos un sendero nuevo para pasear. Vista increíble!',
    'Mi mascota hace las mejores caras cuando duerme.',
    'Consejo: siempre lleva agua cuando salgas a pasear con tu perro.',
    'Celebrando 1 año juntos. El mejor compañero que pude pedir.',
    'Tip de peluquería: cepilla a tu mascota al menos 2 veces por semana.',
    'Hoy aprendimos un truco nuevo. Cada día más inteligente!',
    'Mañana de paseo. No hay mejor forma de empezar el día.',
    'Jugando en el parque con nuevos amigos. La socialización es clave.',
    'Mi gato me trajo un "regalo". Gracias... supongo.',
    'Control veterinario completo. El doc dice que está perfecto.',
    'Probando juguetes nuevos. Este fue el ganador!',
    'Día lluvioso = película + mascota en el sofá.',
    'Entrenamiento de obediencia va increíble. Muy orgulloso.',
    'Le pusimos su disfraz para Halloween. Queda ridículamente tierno.',
    'Mi mascota predice el clima mejor que la tele.',
    'Hoy rescatamos un gatito de la calle. Ya tiene hogar!',
    'Paseo grupal con los vecinos y sus mascotas. Muy buena onda.',
    'Tip: revisa las almohadillas de tu perro después de paseos largos.',
    'Primer corte de pelo profesional. Quedó como modelo!',
    'Mi mascota me mira así cuando estoy comiendo. Imposible resistirse.',
    'Día de spa para mi peludo. Se lo merece.',
    'Registro de peso: va perfecto según el vet. Buen trabajo!',
    'Atardecer con mi mejor amigo de 4 patas. Momentos así no tienen precio.'
  ];
  v_comment_texts text[] := ARRAY[
    'Qué tierno! Me encanta esa foto.',
    'Buenísimo el consejo, mucha gente no sabe eso.',
    'Mi mascota casi tuvo un susto así una vez.',
    'Felicidades! Se merece un premio especial.',
    'Los mejores compañeros, sin duda.',
    'Tremenda foto! Qué lindo peludo.',
    'Muy de acuerdo! Con el mío practicamos todos los días.',
    'Buen tip! Lo voy a probar.',
    'Jajaja los perros y el agua, una combinación perfecta!',
    'Gracias por el recordatorio! Se me había pasado.',
    'Hermosos! Adoptar siempre es la mejor opción.',
    'Qué envidia! Yo apenas logro sacar al mío.',
    'Recomiendo la clínica de Irarrázaval, son muy buenos.',
    'Super tierno! Me alegra ver mascotas felices.',
    'Buen dato! Voy a probar esa marca.',
    'Qué grande está! Crecen tan rápido.',
    'Me encanta esta comunidad. Todos aman a sus mascotas.',
    'Ese paseo se ve increíble! Dónde es?',
    'Mi peludo también hace eso jaja.',
    'Precioso! Se nota que lo cuidas mucho.',
    'Excelente! La salud preventiva es lo más importante.',
    'Quiero uno igual! Son hermosos.',
    'Totalmente de acuerdo. La paciencia es clave.',
    'Qué buena onda! Me gustaría ir al próximo paseo grupal.',
    'Se ve muy feliz! Eso es lo que importa.'
  ];
  v_activity_types text[] := ARRAY['walk','vet_visit','vaccine','grooming','weight_check'];
  v_activity_titles text[][] := ARRAY[
    ARRAY['Paseo matutino','Paseo al parque','Caminata por el barrio','Paseo al río','Paseo largo'],
    ARRAY['Control anual','Revisión general','Consulta de rutina','Chequeo preventivo','Visita de emergencia'],
    ARRAY['Vacuna antirrábica','Vacuna séxtuple','Refuerzo de vacuna','Vacuna triple felina','Desparasitación'],
    ARRAY['Baño completo','Corte de pelo','Baño y corte','Cepillado profesional','Spa day'],
    ARRAY['Control de peso mensual','Pesaje de rutina','Registro de peso','Control nutricional','Medición mensual']
  ];
  -- v_specialties inlined como CASE en el INSERT de service_providers

  -- Variables de trabajo
  v_user_id uuid;
  v_pet_id uuid;
  v_pet_id2 uuid;
  v_post_id uuid;
  v_provider_id uuid;
  v_conv_id uuid;
  v_fname text;
  v_lname text;
  v_display_name text;
  v_email text;
  v_commune text;
  v_num_pets int;
  v_species text;
  v_breed text;
  v_pet_name text;
  v_gender text;
  v_is_provider boolean;
  v_badge_id uuid;
  v_mission_id uuid;
  v_reward_id uuid;

  -- Colecciones para relaciones inter-usuario
  v_all_users uuid[] := ARRAY[]::uuid[];
  v_all_pets uuid[] := ARRAY[]::uuid[];
  v_all_pet_owners uuid[] := ARRAY[]::uuid[];
  v_all_posts uuid[] := ARRAY[]::uuid[];
  v_all_post_owners uuid[] := ARRAY[]::uuid[];
  v_all_providers uuid[] := ARRAY[]::uuid[];
  v_all_provider_ids uuid[] := ARRAY[]::uuid[];

  i int;
  j int;
  k int;
  v_target_user uuid;
  v_idx int;

BEGIN
  RAISE NOTICE '=== INICIO SEED 100 USUARIOS ===';

  -- ============================================================
  -- PASO 1: Crear 100 usuarios en auth.users + profiles
  -- ============================================================
  FOR i IN 1..100 LOOP
    v_user_id := gen_random_uuid();
    v_fname := v_first_names[1 + (i-1) % array_length(v_first_names, 1)];
    v_lname := v_last_names[1 + (i-1) % array_length(v_last_names, 1)];
    v_display_name := v_fname || ' ' || v_lname;
    v_email := lower(replace(v_fname,'á','a')) || '.' ||
               lower(replace(v_lname,'í','i')) || '.' ||
               i::text || '@demo.pawfriend.cl';
    -- Limpiar caracteres especiales del email
    v_email := replace(v_email, 'é', 'e');
    v_email := replace(v_email, 'ó', 'o');
    v_email := replace(v_email, 'ú', 'u');
    v_email := replace(v_email, 'ñ', 'n');
    v_email := replace(v_email, 'ü', 'u');
    v_commune := v_communes[1 + (i-1) % array_length(v_communes, 1)];

    -- Insertar en auth.users
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      v_email,
      crypt('DemoPass2026!', gen_salt('bf')),
      now() - interval '60 days' + (i * interval '6 hours'),
      jsonb_build_object('display_name', v_display_name),
      now() - interval '60 days' + (i * interval '6 hours'),
      now(),
      '', ''
    ) ON CONFLICT (id) DO NOTHING;

    -- Insertar perfil (el trigger podría crearlo, pero forzamos is_demo + puntos)
    INSERT INTO profiles (
      id, display_name, avatar_url, bio, location,
      points, level, is_premium, is_demo, created_at
    ) VALUES (
      v_user_id,
      v_display_name,
      NULL,
      CASE (i % 6)
        WHEN 0 THEN 'Amante de los animales. Rescatista en mi tiempo libre.'
        WHEN 1 THEN 'Dueño orgulloso de mascotas. Providencia, Chile.'
        WHEN 2 THEN 'Veterinario/a apasionado/a por la medicina animal.'
        WHEN 3 THEN 'Paseador/a de perros profesional. Amo mi trabajo!'
        WHEN 4 THEN 'Fotógrafo/a de mascotas. Cada peludo es una estrella.'
        ELSE 'Fanático/a de los animales. Adopta no compres!'
      END,
      v_commune,
      (i * 37 + 50) % 2000 + 100,  -- puntos entre 100-2100
      LEAST(1 + ((i * 37 + 50) % 2000) / 500, 5),  -- nivel 1-5
      (i % 5 = 0),  -- 20% premium
      true,  -- DEMO
      now() - interval '60 days' + (i * interval '6 hours')
    ) ON CONFLICT (id) DO UPDATE SET
      is_demo = true,
      display_name = EXCLUDED.display_name,
      points = EXCLUDED.points,
      level = EXCLUDED.level;

    v_all_users := v_all_users || v_user_id;

    -- ============================================================
    -- PASO 2: Crear 1-3 mascotas por usuario
    -- ============================================================
    v_num_pets := 1 + (i % 3);  -- 1, 2 o 3 mascotas

    FOR j IN 1..v_num_pets LOOP
      v_pet_id := gen_random_uuid();
      v_species := CASE WHEN (i + j) % 4 = 0 THEN 'gato' ELSE 'perro' END;
      v_gender := CASE WHEN (i + j) % 2 = 0 THEN 'macho' ELSE 'hembra' END;

      IF v_species = 'perro' THEN
        v_breed := v_dog_breeds[1 + ((i*3 + j) % array_length(v_dog_breeds, 1))];
        v_pet_name := v_dog_names[1 + ((i*5 + j*3) % array_length(v_dog_names, 1))];
      ELSE
        v_breed := v_cat_breeds[1 + ((i*3 + j) % array_length(v_cat_breeds, 1))];
        v_pet_name := v_cat_names[1 + ((i*5 + j*3) % array_length(v_cat_names, 1))];
      END IF;

      INSERT INTO pets (
        id, owner_id, name, species, breed, birth_date, gender,
        weight, neutered, is_public, vaccination_status,
        activity_level, living_environment,
        created_at
      ) VALUES (
        v_pet_id, v_user_id, v_pet_name, v_species, v_breed,
        CURRENT_DATE - ((1 + (i*7+j*13) % 3650) || ' days')::interval,  -- 0-10 años
        v_gender,
        CASE WHEN v_species = 'perro' THEN 5.0 + (i % 35)::numeric ELSE 2.5 + (i % 8)::numeric END,
        (i + j) % 3 != 0,  -- 66% esterilizados
        true,
        CASE WHEN (i+j) % 5 = 0 THEN 'pending' ELSE 'up_to_date' END,
        CASE (i+j) % 3 WHEN 0 THEN 'alto' WHEN 1 THEN 'medio' ELSE 'bajo' END,
        CASE (i+j) % 3 WHEN 0 THEN 'casa con patio' WHEN 1 THEN 'departamento' ELSE 'casa' END,
        now() - interval '50 days' + (i * interval '4 hours')
      ) ON CONFLICT (id) DO NOTHING;

      v_all_pets := v_all_pets || v_pet_id;
      v_all_pet_owners := v_all_pet_owners || v_user_id;

      -- Medical records (2-4 por mascota)
      FOR k IN 1..LEAST(2 + (i % 3), 4) LOOP
        INSERT INTO medical_records (
          pet_id, owner_id, record_type, title, description,
          veterinarian_name, clinic_name, date, created_at
        ) VALUES (
          v_pet_id, v_user_id,
          CASE k % 4 WHEN 0 THEN 'vacuna' WHEN 1 THEN 'consulta' WHEN 2 THEN 'tratamiento' ELSE 'otro' END,
          CASE k % 4
            WHEN 0 THEN 'Vacuna antirrábica'
            WHEN 1 THEN 'Control general'
            WHEN 2 THEN 'Desparasitación interna'
            ELSE 'Examen de sangre'
          END,
          CASE k % 4
            WHEN 0 THEN 'Vacuna anual aplicada sin reacciones adversas.'
            WHEN 1 THEN 'Paciente en buen estado general. Peso estable.'
            WHEN 2 THEN 'Se administra antiparasitario oral. Sin efectos secundarios.'
            ELSE 'Hemograma y perfil bioquímico dentro de rangos normales.'
          END,
          'Dr. ' || v_last_names[1 + (i+k) % array_length(v_last_names, 1)],
          'Clínica ' || v_communes[1 + (i+k) % array_length(v_communes, 1)],
          CURRENT_DATE - ((k * 30 + i) || ' days')::interval,
          now() - ((k * 30 + i) || ' days')::interval
        );
      END LOOP;

      -- Pet reminders (1-2 por mascota)
      INSERT INTO pet_reminders (
        pet_id, owner_id, type, title, description,
        due_date, is_recurring, recurrence_interval
      ) VALUES (
        v_pet_id, v_user_id,
        'vaccine', 'Próxima vacuna',
        'Refuerzo de vacuna programado',
        CURRENT_DATE + ((30 + i*3) || ' days')::interval,
        true, 'yearly'
      );
      IF j = 1 THEN
        INSERT INTO pet_reminders (
          pet_id, owner_id, type, title, description,
          due_date, is_recurring, recurrence_interval
        ) VALUES (
          v_pet_id, v_user_id,
          'checkup', 'Control veterinario',
          'Control anual de rutina',
          CURRENT_DATE + ((60 + i*2) || ' days')::interval,
          true, 'yearly'
        );
      END IF;
    END LOOP;

    -- ============================================================
    -- PASO 3: Service providers (15 usuarios serán vets/proveedores)
    -- ============================================================
    v_is_provider := (i % 7 = 1);  -- ~15 providers
    IF v_is_provider THEN
      v_provider_id := gen_random_uuid();
      INSERT INTO service_providers (
        id, user_id, display_name, bio, city, commune, address,
        experience_years, status, is_verified, rating, total_reviews,
        slug, specialties, license_number, price_from,
        provider_type, is_directory_visible, provider_plan,
        is_demo, created_at
      ) VALUES (
        v_provider_id, v_user_id, v_display_name || ' Vet',
        'Médico veterinario con experiencia en pequeños animales. Atención profesional y cariñosa.',
        'Santiago', v_commune,
        'Av. Principal ' || (100 + i*10)::text || ', ' || v_commune,
        3 + (i % 15),
        'approved', true,
        3.5 + (random() * 1.5)::numeric(3,2),
        5 + (i % 20),
        'dr-' || lower(replace(replace(replace(v_fname,'á','a'),'é','e'),'í','i')) ||
          '-' || lower(replace(replace(replace(v_lname,'á','a'),'é','e'),'í','i')) || '-' || i::text,
        CASE (i % 6)
          WHEN 0 THEN ARRAY['Medicina general','Vacunación','Control preventivo']
          WHEN 1 THEN ARRAY['Cirugía menor','Esterilización','Traumatología']
          WHEN 2 THEN ARRAY['Dermatología','Alergias','Cuidado de piel']
          WHEN 3 THEN ARRAY['Cardiología','Ecografía','Medicina interna']
          WHEN 4 THEN ARRAY['Odontología','Limpieza dental','Extracciones']
          ELSE ARRAY['Medicina felina','Etología','Comportamiento']
        END,
        'VET-' || lpad(i::text, 5, '0'),
        15000 + (i % 20) * 1000,
        CASE WHEN i % 3 = 0 THEN 'clinic' ELSE 'individual' END,
        true,
        CASE (i % 4)
          WHEN 0 THEN 'provider_free'
          WHEN 1 THEN 'provider_individual'
          WHEN 2 THEN 'provider_clinic_basic'
          ELSE 'provider_clinic_pro'
        END,
        true,
        now() - interval '45 days' + (i * interval '3 hours')
      ) ON CONFLICT (user_id) DO NOTHING;

      v_all_providers := v_all_providers || v_user_id;
      v_all_provider_ids := v_all_provider_ids || v_provider_id;
    END IF;

  END LOOP;

  RAISE NOTICE 'Creados: % users, % pets, % providers',
    array_length(v_all_users, 1),
    array_length(v_all_pets, 1),
    array_length(v_all_provider_ids, 1);

  -- ============================================================
  -- PASO 4: Posts (3-5 por usuario = ~400 posts)
  -- ============================================================
  FOR i IN 1..array_length(v_all_users, 1) LOOP
    FOR j IN 1..(3 + (i % 3)) LOOP
      v_post_id := gen_random_uuid();
      INSERT INTO posts (id, user_id, pet_id, content, likes_count, comments_count, created_at)
      VALUES (
        v_post_id,
        v_all_users[i],
        -- Buscar un pet de este user
        (SELECT id FROM pets WHERE owner_id = v_all_users[i] LIMIT 1),
        v_post_texts[1 + ((i*5 + j*7) % array_length(v_post_texts, 1))],
        0,  -- se actualiza después
        0,  -- se actualiza después
        now() - ((j * 3 + i) || ' hours')::interval
      ) ON CONFLICT (id) DO NOTHING;

      v_all_posts := v_all_posts || v_post_id;
      v_all_post_owners := v_all_post_owners || v_all_users[i];
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Creados: % posts', array_length(v_all_posts, 1);

  -- ============================================================
  -- PASO 5: Likes (~2000, 5 por post en promedio para los primeros 400)
  -- ============================================================
  FOR i IN 1..LEAST(array_length(v_all_posts, 1), 400) LOOP
    FOR j IN 1..LEAST(3 + (i % 5), 7) LOOP
      v_idx := 1 + ((i * 13 + j * 7) % array_length(v_all_users, 1));
      -- No dar like a tu propio post
      IF v_all_users[v_idx] != v_all_post_owners[i] THEN
        INSERT INTO post_likes (post_id, user_id, created_at)
        VALUES (v_all_posts[i], v_all_users[v_idx], now() - ((i + j) || ' hours')::interval)
        ON CONFLICT (post_id, user_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  -- Actualizar contadores de likes
  UPDATE posts SET likes_count = (
    SELECT COUNT(*) FROM post_likes WHERE post_id = posts.id
  ) WHERE user_id = ANY(v_all_users);

  RAISE NOTICE 'Creados: likes';

  -- ============================================================
  -- PASO 6: Comments (~800, 2 por post en promedio)
  -- ============================================================
  FOR i IN 1..LEAST(array_length(v_all_posts, 1), 400) LOOP
    FOR j IN 1..(1 + (i % 3)) LOOP
      v_idx := 1 + ((i * 11 + j * 19) % array_length(v_all_users, 1));
      IF v_all_users[v_idx] != v_all_post_owners[i] THEN
        INSERT INTO post_comments (post_id, user_id, content, created_at)
        VALUES (
          v_all_posts[i],
          v_all_users[v_idx],
          v_comment_texts[1 + ((i*3 + j*5) % array_length(v_comment_texts, 1))],
          now() - ((i + j) || ' hours')::interval + interval '30 minutes'
        ) ON CONFLICT (id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  -- Actualizar contadores de comments
  UPDATE posts SET comments_count = (
    SELECT COUNT(*) FROM post_comments WHERE post_id = posts.id
  ) WHERE user_id = ANY(v_all_users);

  RAISE NOTICE 'Creados: comments';

  -- ============================================================
  -- PASO 7: Follows (~600 relaciones)
  -- ============================================================
  FOR i IN 1..100 LOOP
    -- Cada usuario sigue a 4-8 personas
    FOR j IN 1..(4 + (i % 5)) LOOP
      v_idx := 1 + ((i * 7 + j * 23) % array_length(v_all_users, 1));
      IF v_all_users[v_idx] != v_all_users[i] THEN
        INSERT INTO user_follows (follower_id, following_id, created_at)
        VALUES (v_all_users[i], v_all_users[v_idx], now() - ((i*2 + j) || ' days')::interval)
        ON CONFLICT (follower_id, following_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Creados: follows';

  -- ============================================================
  -- PASO 8: Conversations + Messages (~50 conversaciones)
  -- ============================================================
  FOR i IN 1..50 LOOP
    v_conv_id := gen_random_uuid();
    v_user_id := v_all_users[1 + ((i * 2) % 100)];
    v_target_user := v_all_users[1 + ((i * 2 + 1) % 100)];

    -- Respetar CHECK (participant1_id < participant2_id)
    IF v_user_id > v_target_user THEN
      v_pet_id := v_user_id;  -- temp swap
      v_user_id := v_target_user;
      v_target_user := v_pet_id;  -- pet_id usado como temp
    END IF;

    IF v_user_id != v_target_user THEN
      INSERT INTO conversations (id, participant1_id, participant2_id, last_message_at, created_at)
      VALUES (v_conv_id, v_user_id, v_target_user, now() - (i || ' hours')::interval, now() - (i*2 || ' days')::interval)
      ON CONFLICT (id) DO NOTHING;

      -- 3-6 mensajes por conversación
      FOR j IN 1..(3 + (i % 4)) LOOP
        INSERT INTO messages (conversation_id, sender_id, content, created_at)
        VALUES (
          v_conv_id,
          CASE WHEN j % 2 = 0 THEN v_user_id ELSE v_target_user END,
          CASE (i + j) % 8
            WHEN 0 THEN 'Hola! Cómo está tu mascota?'
            WHEN 1 THEN 'Súper bien, gracias! Ayer fuimos al vet.'
            WHEN 2 THEN 'Me alegro! El mío también necesita ir pronto.'
            WHEN 3 THEN 'Te recomiendo la clínica de la esquina, son muy buenos.'
            WHEN 4 THEN 'Gracias por el dato! Agendo esta semana.'
            WHEN 5 THEN 'Oye, quieres ir al parque con los peludos este finde?'
            WHEN 6 THEN 'Dale! El sábado me acomoda. A qué hora?'
            ELSE 'Perfecto, nos vemos a las 10. Llevo agua para los perros!'
          END,
          now() - (i*2 || ' days')::interval + (j * interval '20 minutes')
        ) ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;

  RAISE NOTICE 'Creados: conversations + messages';

  -- ============================================================
  -- PASO 9: Pet Activities (~300, 3 por usuario)
  -- ============================================================
  FOR i IN 1..100 LOOP
    FOR j IN 1..3 LOOP
      v_idx := 1 + ((i*3 + j - 1) % array_length(v_all_pets, 1));
      -- Solo si el pet pertenece a este user
      IF v_all_pet_owners[v_idx] = v_all_users[i] THEN
        INSERT INTO pet_activities (pet_id, owner_id, activity_type, title, metadata, created_at)
        VALUES (
          v_all_pets[v_idx],
          v_all_users[i],
          v_activity_types[1 + (j-1) % array_length(v_activity_types, 1)],
          v_activity_titles[1 + (j-1) % 5][1 + (i % 5)],
          jsonb_build_object('duration_min', 20 + (i % 60), 'notes', 'Actividad demo'),
          now() - ((i + j*5) || ' days')::interval
        ) ON CONFLICT (id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Creados: pet_activities';

  -- ============================================================
  -- PASO 10: Activities catalog + User Activities
  -- ============================================================
  IF NOT EXISTS (SELECT 1 FROM activities LIMIT 1) THEN
    INSERT INTO activities (id, name, description, category, points, icon)
    VALUES
      (gen_random_uuid(), 'Paseo diario',          'Sacaste a pasear a tu mascota',          'paseo',   15, 'footprints'),
      (gen_random_uuid(), 'Visita al veterinario',  'Llevaste a tu mascota al vet',           'salud',   25, 'stethoscope'),
      (gen_random_uuid(), 'Baño y peluquería',      'Tu mascota quedó regia',                 'cuidado', 20, 'scissors'),
      (gen_random_uuid(), 'Juego en el parque',     'Jugaste con tu mascota al aire libre',   'juego',   15, 'trees'),
      (gen_random_uuid(), 'Entrenamiento',          'Sesión de trucos o obediencia',          'juego',   20, 'brain');
  END IF;

  -- User activities (~200)
  FOR i IN 1..100 LOOP
    FOR j IN 1..2 LOOP
      v_idx := 1 + ((i*3 + j - 1) % array_length(v_all_pets, 1));
      IF v_all_pet_owners[v_idx] = v_all_users[i] THEN
        INSERT INTO user_activities (user_id, activity_id, pet_id, completed_at, notes)
        VALUES (
          v_all_users[i],
          (SELECT id FROM activities ORDER BY random() LIMIT 1),
          v_all_pets[v_idx],
          now() - ((i*2 + j*5) || ' days')::interval,
          'Actividad completada'
        ) ON CONFLICT (id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Creados: activities + user_activities';

  -- ============================================================
  -- PASO 11: Service Reviews (~100, para los providers)
  -- ============================================================
  IF array_length(v_all_provider_ids, 1) > 0 THEN
    FOR i IN 1..LEAST(array_length(v_all_provider_ids, 1), 15) LOOP
      -- 5-8 reviews por provider
      FOR j IN 1..(5 + (i % 4)) LOOP
        v_idx := 1 + ((i * 13 + j * 17) % array_length(v_all_users, 1));
        -- No auto-review
        IF v_all_users[v_idx] != v_all_providers[i] THEN
          INSERT INTO service_reviews (
            provider_id, reviewer_id, rating, title, comment, service_type, created_at
          ) VALUES (
            v_all_provider_ids[i],
            v_all_users[v_idx],
            3 + (j % 3),  -- rating 3-5
            CASE (j % 5)
              WHEN 0 THEN 'Excelente atención'
              WHEN 1 THEN 'Muy profesional'
              WHEN 2 THEN 'Recomendado 100%'
              WHEN 3 THEN 'Buena experiencia'
              ELSE 'Mi mascota quedó en buenas manos'
            END,
            CASE (j % 5)
              WHEN 0 THEN 'Atención muy profesional y cariñosa con mi mascota. Totalmente recomendado.'
              WHEN 1 THEN 'El doctor fue muy atento y explicó todo con claridad. Volveremos.'
              WHEN 2 THEN 'Excelente servicio, precios justos y muy buena atención al animal.'
              WHEN 3 THEN 'Buena experiencia en general. El lugar es limpio y organizado.'
              ELSE 'Mi mascota estaba nerviosa pero la trataron con mucho cariño. Gracias!'
            END,
            'booking',
            now() - ((i*5 + j*3) || ' days')::interval
          ) ON CONFLICT (id) DO NOTHING;
        END IF;
      END LOOP;
    END LOOP;

    -- Reconciliar contadores
    UPDATE service_providers sp
    SET total_reviews = sub.cnt, avg_rating = sub.avg_r
    FROM (
      SELECT provider_id, COUNT(*) AS cnt, AVG(rating)::NUMERIC(3,2) AS avg_r
      FROM service_reviews GROUP BY provider_id
    ) sub
    WHERE sp.id = sub.provider_id AND sp.is_demo = true;
  END IF;

  RAISE NOTICE 'Creados: service_reviews';

  -- ============================================================
  -- PASO 12: Vet Service Prices para providers demo
  -- ============================================================
  IF array_length(v_all_provider_ids, 1) > 0 THEN
    FOR i IN 1..array_length(v_all_provider_ids, 1) LOOP
      v_commune := (SELECT commune FROM service_providers WHERE id = v_all_provider_ids[i]);
      DECLARE
        v_tier numeric;
      BEGIN
        v_tier := CASE
          WHEN v_commune IN ('Las Condes','Vitacura','Lo Barnechea') THEN 1.40
          WHEN v_commune IN ('Providencia','Ñuñoa','La Reina') THEN 1.20
          WHEN v_commune IN ('Santiago','Recoleta','Independencia','Macul','San Miguel') THEN 1.00
          WHEN v_commune IN ('Maipú','La Florida','Puente Alto','Peñalolén') THEN 0.85
          ELSE 0.95
        END;

        INSERT INTO vet_service_prices (provider_id, service_type, price_clp, is_estimate, notes)
        VALUES
          (v_all_provider_ids[i], 'consulta_general', round(28000 * v_tier * (0.9+random()*0.2)), true, NULL),
          (v_all_provider_ids[i], 'vacuna',           round(18000 * v_tier * (0.9+random()*0.2)), true, NULL),
          (v_all_provider_ids[i], 'desparasitacion',  round(15000 * v_tier * (0.9+random()*0.2)), true, NULL),
          (v_all_provider_ids[i], 'control_sano',     round(22000 * v_tier * (0.9+random()*0.2)), true, NULL),
          (v_all_provider_ids[i], 'cirugia_menor',    round(85000 * v_tier * (0.9+random()*0.2)), true, NULL),
          (v_all_provider_ids[i], 'peluqueria',       round(25000 * v_tier * (0.9+random()*0.2)), true, NULL),
          (v_all_provider_ids[i], 'urgencia',         round(45000 * v_tier * (0.9+random()*0.2)), true, NULL),
          (v_all_provider_ids[i], 'teleconsulta',     round(15000 * v_tier * (0.9+random()*0.2)), true, NULL),
          (v_all_provider_ids[i], 'esterilizacion',   round(120000* v_tier * (0.9+random()*0.2)), true, NULL),
          (v_all_provider_ids[i], 'limpieza_dental',  round(95000 * v_tier * (0.9+random()*0.2)), true, NULL)
        ON CONFLICT (provider_id, service_type) DO NOTHING;
      END;
    END LOOP;
  END IF;

  RAISE NOTICE 'Creados: vet_service_prices';

  -- ============================================================
  -- PASO 13: Notifications (~300, 3 por usuario)
  -- ============================================================
  FOR i IN 1..100 LOOP
    INSERT INTO notifications (user_id, type, title, body, action_url, created_at)
    VALUES
      (v_all_users[i], 'reminder',
        'Recordatorio de vacuna',
        'La vacuna de tu mascota vence pronto. Agenda tu cita!',
        '/reminders', now() - ((i*2) || ' days')::interval),
      (v_all_users[i], 'social',
        'Nuevo comentario',
        'Alguien comentó en tu publicación',
        '/feed', now() - ((i) || ' days')::interval),
      (v_all_users[i],
        CASE i % 4 WHEN 0 THEN 'booking' WHEN 1 THEN 'social' WHEN 2 THEN 'reminder' ELSE 'review_received' END,
        CASE i % 4
          WHEN 0 THEN 'Reserva confirmada'
          WHEN 1 THEN 'Nuevo seguidor'
          WHEN 2 THEN 'Control pendiente'
          ELSE 'Nueva reseña recibida'
        END,
        CASE i % 4
          WHEN 0 THEN 'Tu cita veterinaria fue confirmada'
          WHEN 1 THEN 'Un usuario comenzó a seguirte'
          WHEN 2 THEN 'Tu mascota tiene un control programado'
          ELSE 'Recibiste una nueva calificación'
        END,
        CASE i % 4 WHEN 0 THEN '/mis-reservas' WHEN 1 THEN '/profile' WHEN 2 THEN '/reminders' ELSE '/provider/dashboard' END,
        now() - ((i*3) || ' hours')::interval)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Creados: notifications';

  -- ============================================================
  -- PASO 14: Guardian Progress (puntos/nivel para todos)
  -- ============================================================
  FOR i IN 1..100 LOOP
    INSERT INTO user_guardian_progress (
      user_id, current_level, total_paw_points,
      current_level_points, streak_days, last_activity_date
    ) VALUES (
      v_all_users[i],
      LEAST(1 + ((i * 37) % 2000) / 500, 5),
      (i * 37 + 50) % 2000 + 100,
      (i * 37 + 50) % 500,
      (i % 30) + 1,
      CURRENT_DATE - ((i % 7) || ' days')::interval
    ) ON CONFLICT (user_id) DO UPDATE SET
      total_paw_points = EXCLUDED.total_paw_points,
      current_level = EXCLUDED.current_level,
      streak_days = EXCLUDED.streak_days;
  END LOOP;

  -- Point transactions (~200)
  FOR i IN 1..100 LOOP
    FOR j IN 1..2 LOOP
      INSERT INTO paw_point_transactions (
        user_id, points_amount, transaction_type, source_type, description
      ) VALUES (
        v_all_users[i],
        10 + (i % 50),
        'earn',
        CASE j WHEN 1 THEN 'mission' ELSE 'activity' END,
        CASE j WHEN 1 THEN 'Misión completada' ELSE 'Actividad registrada' END
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Creados: guardian_progress + point_transactions';

  -- ============================================================
  -- PASO 15: Service Promotions (~20)
  -- ============================================================
  FOR i IN 1..LEAST(array_length(v_all_providers, 1), 15) LOOP
    INSERT INTO service_promotions (user_id, service_type, title, description, status, created_at)
    VALUES (
      v_all_providers[i],
      CASE i % 3 WHEN 0 THEN 'veterinarian' WHEN 1 THEN 'trainer' ELSE 'dog_walker' END,
      CASE i % 3
        WHEN 0 THEN 'Consulta veterinaria a domicilio'
        WHEN 1 THEN 'Adiestramiento canino personalizado'
        ELSE 'Paseos grupales por la comuna'
      END,
      CASE i % 3
        WHEN 0 THEN 'Atención profesional en la comodidad de tu hogar. Consulta general, vacunas y control preventivo.'
        WHEN 1 THEN 'Sesiones de obediencia y socialización con método positivo. Primera clase de evaluación gratis!'
        ELSE 'Paseos de 1 hora, máximo 4 perros por grupo. Incluye fotos y reporte.'
      END,
      'approved',
      now() - ((i * 3) || ' days')::interval
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Creados: service_promotions';

  -- ============================================================
  -- PASO 16: Adoption Shelters (8 refugios reales de Santiago)
  -- ============================================================
  INSERT INTO adoption_shelters (
    name, type, description, address, commune, city,
    latitude, longitude, contact_email, contact_phone,
    animal_types, is_verified, is_active
  ) VALUES
    ('Refugio Patitas Felices', 'refugio', 'Refugio dedicado al rescate y rehabilitación de perros y gatos callejeros en Santiago.', 'Av. Independencia 3456', 'Independencia', 'Santiago', -33.4200, -70.6530, 'contacto@patitasfelices.cl', '+56912345601', ARRAY['perro','gato'], true, true),
    ('Fundación Amor Animal', 'fundacion', 'Organización sin fines de lucro que promueve la adopción responsable y la esterilización.', 'Los Leones 1520', 'Providencia', 'Santiago', -33.4250, -70.6100, 'info@amoranimal.cl', '+56912345602', ARRAY['perro','gato'], true, true),
    ('ONG Rescate Urbano', 'ong', 'Rescatamos animales en situación de calle y les buscamos un hogar permanente.', 'Gran Avenida 8901', 'San Miguel', 'Santiago', -33.4950, -70.6510, 'rescate@urbano.cl', '+56912345603', ARRAY['perro','gato'], true, true),
    ('Hogar Temporal Ñuñoa', 'independiente', 'Red de hogares temporales en Ñuñoa para animales rescatados.', 'Irarrázaval 4567', 'Ñuñoa', 'Santiago', -33.4530, -70.5960, 'hogartemporal@nnoa.cl', '+56912345604', ARRAY['perro','gato'], false, true),
    ('Refugio Huellas de Amor', 'refugio', 'Refugio en La Florida especializado en perros medianos y grandes.', 'Walker Martínez 2345', 'La Florida', 'Santiago', -33.5170, -70.5880, 'huellas@amor.cl', '+56912345605', ARRAY['perro'], true, true),
    ('Gatitos sin Hogar', 'fundacion', 'Fundación dedicada exclusivamente al rescate y adopción de gatos.', 'Manuel Montt 890', 'Providencia', 'Santiago', -33.4320, -70.6080, 'gatitos@sinhogar.cl', '+56912345606', ARRAY['gato'], true, true),
    ('Refugio Puente Alto', 'refugio', 'Refugio comunitario gestionado por voluntarios en Puente Alto.', 'Concha y Toro 1234', 'Puente Alto', 'Santiago', -33.6100, -70.5760, 'refugio@puentealto.cl', '+56912345607', ARRAY['perro','gato'], false, true),
    ('Fundación Peluditos Chile', 'fundacion', 'Más de 10 años rescatando y rehabilitando animales en la RM.', 'Apoquindo 6789', 'Las Condes', 'Santiago', -33.4080, -70.5750, 'info@peluditos.cl', '+56912345608', ARRAY['perro','gato'], true, true)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Creados: adoption_shelters';

  -- ============================================================
  -- PASO 17: Adoption Posts (12 publicaciones de adopción)
  -- ============================================================
  FOR i IN 1..12 LOOP
    INSERT INTO adoption_posts (
      user_id, pet_name, species, breed, age_years, age_months,
      gender, size, description, reason_for_adoption, health_status,
      temperament, good_with_kids, good_with_dogs, good_with_cats,
      location, status, created_at
    ) VALUES (
      v_all_users[1 + ((i * 8) % array_length(v_all_users, 1))],
      CASE i
        WHEN 1 THEN 'Rulo' WHEN 2 THEN 'Manchita' WHEN 3 THEN 'Copito'
        WHEN 4 THEN 'Nena' WHEN 5 THEN 'Pirata' WHEN 6 THEN 'Mota'
        WHEN 7 THEN 'Dino' WHEN 8 THEN 'Peluchín' WHEN 9 THEN 'Estrella'
        WHEN 10 THEN 'Pancho' WHEN 11 THEN 'Maní' ELSE 'Algodón'
      END,
      CASE WHEN i % 3 = 0 THEN 'gato' ELSE 'perro' END,
      CASE WHEN i % 3 = 0 THEN 'Mestizo' ELSE
        CASE i % 5 WHEN 0 THEN 'Mestizo' WHEN 1 THEN 'Labrador' WHEN 2 THEN 'Poodle' WHEN 3 THEN 'Chihuahua' ELSE 'Bulldog Francés' END
      END,
      i % 8,  -- age_years
      (i * 3) % 12,  -- age_months
      CASE WHEN i % 2 = 0 THEN 'macho' ELSE 'hembra' END,
      CASE i % 3 WHEN 0 THEN 'pequeño' WHEN 1 THEN 'mediano' ELSE 'grande' END,
      CASE i % 4
        WHEN 0 THEN 'Rescatado de la calle, muy cariñoso y sociable. Busca familia que le dé mucho amor.'
        WHEN 1 THEN 'Dueño se muda y no puede llevarlo. Es tranquilo, vacunas al día, esterilizado.'
        WHEN 2 THEN 'Encontrado abandonado en un parque. Ya está recuperado y listo para adopción.'
        ELSE 'Cachorro rescatado, juguetón y lleno de energía. Ideal para familia con patio.'
      END,
      CASE i % 3
        WHEN 0 THEN 'Rescate de calle'
        WHEN 1 THEN 'Dueño no puede mantenerlo'
        ELSE 'Camada no planificada'
      END,
      'Sano, vacunas al día, esterilizado',
      CASE i % 3
        WHEN 0 THEN ARRAY['cariñoso','tranquilo','sociable']
        WHEN 1 THEN ARRAY['juguetón','energético','amigable']
        ELSE ARRAY['tímido','dulce','leal']
      END,
      i % 2 = 0,  -- good_with_kids
      i % 3 != 0,  -- good_with_dogs
      i % 4 = 0,  -- good_with_cats
      v_communes[1 + (i % array_length(v_communes, 1))],
      'disponible',
      now() - ((i * 3) || ' days')::interval
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Creados: adoption_posts';

  -- ============================================================
  -- PASO 18: Lost Pets (10 reportes en el mapa)
  -- ============================================================
  FOR i IN 1..10 LOOP
    INSERT INTO lost_pets (
      pet_id, reporter_id, status, report_type, pet_name, species, breed,
      description, last_seen_location, last_seen_date,
      contact_phone, latitude, longitude,
      reward_offered, is_active
    ) VALUES (
      v_all_pets[1 + (i * 7 % LEAST(array_length(v_all_pets, 1), 50))],
      v_all_pet_owners[1 + (i * 7 % LEAST(array_length(v_all_pet_owners, 1), 50))],
      CASE WHEN i <= 7 THEN 'perdida' ELSE 'encontrada' END,
      CASE WHEN i <= 7 THEN 'perdida' ELSE 'encontrada' END,
      CASE i
        WHEN 1 THEN 'Toby' WHEN 2 THEN 'Luna' WHEN 3 THEN 'Max' WHEN 4 THEN 'Miso'
        WHEN 5 THEN 'Lola' WHEN 6 THEN 'Rocky' WHEN 7 THEN 'Nala'
        WHEN 8 THEN 'Perrito café' WHEN 9 THEN 'Gata tricolor' ELSE 'Cachorro blanco'
      END,
      CASE WHEN i IN (4, 9) THEN 'gato' ELSE 'perro' END,
      CASE i % 4 WHEN 0 THEN 'Mestizo' WHEN 1 THEN 'Labrador' WHEN 2 THEN 'Poodle' ELSE 'Siamés' END,
      CASE i % 3
        WHEN 0 THEN 'Se escapó por la puerta abierta. Tiene collar azul con chapita. Muy asustadizo.'
        WHEN 1 THEN 'Se perdió durante un paseo en el parque. Responde a su nombre. Esterilizado.'
        ELSE 'No vuelve a casa hace 3 días. Tiene microchip. Cualquier info ayuda!'
      END,
      v_communes[1 + (i % array_length(v_communes, 1))],
      CURRENT_DATE - ((i * 2) || ' days')::interval,
      '+5691234' || lpad((5600 + i)::text, 4, '0'),
      -33.40 - (random() * 0.25)::numeric(8,6),
      -70.55 - (random() * 0.15)::numeric(8,6),
      i % 3 = 0,
      true
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Creados: lost_pets';

  -- ============================================================
  -- PASO 19: Service Slots + Bookings para providers demo
  --          (tablas pueden no existir si fueron creadas manual)
  -- ============================================================
  BEGIN
    IF array_length(v_all_provider_ids, 1) > 0 THEN
      FOR i IN 1..LEAST(array_length(v_all_provider_ids, 1), 10) LOOP
        FOR j IN 1..5 LOOP
          DECLARE
            v_slot_id uuid := gen_random_uuid();
            v_slot_date date := CURRENT_DATE + (j || ' days')::interval;
          BEGIN
            INSERT INTO service_slots (
              id, provider_id, slot_date, start_time, end_time,
              service_type, title, description, price, is_active
            ) VALUES (
              v_slot_id,
              v_all_provider_ids[i],
              v_slot_date,
              ('09:00'::time + (j * interval '2 hours')),
              ('10:00'::time + (j * interval '2 hours')),
              'vet',
              'Consulta general - Horario ' || j::text,
              'Consulta veterinaria general de 1 hora',
              25000 + (i * 1000),
              true
            ) ON CONFLICT (id) DO NOTHING;

            IF j % 2 = 0 THEN
              v_idx := 1 + ((i * 11 + j * 7) % array_length(v_all_users, 1));
              INSERT INTO bookings (
                slot_id, user_id, provider_id, pet_id,
                service_type, status, total_price, notes
              ) VALUES (
                v_slot_id,
                v_all_users[v_idx],
                v_all_providers[i],
                (SELECT id FROM pets WHERE owner_id = v_all_users[v_idx] LIMIT 1),
                'vet',
                CASE j % 3 WHEN 0 THEN 'confirmed' WHEN 1 THEN 'pending' ELSE 'completed' END,
                25000 + (i * 1000),
                'Reserva demo'
              ) ON CONFLICT (id) DO NOTHING;
            END IF;
          END;
        END LOOP;
      END LOOP;
    END IF;
    RAISE NOTICE 'Creados: service_slots + bookings';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'SKIP: service_slots/bookings — tablas no existen';
  END;

  -- ============================================================
  -- PASO 20: Specialized Profiles (walkers, trainers, groomers, sitters)
  -- ============================================================
  -- Users 2,12,22,32,42 = dog_walker_profiles
  FOR i IN 0..4 LOOP
    v_idx := 2 + i * 10;
    IF v_idx <= array_length(v_all_users, 1) THEN
      INSERT INTO dog_walker_profiles (
        user_id, bio, experience_years,
        coverage_zones, available_hours,
        price_per_hour, price_per_walk, max_dogs,
        services, is_verified, is_active, rating, total_walks
      ) VALUES (
        v_all_users[v_idx],
        'Paseador profesional con experiencia en razas grandes y pequeñas. Paseos seguros y divertidos.',
        2 + i,
        jsonb_build_array(jsonb_build_object('name', v_communes[1 + (i % array_length(v_communes, 1))], 'radius', 5)),
        '{"lunes":[{"start":"08:00","end":"12:00"},{"start":"15:00","end":"19:00"}],"martes":[{"start":"08:00","end":"18:00"}],"miercoles":[{"start":"08:00","end":"18:00"}]}'::jsonb,
        8000 + i * 1000,
        6000 + i * 500,
        3 + (i % 3),
        '["paseo corto","paseo largo","socialización"]'::jsonb,
        true, true,
        4.0 + (random() * 1.0)::numeric(3,2),
        20 + i * 15
      );
    END IF;
  END LOOP;

  -- Users 4,14,24,34,44 = trainer_profiles
  FOR i IN 0..4 LOOP
    v_idx := 4 + i * 10;
    IF v_idx <= array_length(v_all_users, 1) THEN
      INSERT INTO trainer_profiles (
        user_id, bio, experience_years,
        specialties, training_methods,
        price_per_session, session_duration,
        coverage_zones, available_hours,
        is_verified, is_active, rating, total_sessions
      ) VALUES (
        v_all_users[v_idx],
        'Entrenador canino certificado. Método positivo, sin castigos. Resultados garantizados.',
        3 + i * 2,
        '["obediencia básica","socialización","ansiedad por separación"]'::jsonb,
        ARRAY['refuerzo positivo','clicker training','desensibilización'],
        20000 + i * 2000,
        60,
        jsonb_build_array(jsonb_build_object('name', v_communes[1 + (i*3 % array_length(v_communes, 1))], 'radius', 8)),
        '{"lunes":[{"start":"09:00","end":"18:00"}],"miercoles":[{"start":"09:00","end":"18:00"}],"viernes":[{"start":"09:00","end":"14:00"}]}'::jsonb,
        true, true,
        4.2 + (random() * 0.8)::numeric(3,2),
        30 + i * 20
      );
    END IF;
  END LOOP;

  -- Users 6,16,26,36,46 = groomer_profiles
  FOR i IN 0..4 LOOP
    v_idx := 6 + i * 10;
    IF v_idx <= array_length(v_all_users, 1) THEN
      INSERT INTO groomer_profiles (
        user_id, business_name, bio, experience_years,
        base_price_clp, services_offered,
        accepts_cats, accepts_dogs, accepts_long_hair, mobile_service,
        city, commune, status, avg_rating, total_services
      ) VALUES (
        v_all_users[v_idx],
        'Peluquería ' || (SELECT display_name FROM profiles WHERE id = v_all_users[v_idx]),
        'Peluquería profesional para mascotas. Baño, corte, limpieza de oídos y uñas.',
        2 + i * 2,
        15000 + i * 3000,
        ARRAY['baño','corte','limpieza de oídos','corte de uñas','desenredo'],
        i % 2 = 0, true, true, i % 3 = 0,
        'Santiago',
        v_communes[1 + (i*4 % array_length(v_communes, 1))],
        'approved',
        4.0 + (random() * 1.0)::numeric(3,2),
        15 + i * 10
      );
    END IF;
  END LOOP;

  -- Users 8,18,28,38,48 = dogsitter_profiles
  FOR i IN 0..4 LOOP
    v_idx := 8 + i * 10;
    IF v_idx <= array_length(v_all_users, 1) THEN
      INSERT INTO dogsitter_profiles (
        user_id, bio, experience_years,
        home_type, has_yard, max_dogs,
        accepts_puppies, accepts_senior_dogs,
        price_per_night, price_per_day,
        available_hours, coverage_zones,
        is_verified, is_active, rating, total_bookings
      ) VALUES (
        v_all_users[v_idx],
        'Cuidadora de mascotas con casa amplia y patio. Tu peludo se sentirá como en casa.',
        1 + i * 2,
        CASE i % 2 WHEN 0 THEN 'casa' ELSE 'departamento' END,
        i % 2 = 0,
        2 + (i % 3),
        true, true,
        18000 + i * 2000,
        12000 + i * 1500,
        '{"lunes":[{"start":"07:00","end":"22:00"}],"martes":[{"start":"07:00","end":"22:00"}],"sabado":[{"start":"08:00","end":"20:00"}]}'::jsonb,
        jsonb_build_array(jsonb_build_object('name', v_communes[1 + (i*5 % array_length(v_communes, 1))], 'radius', 5)),
        true, true,
        3.8 + (random() * 1.2)::numeric(3,2),
        10 + i * 8
      );
    END IF;
  END LOOP;

  RAISE NOTICE 'Creados: specialized profiles (walkers, trainers, groomers, sitters)';

  -- ============================================================
  -- PASO 21: Medical Share Tokens + Vet Clinical Notes
  -- ============================================================
  IF array_length(v_all_provider_ids, 1) > 0 THEN
    FOR i IN 1..LEAST(20, array_length(v_all_users, 1)) LOOP
      DECLARE
        v_share_token_id uuid := gen_random_uuid();
        v_pet uuid;
      BEGIN
        SELECT id INTO v_pet FROM pets WHERE owner_id = v_all_users[i] LIMIT 1;
        IF v_pet IS NOT NULL THEN
          INSERT INTO medical_share_tokens (
            id, pet_id, owner_id, token,
            expires_at, is_revoked
          ) VALUES (
            v_share_token_id,
            v_pet,
            v_all_users[i],
            'demo-share-' || substr(md5(i::text || 'token'), 1, 12),
            now() + interval '60 days',
            false
          ) ON CONFLICT (token) DO NOTHING;

          -- 2 notas clínicas por token
          FOR j IN 1..2 LOOP
            INSERT INTO vet_clinical_notes (
              share_token_id, provider_id, pet_id,
              note_type, title, description, created_at
            ) VALUES (
              v_share_token_id,
              v_all_provider_ids[1 + ((i + j) % array_length(v_all_provider_ids, 1))],
              v_pet,
              CASE j WHEN 1 THEN 'consulta' ELSE 'vacuna' END,
              CASE j WHEN 1 THEN 'Control general' ELSE 'Vacuna antirrábica' END,
              CASE j
                WHEN 1 THEN 'Paciente en buen estado general. Peso estable. Mucosas rosadas. Se recomienda control en 6 meses.'
                ELSE 'Vacuna antirrábica anual administrada sin reacciones adversas. Próxima dosis en 12 meses.'
              END,
              now() - ((i * 3 + j * 7) || ' days')::interval
            ) ON CONFLICT (id) DO NOTHING;
          END LOOP;
        END IF;
      END;
    END LOOP;
  END IF;

  RAISE NOTICE 'Creados: medical_share_tokens + vet_clinical_notes';

  -- ============================================================
  -- PASO 22: Review Invitations para providers
  -- ============================================================
  IF array_length(v_all_provider_ids, 1) > 0 THEN
    FOR i IN 1..LEAST(array_length(v_all_provider_ids, 1), 10) LOOP
      FOR j IN 1..3 LOOP
        INSERT INTO review_invitations (
          provider_id, invitation_token,
          client_email, client_name,
          is_used, expires_at
        ) VALUES (
          v_all_provider_ids[i],
          'demo-inv-' || i::text || '-' || j::text || '-' || substr(md5(i::text || j::text), 1, 8),
          'cliente' || (i*3+j)::text || '@demo.pawfriend.cl',
          v_first_names[1 + ((i*3+j) % array_length(v_first_names, 1))] || ' ' ||
          v_last_names[1 + ((i*5+j) % array_length(v_last_names, 1))],
          j = 1,  -- primera usada, resto pendiente
          now() + interval '30 days'
        ) ON CONFLICT (invitation_token) DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;

  RAISE NOTICE 'Creados: review_invitations';

  -- ============================================================
  -- PASO 23: User Stats (contadores para perfil + admin)
  -- ============================================================
  FOR i IN 1..array_length(v_all_users, 1) LOOP
    INSERT INTO user_stats (
      user_id, total_points, level,
      posts_count, pets_count, followers_count, following_count
    ) VALUES (
      v_all_users[i],
      (i * 37 + 50) % 2000 + 100,
      LEAST(1 + ((i * 37 + 50) % 2000) / 500, 5),
      3 + (i % 3),  -- posts
      1 + (i % 3),  -- pets
      4 + (i % 8),  -- followers
      4 + ((i + 3) % 8)  -- following
    ) ON CONFLICT (user_id) DO UPDATE SET
      total_points = EXCLUDED.total_points,
      posts_count = EXCLUDED.posts_count,
      pets_count = EXCLUDED.pets_count;
  END LOOP;

  RAISE NOTICE 'Creados: user_stats';

  RAISE NOTICE '=== SEED 100 USUARIOS COMPLETO ===';
END $$;


-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- PARTE 3: CATÁLOGOS DE SISTEMA (badges, missions, rewards, templates)
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================
-- Z. Guardian Levels (catálogo de niveles para PawGame)
-- ============================================================
INSERT INTO guardian_levels (level_number, level_name, min_points, max_points, bonus_multiplier, badge_icon, description)
VALUES
  (1, 'Cachorro Curioso',    0,    499,  1.0, 'paw-print',   'Recién llegas a Paw Friend. Cada paso cuenta!'),
  (2, 'Guardián Novato',     500,  1499, 1.2, 'shield',      'Ya conoces la plataforma. Tu mascota está más segura contigo.'),
  (3, 'Protector Dedicado',  1500, 3499, 1.5, 'heart',       'Tu compromiso con tu mascota es admirable. Sigue así!'),
  (4, 'Héroe Animal',        3500, 6999, 1.8, 'star',        'Eres un ejemplo para la comunidad. Tu mascota tiene suerte de tenerte.'),
  (5, 'Leyenda Paw Friend',  7000, 99999,2.0, 'crown',       'El nivel máximo. Eres una leyenda de Paw Friend. Respeto total.')
ON CONFLICT (level_number) DO NOTHING;

-- ============================================================
-- A. Paw Badges (catálogo gamificación)
-- ============================================================
INSERT INTO paw_badges (badge_key, name, description, category, icon, rarity, unlock_condition, unlock_value, points_bonus)
VALUES
  ('first_pet',        'Primera Mascota',      'Registraste tu primera mascota en Paw Friend',     'participation', 'paw-print',       'common',    'register_pet',        1,  10),
  ('vet_regular',      'Tutor Responsable',    'Llevaste a tu mascota al vet 5 veces',             'health',        'stethoscope',     'rare',      'vet_visits',          5,  25),
  ('social_butterfly', 'Mariposa Social',      'Publicaste 10 posts en el feed',                   'community',     'message-circle',  'rare',      'create_posts',        10, 20),
  ('walker_pro',       'Paseador Pro',         'Completaste 20 paseos registrados',                'activity',      'footprints',      'epic',      'complete_walks',      20, 30),
  ('adoption_hero',    'Héroe de la Adopción', 'Adoptaste una mascota desde la plataforma',        'special',       'heart',           'legendary', 'adopt_pet',           1,  50),
  ('vaccine_champion', 'Campeón de Vacunas',   'Todas las vacunas de tu mascota al día',           'health',        'shield',          'common',    'vaccines_up_to_date', 1,  15)
ON CONFLICT (badge_key) DO NOTHING;

-- Asignar badges a demo users (60% tiene first_pet, 30% vet_regular, etc.)
DO $$
DECLARE
  v_users uuid[];
  v_badge uuid;
  i int;
BEGIN
  SELECT array_agg(id) INTO v_users FROM profiles WHERE is_demo = true;
  IF v_users IS NULL THEN RETURN; END IF;

  -- first_pet para 60%
  SELECT id INTO v_badge FROM paw_badges WHERE badge_key = 'first_pet';
  IF v_badge IS NOT NULL THEN
    FOR i IN 1..LEAST(array_length(v_users, 1), 60) LOOP
      INSERT INTO user_paw_badges (user_id, badge_id, earned_at)
      VALUES (v_users[i], v_badge, now() - ((60 - i) || ' days')::interval)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END LOOP;
  END IF;

  -- vet_regular para 30%
  SELECT id INTO v_badge FROM paw_badges WHERE badge_key = 'vet_regular';
  IF v_badge IS NOT NULL THEN
    FOR i IN 1..LEAST(array_length(v_users, 1), 30) LOOP
      INSERT INTO user_paw_badges (user_id, badge_id, earned_at)
      VALUES (v_users[1 + (i*3 % array_length(v_users, 1))], v_badge, now() - ((30 - i) || ' days')::interval)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END LOOP;
  END IF;

  -- vaccine_champion para 25%
  SELECT id INTO v_badge FROM paw_badges WHERE badge_key = 'vaccine_champion';
  IF v_badge IS NOT NULL THEN
    FOR i IN 1..LEAST(array_length(v_users, 1), 25) LOOP
      INSERT INTO user_paw_badges (user_id, badge_id, earned_at)
      VALUES (v_users[1 + (i*4 % array_length(v_users, 1))], v_badge, now() - ((25 - i) || ' days')::interval)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END LOOP;
  END IF;

  -- social_butterfly para 15%
  SELECT id INTO v_badge FROM paw_badges WHERE badge_key = 'social_butterfly';
  IF v_badge IS NOT NULL THEN
    FOR i IN 1..LEAST(array_length(v_users, 1), 15) LOOP
      INSERT INTO user_paw_badges (user_id, badge_id, earned_at)
      VALUES (v_users[1 + (i*7 % array_length(v_users, 1))], v_badge, now() - ((15 - i) || ' days')::interval)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END LOOP;
  END IF;

  -- walker_pro para 10%
  SELECT id INTO v_badge FROM paw_badges WHERE badge_key = 'walker_pro';
  IF v_badge IS NOT NULL THEN
    FOR i IN 1..LEAST(array_length(v_users, 1), 10) LOOP
      INSERT INTO user_paw_badges (user_id, badge_id, earned_at)
      VALUES (v_users[1 + (i*10 % array_length(v_users, 1))], v_badge, now() - ((10 - i) || ' days')::interval)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END LOOP;
  END IF;

  -- adoption_hero para 5%
  SELECT id INTO v_badge FROM paw_badges WHERE badge_key = 'adoption_hero';
  IF v_badge IS NOT NULL THEN
    FOR i IN 1..LEAST(array_length(v_users, 1), 5) LOOP
      INSERT INTO user_paw_badges (user_id, badge_id, earned_at)
      VALUES (v_users[1 + (i*20 % array_length(v_users, 1))], v_badge, now() - ((5 - i) || ' days')::interval)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END LOOP;
  END IF;

  RAISE NOTICE 'Asignados: badges a demo users';
END $$;

-- ============================================================
-- B. Paw Missions (catálogo completo)
-- ============================================================
INSERT INTO paw_missions (mission_type, category, title, description, icon, points_reward, target_action, target_count, is_active) VALUES
  ('daily',  'activity',   'Aventura del día',         'Registra un paseo o actividad con tu mascota',                                     'footprints',      15, 'log_walk',        1, true),
  ('daily',  'community',  'Fotógrafo de patitas',     'Comparte una foto de tu mascota en la comunidad',                                  'message-circle',  10, 'create_post',     1, true),
  ('daily',  'health',     'Báscula mágica',           'Pesa a tu mascota y anótalo en su ficha',                                          'scale',           15, 'log_weight',      1, true),
  ('daily',  'health',     'Desayuno servido',         'Registra la alimentación diaria de tu mascota',                                    'utensils',         5, 'log_food',        1, true),
  ('daily',  'activity',   'Check-in matutino',        'Entra a Paw Friend y revisa el estado de tu mascota',                              'sun',              5, 'daily_checkin',   1, true),
  ('weekly', 'health',     'Doctor amor',              'Lleva a tu mascota a un control veterinario',                                      'stethoscope',     30, 'log_vet_visit',   1, true),
  ('weekly', 'care',       'Spa day',                  'Registra una sesión de peluquería o baño',                                          'scissors',        25, 'log_grooming',    1, true),
  ('weekly', 'health',     'Escudo protector',         'Registra una vacuna en la ficha médica',                                           'shield',          40, 'log_vaccine',     1, true),
  ('weekly', 'activity',   'Influencer de 4 patas',    'Sube una foto de tu paseo al feed',                                                'camera',          10, 'post_walk_photo', 1, true),
  ('weekly', 'community',  'Crítico gastronómico vet', 'Deja una reseña a un veterinario',                                                 'star',            25, 'leave_review',    1, true),
  ('weekly', 'health',     'Ficha perfecta',           'Completa todos los campos de la ficha clínica',                                    'clipboard',      100, 'complete_profile',1, true),
  ('weekly', 'community',  'Corazón generoso',         'Dale like a 3 publicaciones de otros dueños',                                      'heart',           15, 'like_posts',      3, true),
  ('weekly', 'health',     'Detective de alergias',    'Actualiza la sección de alergias en la ficha de tu mascota',                        'search',          30, 'update_allergies',1, true),
  ('story',  'exploration','Indiana Paws',             'Completa 5 paseos en lugares diferentes',                                           'map',             50, 'complete_walks',  5, true),
  ('story',  'exploration','Primera cita',             'Reserva tu primera consulta o servicio desde Paw Friend',                           'calendar',        75, 'first_booking',   1, true),
  ('story',  'community',  'Red de amigos peludos',    'Sigue a 5 dueños de mascotas',                                                     'users',           60, 'follow_5',        5, true),
  ('story',  'community',  'Embajador Paw',            'Invita a un amigo a usar Paw Friend',                                              'share',          100, 'invite_friend',   1, true),
  ('story',  'health',     'Archivo completo',         'Sube 3 documentos a la ficha clínica',                                              'folder',          80, 'upload_documents',3, true),
  ('story',  'exploration','Primer canje',             'Canjea tu primer premio en la Paw Shop',                                            'gift',            50, 'first_redeem',    1, true)
ON CONFLICT DO NOTHING;

-- Asignar progreso de misiones a demo users (~200 registros)
DO $$
DECLARE
  v_users uuid[];
  v_missions uuid[];
  i int;
  j int;
  v_idx int;
BEGIN
  SELECT array_agg(id) INTO v_users FROM profiles WHERE is_demo = true;
  SELECT array_agg(id) INTO v_missions FROM paw_missions WHERE is_active = true;
  IF v_users IS NULL OR v_missions IS NULL THEN RETURN; END IF;

  FOR i IN 1..array_length(v_users, 1) LOOP
    -- Cada user tiene progreso en 2-4 misiones
    FOR j IN 1..(2 + (i % 3)) LOOP
      v_idx := 1 + ((i * 5 + j * 3) % array_length(v_missions, 1));
      INSERT INTO user_mission_progress (
        user_id, mission_id, current_progress, is_completed, completed_at, assigned_date
      ) VALUES (
        v_users[i],
        v_missions[v_idx],
        CASE WHEN (i + j) % 3 = 0 THEN 1 ELSE (i % 3) END,
        (i + j) % 3 = 0,
        CASE WHEN (i + j) % 3 = 0 THEN now() - ((i + j) || ' days')::interval ELSE NULL END,
        CURRENT_DATE - ((j) || ' days')::interval
      ) ON CONFLICT (user_id, mission_id, assigned_date) DO NOTHING;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Asignados: mission_progress a demo users';
END $$;

-- ============================================================
-- C. Paw Shop Rewards (catálogo v2)
-- ============================================================
INSERT INTO paw_shop_rewards (name, description, category, points_cost, discount_percentage, service_type, partner_name, icon, stock, is_active)
VALUES
  ('Primera consulta -20%',       '20% off en tu primera consulta con cualquier vet del directorio.',              'discount', 200,  20,   'vet',     'Paw Friend',       'stethoscope', NULL, true),
  ('Baño + corte -15%',           'Descuento en peluquerías verificadas.',                                          'discount', 350,  15,   'groomer', 'Paw Friend',       'scissors',    NULL, true),
  ('Paseo gratis',                'Un paseo cortesía con paseadores verificados.',                                  'discount', 500,  100,  'walker',  'Paw Friend',       'footprints',  30,   true),
  ('Control dental -25%',         'Descuento en limpieza dental.',                                                  'discount', 600,  25,   'vet',     'Paw Friend',       'smile',       NULL, true),
  ('Vacuna antirrábica gratis',   'Cubre el costo de la vacuna anual obligatoria.',                                 'discount', 800,  100,  'vet',     'Paw Friend',       'syringe',     20,   true),
  ('Sesión de fotos mascotera',   'Sesión de 30 min con fotógrafos pet-friendly.',                                  'discount', 1500, NULL, NULL,      'Paw Friend',       'camera',      10,   true),
  ('1 kg de alimento a refugio',  'Alimentamos a un rescatado por una semana gracias a ti.',                        'donation', 100,  NULL, NULL,      'Refugios aliados', 'heart',       NULL, true),
  ('Kit vacuna para rescatado',   'Cubres la primera vacuna de un animal esperando adopción.',                      'donation', 300,  NULL, NULL,      'Refugios aliados', 'syringe',     NULL, true),
  ('Manta + plato para refugio',  'Equipamos a un rescatado con lo básico para su estadía.',                        'donation', 500,  NULL, NULL,      'Refugios aliados', 'home',        NULL, true),
  ('Esterilización solidaria',    'Cubres una esterilización completa de un rescatado.',                            'donation', 1200, NULL, NULL,      'Refugios aliados', 'shield',      10,   true),
  ('Badge "Paw Lover"',          'Corazón dorado en tu perfil.',                                                    'visual',   400,  NULL, NULL,      NULL,               'heart',       NULL, true),
  ('Badge "Vet VIP"',            'Estrella azul exclusiva.',                                                        'visual',   800,  NULL, NULL,      NULL,               'star',        NULL, true),
  ('Badge "Paw Master"',         'Corona diamante. El badge más raro de Paw Friend.',                               'visual',   5000, NULL, NULL,      NULL,               'crown',       50,   true),
  ('Marco dorado para foto',     'Tu mascota con marco premium en el feed.',                                        'visual',   600,  NULL, NULL,      NULL,               'image',       NULL, true),
  ('Título personalizado',       'Elige un título custom bajo tu nombre.',                                          'visual',   1000, NULL, NULL,      NULL,               'award',       NULL, true),
  ('7 días Premium',             'Prueba todas las funciones Premium por una semana.',                              'premium',  1000, NULL, NULL,      'Paw Friend',       'zap',         NULL, true),
  ('1 mes Premium',              'Un mes completo de mascotas ilimitadas, PDF, compartir ficha y más.',             'premium',  3000, NULL, NULL,      'Paw Friend',       'crown',       20,   true),
  ('Exportar 5 PDFs gratis',     'Genera hasta 5 fichas médicas PDF sin necesitar Premium.',                        'premium',  800,  NULL, NULL,      'Paw Friend',       'file-text',   NULL, true)
ON CONFLICT DO NOTHING;

-- Algunos canjes de demo users (~30)
DO $$
DECLARE
  v_users uuid[];
  v_rewards uuid[];
  i int;
  v_idx int;
BEGIN
  SELECT array_agg(id) INTO v_users FROM profiles WHERE is_demo = true;
  SELECT array_agg(id) INTO v_rewards FROM paw_shop_rewards WHERE is_active = true;
  IF v_users IS NULL OR v_rewards IS NULL THEN RETURN; END IF;

  FOR i IN 1..LEAST(30, array_length(v_users, 1)) LOOP
    v_idx := 1 + ((i * 7) % array_length(v_rewards, 1));
    INSERT INTO user_shop_redemptions (
      user_id, reward_id, points_spent, redeemed_at, redemption_code
    ) VALUES (
      v_users[i],
      v_rewards[v_idx],
      (SELECT points_cost FROM paw_shop_rewards WHERE id = v_rewards[v_idx]),
      now() - ((i * 2) || ' days')::interval,
      'DEMO-' || upper(substr(md5(i::text), 1, 8))
    ) ON CONFLICT (redemption_code) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Creados: shop redemptions demo';
END $$;

-- ============================================================
-- D. Consultation Templates (plantillas del sistema)
-- ============================================================
INSERT INTO consultation_templates (name, category, template_body, is_system, provider_id) VALUES
(
  'Vacunación rutinaria', 'vacunacion',
  '{"note_type":"vacuna","title":"Vacunación rutinaria","description_template":"Paciente {pet_name} ({species}, {breed}). Se administra vacuna {vaccine_name}. Lote: {batch}. Vía: {route}. Sin reacciones adversas inmediatas.","fields":["vaccine_name","batch","route","next_date"],"defaults":{"route":"SC"}}'::jsonb,
  TRUE, NULL
),
(
  'Control sano anual', 'control_sano',
  '{"note_type":"control","title":"Control sano anual","description_template":"Control anual de {pet_name}. Peso: {weight} kg. Temperatura: {temp}°C. FC: {heart_rate} bpm. FR: {resp_rate} rpm. Mucosas rosadas, hidratación adecuada. {observations}","fields":["weight","temp","heart_rate","resp_rate","observations"],"defaults":{}}'::jsonb,
  TRUE, NULL
),
(
  'Post-esterilización día 1', 'post_esterilizacion',
  '{"note_type":"cirugia","title":"Control post-esterilización día 1","description_template":"Control post-quirúrgico día 1. Herida: {wound_status}. Apetito: {appetite}. Actividad: {activity}. Dolor (escala 0-5): {pain_score}. {observations}","fields":["wound_status","appetite","activity","pain_score","observations"],"defaults":{"wound_status":"Limpia, sin signos de infección","appetite":"Normal","activity":"Reducida (esperable)"}}'::jsonb,
  TRUE, NULL
),
(
  'Consulta dermatológica', 'dermatologia',
  '{"note_type":"consulta","title":"Consulta dermatológica","description_template":"Motivo: {reason}. Localización: {location}. Tipo: {lesion_type}. Prurito (0-10): {pruritus}. Evolución: {duration}. Tratamientos previos: {previous_tx}. Plan: {plan}","fields":["reason","location","lesion_type","pruritus","duration","previous_tx","plan"],"defaults":{}}'::jsonb,
  TRUE, NULL
),
(
  'Control geriátrico', 'geriatrico',
  '{"note_type":"control","title":"Control geriátrico","description_template":"Control geriátrico de {pet_name} ({age} años). Peso: {weight} kg ({weight_trend}). Movilidad: {mobility}. Visión: {vision}. Audición: {hearing}. Apetito: {appetite}. Exámenes: {exams}. {observations}","fields":["weight","weight_trend","mobility","vision","hearing","appetite","exams","observations"],"defaults":{"exams":"Hemograma, perfil bioquímico, orina completa"}}'::jsonb,
  TRUE, NULL
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- E. Vet service prices para providers REALES (no demo)
-- ============================================================
DO $$
DECLARE
  v_provider_id uuid;
  v_commune text;
  v_tier numeric;
BEGIN
  FOR v_provider_id, v_commune IN
    SELECT id, commune FROM service_providers
    WHERE is_directory_visible = true AND is_demo = false
      AND commune IS NOT NULL
      AND commune IN (
        SELECT commune FROM service_providers
        WHERE is_directory_visible = true AND is_demo = false AND commune IS NOT NULL
        GROUP BY commune HAVING COUNT(*) >= 3
      )
  LOOP
    v_tier := CASE
      WHEN v_commune IN ('Las Condes','Vitacura','Lo Barnechea') THEN 1.40
      WHEN v_commune IN ('Providencia','Ñuñoa','La Reina') THEN 1.20
      WHEN v_commune IN ('Santiago','Recoleta','Independencia','Macul','San Miguel') THEN 1.00
      WHEN v_commune IN ('Maipú','La Florida','Puente Alto','Peñalolén') THEN 0.85
      ELSE 0.95
    END;

    INSERT INTO vet_service_prices (provider_id, service_type, price_clp, is_estimate)
    VALUES
      (v_provider_id,'consulta_general',round(28000*v_tier*(0.9+random()*0.2)),true),
      (v_provider_id,'vacuna',          round(18000*v_tier*(0.9+random()*0.2)),true),
      (v_provider_id,'desparasitacion', round(15000*v_tier*(0.9+random()*0.2)),true),
      (v_provider_id,'control_sano',    round(22000*v_tier*(0.9+random()*0.2)),true),
      (v_provider_id,'cirugia_menor',   round(85000*v_tier*(0.9+random()*0.2)),true),
      (v_provider_id,'peluqueria',      round(25000*v_tier*(0.9+random()*0.2)),true),
      (v_provider_id,'urgencia',        round(45000*v_tier*(0.9+random()*0.2)),true),
      (v_provider_id,'teleconsulta',    round(15000*v_tier*(0.9+random()*0.2)),true),
      (v_provider_id,'esterilizacion',  round(120000*v_tier*(0.9+random()*0.2)),true),
      (v_provider_id,'limpieza_dental', round(95000*v_tier*(0.9+random()*0.2)),true)
    ON CONFLICT (provider_id, service_type) DO NOTHING;
  END LOOP;
END $$;

-- ============================================================
-- F. Re-activar guard trigger
-- ============================================================
ALTER TABLE pets ENABLE TRIGGER USER;
ALTER TABLE vet_clinical_notes ENABLE TRIGGER USER;

-- ============================================================
-- G. Comentario final
-- ============================================================
COMMENT ON TABLE vet_service_prices IS
  'Precios por servicio. 10 tipos: consulta_general, vacuna, desparasitacion, control_sano, cirugia_menor, peluqueria, urgencia, teleconsulta, esterilizacion, limpieza_dental.';

DO $$ BEGIN RAISE NOTICE '=== MIGRACIÓN COMPLETA: Limpieza + 100 usuarios demo + catálogos ==='; END $$;
