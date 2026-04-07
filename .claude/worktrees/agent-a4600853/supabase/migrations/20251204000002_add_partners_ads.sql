-- Partners and In-App Advertising System
-- Manages strategic partnerships and non-intrusive pet-relevant ads

CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  ad_text TEXT NOT NULL,
  ad_image_url TEXT,
  ad_link TEXT NOT NULL,
  placement TEXT NOT NULL CHECK (placement IN ('home', 'services', 'map', 'content', 'feed')),
  category TEXT NOT NULL CHECK (category IN ('food', 'insurance', 'clinic', 'store', 'adoption', 'general')),
  is_active BOOLEAN DEFAULT true,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0, -- Higher priority ads shown first
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ, -- Optional end date for time-limited campaigns
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partners_placement_active ON public.partners(placement, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_partners_category ON public.partners(category, is_active);
CREATE INDEX IF NOT EXISTS idx_partners_priority ON public.partners(priority DESC, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All authenticated users can view active partners
CREATE POLICY "Active partners are viewable by authenticated users"
ON public.partners FOR SELECT
TO authenticated
USING (is_active = true);

-- Only admins can manage partners
CREATE POLICY "Admins can manage partners"
ON public.partners FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Function to increment impressions
CREATE OR REPLACE FUNCTION increment_partner_impressions(partner_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.partners
  SET impressions = impressions + 1,
      updated_at = now()
  WHERE id = partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment clicks
CREATE OR REPLACE FUNCTION increment_partner_clicks(partner_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.partners
  SET clicks = clicks + 1,
      updated_at = now()
  WHERE id = partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE public.partners IS 'Strategic partners and in-app advertising';
COMMENT ON COLUMN public.partners.placement IS 'Where the ad should be displayed: home, services, map, content, or feed';
COMMENT ON COLUMN public.partners.category IS 'Ad category for filtering: food, insurance, clinic, store, adoption, or general';
COMMENT ON COLUMN public.partners.priority IS 'Display priority (higher = shown first)';
COMMENT ON COLUMN public.partners.impressions IS 'Number of times ad was displayed';
COMMENT ON COLUMN public.partners.clicks IS 'Number of times ad was clicked';

