-- ============================================
-- SEED DATA: Usuarios demo con mascotas
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Crear usuarios en auth.users (con password hasheada para "demo1234")
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, raw_app_meta_data, aud, role)
VALUES
  ('a1b2c3d4-1111-4000-a000-000000000001', '00000000-0000-0000-0000-000000000000', 'camila.silva@demo.cl', crypt('demo1234', gen_salt('bf')), now(), now(), now(), '{"display_name": "Camila Silva"}', '{"provider": "email", "providers": ["email"]}', 'authenticated', 'authenticated'),
  ('a1b2c3d4-2222-4000-a000-000000000002', '00000000-0000-0000-0000-000000000000', 'matias.rojas@demo.cl', crypt('demo1234', gen_salt('bf')), now(), now(), now(), '{"display_name": "Matías Rojas"}', '{"provider": "email", "providers": ["email"]}', 'authenticated', 'authenticated'),
  ('a1b2c3d4-3333-4000-a000-000000000003', '00000000-0000-0000-0000-000000000000', 'valentina.munoz@demo.cl', crypt('demo1234', gen_salt('bf')), now(), now(), now(), '{"display_name": "Valentina Muñoz"}', '{"provider": "email", "providers": ["email"]}', 'authenticated', 'authenticated'),
  ('a1b2c3d4-4444-4000-a000-000000000004', '00000000-0000-0000-0000-000000000000', 'sebastian.diaz@demo.cl', crypt('demo1234', gen_salt('bf')), now(), now(), now(), '{"display_name": "Sebastián Díaz"}', '{"provider": "email", "providers": ["email"]}', 'authenticated', 'authenticated'),
  ('a1b2c3d4-5555-4000-a000-000000000005', '00000000-0000-0000-0000-000000000000', 'francisca.lagos@demo.cl', crypt('demo1234', gen_salt('bf')), now(), now(), now(), '{"display_name": "Francisca Lagos"}', '{"provider": "email", "providers": ["email"]}', 'authenticated', 'authenticated'),
  ('a1b2c3d4-6666-4000-a000-000000000006', '00000000-0000-0000-0000-000000000000', 'nicolas.herrera@demo.cl', crypt('demo1234', gen_salt('bf')), now(), now(), now(), '{"display_name": "Nicolás Herrera"}', '{"provider": "email", "providers": ["email"]}', 'authenticated', 'authenticated'),
  ('a1b2c3d4-7777-4000-a000-000000000007', '00000000-0000-0000-0000-000000000000', 'isidora.parra@demo.cl', crypt('demo1234', gen_salt('bf')), now(), now(), now(), '{"display_name": "Isidora Parra"}', '{"provider": "email", "providers": ["email"]}', 'authenticated', 'authenticated'),
  ('a1b2c3d4-8888-4000-a000-000000000008', '00000000-0000-0000-0000-000000000000', 'tomas.gonzalez@demo.cl', crypt('demo1234', gen_salt('bf')), now(), now(), now(), '{"display_name": "Tomás González"}', '{"provider": "email", "providers": ["email"]}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Crear identities para cada usuario (requerido por Supabase Auth)
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at)
VALUES
  ('a1b2c3d4-1111-4000-a000-000000000001', 'a1b2c3d4-1111-4000-a000-000000000001', '{"sub": "a1b2c3d4-1111-4000-a000-000000000001", "email": "camila.silva@demo.cl"}', 'email', 'a1b2c3d4-1111-4000-a000-000000000001', now(), now(), now()),
  ('a1b2c3d4-2222-4000-a000-000000000002', 'a1b2c3d4-2222-4000-a000-000000000002', '{"sub": "a1b2c3d4-2222-4000-a000-000000000002", "email": "matias.rojas@demo.cl"}', 'email', 'a1b2c3d4-2222-4000-a000-000000000002', now(), now(), now()),
  ('a1b2c3d4-3333-4000-a000-000000000003', 'a1b2c3d4-3333-4000-a000-000000000003', '{"sub": "a1b2c3d4-3333-4000-a000-000000000003", "email": "valentina.munoz@demo.cl"}', 'email', 'a1b2c3d4-3333-4000-a000-000000000003', now(), now(), now()),
  ('a1b2c3d4-4444-4000-a000-000000000004', 'a1b2c3d4-4444-4000-a000-000000000004', '{"sub": "a1b2c3d4-4444-4000-a000-000000000004", "email": "sebastian.diaz@demo.cl"}', 'email', 'a1b2c3d4-4444-4000-a000-000000000004', now(), now(), now()),
  ('a1b2c3d4-5555-4000-a000-000000000005', 'a1b2c3d4-5555-4000-a000-000000000005', '{"sub": "a1b2c3d4-5555-4000-a000-000000000005", "email": "francisca.lagos@demo.cl"}', 'email', 'a1b2c3d4-5555-4000-a000-000000000005', now(), now(), now()),
  ('a1b2c3d4-6666-4000-a000-000000000006', 'a1b2c3d4-6666-4000-a000-000000000006', '{"sub": "a1b2c3d4-6666-4000-a000-000000000006", "email": "nicolas.herrera@demo.cl"}', 'email', 'a1b2c3d4-6666-4000-a000-000000000006', now(), now(), now()),
  ('a1b2c3d4-7777-4000-a000-000000000007', 'a1b2c3d4-7777-4000-a000-000000000007', '{"sub": "a1b2c3d4-7777-4000-a000-000000000007", "email": "isidora.parra@demo.cl"}', 'email', 'a1b2c3d4-7777-4000-a000-000000000007', now(), now(), now()),
  ('a1b2c3d4-8888-4000-a000-000000000008', 'a1b2c3d4-8888-4000-a000-000000000008', '{"sub": "a1b2c3d4-8888-4000-a000-000000000008", "email": "tomas.gonzalez@demo.cl"}', 'email', 'a1b2c3d4-8888-4000-a000-000000000008', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PROFILES
-- ============================================
INSERT INTO profiles (id, display_name, bio, location, avatar_url) VALUES
  ('a1b2c3d4-1111-4000-a000-000000000001', 'Camila Silva', 'Amante de los animales. Rescatista voluntaria en Santiago.', 'Providencia, Santiago', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Camila'),
  ('a1b2c3d4-2222-4000-a000-000000000002', 'Matías Rojas', 'Corredor con mi perro. Fan del canicross y la vida outdoor.', 'Las Condes, Santiago', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Matias'),
  ('a1b2c3d4-3333-4000-a000-000000000003', 'Valentina Muñoz', 'Veterinaria de vocación. Mis gatos son mi mundo.', 'Ñuñoa, Santiago', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Valentina'),
  ('a1b2c3d4-4444-4000-a000-000000000004', 'Sebastián Díaz', 'Fotógrafo de mascotas. Capturo momentos peludos.', 'Vitacura, Santiago', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sebastian'),
  ('a1b2c3d4-5555-4000-a000-000000000005', 'Francisca Lagos', 'Mamá de 3 perritos adoptados. Adopta no compres!', 'Maipú, Santiago', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Francisca'),
  ('a1b2c3d4-6666-4000-a000-000000000006', 'Nicolás Herrera', 'Entrenador canino certificado. Educación positiva siempre.', 'La Florida, Santiago', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nicolas'),
  ('a1b2c3d4-7777-4000-a000-000000000007', 'Isidora Parra', 'Cat lady orgullosa. 4 gatos rescatados y contando.', 'Recoleta, Santiago', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isidora'),
  ('a1b2c3d4-8888-4000-a000-000000000008', 'Tomás González', 'Paseo perros los fines de semana. Golden lover.', 'Puente Alto, Santiago', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tomas')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- MASCOTAS (2-3 por usuario, mix de perros y gatos)
-- ============================================
INSERT INTO pets (id, owner_id, name, species, breed, gender, birth_date, weight, size, color, bio, photo_url, is_public, neutered, vaccination_status, personality) VALUES
  -- Camila Silva: 3 mascotas (2 perros rescatados + 1 gato)
  (gen_random_uuid(), 'a1b2c3d4-1111-4000-a000-000000000001', 'Luna', 'perro', 'Mestizo', 'hembra', '2021-03-15', 12.5, 'mediano', 'Negro con patas blancas', 'Rescatada de la calle con 3 meses. Es la más cariñosa del mundo.', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400', true, true, 'al_dia', '{"cariñosa","juguetona","sociable"}'),
  (gen_random_uuid(), 'a1b2c3d4-1111-4000-a000-000000000001', 'Rocky', 'perro', 'Labrador Mix', 'macho', '2020-08-20', 25.0, 'grande', 'Dorado', 'Le encanta nadar y buscar la pelota. Adoptado de un refugio.', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400', true, true, 'al_dia', '{"energético","amigable","leal"}'),
  (gen_random_uuid(), 'a1b2c3d4-1111-4000-a000-000000000001', 'Michi', 'gato', 'Mestizo', 'macho', '2022-01-10', 4.2, 'mediano', 'Atigrado', 'El rey de la casa. Duerme 18 horas al día.', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', true, true, 'al_dia', '{"independiente","curioso","dormilón"}'),

  -- Matías Rojas: 2 mascotas (2 perros deportistas)
  (gen_random_uuid(), 'a1b2c3d4-2222-4000-a000-000000000002', 'Thor', 'perro', 'Husky Siberiano', 'macho', '2019-11-05', 28.0, 'grande', 'Gris y blanco', 'Mi compañero de running. Corremos juntos todos los días.', 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=400', true, true, 'al_dia', '{"aventurero","energético","independiente"}'),
  (gen_random_uuid(), 'a1b2c3d4-2222-4000-a000-000000000002', 'Kira', 'perro', 'Border Collie', 'hembra', '2021-06-18', 18.0, 'mediano', 'Negro y blanco', 'La más inteligente. Sabe más de 30 trucos.', 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=400', true, true, 'al_dia', '{"inteligente","activa","obediente"}'),

  -- Valentina Muñoz: 3 mascotas (3 gatos)
  (gen_random_uuid(), 'a1b2c3d4-3333-4000-a000-000000000003', 'Simba', 'gato', 'Persa', 'macho', '2020-04-22', 5.5, 'mediano', 'Naranja', 'Un príncipe en toda regla. Le encanta que lo peinen.', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400', true, true, 'al_dia', '{"tranquilo","cariñoso","perezoso"}'),
  (gen_random_uuid(), 'a1b2c3d4-3333-4000-a000-000000000003', 'Nala', 'gato', 'Siamés', 'hembra', '2021-09-30', 3.8, 'pequeño', 'Crema con puntas oscuras', 'Muy habladora. Maúlla para todo.', 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=400', true, true, 'al_dia', '{"sociable","vocal","juguetona"}'),
  (gen_random_uuid(), 'a1b2c3d4-3333-4000-a000-000000000003', 'Cleo', 'gato', 'Mestizo', 'hembra', '2022-12-01', 3.2, 'pequeño', 'Tricolor', 'La bebé del grupo. Fue rescatada de un terreno baldío.', 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400', true, false, 'al_dia', '{"tímida","dulce","curiosa"}'),

  -- Sebastián Díaz: 2 mascotas (1 perro + 1 gato)
  (gen_random_uuid(), 'a1b2c3d4-4444-4000-a000-000000000004', 'Max', 'perro', 'Golden Retriever', 'macho', '2020-02-14', 32.0, 'grande', 'Dorado', 'Mi modelo favorito. Sale en todas mis fotos.', 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400', true, true, 'al_dia', '{"fotogénico","amable","paciente"}'),
  (gen_random_uuid(), 'a1b2c3d4-4444-4000-a000-000000000004', 'Sombra', 'gato', 'Bombay', 'macho', '2021-10-31', 4.8, 'mediano', 'Negro', 'Apareció en Halloween y se quedó para siempre.', 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400', true, true, 'al_dia', '{"misterioso","cariñoso","nocturno"}'),

  -- Francisca Lagos: 3 mascotas (3 perros adoptados)
  (gen_random_uuid(), 'a1b2c3d4-5555-4000-a000-000000000005', 'Canela', 'perro', 'Mestizo', 'hembra', '2019-07-20', 8.0, 'pequeño', 'Café', 'Mi primera adoptada. Tiene un ojo celeste y otro café.', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400', true, true, 'al_dia', '{"leal","protectora","cariñosa"}'),
  (gen_random_uuid(), 'a1b2c3d4-5555-4000-a000-000000000005', 'Pelusa', 'perro', 'Poodle Mix', 'hembra', '2020-12-25', 6.5, 'pequeño', 'Blanco', 'Regalo de Navidad para toda la familia.', 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400', true, true, 'al_dia', '{"alegre","juguetona","sociable"}'),
  (gen_random_uuid(), 'a1b2c3d4-5555-4000-a000-000000000005', 'Toby', 'perro', 'Mestizo', 'macho', '2022-05-10', 15.0, 'mediano', 'Blanco y negro', 'El más nuevo de la manada. Se lleva bien con todos.', 'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=400', true, true, 'al_dia', '{"tranquilo","adaptable","amistoso"}'),

  -- Nicolás Herrera: 2 mascotas (2 perros de trabajo)
  (gen_random_uuid(), 'a1b2c3d4-6666-4000-a000-000000000006', 'Rex', 'perro', 'Pastor Alemán', 'macho', '2018-09-12', 35.0, 'grande', 'Negro y fuego', 'Mi asistente de entrenamiento. Super obediente.', 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400', true, true, 'al_dia', '{"disciplinado","inteligente","protector"}'),
  (gen_random_uuid(), 'a1b2c3d4-6666-4000-a000-000000000006', 'Nube', 'perro', 'Samoyedo', 'hembra', '2021-01-20', 22.0, 'grande', 'Blanco', 'La más sociable del barrio. Todos la conocen.', 'https://images.unsplash.com/photo-1529429617124-95b109e86bb8?w=400', true, true, 'al_dia', '{"amigable","alegre","social"}'),

  -- Isidora Parra: 3 mascotas (4 gatos, pero pondremos 3)
  (gen_random_uuid(), 'a1b2c3d4-7777-4000-a000-000000000007', 'Miso', 'gato', 'Scottish Fold', 'macho', '2020-06-15', 4.0, 'mediano', 'Gris', 'El más fotogénico de la casa. Sus orejas son únicas.', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400', true, true, 'al_dia', '{"tranquilo","curioso","fotogénico"}'),
  (gen_random_uuid(), 'a1b2c3d4-7777-4000-a000-000000000007', 'Mora', 'gato', 'Mestizo', 'hembra', '2021-03-08', 3.5, 'pequeño', 'Negro', 'Rescatada de un techo. Ahora es la reina.', 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400', true, true, 'al_dia', '{"valiente","independiente","cariñosa"}'),
  (gen_random_uuid(), 'a1b2c3d4-7777-4000-a000-000000000007', 'Café', 'gato', 'Ragdoll', 'macho', '2022-08-22', 5.2, 'grande', 'Bicolor crema', 'El más grande y el más miedoso. Le encanta estar en brazos.', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400', true, false, 'al_dia', '{"tímido","dulce","apegado"}'),

  -- Tomás González: 2 mascotas (1 golden + 1 gato)
  (gen_random_uuid(), 'a1b2c3d4-8888-4000-a000-000000000008', 'Buddy', 'perro', 'Golden Retriever', 'macho', '2019-12-24', 30.0, 'grande', 'Dorado claro', 'Mi compañero de paseos. Ama a todos los perros del parque.', 'https://images.unsplash.com/photo-1612774412771-005ed8e861d2?w=400', true, true, 'al_dia', '{"amigable","leal","juguetón"}'),
  (gen_random_uuid(), 'a1b2c3d4-8888-4000-a000-000000000008', 'Pelusa', 'gato', 'Angora', 'hembra', '2021-07-04', 4.5, 'mediano', 'Blanco', 'La princesa de pelo largo. Se lleva increíble con Buddy.', 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=400', true, true, 'al_dia', '{"elegante","juguetona","sociable"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Algunos posts en el feed social
-- ============================================
INSERT INTO posts (id, user_id, content, image_url, created_at) VALUES
  (gen_random_uuid(), 'a1b2c3d4-1111-4000-a000-000000000001', 'Luna y Rocky disfrutando del Parque Bicentenario! Nada mejor que un domingo al sol con mis peludos.', 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600', now() - interval '2 days'),
  (gen_random_uuid(), 'a1b2c3d4-2222-4000-a000-000000000002', 'Primer canicross del año con Thor! 10km en el cerro San Cristóbal. Este husky no se cansa nunca.', 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=600', now() - interval '1 day'),
  (gen_random_uuid(), 'a1b2c3d4-3333-4000-a000-000000000003', 'Simba siendo Simba. 15 minutos posando para la foto y al final se durmió.', 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600', now() - interval '3 days'),
  (gen_random_uuid(), 'a1b2c3d4-4444-4000-a000-000000000004', 'Sesión de fotos con Max en el atardecer. Este golden nació para ser modelo.', 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600', now() - interval '12 hours'),
  (gen_random_uuid(), 'a1b2c3d4-5555-4000-a000-000000000005', 'Hoy se cumplen 3 años desde que adopté a Canela. Mejor decisión de mi vida. Adopta, no compres!', 'https://images.unsplash.com/photo-1583337130417-13571fc8b1d3?w=600', now() - interval '6 hours'),
  (gen_random_uuid(), 'a1b2c3d4-6666-4000-a000-000000000006', 'Clase de obediencia con Nube. Esta samoyedo es la alumna estrella!', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600', now() - interval '4 hours'),
  (gen_random_uuid(), 'a1b2c3d4-7777-4000-a000-000000000007', 'Miso, Mora y Café alineados esperando su comida. La sincronización gatuna es real.', 'https://images.unsplash.com/photo-1615497001839-b0a0eac3274c?w=600', now() - interval '5 hours'),
  (gen_random_uuid(), 'a1b2c3d4-8888-4000-a000-000000000008', 'Buddy y Pelusa: la prueba de que perros y gatos pueden ser mejores amigos.', 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600', now() - interval '8 hours')
ON CONFLICT (id) DO NOTHING;
