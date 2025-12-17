-- Create service promotion posts table
CREATE TABLE public.service_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type text NOT NULL, -- 'dog_walker', 'dogsitter', 'veterinarian', etc.
  title text NOT NULL,
  description text NOT NULL,
  images text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  ai_moderation_score jsonb, -- Store AI analysis results
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_promotions ENABLE ROW LEVEL SECURITY;

-- Users can create their own promotion posts
CREATE POLICY "Users can create service promotions"
ON public.service_promotions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own posts regardless of status
CREATE POLICY "Users can view their own promotions"
ON public.service_promotions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Everyone can view approved posts
CREATE POLICY "Approved promotions are visible to all"
ON public.service_promotions
FOR SELECT
TO authenticated
USING (status = 'approved');

-- Admins can update any promotion post
CREATE POLICY "Admins can manage promotions"
ON public.service_promotions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Users can update their pending/rejected posts
CREATE POLICY "Users can update their pending promotions"
ON public.service_promotions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status IN ('pending', 'rejected'));

-- Users can delete their own posts
CREATE POLICY "Users can delete their own promotions"
ON public.service_promotions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_service_promotions_updated_at
BEFORE UPDATE ON public.service_promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better query performance
CREATE INDEX idx_service_promotions_status ON public.service_promotions(status);
CREATE INDEX idx_service_promotions_service_type ON public.service_promotions(service_type);
CREATE INDEX idx_service_promotions_user_id ON public.service_promotions(user_id);