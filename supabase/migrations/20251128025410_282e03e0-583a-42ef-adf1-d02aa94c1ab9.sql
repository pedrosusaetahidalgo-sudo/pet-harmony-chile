-- CRITICAL SECURITY FIX: Protect user email addresses from public scraping

-- 1. Update RLS policy to require authentication for viewing profiles
DROP POLICY IF EXISTS "Profiles son visibles por todos" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users only"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2. Fix handle_new_user function to never use email as display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only use name from metadata, never fallback to email
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id, 
    CASE 
      WHEN NEW.raw_user_meta_data->>'name' IS NOT NULL AND NEW.raw_user_meta_data->>'name' != '' 
      THEN NEW.raw_user_meta_data->>'name'
      ELSE 'Usuario'  -- Generic fallback instead of email
    END
  );
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;

-- 3. Clean up existing profiles that have email addresses as display_name
-- Replace any display_name that looks like an email with 'Usuario'
UPDATE public.profiles
SET display_name = 'Usuario'
WHERE display_name LIKE '%@%';

-- 4. Add comment to remind developers
COMMENT ON TABLE public.profiles IS 'SECURITY: Never store email addresses or PII in display_name. Use RLS to protect user data.';