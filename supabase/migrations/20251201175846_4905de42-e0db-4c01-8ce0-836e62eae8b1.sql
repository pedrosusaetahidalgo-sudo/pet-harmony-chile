-- Add RLS policies for provider_availability table
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

-- Providers can manage their own availability
CREATE POLICY "Providers can manage their availability"
ON public.provider_availability
FOR ALL
USING (auth.uid() = user_id);

-- Everyone can view provider availability
CREATE POLICY "Provider availability is viewable by all"
ON public.provider_availability
FOR SELECT
USING (is_available = true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_provider_availability_user_date 
ON public.provider_availability(user_id, date);

CREATE INDEX IF NOT EXISTS idx_provider_availability_type_date 
ON public.provider_availability(provider_type, date);

-- Add RLS to trainer_profiles if not exists
ALTER TABLE public.trainer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can manage their profile"
ON public.trainer_profiles
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Trainer profiles viewable by all"
ON public.trainer_profiles
FOR SELECT
USING (is_active = true OR auth.uid() = user_id);

-- Add RLS to training_bookings
ALTER TABLE public.training_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can create training bookings"
ON public.training_bookings
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Participants can view training bookings"
ON public.training_bookings
FOR SELECT
USING (auth.uid() = owner_id OR auth.uid() = trainer_id);

CREATE POLICY "Participants can update training bookings"
ON public.training_bookings
FOR UPDATE
USING (auth.uid() = owner_id OR auth.uid() = trainer_id);