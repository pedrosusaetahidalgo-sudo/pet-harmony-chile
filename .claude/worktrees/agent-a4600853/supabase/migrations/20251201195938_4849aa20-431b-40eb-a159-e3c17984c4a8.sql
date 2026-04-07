-- Create adoption_shelters table for AI-powered shelter directory
CREATE TABLE public.adoption_shelters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'refugio', -- 'ong', 'refugio', 'independiente', 'fundacion'
  description TEXT,
  ai_description TEXT, -- AI-generated friendly description
  address TEXT,
  commune TEXT,
  city TEXT DEFAULT 'Santiago',
  latitude NUMERIC,
  longitude NUMERIC,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  social_media JSONB DEFAULT '{}', -- {facebook, instagram, twitter}
  animal_types TEXT[] DEFAULT ARRAY['perro', 'gato'], -- Types of animals they handle
  pet_sizes TEXT[] DEFAULT ARRAY['pequeño', 'mediano', 'grande'], -- Sizes they accept
  formality_level TEXT DEFAULT 'establecido', -- 'establecido', 'semi_formal', 'independiente'
  specialties TEXT[], -- e.g., 'gatos senior', 'perros medianos', 'rescate de calle'
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  ai_processed_at TIMESTAMP WITH TIME ZONE,
  source TEXT DEFAULT 'ai_generated', -- 'ai_generated', 'manual', 'scraped'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.adoption_shelters ENABLE ROW LEVEL SECURITY;

-- Public read access for active shelters
CREATE POLICY "Active shelters are viewable by everyone"
ON public.adoption_shelters
FOR SELECT
USING (is_active = true);

-- Authenticated users can suggest new shelters
CREATE POLICY "Authenticated users can suggest shelters"
ON public.adoption_shelters
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for geospatial queries
CREATE INDEX idx_adoption_shelters_location ON public.adoption_shelters (latitude, longitude);
CREATE INDEX idx_adoption_shelters_commune ON public.adoption_shelters (commune);
CREATE INDEX idx_adoption_shelters_type ON public.adoption_shelters (type);

-- Create trigger for updated_at
CREATE TRIGGER update_adoption_shelters_updated_at
BEFORE UPDATE ON public.adoption_shelters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();