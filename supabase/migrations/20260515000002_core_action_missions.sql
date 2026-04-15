-- Core-action missions: reward users for clinical and care actions
-- These missions tie gamification to real value (completing ficha, vaccines, reviews)

-- Add new requirement types to the constraint if needed
-- (The CHECK constraint may already include these from 20260504100000)
DO $$
BEGIN
  -- Try to add new requirement types; ignore if constraint already has them
  ALTER TABLE paw_missions DROP CONSTRAINT IF EXISTS paw_missions_requirement_type_check;
  ALTER TABLE paw_missions ADD CONSTRAINT paw_missions_requirement_type_check
    CHECK (requirement_type IN (
      'collect_count', 'collect_species', 'collect_species_count',
      'collect_rarity', 'collect_all_rarities', 'be_collected', 'collect_owners',
      'complete_reminders', 'book_vet', 'complete_profile', 'memorial',
      'log_vaccine', 'leave_review', 'complete_checklist'
    ));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint update skipped: %', SQLERRM;
END $$;

-- Insert core-action missions (idempotent via ON CONFLICT)
INSERT INTO paw_missions (id, title, description, category, icon, achievement_title,
  requirement_type, requirement_value, sort_order, is_active)
VALUES
  -- Clinical care missions
  ('core_first_vaccine', 'Primera vacuna registrada',
   'Registra la primera vacuna de tu mascota en la ficha clínica',
   'care', 'syringe', 'Protector Responsable',
   'log_vaccine', '{"count": 1}'::jsonb, 100, true),

  ('core_vaccines_5', 'Carnet completo',
   'Registra 5 vacunas en total para tus mascotas',
   'care', 'shield', 'Escudo Sanitario',
   'log_vaccine', '{"count": 5}'::jsonb, 101, true),

  ('core_first_review', 'Primera reseña',
   'Deja tu primera reseña después de una consulta veterinaria',
   'social', 'star', 'Voz de la Comunidad',
   'leave_review', '{"count": 1}'::jsonb, 110, true),

  ('core_reviews_5', 'Crítico experto',
   'Deja 5 reseñas para ayudar a otros dueños a elegir veterinario',
   'social', 'trophy', 'Guía Veterinaria',
   'leave_review', '{"count": 5}'::jsonb, 111, true),

  ('core_reminders_10', 'Cuidador puntual',
   'Completa 10 recordatorios de cuidado a tiempo',
   'care', 'clock', 'Reloj Biológico',
   'complete_reminders', '{"count": 10}'::jsonb, 120, true),

  ('core_reminders_50', 'Máquina de cuidados',
   'Completa 50 recordatorios — tu mascota te lo agradece',
   'care', 'heart', 'Corazón de Oro',
   'complete_reminders', '{"count": 50}'::jsonb, 121, true),

  ('core_vet_visit', 'Visita al doc',
   'Reserva y completa tu primera cita veterinaria',
   'care', 'stethoscope', 'Paciente Responsable',
   'book_vet', '{"count": 1}'::jsonb, 130, true),

  ('core_profile_complete', 'Ficha perfecta',
   'Completa al 100% la ficha de tu mascota',
   'care', 'file-text', 'Archivista Perruno',
   'complete_profile', '{"pct": 100}'::jsonb, 140, true)

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value,
  is_active = EXCLUDED.is_active;
