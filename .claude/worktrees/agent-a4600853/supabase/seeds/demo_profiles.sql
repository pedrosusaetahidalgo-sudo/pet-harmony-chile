-- ============================================================
-- Paw Friend — 5 perfiles de demostración para reuniones de venta
-- 2026-04-08
-- ============================================================
-- Marcador: license_number con prefijo "DEMO" para identificar y borrar fácil.
-- Para borrar todos los demos:
--   DELETE FROM service_reviews WHERE provider_id IN (
--     SELECT id FROM service_providers WHERE license_number LIKE 'DEMO%'
--   );
--   DELETE FROM service_providers WHERE license_number LIKE 'DEMO%';
-- ============================================================

-- Limpiar demos previos (idempotente)
DELETE FROM service_reviews WHERE provider_id IN (
  SELECT id FROM service_providers WHERE license_number LIKE 'DEMO%'
);
DELETE FROM service_providers WHERE license_number LIKE 'DEMO%';

-- Necesitamos 5 user_ids distintos (UNIQUE en service_providers.user_id).
-- Tomamos los 5 profiles más antiguos (existentes) — los demos los reusamos.
-- Si hay menos de 5 profiles, falla el INSERT con un error claro.

WITH demo_users AS (
  SELECT id, row_number() OVER (ORDER BY created_at) AS rn
  FROM profiles
  WHERE NOT EXISTS (
    SELECT 1 FROM service_providers sp
    WHERE sp.user_id = profiles.id
      AND sp.license_number NOT LIKE 'DEMO%'
  )
  LIMIT 5
),
reviewer AS (
  SELECT id FROM profiles ORDER BY created_at LIMIT 1
)

-- ===========================================================
-- PERFIL 1: Dra. Javiera Muñoz — recién egresada, domicilio
-- ===========================================================
INSERT INTO service_providers (
  user_id, display_name, bio, provider_type, specialties, service_areas,
  commune, license_number, price_from, experience_years, avatar_url,
  is_directory_visible, is_verified, provider_plan, status,
  avg_rating, total_reviews, public_email, public_phone, slug, accepts_emergency
)
SELECT
  (SELECT id FROM demo_users WHERE rn = 1),
  'Dra. Javiera Muñoz',
  'Médica veterinaria recién egresada de la Universidad de Chile, con vocación por la medicina preventiva y la atención cercana. Atiendo a domicilio en el sector oriente de Santiago para que tu mascota no tenga que pasar por el estrés del traslado. Especializada en primera consulta, vacunación y orientación nutricional.',
  'home_visit',
  ARRAY['Medicina general', 'Vacunación', 'Esterilización']::text[],
  ARRAY['Las Condes', 'Vitacura', 'Providencia', 'Lo Barnechea']::text[],
  'Las Condes', 'DEMO001', 25000, 1,
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=faces',
  true, true, 'provider_individual', 'approved',
  4.9, 8,
  'javiera.munoz@demo.pawfriend.cl', '+56 9 8765 1001',
  generate_provider_slug('Dra. Javiera Muñoz'),
  false;

-- ===========================================================
-- PERFIL 2: Dr. Matías Fernández — especialista dermatología
-- ===========================================================
INSERT INTO service_providers (
  user_id, display_name, bio, provider_type, specialties, service_areas,
  commune, license_number, price_from, experience_years, avatar_url,
  is_directory_visible, is_verified, provider_plan, status,
  avg_rating, total_reviews, public_email, public_phone, slug, accepts_emergency
)
SELECT
  (SELECT id FROM (SELECT id, row_number() OVER (ORDER BY created_at) AS rn FROM profiles WHERE NOT EXISTS (SELECT 1 FROM service_providers sp WHERE sp.user_id = profiles.id AND sp.license_number NOT LIKE 'DEMO%') LIMIT 5) u WHERE rn = 2),
  'Dr. Matías Fernández',
  'Dermatólogo veterinario con 6 años de experiencia tratando alergias crónicas, problemas de piel, oído y casos de animales exóticos. Atiendo en consulta propia con diagnóstico clínico, citologías y plan de tratamiento personalizado. Trabajo con perros, gatos, conejos y hurones.',
  'individual',
  ARRAY['Dermatología', 'Animales exóticos', 'Medicina general']::text[],
  ARRAY['Ñuñoa', 'Providencia', 'Las Condes', 'La Reina']::text[],
  'Ñuñoa', 'DEMO002', 38000, 6,
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=faces',
  true, true, 'provider_individual', 'approved',
  4.8, 47,
  'matias.fernandez@demo.pawfriend.cl', '+56 9 8765 1002',
  generate_provider_slug('Dr. Matías Fernández'),
  false;

