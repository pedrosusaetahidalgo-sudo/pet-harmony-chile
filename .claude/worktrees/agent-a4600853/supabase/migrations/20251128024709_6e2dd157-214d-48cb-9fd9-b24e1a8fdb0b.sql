-- Update verification_requests to support document uploads better
ALTER TABLE public.verification_requests
ADD COLUMN IF NOT EXISTS document_urls text[];

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);