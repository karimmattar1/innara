-- Allow all authenticated users to view profiles of staff members
-- This fixes the issue where staff names are not displayed on requests
-- because the RLS policy was blocking access to staff profiles

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view staff profiles" ON public.profiles;

-- Create a policy that allows viewing profiles of users who are staff
CREATE POLICY "Anyone can view staff profiles"
ON public.profiles
FOR SELECT
USING (
  -- Allow if the profile belongs to someone with a staff assignment
  EXISTS (
    SELECT 1 FROM public.staff_assignments sa
    WHERE sa.user_id = profiles.id
      AND sa.is_active = true
  )
);

-- Also ensure users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);