-- ===========================================================
-- PERFIL 3: Clínica Veterinaria Patitas — clínica chica moderna
-- ===========================================================
INSERT INTO service_providers (
  user_id, display_name, bio, provider_type, specialties, service_areas,
  commune, license_number, price_from, experience_years, avatar_url,
  is_directory_visible, is_verified, provider_plan, status,
  avg_rating, total_reviews, public_email, public_phone, slug, accepts_emergency,
  address
)
SELECT
  (SELECT id FROM (SELECT id, row_number() OVER (ORDER BY created_at) AS rn FROM profiles WHERE NOT EXISTS (SELECT 1 FROM service_providers sp WHERE sp.user_id = profiles.id AND sp.license_number NOT LIKE 'DEMO%') LIMIT 5) u WHERE rn = 3),
  'Clínica Veterinaria Patitas',
  'Clínica veterinaria de barrio en Ñuñoa con un equipo de 3 veterinarios titulados y 1 técnico paramédico. Ofrecemos atención integral: medicina general, cirugía menor, vacunación, peluquería y hospitalización breve. Horario corrido de lunes a sábado, urgencias coordinadas.',
  'clinic',
  ARRAY['Medicina general', 'Cirugía', 'Vacunación', 'Odontología']::text[],
  ARRAY['Ñuñoa', 'Macul', 'Providencia']::text[],
  'Ñuñoa', 'DEMO003', 22000, 8,
  'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=600&fit=crop',
  true, true, 'provider_clinic_basic', 'approved',
  4.7, 124,
  'contacto@clinicapatitas.demo.cl', '+56 2 2345 1003',
  generate_provider_slug('Clínica Veterinaria Patitas'),
  false,
  'Av. Irarrázaval 4567, Ñuñoa';

-- ===========================================================
-- PERFIL 4: Clínica Veterinaria Altamira — multi-especialidad grande
-- ===========================================================
INSERT INTO service_providers (
  user_id, display_name, bio, provider_type, specialties, service_areas,
  commune, license_number, price_from, experience_years, avatar_url,
  is_directory_visible, is_verified, provider_plan, status,
  avg_rating, total_reviews, public_email, public_phone, slug, accepts_emergency,
  address
)
SELECT
  (SELECT id FROM (SELECT id, row_number() OVER (ORDER BY created_at) AS rn FROM profiles WHERE NOT EXISTS (SELECT 1 FROM service_providers sp WHERE sp.user_id = profiles.id AND sp.license_number NOT LIKE 'DEMO%') LIMIT 5) u WHERE rn = 4),
  'Clínica Veterinaria Altamira',
  'Clínica veterinaria multi-especialidad con más de 15 años de trayectoria en Providencia. Equipo de 8 veterinarios especializados en oncología, cardiología, dermatología, traumatología y cirugía mayor. Pabellón quirúrgico con monitoreo anestésico, hospitalización 24/7, ecografía y radiografía digital. Convenio con principales aseguradoras de mascotas.',
  'clinic',
  ARRAY['Medicina general', 'Cirugía', 'Oncología', 'Cardiología', 'Dermatología', 'Ortopedia']::text[],
  ARRAY['Providencia', 'Las Condes', 'Vitacura', 'Ñuñoa']::text[],
  'Providencia', 'DEMO004', 35000, 15,
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop',
  true, true, 'provider_clinic_pro', 'approved',
  4.8, 340,
  'reservas@altamira.demo.cl', '+56 2 2345 1004',
  generate_provider_slug('Clínica Veterinaria Altamira'),
  true,
  'Av. Providencia 2890, Providencia';

-- ===========================================================
-- PERFIL 5: Dr. Cristián Rojas — emergencias 24h
-- ===========================================================
INSERT INTO service_providers (
  user_id, display_name, bio, provider_type, specialties, service_areas,
  commune, license_number, price_from, experience_years, avatar_url,
  is_directory_visible, is_verified, provider_plan, status,
  avg_rating, total_reviews, public_email, public_phone, slug, accepts_emergency
)
SELECT
  (SELECT id FROM (SELECT id, row_number() OVER (ORDER BY created_at) AS rn FROM profiles WHERE NOT EXISTS (SELECT 1 FROM service_providers sp WHERE sp.user_id = profiles.id AND sp.license_number NOT LIKE 'DEMO%') LIMIT 5) u WHERE rn = 5),
  'Dr. Cristián Rojas',
  'Veterinario especialista en emergencias y urgencias nocturnas, con 12 años atendiendo casos críticos en toda la Región Metropolitana. Disponible 24/7 para emergencias a domicilio: traumatismos, intoxicaciones, partos complicados, eutanasias compasivas. Llegada promedio en zona oriente: 30 minutos. Tarifas claras, sin sorpresas.',
  'home_visit',
  ARRAY['Medicina general', 'Cirugía', 'Geriatría']::text[],
  ARRAY['Las Condes', 'Providencia', 'Vitacura', 'Ñuñoa', 'La Reina', 'Lo Barnechea', 'Santiago', 'Macul']::text[],
  'Providencia', 'DEMO005', 55000, 12,
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=faces',
  true, true, 'provider_individual', 'approved',
  4.9, 78,
  'urgencias@cristianrojas.demo.cl', '+56 9 8765 1005',
  generate_provider_slug('Dr. Cristián Rojas'),
  true;

-- ============================================================
-- RESEÑAS para los 5 perfiles
-- ============================================================
-- Insertar reseñas usando el primer profile como reviewer (común para todos los demos).
-- En producción real, cada reseña vendría de un reviewer distinto.

