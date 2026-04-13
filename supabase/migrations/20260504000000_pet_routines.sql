-- =============================================================
-- Pet Routines: rutinas semanales recurrentes por mascota
-- + Routine Completions: log de cumplimiento diario
-- + Extiende external_calendar_events para source_type 'routine'
-- =============================================================

-- 1. Tabla principal de rutinas
CREATE TABLE pet_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Que actividad
  category TEXT NOT NULL CHECK (category IN (
    'paseo', 'comida', 'medicacion', 'higiene',
    'entrenamiento', 'juego', 'suplemento', 'otro'
  )),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,

  -- Cuando (patron semanal)
  days_of_week INTEGER[] NOT NULL,  -- 0=domingo, 1=lunes ... 6=sabado
  time_of_day TIME NOT NULL,
  duration_minutes INTEGER,

  -- Alertas
  notify_before_minutes INTEGER DEFAULT 15,
  notify_channels TEXT[] DEFAULT '{in_app}',

  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_on DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_on DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pet_routines_owner ON pet_routines(owner_id);
CREATE INDEX idx_pet_routines_pet ON pet_routines(pet_id);
CREATE INDEX idx_pet_routines_active ON pet_routines(owner_id) WHERE is_active = true;

ALTER TABLE pet_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their pet routines"
  ON pet_routines FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);


-- 2. Log de cumplimiento
CREATE TABLE routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES pet_routines(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  skipped BOOLEAN NOT NULL DEFAULT false,
  skip_reason TEXT,

  UNIQUE(routine_id, completed_date)
);

CREATE INDEX idx_routine_completions_routine ON routine_completions(routine_id);
CREATE INDEX idx_routine_completions_date ON routine_completions(completed_date DESC);

ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage routine completions"
  ON routine_completions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pet_routines r
      WHERE r.id = routine_completions.routine_id
      AND r.owner_id = auth.uid()
    )
  );


-- 3. Extender external_calendar_events para rutinas
ALTER TABLE external_calendar_events
  DROP CONSTRAINT IF EXISTS external_calendar_events_source_type_check;

ALTER TABLE external_calendar_events
  ADD CONSTRAINT external_calendar_events_source_type_check
  CHECK (source_type IN ('pet_reminder', 'appointment', 'routine'));
