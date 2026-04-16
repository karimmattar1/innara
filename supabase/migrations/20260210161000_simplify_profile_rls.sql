-- Simplify profile RLS to allow all authenticated users to read all profiles
-- This ensures staff names always display correctly on the dashboard

-- Drop existing profile SELECT policies to start fresh
DROP POLICY IF EXISTS "Anyone can view staff profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view profiles for active hotel guests" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a single, simple policy: all authenticated users can read all profiles
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Keep the insert/update policies unchanged - users can only modify their own profile