DO $$
DECLARE
  v_reviewer_id uuid;
  v_provider_id uuid;
  v_count integer;
  i integer;
  v_rating integer;
  v_titles text[];
  v_comments text[];
  v_responses text[];
BEGIN
  -- Reviewer común (primer profile)
  SELECT id INTO v_reviewer_id FROM profiles ORDER BY created_at LIMIT 1;

  IF v_reviewer_id IS NULL THEN
    RAISE NOTICE 'No hay profiles en la base — saltando reseñas demo';
    RETURN;
  END IF;

  -- Catálogo de títulos y comentarios creíbles en español chileno
  v_titles := ARRAY[
    'Excelente atención',
    'Súper profesional',
    'Muy recomendado',
    'Llegó puntual y muy cariñoso',
    'Salvó a mi perro',
    'Atención de primera',
    'Trato excelente con animales nerviosos',
    'Diagnóstico certero',
    'Precio justo y honesto',
    'Volvería sin dudar',
    'Resolvió todo en una visita',
    'Muy paciente con mi gato',
    'Recomendadísimo',
    'Profesional y empático',
    'Atención humana y técnica de primera'
  ];

  v_comments := ARRAY[
    'Llegó puntual a la hora acordada, súper paciente con mi perro que es muy ansioso. Explicó todo el procedimiento y dejó indicaciones claras por escrito. Muy recomendado.',
    'Atendió a mi gata con mucha calma, ella es muy nerviosa y normalmente es imposible llevarla a una clínica. La revisión a domicilio fue perfecta, sin estrés para ella ni para mí.',
    'Vino a vacunar a mis dos perros y revisó todo en general. Cobró lo que dijo, sin cargos sorpresa. El reporte que dejó es súper completo.',
    'Mi perro tenía un problema de piel hace meses y nadie había podido diagnosticarlo bien. En una sola visita identificó la causa y dio el tratamiento. Está mucho mejor.',
    'Consulta de control completa, examen físico, recomendaciones de alimentación y vacunación. Súper profesional y muy buena persona.',
    'Atendió una emergencia a las 2 AM, llegó en 25 minutos. Mi perro estaba mal y gracias a su rapidez se recuperó sin complicaciones. Eternamente agradecido.',
    'La atención fue excelente. Notaste que realmente le importan los animales, no es solo trabajo. Mi mascota quedó tranquila después de la visita.',
    'Buena comunicación previa por WhatsApp, llegó a la hora, todo claro. Precio razonable para el servicio que entrega.',
    'Recomendada por una amiga y no me decepcionó. Muy preparada, atenta a los detalles, y dejó indicaciones claras para el cuidado posterior.',
    'Profesional, puntual y con muy buen trato. Mi gato es difícil con los veterinarios y se portó increíble. Definitivamente la voy a llamar de nuevo.'
  ];

  v_responses := ARRAY[
    '¡Muchas gracias por la confianza! Un gusto haber podido ayudar.',
    'Gracias por tu reseña. Me alegra mucho saber que la atención fue de tu agrado.',
    'Gracias por tomarte el tiempo de escribir. Saludos a tu mascota.',
    NULL,
    NULL,
    'Gracias por confiar en mí en un momento tan difícil. Cualquier cosa, acá estoy.',
    NULL
  ];

  -- ========================================
  -- Reseñas por perfil
  -- ========================================
  FOR v_provider_id, v_count IN
    SELECT id, total_reviews FROM service_providers WHERE license_number LIKE 'DEMO%' ORDER BY license_number
  LOOP
    FOR i IN 1..LEAST(v_count, 15) LOOP  -- max 15 reseñas reales por demo (para no inflar la DB)
      v_rating := CASE
        WHEN i % 10 < 6 THEN 5  -- 60% 5★
        WHEN i % 10 < 9 THEN 4  -- 30% 4★
        ELSE 3                   -- 10% 3★
      END;

      INSERT INTO service_reviews (
        provider_id, reviewer_id, rating, title, comment,
        service_type, is_visible, verification_type, booking_id,
        provider_response, provider_responded_at,
        created_at, updated_at
      ) VALUES (
        v_provider_id,
        v_reviewer_id,
        v_rating,
        v_titles[1 + (i % array_length(v_titles, 1))],
        v_comments[1 + (i % array_length(v_comments, 1))],
        'veterinarian',
        true,
        'booking',
        NULL,
        v_responses[1 + (i % array_length(v_responses, 1))],
        CASE WHEN v_responses[1 + (i % array_length(v_responses, 1))] IS NOT NULL
             THEN now() - (i || ' days')::interval ELSE NULL END,
        now() - ((i * 3 + (random() * 5)::int) || ' days')::interval,
        now() - ((i * 3 + (random() * 5)::int) || ' days')::interval
      );
    END LOOP;
  END LOOP;
END;
$$;

-- ============================================================
-- Verificación
-- ============================================================
SELECT
  display_name,
  slug,
  provider_type,
  avg_rating,
  total_reviews,
  (SELECT count(*) FROM service_reviews WHERE provider_id = sp.id) AS reviews_inserted
FROM service_providers sp
WHERE license_number LIKE 'DEMO%'
ORDER BY license_number;
