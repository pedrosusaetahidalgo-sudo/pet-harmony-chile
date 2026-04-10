-- Mejorar misiones existentes con nombres más creativos
-- + agregar misiones que conecten orgánicamente con el canje de rewards

-- Actualizar títulos de misiones genéricas del demo seed
UPDATE paw_missions SET
  title = 'Aventura del día',
  description = 'Registra un paseo o actividad con tu mascota'
WHERE target_action = 'log_walk' AND title = 'Paseo del día';

UPDATE paw_missions SET
  title = 'Fotógrafo de patitas',
  description = 'Comparte una foto de tu mascota en la comunidad'
WHERE target_action = 'create_post' AND title = 'Comparte tu día';

UPDATE paw_missions SET
  title = 'Doctor amor',
  description = 'Lleva a tu mascota a un control veterinario'
WHERE target_action = 'log_vet_visit' AND title = 'Guardián de la salud';

UPDATE paw_missions SET
  title = 'Spa day',
  description = 'Registra una sesión de peluquería o baño'
WHERE target_action = 'log_grooming' AND title = 'Cuidado premium';

UPDATE paw_missions SET
  title = 'Indiana Paws',
  description = 'Completa 5 paseos en lugares diferentes'
WHERE target_action = 'complete_walks' AND title = 'Explorador urbano';

-- Actualizar misiones de calidad (seed 20260421000001)
UPDATE paw_missions SET
  title = 'Báscula mágica',
  description = 'Pesa a tu mascota y anótalo en su ficha — un peludo saludable tiene su peso al día'
WHERE target_action = 'log_weight' AND title = 'Registra el peso de tu mascota';

UPDATE paw_missions SET
  title = 'Escudo protector',
  description = 'Registra una vacuna en la ficha médica — tu mascota merece estar blindada'
WHERE target_action = 'log_vaccine' AND title = 'Actualiza las vacunas';

UPDATE paw_missions SET
  title = 'Influencer de 4 patas',
  description = 'Sube una foto de tu paseo al feed — ¡que todo el mundo vea a tu estrella!'
WHERE target_action = 'post_walk_photo' AND title = 'Sube una foto de paseo';

UPDATE paw_missions SET
  title = 'Crítico gastronómico vet',
  description = 'Deja una reseña a un veterinario — ayuda a otros dueños a elegir mejor'
WHERE target_action = 'leave_review' AND title = 'Deja una reseña a un vet';

UPDATE paw_missions SET
  title = 'Ficha perfecta',
  description = 'Completa todos los campos de la ficha clínica — cada dato puede salvar una vida'
WHERE target_action = 'complete_profile' AND title = 'Ficha clínica 100%';

UPDATE paw_missions SET
  title = 'Primera cita',
  description = 'Reserva tu primera consulta o servicio desde Paw Friend'
WHERE target_action = 'first_booking' AND title = 'Primer servicio reservado';

UPDATE paw_missions SET
  title = 'Red de amigos peludos',
  description = 'Sigue a 5 dueños de mascotas — los mejores tips vienen de la manada'
WHERE target_action = 'follow_5' AND title = 'Conecta con 5 dueños';

-- Nuevas misiones orgánicas que incentivan canje de rewards
INSERT INTO paw_missions (mission_type, category, title, description, target_action, target_count, points_reward, is_active) VALUES
  ('daily', 'health', 'Desayuno servido', 'Registra la alimentación diaria de tu mascota', 'log_food', 1, 5, true),
  ('daily', 'activity', 'Check-in matutino', 'Entra a Paw Friend y revisa el estado de tu mascota', 'daily_checkin', 1, 5, true),
  ('weekly', 'community', 'Corazón generoso', 'Dale like a 3 publicaciones de otros dueños', 'like_posts', 3, 15, true),
  ('weekly', 'health', 'Detective de alergias', 'Actualiza la sección de alergias en la ficha de tu mascota', 'update_allergies', 1, 30, true),
  ('story', 'community', 'Embajador Paw', 'Invita a un amigo a usar Paw Friend', 'invite_friend', 1, 100, true),
  ('story', 'health', 'Archivo completo', 'Sube 3 documentos a la ficha clínica (recetas, exámenes, etc.)', 'upload_documents', 3, 80, true),
  ('story', 'exploration', 'Primer canje', 'Canjea tu primer premio en la Paw Shop', 'first_redeem', 1, 50, true)
ON CONFLICT DO NOTHING;
