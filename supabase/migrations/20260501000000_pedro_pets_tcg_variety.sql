-- Asignar patrones holograficos y scores variados a las 4 mascotas de Pedro
-- para demostrar los 4 estilos TCG distintos (comun, raro, epico, legendario).
-- NO aplicar automaticamente. El dueno aplica manualmente desde Supabase Dashboard > SQL Editor.

-- Paso 1: Obtener el user_id de Pedro
-- (usa su email para buscar en auth.users)

DO $$
DECLARE
  pedro_uid uuid;
  pet_record record;
  pet_counter int := 0;
  patterns text[] := ARRAY['holo-stars', 'holo-diamonds', 'holo-fire', 'holo-rainbow'];
  scores int[] := ARRAY[15, 50, 70, 90];
BEGIN
  -- Buscar al usuario Pedro por email
  SELECT id INTO pedro_uid
  FROM auth.users
  WHERE email = 'pedro.susaeta.hidalgo@gmail.com'
  LIMIT 1;

  IF pedro_uid IS NULL THEN
    RAISE NOTICE 'Usuario Pedro no encontrado, intentando con variante de email...';
    SELECT id INTO pedro_uid
    FROM auth.users
    WHERE email ILIKE '%pedro.susaeta%'
    LIMIT 1;
  END IF;

  IF pedro_uid IS NULL THEN
    RAISE EXCEPTION 'No se encontro el usuario Pedro. Verificar email en auth.users.';
  END IF;

  RAISE NOTICE 'Usuario Pedro encontrado: %', pedro_uid;

  -- Iterar sobre sus mascotas activas y asignar patron + score variado
  FOR pet_record IN
    SELECT id, name
    FROM pets
    WHERE owner_id = pedro_uid
      AND lifecycle_status = 'active'
    ORDER BY created_at ASC
    LIMIT 4
  LOOP
    pet_counter := pet_counter + 1;

    -- Asignar holo_pattern variado
    UPDATE pets
    SET holo_pattern = patterns[pet_counter]
    WHERE id = pet_record.id;

    -- Upsert pet_paw_progress con scores variados para generar diferentes rarezas
    INSERT INTO pet_paw_progress (pet_id, health_score, activity_score, happiness_score, social_score)
    VALUES (
      pet_record.id,
      scores[pet_counter],
      scores[pet_counter] + 5,
      scores[pet_counter] - 3,
      scores[pet_counter] + 2
    )
    ON CONFLICT (pet_id) DO UPDATE SET
      health_score = EXCLUDED.health_score,
      activity_score = EXCLUDED.activity_score,
      happiness_score = EXCLUDED.happiness_score,
      social_score = EXCLUDED.social_score;

    RAISE NOTICE 'Mascota "%" (%) -> patron: %, score: ~%',
      pet_record.name, pet_record.id, patterns[pet_counter], scores[pet_counter];
  END LOOP;

  RAISE NOTICE 'Total mascotas actualizadas: %', pet_counter;
END $$;

-- Resultado esperado:
-- Mascota 1: holo-stars (Starlight) + ~15 pts = Comun (borde bronce)
-- Mascota 2: holo-diamonds (Diamond Dust) + ~50 pts = Raro (borde dorado)
-- Mascota 3: holo-fire (Phoenix Flame) + ~70 pts = Epico (borde prismatico)
-- Mascota 4: holo-rainbow (Full Rainbow, 1%!) + ~90 pts = Legendario (borde fuego + float)
