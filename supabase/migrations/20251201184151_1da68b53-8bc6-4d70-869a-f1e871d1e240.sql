-- Add admin role to specific user by email (will work once user registers)
-- First, create a function to auto-assign admin role for specific emails
CREATE OR REPLACE FUNCTION public.assign_admin_for_specific_emails()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign admin role for Pedro
  IF NEW.email = 'pedro.susaeta.hidalgo@gmail.com' OR NEW.email = 'Pedro.susaeta.hidalgo@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to auto-assign admin role
DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_for_specific_emails();

-- Also check if user already exists and assign role
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE LOWER(email) = LOWER('pedro.susaeta.hidalgo@gmail.com');
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;