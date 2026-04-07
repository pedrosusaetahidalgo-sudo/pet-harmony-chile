-- =====================================================
-- COMPREHENSIVE MEDICAL RECORDS SYSTEM
-- =====================================================
-- This migration creates a complete medical records system
-- for pets including document storage and structured records

-- 1. Extend pets table with additional medical fields
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS chronic_conditions TEXT[] DEFAULT '{}';

-- 2. Create medical_documents table for file storage
CREATE TABLE IF NOT EXISTS public.medical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('vaccine_card', 'id_card', 'lab_result', 'xray', 'prescription', 'other')),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT,
  issued_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for medical_documents
CREATE INDEX IF NOT EXISTS idx_medical_documents_pet_id ON public.medical_documents(pet_id);
CREATE INDEX IF NOT EXISTS idx_medical_documents_owner_id ON public.medical_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_medical_documents_type ON public.medical_documents(type);
CREATE INDEX IF NOT EXISTS idx_medical_documents_issued_at ON public.medical_documents(issued_at);

-- Enable RLS on medical_documents
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_documents (drop first to avoid conflicts on re-run)
DROP POLICY IF EXISTS "Owners can view their pet medical documents" ON public.medical_documents;
DROP POLICY IF EXISTS "Owners can insert medical documents" ON public.medical_documents;
DROP POLICY IF EXISTS "Owners can update their medical documents" ON public.medical_documents;
DROP POLICY IF EXISTS "Owners can delete their medical documents" ON public.medical_documents;

CREATE POLICY "Owners can view their pet medical documents"
  ON public.medical_documents FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert medical documents"
  ON public.medical_documents FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their medical documents"
  ON public.medical_documents FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their medical documents"
  ON public.medical_documents FOR DELETE
  USING (auth.uid() = owner_id);

-- 3. Update medical_records table structure to match requirements
ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS visit_date DATE,
  ADD COLUMN IF NOT EXISTS clinic_name TEXT,
  ADD COLUMN IF NOT EXISTS vet_name TEXT,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS diagnosis TEXT,
  ADD COLUMN IF NOT EXISTS treatment JSONB,
  ADD COLUMN IF NOT EXISTS next_checkup_date DATE;

-- Set owner_id from pet's owner if null (safe backfill)
UPDATE public.medical_records mr
SET owner_id = p.owner_id
FROM public.pets p
WHERE mr.pet_id = p.id AND mr.owner_id IS NULL;

-- Only set NOT NULL if all rows have owner_id (safe check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.medical_records WHERE owner_id IS NULL
  ) THEN
    ALTER TABLE public.medical_records ALTER COLUMN owner_id SET NOT NULL;
  END IF;
END $$;

-- Create index for owner_id
CREATE INDEX IF NOT EXISTS idx_medical_records_owner_id ON public.medical_records(owner_id);

-- Update RLS policies for medical_records
DROP POLICY IF EXISTS "Dueños pueden ver registros médicos de sus mascotas" ON public.medical_records;
DROP POLICY IF EXISTS "Dueños pueden insertar registros médicos" ON public.medical_records;
DROP POLICY IF EXISTS "Dueños pueden actualizar registros médicos" ON public.medical_records;
DROP POLICY IF EXISTS "Dueños pueden eliminar registros médicos" ON public.medical_records;
DROP POLICY IF EXISTS "Owners can view their pet medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Owners can insert medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Owners can update their medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Owners can delete their medical records" ON public.medical_records;

CREATE POLICY "Owners can view their pet medical records"
  ON public.medical_records FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert medical records"
  ON public.medical_records FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their medical records"
  ON public.medical_records FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their medical records"
  ON public.medical_records FOR DELETE
  USING (auth.uid() = owner_id);

-- 4. Create medical_share_tokens table for vet sharing
CREATE TABLE IF NOT EXISTS public.medical_share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMPTZ
);

-- Indexes for medical_share_tokens
CREATE INDEX IF NOT EXISTS idx_medical_share_tokens_token ON public.medical_share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_medical_share_tokens_pet_id ON public.medical_share_tokens(pet_id);
CREATE INDEX IF NOT EXISTS idx_medical_share_tokens_owner_id ON public.medical_share_tokens(owner_id);

-- Enable RLS on medical_share_tokens
ALTER TABLE public.medical_share_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_share_tokens
DROP POLICY IF EXISTS "Owners can manage their share tokens" ON public.medical_share_tokens;

