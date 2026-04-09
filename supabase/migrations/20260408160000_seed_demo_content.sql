-- ============================================================================
-- SEED DEMO: Contenido completo para UX preview
-- Migración idempotente — ON CONFLICT DO NOTHING / IF NOT EXISTS
-- Referencia dinámica a users/pets/providers demo existentes (no crea users)
-- Aplicar manualmente desde Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============================================================
-- 0. HELPERS: variables temporales con IDs de demo users
--    Usamos los 8 users del seed.sql (IDs hardcodeados)
-- ============================================================
DO $$
DECLARE
  u1 uuid := 'a1b2c3d4-1111-4000-a000-000000000001'; -- Camila Silva
  u2 uuid := 'a1b2c3d4-2222-4000-a000-000000000002'; -- Matías Rojas
  u3 uuid := 'a1b2c3d4-3333-4000-a000-000000000003'; -- Valentina Muñoz
  u4 uuid := 'a1b2c3d4-4444-4000-a000-000000000004'; -- Sebastián Díaz
  u5 uuid := 'a1b2c3d4-5555-4000-a000-000000000005'; -- Francisca Lagos
  u6 uuid := 'a1b2c3d4-6666-4000-a000-000000000006'; -- Nicolás Herrera
  u7 uuid := 'a1b2c3d4-7777-4000-a000-000000000007'; -- Isidora Parra
  u8 uuid := 'a1b2c3d4-8888-4000-a000-000000000008'; -- Tomás González

  -- Pets (se resuelven dinámicamente)
  pet1 uuid; pet2 uuid; pet3 uuid; pet4 uuid; pet5 uuid;
  pet6 uuid; pet7 uuid; pet8 uuid; pet9 uuid; pet10 uuid;

  -- Posts (para comments/likes)
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid;
  p6 uuid; p7 uuid; p8 uuid; p9 uuid; p10 uuid;
  p11 uuid; p12 uuid; p13 uuid; p14 uuid; p15 uuid;
  p16 uuid; p17 uuid; p18 uuid; p19 uuid; p20 uuid;

  -- Providers
  prov1 uuid; prov2 uuid;

  -- Conversations
  conv1 uuid; conv2 uuid; conv3 uuid; conv4 uuid; conv5 uuid;

  -- Badges
  b1 uuid; b2 uuid; b3 uuid; b4 uuid; b5 uuid; b6 uuid;

  -- Missions
  m1 uuid; m2 uuid; m3 uuid; m4 uuid; m5 uuid;

  -- Activities catalog
  act1 uuid; act2 uuid; act3 uuid; act4 uuid; act5 uuid;

  -- Share tokens for vet notes
  st1 uuid; st2 uuid; st3 uuid;

