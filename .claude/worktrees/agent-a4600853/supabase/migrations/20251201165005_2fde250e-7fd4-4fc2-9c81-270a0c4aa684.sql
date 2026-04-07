CREATE TABLE public.trainer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bio TEXT,
  experience_years INTEGER,
  certifications JSONB,
  specialties JSONB,
  training_methods TEXT[],
  price_per_session INTEGER NOT NULL,
  session_duration INTEGER DEFAULT 60,
  coverage_zones JSONB NOT NULL,
  available_hours JSONB NOT NULL,
  photos TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.training_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  trainer_id UUID NOT NULL,
  pet_id UUID NOT NULL,
  training_type TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  training_address TEXT NOT NULL,
  training_latitude NUMERIC,
  training_longitude NUMERIC,
  behavioral_goals TEXT,
  special_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente',
  total_price INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pendiente',
  stripe_payment_intent_id TEXT,
  canceled_by UUID,
  canceled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_training_pet FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE
);

CREATE TABLE public.training_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL UNIQUE,
  owner_id UUID NOT NULL,
  trainer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photos TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  provider_response TEXT,
  provider_response_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_training_booking FOREIGN KEY (booking_id) REFERENCES public.training_bookings(id) ON DELETE CASCADE
);

CREATE TABLE public.training_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  exercises_completed JSONB,
  progress_notes TEXT,
  behavioral_observations TEXT,
  homework_assigned TEXT,
  next_session_goals TEXT,
  photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.provider_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider_type TEXT NOT NULL,
  date DATE NOT NULL,
  time_slots JSONB NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider_type, date)
);

ALTER TABLE public.trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;