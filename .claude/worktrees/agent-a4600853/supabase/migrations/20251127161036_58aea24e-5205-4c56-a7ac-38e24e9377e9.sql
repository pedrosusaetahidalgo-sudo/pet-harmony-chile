-- Create places table for pet services and locations
CREATE TABLE public.places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  place_type TEXT NOT NULL, -- veterinaria, peluqueria, parque, tienda, hotel, guarderia
  description TEXT,
  address TEXT NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  phone TEXT,
  website TEXT,
  opening_hours JSONB,
  rating NUMERIC(2, 1) DEFAULT 0,
  price_range TEXT, -- $, $$, $$$
  amenities TEXT[],
  photos TEXT[],
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Places are viewable by everyone
CREATE POLICY "Places are viewable by everyone"
ON public.places
FOR SELECT
USING (true);

-- Only authenticated users can suggest new places
CREATE POLICY "Authenticated users can insert places"
ON public.places
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes for better query performance
CREATE INDEX idx_places_type ON public.places(place_type);
CREATE INDEX idx_places_lat_lng ON public.places(latitude, longitude);

-- Create function to calculate distance in kilometers using Haversine formula
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
  RETURN 6371 * acos(
    LEAST(1.0, GREATEST(-1.0,
      cos(radians(lat1)) * cos(radians(lat2)) * 
      cos(radians(lon2) - radians(lon1)) + 
      sin(radians(lat1)) * sin(radians(lat2))
    ))
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add trigger for updated_at
CREATE TRIGGER update_places_updated_at
BEFORE UPDATE ON public.places
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();