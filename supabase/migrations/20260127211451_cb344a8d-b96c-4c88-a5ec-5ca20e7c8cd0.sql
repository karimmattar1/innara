
-- Fix 1: Restrict bookings access - only users see their own, managers/super_admins see all
-- Regular staff should NOT see booking financial details
DROP POLICY IF EXISTS "Staff can view hotel bookings" ON public.bookings;

CREATE POLICY "Managers can view hotel bookings"
  ON public.bookings
  FOR SELECT
  USING (
    has_role(auth.uid(), 'manager'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Fix 2: Ensure hotel_faqs only allows managers to manage (drop any old permissive policy)
DROP POLICY IF EXISTS "Authenticated can manage FAQs" ON public.hotel_faqs;

-- Fix 3: Strengthen profiles RLS - ensure staff can ONLY view profiles of guests 
-- who are actively staying at THEIR hotel with a verified stay
DROP POLICY IF EXISTS "Staff can view profiles for active hotel guests" ON public.profiles;

CREATE POLICY "Staff can view profiles for active hotel guests"
  ON public.profiles
  FOR SELECT
  USING (
    (auth.uid() = id)  -- Users can always see their own profile
    OR (
      -- Staff can only see profiles of guests with ACTIVE stays at their hotel
      EXISTS (
        SELECT 1
        FROM stays s
        JOIN staff_assignments sa ON sa.hotel_id = s.hotel_id
        WHERE s.user_id = profiles.id
          AND sa.user_id = auth.uid()
          AND sa.is_active = true
          AND s.status = 'active'::stay_status
          AND s.verified_at IS NOT NULL  -- Additional check: only verified stays
      )
    )
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );
