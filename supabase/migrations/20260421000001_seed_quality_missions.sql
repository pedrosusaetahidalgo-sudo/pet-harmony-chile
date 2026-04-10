-- Misiones de salud real y comunidad (no genéricas)
-- Complementan las misiones iniciales del seed.

INSERT INTO paw_missions (mission_type, category, title, description, target_action, target_count, points_reward, is_active) VALUES
  ('daily', 'health', 'Registra el peso de tu mascota', 'Anota el peso actual en la ficha clínica', 'log_weight', 1, 15, true),
  ('weekly', 'health', 'Completa un control preventivo', 'Lleva a tu mascota al vet para un chequeo', 'log_vet_visit', 1, 50, true),
  ('weekly', 'health', 'Actualiza las vacunas', 'Registra una vacuna en la ficha médica', 'log_vaccine', 1, 40, true),
  ('daily', 'activity', 'Sube una foto de paseo', 'Publica una foto de tu paseo diario', 'post_walk_photo', 1, 10, true),
  ('weekly', 'community', 'Deja una reseña a un vet', 'Ayuda a otros dueños compartiendo tu experiencia', 'leave_review', 1, 25, true),
  ('weekly', 'health', 'Ficha clínica 100%', 'Completa todos los campos de la ficha de tu mascota', 'complete_profile', 1, 100, true),
  ('story', 'exploration', 'Primer servicio reservado', 'Reserva tu primera consulta desde Paw Friend', 'first_booking', 1, 75, true),
  ('story', 'community', 'Conecta con 5 dueños', 'Sigue a 5 usuarios de la comunidad', 'follow_5', 5, 60, true)
ON CONFLICT DO NOTHING;
