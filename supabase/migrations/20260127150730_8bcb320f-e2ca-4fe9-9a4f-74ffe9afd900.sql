-- Fix 1: Restrict profiles access so staff can ONLY view profiles for guests 
-- with ACTIVE stays at their specific hotel (not all historical guests)

-- Drop the existing policy that's too permissive
DROP POLICY IF EXISTS "Staff can view profiles for hotel guests" ON public.profiles;

-- Create a more restrictive policy: staff can only view profiles for guests 
-- with currently active stays at their assigned hotel
CREATE POLICY "Staff can view profiles for active hotel guests"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() = id) -- Users can always view their own profile
  OR 
  (EXISTS (
    SELECT 1
    FROM stays s
    JOIN staff_assignments sa ON sa.hotel_id = s.hotel_id
    WHERE s.user_id = profiles.id
      AND sa.user_id = auth.uid()
      AND sa.is_active = true
      AND s.status = 'active'  -- Only active stays, not historical
  ))
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Fix 2: Remove public access to SLA configs - restrict to authenticated staff/managers only

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "SLA configs are publicly viewable" ON public.sla_configs;

-- Create a new policy that only allows authenticated staff and managers to view SLA configs
CREATE POLICY "Authenticated staff can view SLA configs"
ON public.sla_configs
FOR SELECT
USING (
  (EXISTS (
    SELECT 1
    FROM staff_assignments sa
    WHERE sa.user_id = auth.uid()
      AND sa.hotel_id = sla_configs.hotel_id
      AND sa.is_active = true
  ))
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);