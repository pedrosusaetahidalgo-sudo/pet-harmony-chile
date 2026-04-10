-- Agrega constraint de unicidad a vaccination_protocols para evitar duplicados.
-- Detectado en auditoria: INSERT ON CONFLICT DO NOTHING sin unique constraint.
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vaccination_protocols_species_vaccine_name_key'
  ) THEN
    ALTER TABLE public.vaccination_protocols
      ADD CONSTRAINT vaccination_protocols_species_vaccine_name_key
      UNIQUE (species, vaccine_name);
  END IF;
END
$$;
