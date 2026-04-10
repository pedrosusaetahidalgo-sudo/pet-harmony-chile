-- Corrige FK faltante en vet_clinical_notes.pet_id.
-- Detectado en auditoria: la columna pet_id no tenia REFERENCES a pets(id).
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vet_clinical_notes_pet_id_fkey'
      AND table_name = 'vet_clinical_notes'
  ) THEN
    ALTER TABLE public.vet_clinical_notes
      ADD CONSTRAINT vet_clinical_notes_pet_id_fkey
      FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE;
  END IF;
END
$$;
