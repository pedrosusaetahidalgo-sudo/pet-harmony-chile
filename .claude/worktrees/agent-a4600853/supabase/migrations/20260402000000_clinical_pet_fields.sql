-- =====================================================
-- FASE 1: CAMPOS CLÍNICOS PARA MASCOTAS
-- =====================================================
-- Amplía la tabla pets con datos médicos estructurados
-- para uso veterinario real.

-- Campos clínicos
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS blood_type TEXT,
  ADD COLUMN IF NOT EXISTS neutered_date DATE,
  ADD COLUMN IF NOT EXISTS chip_registry TEXT,
  ADD COLUMN IF NOT EXISTS weight_history JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS allergies_food TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allergies_medication TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allergies_environmental TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS chronic_conditions_detail JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS current_medications JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS diet_type TEXT,
  ADD COLUMN IF NOT EXISTS diet_brand TEXT,
  ADD COLUMN IF NOT EXISTS diet_frequency TEXT,
  ADD COLUMN IF NOT EXISTS activity_level TEXT,
  ADD COLUMN IF NOT EXISTS living_environment TEXT,
  ADD COLUMN IF NOT EXISTS cohabitation_pets INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cohabitation_children BOOLEAN,
  ADD COLUMN IF NOT EXISTS emergency_vet_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_vet_phone TEXT,
  ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
  ADD COLUMN IF NOT EXISTS insurance_policy TEXT,
  ADD COLUMN IF NOT EXISTS preferred_clinic TEXT,
  ADD COLUMN IF NOT EXISTS behavior_notes TEXT,
  ADD COLUMN IF NOT EXISTS last_vet_visit DATE,
  ADD COLUMN IF NOT EXISTS adoption_date DATE,
  ADD COLUMN IF NOT EXISTS is_adopted BOOLEAN DEFAULT false;

-- Tabla de recordatorios por mascota
CREATE TABLE IF NOT EXISTS public.pet_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('vaccine', 'checkup', 'medication', 'grooming', 'weight', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_interval TEXT CHECK (recurrence_interval IN ('weekly', 'monthly', 'quarterly', 'biannual', 'yearly')),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_reminders_pet_id ON public.pet_reminders(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_reminders_owner_id ON public.pet_reminders(owner_id);
CREATE INDEX IF NOT EXISTS idx_pet_reminders_due_date ON public.pet_reminders(due_date);

ALTER TABLE public.pet_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage their pet reminders" ON public.pet_reminders;
CREATE POLICY "Owners can manage their pet reminders"
  ON public.pet_reminders FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Comentarios
COMMENT ON COLUMN public.pets.weight_history IS 'Array de {date, weight_kg} para tracking histórico';
COMMENT ON COLUMN public.pets.chronic_conditions_detail IS 'Array de {condition, diagnosed_date, severity, notes}';
COMMENT ON COLUMN public.pets.current_medications IS 'Array de {name, dose, frequency, start_date, end_date}';
COMMENT ON TABLE public.pet_reminders IS 'Recordatorios de cuidado por mascota (vacunas, checkups, medicamentos)';