CREATE POLICY "Owners can manage their share tokens"
  ON public.medical_share_tokens FOR ALL
  USING (auth.uid() = owner_id);

-- Function to generate unique share token (VOLATILE because it uses random)
CREATE OR REPLACE FUNCTION public.generate_medical_share_token()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  v_token TEXT;
BEGIN
  v_token := encode(gen_random_bytes(16), 'base64');
  v_token := replace(replace(v_token, '+', ''), '/', '');
  v_token := substring(v_token from 1 for 32);
  RETURN v_token;
END;
$$;

-- Function to check if share token is valid
CREATE OR REPLACE FUNCTION public.is_valid_share_token(p_token TEXT)
RETURNS TABLE(pet_id UUID, owner_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT mst.pet_id, mst.owner_id
  FROM public.medical_share_tokens mst
  WHERE mst.token = p_token
    AND mst.expires_at > now()
    AND mst.is_revoked = false;
END;
$$;

-- 5. Create storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-documents',
  'medical-documents',
  false,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'application/pdf'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for medical-documents bucket
-- Drop first to avoid "already exists" errors on re-run
DROP POLICY IF EXISTS "Authenticated users can upload medical documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can view their medical documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update their medical documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete their medical documents" ON storage.objects;

CREATE POLICY "Authenticated users can upload medical documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can view their medical documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can update their medical documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can delete their medical documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Add trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_medical_documents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop trigger first to avoid "already exists" error
DROP TRIGGER IF EXISTS update_medical_documents_updated_at ON public.medical_documents;

CREATE TRIGGER update_medical_documents_updated_at
  BEFORE UPDATE ON public.medical_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_medical_documents_updated_at();

-- 7. Function to get medical summary data
CREATE OR REPLACE FUNCTION public.get_medical_summary_data(p_pet_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'pet', (
      SELECT jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'species', p.species,
        'breed', p.breed,
        'gender', p.gender,
        'birth_date', p.birth_date,
        'weight', p.weight,
        'microchip_number', p.microchip_number,
        'neutered', p.neutered,
        'allergies', p.allergies,
        'chronic_conditions', p.chronic_conditions
      )
      FROM pets p
      WHERE p.id = p_pet_id
    ),
    'owner', (
      SELECT jsonb_build_object(
        'display_name', pr.display_name,
        'email', au.email,
        'phone', NULL
      )
      FROM pets p
      JOIN profiles pr ON pr.id = p.owner_id
      JOIN auth.users au ON au.id = pr.id
      WHERE p.id = p_pet_id
    ),
    'vaccinations', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'title', mr.title,
          'date', mr.date,
          'next_date', mr.next_date,
          'veterinarian_name', mr.veterinarian_name,
          'clinic_name', mr.clinic_name
        )
        ORDER BY mr.date DESC
      ), '[]'::jsonb)
      FROM medical_records mr
      WHERE mr.pet_id = p_pet_id AND mr.record_type = 'vacuna'
    ),
    'recent_visits', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'visit_date', COALESCE(mr.visit_date, mr.date),
          'clinic_name', mr.clinic_name,
          'vet_name', COALESCE(mr.vet_name, mr.veterinarian_name),
          'reason', mr.reason,
          'diagnosis', mr.diagnosis,
          'treatment', mr.treatment
        )
        ORDER BY COALESCE(mr.visit_date, mr.date) DESC
      ), '[]'::jsonb)
      FROM (
        SELECT * FROM medical_records
        WHERE pet_id = p_pet_id AND record_type IN ('consulta', 'tratamiento')
        ORDER BY COALESCE(visit_date, date) DESC
        LIMIT 10
      ) mr
    ),
    'documents_count', (
      SELECT COUNT(*)
      FROM medical_documents
      WHERE pet_id = p_pet_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Comments for documentation
COMMENT ON TABLE public.medical_documents IS 'Stores medical document files (vaccine cards, lab results, etc.)';
COMMENT ON TABLE public.medical_share_tokens IS 'Tokens for sharing medical records with vets (read-only access)';
COMMENT ON FUNCTION public.generate_medical_share_token() IS 'Generates a unique token for sharing medical records';
COMMENT ON FUNCTION public.is_valid_share_token(TEXT) IS 'Validates a share token and returns pet_id if valid';
COMMENT ON FUNCTION public.get_medical_summary_data(UUID) IS 'Returns comprehensive medical summary data for a pet';
