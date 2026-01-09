-- Premium Membership System
-- Adds premium subscription support for users

-- Add premium columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS premium_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS premium_plan TEXT CHECK (premium_plan IN ('monthly', 'yearly') OR premium_plan IS NULL);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  payment_provider_id TEXT, -- ID from payment provider (Webpay, etc.)
  payment_amount_clp INTEGER, -- Amount paid for subscription
  auto_renew BOOLEAN DEFAULT true,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for active subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date) WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
ON public.subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admin can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Function to update premium status based on subscriptions
CREATE OR REPLACE FUNCTION update_user_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile premium status based on active subscription
  UPDATE public.profiles
  SET 
    is_premium = EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE subscriptions.user_id = NEW.user_id
      AND subscriptions.status = 'active'
      AND subscriptions.end_date > now()
    ),
    premium_start_date = (
      SELECT MIN(start_date) FROM public.subscriptions
      WHERE subscriptions.user_id = NEW.user_id
      AND subscriptions.status = 'active'
    ),
    premium_end_date = (
      SELECT MAX(end_date) FROM public.subscriptions
      WHERE subscriptions.user_id = NEW.user_id
      AND subscriptions.status = 'active'
      AND end_date > now()
    ),
    premium_plan = (
      SELECT plan_type FROM public.subscriptions
      WHERE subscriptions.user_id = NEW.user_id
      AND subscriptions.status = 'active'
      AND subscriptions.end_date > now()
      ORDER BY end_date DESC
      LIMIT 1
    )
  WHERE profiles.id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update premium status when subscription changes
CREATE TRIGGER update_premium_status_on_subscription_change
AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_user_premium_status();

-- Add comments
COMMENT ON COLUMN public.profiles.is_premium IS 'Whether user has active premium membership';
COMMENT ON COLUMN public.profiles.premium_start_date IS 'Date when premium membership started';
COMMENT ON COLUMN public.profiles.premium_end_date IS 'Date when premium membership expires';
COMMENT ON COLUMN public.profiles.premium_plan IS 'Type of premium plan: monthly or yearly';

