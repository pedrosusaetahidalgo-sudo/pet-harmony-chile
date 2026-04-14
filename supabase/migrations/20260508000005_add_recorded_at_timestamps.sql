-- Add precise timestamps (recorded_at) to medical events.
-- These capture the exact moment a record was created in the system,
-- distinct from visit_date/consultation_date which are user-entered dates.
-- Used for: timeline ordering, audit trail, deduplication by time.

-- 1. medical_records: when the record was entered into the system
ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS recorded_at timestamptz DEFAULT now();

-- 2. vet_clinical_notes: when the vet note was entered
ALTER TABLE public.vet_clinical_notes
  ADD COLUMN IF NOT EXISTS recorded_at timestamptz DEFAULT now();
