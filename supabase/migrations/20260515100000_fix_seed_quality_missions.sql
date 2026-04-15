-- Paw Friend migration — 2026-05-15
-- Fixes 20260421000001_seed_quality_missions.sql which used WRONG column names
-- (mission_type, target_action, target_count, points_reward) that don't exist in paw_missions.
-- Real columns: id, title, description, category, icon, achievement_title,
--               requirement_type, requirement_value, sort_order, is_active, created_at
--
-- Mapping from broken migration intent → correct columns:
--   mission_type ('daily','weekly','story') → dropped (no column; was conceptual grouping)
--   category ('health','activity','community','exploration') → category (reuse, but must match CHECK: collection_species, collection_quantity, collection_rarity, social, care)
--   target_action → requirement_type
--   target_count → folded into requirement_value (jsonb)
--   points_reward → dropped (handled by gamification layer, not in this table)

INSERT INTO paw_missions (id, title, description, category, icon, achievement_title,
  requirement_type, requirement_value, sort_order, is_active)
VALUES
  -- Health / Care missions
  ('quality_log_weight', 'Registra el peso de tu mascota',
   'Anota el peso actual en la ficha clínica',
   'care', 'scale', 'Cuidador Atento',
   'complete_profile', '{"action": "log_weight", "count": 1}'::jsonb, 200, true),

  ('quality_vet_checkup', 'Completa un control preventivo',
   'Lleva a tu mascota al vet para un chequeo',
   'care', 'stethoscope', 'Chequeo Preventivo',
   'book_vet', '{"count": 1}'::jsonb, 201, true),

  ('quality_log_vaccine', 'Actualiza las vacunas',
   'Registra una vacuna en la ficha médica',
   'care', 'syringe', 'Vacunador Responsable',
   'log_vaccine', '{"count": 1}'::jsonb, 202, true),

  ('quality_ficha_100', 'Ficha clínica 100%',
   'Completa todos los campos de la ficha de tu mascota',
   'care', 'clipboard-check', 'Ficha Perfecta',
   'complete_profile', '{"pct": 100}'::jsonb, 203, true),

  -- Social / Community missions
  ('quality_leave_review', 'Deja una reseña a un vet',
   'Ayuda a otros dueños compartiendo tu experiencia',
   'social', 'star', 'Crítico Comunitario',
   'leave_review', '{"count": 1}'::jsonb, 210, true),

  ('quality_follow_5', 'Conecta con 5 dueños',
   'Sigue a 5 usuarios de la comunidad',
   'social', 'heart-handshake', 'Conector Social',
   'collect_owners', '{"count": 5}'::jsonb, 211, true),

  -- Care / Exploration missions
  ('quality_first_booking', 'Primer servicio reservado',
   'Reserva tu primera consulta desde Paw Friend',
   'care', 'calendar', 'Primera Reserva',
   'book_vet', '{"count": 1}'::jsonb, 220, true),

  ('quality_walk_photo', 'Sube una foto de paseo',
   'Publica una foto de tu paseo diario',
   'social', 'camera', 'Fotógrafo Perruno',
   'complete_checklist', '{"action": "post_walk_photo", "count": 1}'::jsonb, 221, true)

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  achievement_title = EXCLUDED.achievement_title,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;