BEGIN

  -- ============================================================
  -- Resolver IDs de mascotas demo (una por owner, primera que encuentre)
  -- ============================================================
  SELECT id INTO pet1 FROM pets WHERE owner_id = u1 LIMIT 1;
  SELECT id INTO pet2 FROM pets WHERE owner_id = u1 OFFSET 1 LIMIT 1;
  SELECT id INTO pet3 FROM pets WHERE owner_id = u2 LIMIT 1;
  SELECT id INTO pet4 FROM pets WHERE owner_id = u3 LIMIT 1;
  SELECT id INTO pet5 FROM pets WHERE owner_id = u4 LIMIT 1;
  SELECT id INTO pet6 FROM pets WHERE owner_id = u5 LIMIT 1;
  SELECT id INTO pet7 FROM pets WHERE owner_id = u6 LIMIT 1;
  SELECT id INTO pet8 FROM pets WHERE owner_id = u7 LIMIT 1;
  SELECT id INTO pet9 FROM pets WHERE owner_id = u8 LIMIT 1;
  SELECT id INTO pet10 FROM pets WHERE owner_id = u5 OFFSET 1 LIMIT 1;

  -- Si no hay mascotas, salir temprano
  IF pet1 IS NULL THEN
    RAISE NOTICE 'No se encontraron mascotas demo. Ejecuta primero el seed.sql base.';
    RETURN;
  END IF;

  -- ============================================================
  -- 1. POSTS ADICIONALES (12 más, variados)
  -- ============================================================
  INSERT INTO posts (id, user_id, pet_id, content, image_url, likes_count, comments_count, created_at)
  VALUES
    (gen_random_uuid(), u1, pet1, 'Consejo: nunca le des chocolate a tu perro, es tóxico para ellos. Cuida a tu peludo!', NULL, 12, 3, now() - interval '6 days'),
    (gen_random_uuid(), u2, pet3, 'Thor cumple 3 años hoy! Feliz cumpleaños campeon!', 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600', 24, 5, now() - interval '5 days'),
    (gen_random_uuid(), u3, pet4, 'Alguien conoce un buen vet en Ñuñoa? Simba necesita su control anual.', NULL, 8, 4, now() - interval '4 days 6 hours'),
    (gen_random_uuid(), u5, pet6, 'Canela aprendió a dar la patita! Estoy tan orgullosa de ella.', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600', 18, 3, now() - interval '3 days 12 hours'),
    (gen_random_uuid(), u7, pet8, 'Los gatos son los mejores compañeros para trabajar desde casa. Miso no me deja escribir.', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600', 15, 2, now() - interval '3 days'),
    (gen_random_uuid(), u4, pet5, 'Sesión de fotos en el Parque Bicentenario con Max. Este golden es pura fotogenia.', 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=600', 22, 4, now() - interval '2 days 18 hours'),
    (gen_random_uuid(), u6, pet7, 'Tip de entrenador: la paciencia es la clave. 15 minutos al día hacen la diferencia.', NULL, 10, 2, now() - interval '2 days 8 hours'),
    (gen_random_uuid(), u8, pet9, 'Buddy encontró un amigo nuevo en el parque. Los golden son los perros más sociables que existen.', 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600', 14, 3, now() - interval '1 day 20 hours'),
    (gen_random_uuid(), u1, pet2, 'Rocky nadando en la piscina del tío. Este labrador ama el agua!', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600', 20, 4, now() - interval '1 day 12 hours'),
    (gen_random_uuid(), u3, NULL, 'Recordatorio: la desparasitación interna se hace cada 3 meses. No lo olviden!', NULL, 9, 2, now() - interval '1 day 4 hours'),
    (gen_random_uuid(), u5, pet10, 'Pelusa y Toby jugando juntos. La adopción fue la mejor decisión de nuestras vidas.', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600', 16, 3, now() - interval '18 hours'),
    (gen_random_uuid(), u2, pet3, 'Después de 10km con Thor, los dos estamos muertos. Pero felices.', 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=600', 11, 2, now() - interval '8 hours')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- Resolver IDs de los últimos 20 posts para comments/likes
  -- ============================================================
  SELECT id INTO p1  FROM posts WHERE user_id = u1 ORDER BY created_at DESC LIMIT 1 OFFSET 0;
  SELECT id INTO p2  FROM posts WHERE user_id = u1 ORDER BY created_at DESC LIMIT 1 OFFSET 1;
  SELECT id INTO p3  FROM posts WHERE user_id = u2 ORDER BY created_at DESC LIMIT 1 OFFSET 0;
  SELECT id INTO p4  FROM posts WHERE user_id = u2 ORDER BY created_at DESC LIMIT 1 OFFSET 1;
  SELECT id INTO p5  FROM posts WHERE user_id = u3 ORDER BY created_at DESC LIMIT 1 OFFSET 0;
  SELECT id INTO p6  FROM posts WHERE user_id = u3 ORDER BY created_at DESC LIMIT 1 OFFSET 1;
  SELECT id INTO p7  FROM posts WHERE user_id = u4 ORDER BY created_at DESC LIMIT 1 OFFSET 0;
  SELECT id INTO p8  FROM posts WHERE user_id = u5 ORDER BY created_at DESC LIMIT 1 OFFSET 0;
  SELECT id INTO p9  FROM posts WHERE user_id = u5 ORDER BY created_at DESC LIMIT 1 OFFSET 1;
  SELECT id INTO p10 FROM posts WHERE user_id = u6 ORDER BY created_at DESC LIMIT 1 OFFSET 0;
  SELECT id INTO p11 FROM posts WHERE user_id = u7 ORDER BY created_at DESC LIMIT 1 OFFSET 0;
  SELECT id INTO p12 FROM posts WHERE user_id = u8 ORDER BY created_at DESC LIMIT 1 OFFSET 0;

  -- ============================================================
  -- 2. POST COMMENTS (~45 comentarios distribuidos)
  --    Timestamps relativos al created_at del post via LATERAL join
  -- ============================================================
  INSERT INTO post_comments (id, user_id, post_id, content, created_at)
  SELECT gen_random_uuid(), commenter, post, comment_text, post_time + comment_offset
  FROM (VALUES
    -- Comments on Camila's most recent post (p1)
    (u3, p1, 'Qué tierna Luna! Me encanta esa foto.', interval '25 minutes'),
    (u5, p1, 'Buenísimo el consejo, mucha gente no sabe eso del chocolate.', interval '1 hour'),
    (u8, p1, 'Mi perro casi comió chocolate una vez, menos mal lo pillé a tiempo.', interval '2 hours'),
    -- Post de Thor cumpleaños (u2)
    (u1, p3, 'Feliz cumple Thor! Qué grande está!', interval '30 minutes'),
    (u5, p3, 'Los husky son hermosos. Felicidades!', interval '1 hour 15 minutes'),
    (u7, p3, 'Feliz cumple! Se merece un premio especial hoy.', interval '2 hours'),
    (u4, p3, 'Hay que hacerle una sesión de fotos de cumpleaños!', interval '3 hours'),
    (u6, p3, 'Tremendo perro, felicidades Matías!', interval '4 hours'),

    -- Post pregunta vet Ñuñoa (u3)
    (u1, p5, 'Yo llevo a Luna a la Veterinaria Patitas en Ñuñoa, son muy buenos.', interval '20 minutes'),
    (u6, p5, 'El Dr. Sepúlveda en Irarrázaval es excelente. Lo recomiendo.', interval '45 minutes'),
    (u8, p5, 'También está VetCare cerca del metro, buena atención y precios.', interval '1 hour 30 minutes'),
    (u5, p5, 'Yo voy a la clínica de Av. Grecia, súper profesionales.', interval '2 hours'),

    -- Post Canela patita (u5)
    (u3, p8, 'Qué inteligente! Cuánto le costó aprender?', interval '40 minutes'),
    (u6, p8, 'Buen trabajo! La educación positiva siempre funciona.', interval '1 hour 10 minutes'),
    (u1, p8, 'Rocky también sabe dar la patita, a los perros les encanta ese truco.', interval '2 hours 30 minutes'),

    -- Post gatos WFH (u7)
    (u3, p11, 'Jajaja a mí me pasa lo mismo con Nala, se sienta en el teclado.', interval '35 minutes'),
    (u4, p11, 'Sombra hace lo mismo! Los gatos son expertos en interrumpir.', interval '1 hour 20 minutes'),

    -- Post Max Bicentenario (u4)
    (u2, p7, 'Está espectacular esa foto! Qué cámara usas?', interval '50 minutes'),
    (u1, p7, 'Max es un modelo profesional, qué perro más lindo.', interval '1 hour 30 minutes'),
    (u7, p7, 'Hermosa la luz del atardecer. Golden goals!', interval '2 hours'),
    (u5, p7, 'Me encanta! Deberías hacer un Instagram para Max.', interval '3 hours'),

    -- Post tip entrenador (u6)
    (u2, p10, 'Muy de acuerdo! Con Thor practicamos 20 min cada mañana.', interval '45 minutes'),
    (u5, p10, 'Buen tip Nico! Lo voy a probar con Toby.', interval '1 hour 30 minutes'),

    -- Post Buddy amigo (u8)
    (u4, p12, 'Los golden son los mejores! Max también hace amigos altiro.', interval '30 minutes'),
    (u1, p12, 'Qué bonita foto! Rocky también es así de sociable.', interval '1 hour'),
    (u5, p12, 'Adoptar fue la mejor decisión! Mis tres perritos son amistosos con todos.', interval '2 hours'),

    -- Post Rocky piscina (u1)
    (u2, p2, 'Jajaja los labradores y el agua, una combinación perfecta!', interval '40 minutes'),
    (u4, p2, 'Max también ama nadar! Deberíamos juntarlos.', interval '1 hour 20 minutes'),
    (u6, p2, 'El agua es excelente ejercicio para perros, súper recomendado.', interval '2 hours 10 minutes'),
    (u8, p2, 'Buddy se tira al agua de cabeza, no hay forma de sacarlo.', interval '3 hours'),

    -- Post recordatorio desparasitación (u3)
    (u1, p6, 'Gracias por el recordatorio! Se me había pasado el de Luna.', interval '25 minutes'),
    (u5, p6, 'Yo uso Paw Friend para los recordatorios, es muy práctica la app.', interval '50 minutes'),

    -- Post Pelusa y Toby (u5)
    (u3, p9, 'Hermosos! Adoptar siempre es la mejor opción.', interval '35 minutes'),
    (u7, p9, 'Qué lindos jugando juntos! Se nota que son felices.', interval '1 hour'),
    (u1, p9, 'Adopta no compres! Mis dos rescatados son los más cariñosos.', interval '2 hours'),

    -- Post 10km Thor (u2)
    (u6, p4, 'Buen entrenamiento! Los husky necesitan mucha actividad.', interval '30 minutes'),
    (u1, p4, 'Qué envidia! Yo apenas logro 5km con Luna jaja.', interval '1 hour')
  ) AS t(commenter, post, comment_text, comment_offset)
  CROSS JOIN LATERAL (
    SELECT created_at AS post_time FROM posts WHERE id = t.post
  ) pt
  WHERE t.post IS NOT NULL
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- 3. POST LIKES (~50 likes distribuidos)
  -- ============================================================
  INSERT INTO post_likes (post_id, user_id, created_at)
  SELECT post, liker, now() - (random() * interval '7 days')
  FROM (VALUES
    (p1, u2), (p1, u3), (p1, u5), (p1, u7), (p1, u8),
    (p2, u3), (p2, u4), (p2, u6), (p2, u8),
    (p3, u1), (p3, u3), (p3, u4), (p3, u5), (p3, u6), (p3, u7), (p3, u8),
    (p4, u1), (p4, u5), (p4, u6),
    (p5, u1), (p5, u2), (p5, u4), (p5, u6),
    (p6, u1), (p6, u5), (p6, u7),
    (p7, u1), (p7, u2), (p7, u3), (p7, u5), (p7, u6), (p7, u8),
    (p8, u2), (p8, u3), (p8, u4), (p8, u6), (p8, u7),
    (p9, u1), (p9, u2), (p9, u3), (p9, u7),
    (p10, u1), (p10, u2), (p10, u5),
    (p11, u1), (p11, u3), (p11, u4), (p11, u5),
    (p12, u1), (p12, u4), (p12, u5), (p12, u7)
  ) AS t(post, liker)
  WHERE t.post IS NOT NULL
  ON CONFLICT (post_id, user_id) DO NOTHING;

  -- ============================================================
  -- 4. USER FOLLOWS (red social entre los 8 demo users)
  -- ============================================================
  INSERT INTO user_follows (follower_id, following_id, created_at)
  SELECT follower, following, now() - (random() * interval '30 days')
  FROM (VALUES
    -- Camila sigue a varios
    (u1, u2), (u1, u3), (u1, u5), (u1, u6),
    -- Matías sigue a
    (u2, u1), (u2, u4), (u2, u6),
    -- Valentina sigue a
    (u3, u1), (u3, u5), (u3, u7),
    -- Sebastián sigue a
    (u4, u1), (u4, u2), (u4, u3), (u4, u7),
    -- Francisca sigue a todos (rescatista activa)
    (u5, u1), (u5, u2), (u5, u3), (u5, u4), (u5, u6), (u5, u7), (u5, u8),
    -- Nicolás sigue a
    (u6, u1), (u6, u2), (u6, u5),
    -- Isidora sigue a
    (u7, u1), (u7, u3), (u7, u4), (u7, u5),
    -- Tomás sigue a
    (u8, u1), (u8, u2), (u8, u4), (u8, u5)
  ) AS t(follower, following)
  -- La constraint ordered_participants no aplica aquí (solo en conversations)
  -- Pero sí hay CHECK (follower_id != following_id) y UNIQUE
  ON CONFLICT (follower_id, following_id) DO NOTHING;

  -- ============================================================
  -- 5. CHAT: CONVERSATIONS + MESSAGES
  --    conversations tiene CHECK (participant1_id < participant2_id)
  -- ============================================================
  conv1 := gen_random_uuid();
  conv2 := gen_random_uuid();
  conv3 := gen_random_uuid();
  conv4 := gen_random_uuid();
  conv5 := gen_random_uuid();

  INSERT INTO conversations (id, participant1_id, participant2_id, last_message_at, created_at)
  VALUES
    -- u1 < u2 alphabetically by UUID? No, by value. Los UUIDs demo ya están ordenados.
    (conv1, u1, u2, now() - interval '2 hours', now() - interval '3 days'),
    (conv2, u1, u3, now() - interval '5 hours', now() - interval '5 days'),
    (conv3, u3, u5, now() - interval '1 day', now() - interval '4 days'),
    (conv4, u2, u6, now() - interval '8 hours', now() - interval '2 days'),
    (conv5, u5, u7, now() - interval '3 hours', now() - interval '1 day')
  ON CONFLICT (id) DO NOTHING;

  -- Messages para conv1: Camila <-> Matías (sobre paseo)
  INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
  VALUES
    (gen_random_uuid(), conv1, u1, 'Hola Matías! Mañana vamos al parque con Luna, quieres ir con Thor?', now() - interval '3 days'),
    (gen_random_uuid(), conv1, u2, 'Dale! A qué hora? Thor necesita gastar energía jaja', now() - interval '3 days' + interval '15 minutes'),
    (gen_random_uuid(), conv1, u1, 'Como a las 10? En el Parque Bicentenario.', now() - interval '3 days' + interval '30 minutes'),
    (gen_random_uuid(), conv1, u2, 'Perfecto, nos vemos ahí! Llevo agua para los perros.', now() - interval '3 days' + interval '45 minutes'),
    (gen_random_uuid(), conv1, u1, 'Genial! Luna va a estar feliz de ver a Thor.', now() - interval '3 days' + interval '1 hour'),
    (gen_random_uuid(), conv1, u2, 'Estuvo increíble el paseo! Hay que repetirlo.', now() - interval '2 days'),
    (gen_random_uuid(), conv1, u1, 'Sí! La próxima semana de nuevo? Luna quedó muerta de cansada jaja', now() - interval '2 hours')
  ON CONFLICT (id) DO NOTHING;

  -- Messages para conv2: Camila <-> Valentina (consulta vet)
  INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
  VALUES
    (gen_random_uuid(), conv2, u1, 'Vale, tú eres veterinaria cierto? Tengo una duda sobre Luna.', now() - interval '5 days'),
    (gen_random_uuid(), conv2, u3, 'Sí! Cuéntame, en qué te puedo ayudar?', now() - interval '5 days' + interval '20 minutes'),
    (gen_random_uuid(), conv2, u1, 'Luna ha estado rascándose mucho, especialmente detrás de las orejas.', now() - interval '5 days' + interval '35 minutes'),
    (gen_random_uuid(), conv2, u3, 'Puede ser alergia o parásitos. Cuándo fue su última desparasitación?', now() - interval '5 days' + interval '50 minutes'),
    (gen_random_uuid(), conv2, u1, 'Hace como 4 meses, se me pasó el plazo.', now() - interval '5 days' + interval '1 hour'),
    (gen_random_uuid(), conv2, u3, 'Te recomiendo desparasitarla y si no mejora en una semana, llévala al vet para descartar alergias.', now() - interval '5 days' + interval '1 hour 15 minutes'),
    (gen_random_uuid(), conv2, u1, 'Muchas gracias Vale! Le compro el antiparasitario altiro.', now() - interval '5 days' + interval '1 hour 30 minutes'),
    (gen_random_uuid(), conv2, u3, 'De nada! Cualquier cosa me escribes. Saludos a Luna!', now() - interval '5 hours')
  ON CONFLICT (id) DO NOTHING;

  -- Messages para conv3: Valentina <-> Francisca (adopción)
  INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
  VALUES
    (gen_random_uuid(), conv3, u5, 'Hola Vale! Vi que eres vet, tengo un gatito rescatado que necesita revisión.', now() - interval '4 days'),
    (gen_random_uuid(), conv3, u3, 'Hola Fran! Claro, tráelo cuando quieras. Qué edad tiene?', now() - interval '4 days' + interval '30 minutes'),
    (gen_random_uuid(), conv3, u5, 'Estimamos que como 2 meses. Estaba en un terreno baldío.', now() - interval '4 days' + interval '45 minutes'),
    (gen_random_uuid(), conv3, u3, 'Pobrecito. Hay que vacunarlo y desparasitarlo. También conviene hacerle un examen general.', now() - interval '4 days' + interval '1 hour'),
    (gen_random_uuid(), conv3, u5, 'Perfecto, cuánto sale aprox la consulta + vacunas?', now() - interval '4 days' + interval '1 hour 15 minutes'),
    (gen_random_uuid(), conv3, u3, 'La consulta son $25.000 y las vacunas entre $15.000 y $20.000 cada una.', now() - interval '1 day')
  ON CONFLICT (id) DO NOTHING;

  -- Messages para conv4: Matías <-> Nicolás (entrenamiento)
  INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
  VALUES
    (gen_random_uuid(), conv4, u2, 'Nico, haces entrenamiento para husky? Thor es bien terco a veces.', now() - interval '2 days'),
    (gen_random_uuid(), conv4, u6, 'Sí! Los husky son inteligentes pero independientes. Necesitan motivación distinta.', now() - interval '2 days' + interval '20 minutes'),
    (gen_random_uuid(), conv4, u2, 'Cuánto cobras por sesión?', now() - interval '2 days' + interval '30 minutes'),
    (gen_random_uuid(), conv4, u6, 'La sesión individual son $20.000, dura una hora. Podemos partir la próxima semana.', now() - interval '2 days' + interval '45 minutes'),
    (gen_random_uuid(), conv4, u2, 'Me tinca! El lunes te acomoda?', now() - interval '2 days' + interval '1 hour'),
    (gen_random_uuid(), conv4, u6, 'Lunes a las 10 está perfecto. Nos juntamos en el parque.', now() - interval '8 hours')
  ON CONFLICT (id) DO NOTHING;

  -- Messages para conv5: Francisca <-> Isidora (gatos rescatados)
  INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
  VALUES
    (gen_random_uuid(), conv5, u5, 'Isi! Vi tu post de los 3 gatos, son hermosos! Cómo los rescataste?', now() - interval '1 day'),
    (gen_random_uuid(), conv5, u7, 'Gracias! Miso lo adopté de un refugio, Mora la saqué de un techo y Café me lo encontré en la calle.', now() - interval '1 day' + interval '25 minutes'),
    (gen_random_uuid(), conv5, u5, 'Qué lindo! Yo tengo 3 perritos adoptados. Rescatar es lo mejor.', now() - interval '1 day' + interval '40 minutes'),
    (gen_random_uuid(), conv5, u7, 'Sí! Ojalá más gente adoptara en vez de comprar.', now() - interval '1 day' + interval '55 minutes'),
    (gen_random_uuid(), conv5, u5, 'Totalmente de acuerdo. Hay que difundir la adopción responsable.', now() - interval '3 hours')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- 6. ACTIVITIES CATALOG (si está vacía)
  -- ============================================================
  IF NOT EXISTS (SELECT 1 FROM activities LIMIT 1) THEN
    INSERT INTO activities (id, name, description, category, points, icon)
    VALUES
      (gen_random_uuid(), 'Paseo diario', 'Sacaste a pasear a tu mascota', 'paseo', 15, 'footprints'),
      (gen_random_uuid(), 'Visita al veterinario', 'Llevaste a tu mascota al vet', 'salud', 25, 'stethoscope'),
      (gen_random_uuid(), 'Baño y peluquería', 'Tu mascota quedó regia', 'cuidado', 20, 'scissors'),
      (gen_random_uuid(), 'Juego en el parque', 'Jugaste con tu mascota al aire libre', 'juego', 15, 'trees'),
      (gen_random_uuid(), 'Entrenamiento', 'Sesión de trucos o obediencia', 'juego', 20, 'brain')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Resolver IDs de activities
  SELECT id INTO act1 FROM activities WHERE category = 'paseo' LIMIT 1;
  SELECT id INTO act2 FROM activities WHERE category = 'salud' LIMIT 1;
  SELECT id INTO act3 FROM activities WHERE category = 'cuidado' LIMIT 1;
  SELECT id INTO act4 FROM activities WHERE name ILIKE '%juego%' LIMIT 1;
  SELECT id INTO act5 FROM activities WHERE name ILIKE '%entrenamiento%' LIMIT 1;

  -- ============================================================
  -- 7. USER ACTIVITIES (20 actividades completadas)
  -- ============================================================
  IF act1 IS NOT NULL THEN
    INSERT INTO user_activities (id, user_id, activity_id, pet_id, completed_at, notes)
    VALUES
      (gen_random_uuid(), u1, act1, pet1, now() - interval '14 days', 'Paseo matutino por el barrio'),
      (gen_random_uuid(), u1, act2, pet1, now() - interval '12 days', 'Control anual, todo bien'),
      (gen_random_uuid(), u1, act1, pet2, now() - interval '10 days', 'Paseo con Rocky al cerro'),
      (gen_random_uuid(), u2, act1, pet3, now() - interval '13 days', 'Corrimos 8km por el río'),
      (gen_random_uuid(), u2, act5, pet3, now() - interval '9 days', 'Sesión de obediencia'),
      (gen_random_uuid(), u3, act3, pet4, now() - interval '11 days', 'Simba quedó hermoso'),
      (gen_random_uuid(), u3, act2, pet4, now() - interval '7 days', 'Vacuna antirrábica'),
      (gen_random_uuid(), u4, act4, pet5, now() - interval '8 days', 'Juegos en el Bicentenario'),
      (gen_random_uuid(), u4, act1, pet5, now() - interval '3 days', 'Paseo largo por Vitacura'),
      (gen_random_uuid(), u5, act1, pet6, now() - interval '6 days', 'Paseo con los tres perros'),
      (gen_random_uuid(), u5, act2, pet6, now() - interval '4 days', 'Desparasitación'),
      (gen_random_uuid(), u5, act3, pet10, now() - interval '2 days', 'Baño de Pelusa'),
      (gen_random_uuid(), u6, act5, pet7, now() - interval '5 days', 'Entrenamiento con Rex'),
      (gen_random_uuid(), u6, act1, pet7, now() - interval '1 day', 'Paseo por La Florida'),
      (gen_random_uuid(), u7, act3, pet8, now() - interval '9 days', 'Miso al peluquero felino'),
      (gen_random_uuid(), u7, act2, pet8, now() - interval '4 days', 'Control general de Miso'),
      (gen_random_uuid(), u8, act1, pet9, now() - interval '7 days', 'Paseo al atardecer con Buddy'),
      (gen_random_uuid(), u8, act4, pet9, now() - interval '3 days', 'Juego de pelota en el parque'),
      (gen_random_uuid(), u8, act1, pet9, now() - interval '1 day', 'Paseo largo por Puente Alto'),
      (gen_random_uuid(), u1, act4, pet1, now() - interval '2 days', 'Luna jugando con otros perros')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ============================================================
  -- 8. PET ACTIVITIES (diario de actividades, 20 entradas)
  -- ============================================================
  INSERT INTO pet_activities (id, pet_id, owner_id, activity_type, title, metadata, created_at)
  VALUES
    (gen_random_uuid(), pet1, u1, 'walk', 'Paseo matutino con Luna', '{"duration_min": 45, "distance_km": 3.2}'::jsonb, now() - interval '13 days'),
    (gen_random_uuid(), pet1, u1, 'vet_visit', 'Control anual de Luna', '{"clinic": "Veterinaria Patitas"}'::jsonb, now() - interval '10 days'),
    (gen_random_uuid(), pet1, u1, 'grooming', 'Baño de Luna', '{"service": "baño completo"}'::jsonb, now() - interval '6 days'),
    (gen_random_uuid(), pet2, u1, 'walk', 'Rocky al río Mapocho', '{"duration_min": 60, "distance_km": 5.0}'::jsonb, now() - interval '11 days'),
    (gen_random_uuid(), pet3, u2, 'walk', 'Canicross con Thor 10km', '{"duration_min": 55, "distance_km": 10}'::jsonb, now() - interval '12 days'),
    (gen_random_uuid(), pet3, u2, 'walk', 'Paseo por cerro San Cristóbal', '{"duration_min": 90, "distance_km": 7}'::jsonb, now() - interval '5 days'),
    (gen_random_uuid(), pet4, u3, 'vet_visit', 'Vacuna antirrábica de Simba', '{"vaccine": "antirrábica"}'::jsonb, now() - interval '8 days'),
    (gen_random_uuid(), pet4, u3, 'grooming', 'Cepillado de Simba', '{"service": "cepillado persa"}'::jsonb, now() - interval '3 days'),
    (gen_random_uuid(), pet5, u4, 'walk', 'Max en el Parque Bicentenario', '{"duration_min": 50, "distance_km": 4}'::jsonb, now() - interval '9 days'),
    (gen_random_uuid(), pet5, u4, 'vaccine', 'Vacuna séxtuple de Max', '{"vaccine": "séxtuple canina"}'::jsonb, now() - interval '4 days'),
    (gen_random_uuid(), pet6, u5, 'walk', 'Paseo con Canela y Pelusa', '{"duration_min": 40, "distance_km": 2.5}'::jsonb, now() - interval '7 days'),
    (gen_random_uuid(), pet6, u5, 'vet_visit', 'Desparasitación de Canela', '{"treatment": "desparasitación interna"}'::jsonb, now() - interval '4 days'),
    (gen_random_uuid(), pet7, u6, 'walk', 'Entrenamiento con Rex al parque', '{"duration_min": 60, "distance_km": 4}'::jsonb, now() - interval '6 days'),
    (gen_random_uuid(), pet7, u6, 'walk', 'Rex corriendo por La Florida', '{"duration_min": 45, "distance_km": 3}'::jsonb, now() - interval '1 day'),
    (gen_random_uuid(), pet8, u7, 'vet_visit', 'Control general de Miso', '{"clinic": "Cat Clinic"}'::jsonb, now() - interval '5 days'),
    (gen_random_uuid(), pet8, u7, 'grooming', 'Miso al peluquero felino', '{"service": "corte y baño felino"}'::jsonb, now() - interval '9 days'),
    (gen_random_uuid(), pet9, u8, 'walk', 'Buddy al parque al atardecer', '{"duration_min": 50, "distance_km": 3.5}'::jsonb, now() - interval '7 days'),
    (gen_random_uuid(), pet9, u8, 'walk', 'Paseo largo con Buddy', '{"duration_min": 70, "distance_km": 5}'::jsonb, now() - interval '2 days'),
    (gen_random_uuid(), pet9, u8, 'vaccine', 'Vacuna anual de Buddy', '{"vaccine": "séxtuple canina"}'::jsonb, now() - interval '14 days'),
    (gen_random_uuid(), pet10, u5, 'grooming', 'Pelusa al baño', '{"service": "baño y corte"}'::jsonb, now() - interval '3 days')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- 9. PAW BADGES (catálogo — solo si están vacíos)
  -- ============================================================
  IF NOT EXISTS (SELECT 1 FROM paw_badges LIMIT 1) THEN
    INSERT INTO paw_badges (id, badge_key, name, description, category, icon, rarity, unlock_condition, unlock_value, points_bonus)
    VALUES
      (gen_random_uuid(), 'first_pet', 'Primera Mascota', 'Registraste tu primera mascota en Paw Friend', 'participation', 'paw-print', 'common', 'register_pet', 1, 10),
      (gen_random_uuid(), 'vet_regular', 'Tutor Responsable', 'Llevaste a tu mascota al vet 5 veces', 'health', 'stethoscope', 'rare', 'vet_visits', 5, 25),
      (gen_random_uuid(), 'social_butterfly', 'Mariposa Social', 'Publicaste 10 posts en el feed', 'community', 'message-circle', 'rare', 'create_posts', 10, 20),
      (gen_random_uuid(), 'walker_pro', 'Paseador Pro', 'Completaste 20 paseos registrados', 'activity', 'footprints', 'epic', 'complete_walks', 20, 30),
      (gen_random_uuid(), 'adoption_hero', 'Héroe de la Adopción', 'Adoptaste una mascota desde la plataforma', 'special', 'heart', 'legendary', 'adopt_pet', 1, 50),
      (gen_random_uuid(), 'vaccine_champion', 'Campeón de Vacunas', 'Todas las vacunas de tu mascota al día', 'health', 'shield', 'common', 'vaccines_up_to_date', 1, 15)
    ON CONFLICT (badge_key) DO NOTHING;
  END IF;

  -- Resolver badge IDs
  SELECT id INTO b1 FROM paw_badges WHERE badge_key = 'first_pet';
  SELECT id INTO b2 FROM paw_badges WHERE badge_key = 'vet_regular';
  SELECT id INTO b3 FROM paw_badges WHERE badge_key = 'social_butterfly';
  SELECT id INTO b4 FROM paw_badges WHERE badge_key = 'walker_pro';
  SELECT id INTO b5 FROM paw_badges WHERE badge_key = 'adoption_hero';
  SELECT id INTO b6 FROM paw_badges WHERE badge_key = 'vaccine_champion';

  -- ============================================================
  -- 10. USER PAW BADGES (10 badges otorgados a users demo)
  -- ============================================================
  IF b1 IS NOT NULL THEN
    INSERT INTO user_paw_badges (id, user_id, badge_id, earned_at)
    VALUES
      (gen_random_uuid(), u1, b1, now() - interval '60 days'),
      (gen_random_uuid(), u1, b6, now() - interval '30 days'),
      (gen_random_uuid(), u2, b1, now() - interval '55 days'),
      (gen_random_uuid(), u2, b4, now() - interval '10 days'),
      (gen_random_uuid(), u3, b1, now() - interval '50 days'),
      (gen_random_uuid(), u3, b2, now() - interval '15 days'),
      (gen_random_uuid(), u5, b1, now() - interval '45 days'),
      (gen_random_uuid(), u5, b5, now() - interval '20 days'),
      (gen_random_uuid(), u5, b3, now() - interval '5 days'),
      (gen_random_uuid(), u8, b1, now() - interval '40 days')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ============================================================
  -- 11. PAW MISSIONS (catálogo — solo si están vacías)
  -- ============================================================
  IF NOT EXISTS (SELECT 1 FROM paw_missions LIMIT 1) THEN
    INSERT INTO paw_missions (id, mission_type, category, title, description, icon, points_reward, target_action, target_count, required_level)
    VALUES
      (gen_random_uuid(), 'daily', 'activity', 'Paseo del día', 'Registra un paseo con tu mascota', 'footprints', 15, 'log_walk', 1, 1),
      (gen_random_uuid(), 'daily', 'community', 'Comparte tu día', 'Publica algo en el feed social', 'message-circle', 10, 'create_post', 1, 1),
      (gen_random_uuid(), 'weekly', 'health', 'Guardián de la salud', 'Registra una visita al veterinario esta semana', 'stethoscope', 30, 'log_vet_visit', 1, 1),
      (gen_random_uuid(), 'weekly', 'care', 'Cuidado premium', 'Lleva a tu mascota al peluquero', 'scissors', 25, 'log_grooming', 1, 1),
      (gen_random_uuid(), 'story', 'exploration', 'Explorador urbano', 'Completa 5 paseos diferentes en una semana', 'map', 50, 'unique_walks', 5, 2)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Resolver mission IDs
  SELECT id INTO m1 FROM paw_missions WHERE target_action = 'log_walk' LIMIT 1;
  SELECT id INTO m2 FROM paw_missions WHERE target_action = 'create_post' LIMIT 1;
  SELECT id INTO m3 FROM paw_missions WHERE target_action = 'log_vet_visit' LIMIT 1;
  SELECT id INTO m4 FROM paw_missions WHERE target_action = 'log_grooming' LIMIT 1;
  SELECT id INTO m5 FROM paw_missions WHERE target_action = 'unique_walks' LIMIT 1;

  -- ============================================================
  -- 12. USER MISSION PROGRESS (5 misiones en progreso)
  -- ============================================================
  IF m1 IS NOT NULL THEN
    INSERT INTO user_mission_progress (id, user_id, mission_id, current_progress, is_completed, completed_at, assigned_date)
    VALUES
      (gen_random_uuid(), u1, m1, 1, true, now() - interval '1 day', CURRENT_DATE - 1),
      (gen_random_uuid(), u2, m1, 1, true, now() - interval '2 days', CURRENT_DATE - 2),
      (gen_random_uuid(), u3, m3, 1, true, now() - interval '3 days', CURRENT_DATE - 3),
      (gen_random_uuid(), u5, m2, 0, false, NULL, CURRENT_DATE),
      (gen_random_uuid(), u8, m5, 3, false, NULL, CURRENT_DATE)
    ON CONFLICT (user_id, mission_id, assigned_date) DO NOTHING;
  END IF;

  -- ============================================================
  -- 13. SERVICE PROMOTIONS (6 promociones de servicios)
  -- ============================================================
  INSERT INTO service_promotions (id, user_id, service_type, title, description, status, created_at)
  VALUES
    (gen_random_uuid(), u3, 'veterinarian', 'Consulta veterinaria a domicilio', 'Atención profesional en la comodidad de tu hogar. Consulta general, vacunas y control preventivo. Comunas Ñuñoa, Providencia y Macul. $30.000 la consulta.', 'approved', now() - interval '10 days'),
    (gen_random_uuid(), u6, 'trainer', 'Adiestramiento canino personalizado', 'Sesiones de obediencia y socialización con método positivo. 15 años de experiencia. Sesión de 1 hora $20.000. Primera clase de evaluación gratis!', 'approved', now() - interval '8 days'),
    (gen_random_uuid(), u6, 'dog_walker', 'Paseos grupales en La Florida', 'Paseos de 1 hora, máximo 4 perros por grupo. De lunes a viernes. $8.000 por paseo. Incluye fotos y reporte.', 'approved', now() - interval '6 days'),
    (gen_random_uuid(), u4, 'veterinarian', 'Fotografía profesional de mascotas', 'Sesiones de fotos para tu peludo en locaciones de Santiago. Incluye 20 fotos editadas. Desde $35.000.', 'approved', now() - interval '5 days'),
    (gen_random_uuid(), u3, 'veterinarian', 'Desparasitación a domicilio', 'Servicio de desparasitación interna y externa a domicilio. Producto incluido. $18.000. Agenda por chat.', 'approved', now() - interval '3 days'),
    (gen_random_uuid(), u8, 'dog_walker', 'Paseos los fines de semana en Puente Alto', 'Paseos individuales o grupales en parques de Puente Alto. 45 min a 1 hora. $7.000 individual, $5.000 grupal.', 'pending', now() - interval '1 day')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- 14. MEDICAL SHARE TOKENS + VET CLINICAL NOTES
  --     Solo si hay providers de tipo vet en service_providers
  -- ============================================================
  SELECT id INTO prov1 FROM service_providers WHERE status = 'approved' LIMIT 1;
  SELECT id INTO prov2 FROM service_providers WHERE status = 'approved' LIMIT 1 OFFSET 1;

  IF prov1 IS NOT NULL AND pet1 IS NOT NULL THEN
    -- Crear share tokens demo
    st1 := gen_random_uuid();
    st2 := gen_random_uuid();
    st3 := gen_random_uuid();

    INSERT INTO medical_share_tokens (id, pet_id, owner_id, token, expires_at, is_revoked, created_at)
    VALUES
      (st1, pet1, u1, 'demo-token-luna-001', now() + interval '30 days', false, now() - interval '10 days'),
      (st2, pet3, u2, 'demo-token-thor-001', now() + interval '30 days', false, now() - interval '7 days'),
      (st3, pet6, u5, 'demo-token-canela-001', now() + interval '30 days', false, now() - interval '5 days')
    ON CONFLICT (token) DO NOTHING;

    -- Notas clínicas del vet (vinculadas a share tokens)
    INSERT INTO vet_clinical_notes (id, share_token_id, provider_id, pet_id, note_type, title, description, created_at)
    VALUES
      (gen_random_uuid(), st1, prov1, pet1, 'consulta', 'Control general Luna', 'Paciente en buen estado general. Peso 12.5 kg estable. Mucosas rosadas, hidratación normal. Se recomienda desparasitación interna.', now() - interval '10 days'),
      (gen_random_uuid(), st1, prov1, pet1, 'vacuna', 'Vacuna antirrábica Luna', 'Se administra vacuna antirrábica anual. Sin reacciones adversas. Próxima dosis en 12 meses.', now() - interval '5 days'),
      (gen_random_uuid(), st2, prov1, pet3, 'control', 'Revisión post-ejercicio Thor', 'Husky de 28 kg. Evaluación articular post canicross. Sin signos de displasia ni claudicación. Recomendación: mantener rutina con calentamiento previo.', now() - interval '7 days'),
      (gen_random_uuid(), st3, prov1, pet6, 'consulta', 'Primera consulta Canela', 'Mestiza rescatada, 8 kg. Examen general satisfactorio. Heterocromía ocular (ojo derecho celeste, izquierdo café). Vacunas al día. Buena condición corporal.', now() - interval '5 days'),
      (gen_random_uuid(), st3, prov1, pet6, 'vacuna', 'Vacuna séxtuple Canela', 'Se administra refuerzo de séxtuple canina. Paciente toleró bien la inyección. Control en 3 semanas.', now() - interval '3 days')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ============================================================
  -- 15. NOTIFICATIONS (si la tabla existe — no hay CREATE TABLE
  --     en migraciones pero es usada por triggers)
  -- ============================================================
  BEGIN
    INSERT INTO notifications (user_id, type, title, body, action_url, created_at)
    VALUES
      (u1, 'reminder', 'Recordatorio de vacuna', 'La vacuna antirrábica de Luna vence en 7 días', '/reminders', now() - interval '3 days'),
      (u1, 'social', 'Nuevo comentario', 'Valentina Muñoz comentó en tu publicación', '/feed', now() - interval '2 days'),
      (u1, 'booking', 'Reserva confirmada', 'Tu cita veterinaria para Luna fue confirmada para el viernes', '/mis-reservas', now() - interval '1 day'),
      (u2, 'social', 'Nuevo seguidor', 'Camila Silva comenzó a seguirte', '/profile', now() - interval '5 days'),
      (u2, 'reminder', 'Paseo pendiente', 'No has registrado un paseo hoy. Thor necesita ejercicio!', '/home', now() - interval '1 day'),
      (u3, 'review_received', 'Nueva reseña', 'Recibiste una calificación de 5 estrellas', '/provider/dashboard', now() - interval '4 days'),
      (u3, 'social', 'Tu post es popular', 'Tu publicación sobre desparasitación tiene 9 likes', '/feed', now() - interval '2 days'),
      (u5, 'reminder', 'Desparasitación pendiente', 'Es hora de desparasitar a Canela. Última fue hace 3 meses', '/reminders', now() - interval '6 days'),
      (u5, 'social', 'Nuevo comentario', 'Isidora Parra comentó en tu publicación', '/feed', now() - interval '1 day'),
      (u5, 'adoption', 'Interés en adopción', 'Alguien mostró interés en tu publicación de adopción', '/adoption', now() - interval '3 days'),
      (u6, 'booking', 'Nueva reserva', 'Matías Rojas quiere agendar una sesión de entrenamiento', '/mis-reservas', now() - interval '2 days'),
      (u7, 'social', 'Nuevo seguidor', 'Sebastián Díaz comenzó a seguirte', '/profile', now() - interval '4 days'),
      (u7, 'reminder', 'Control veterinario', 'Miso tiene su control programado para esta semana', '/reminders', now() - interval '1 day'),
      (u8, 'social', 'Nuevo comentario', 'Camila Silva comentó en tu publicación', '/feed', now() - interval '12 hours'),
      (u8, 'reminder', 'Vacuna próxima', 'La vacuna séxtuple de Buddy vence en 14 días', '/reminders', now() - interval '2 days')
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Tabla notifications no existe, se omite el seed de notificaciones.';
  END;

  RAISE NOTICE 'Seed demo content aplicado exitosamente.';

END;
$$;
