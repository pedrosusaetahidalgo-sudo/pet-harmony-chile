-- Add platform fee columns to all booking tables
-- This allows tracking fees and payouts for each booking

-- Walk bookings
ALTER TABLE public.walk_bookings 
ADD COLUMN IF NOT EXISTS platform_fee_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS provider_payout_amount INTEGER DEFAULT 0;

-- Vet bookings
ALTER TABLE public.vet_bookings 
ADD COLUMN IF NOT EXISTS platform_fee_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS provider_payout_amount INTEGER DEFAULT 0;

-- Dogsitter bookings
ALTER TABLE public.dogsitter_bookings 
ADD COLUMN IF NOT EXISTS platform_fee_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS provider_payout_amount INTEGER DEFAULT 0;

-- Training bookings
ALTER TABLE public.training_bookings 
ADD COLUMN IF NOT EXISTS platform_fee_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS provider_payout_amount INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.walk_bookings.platform_fee_amount IS 'Platform commission fee in CLP';
COMMENT ON COLUMN public.walk_bookings.provider_payout_amount IS 'Amount provider receives after platform fee in CLP';
COMMENT ON COLUMN public.vet_bookings.platform_fee_amount IS 'Platform commission fee in CLP';
COMMENT ON COLUMN public.vet_bookings.provider_payout_amount IS 'Amount provider receives after platform fee in CLP';
COMMENT ON COLUMN public.dogsitter_bookings.platform_fee_amount IS 'Platform commission fee in CLP';
COMMENT ON COLUMN public.dogsitter_bookings.provider_payout_amount IS 'Amount provider receives after platform fee in CLP';
COMMENT ON COLUMN public.training_bookings.platform_fee_amount IS 'Platform commission fee in CLP';
COMMENT ON COLUMN public.training_bookings.provider_payout_amount IS 'Amount provider receives after platform fee in CLP';

