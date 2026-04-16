-- Allow staff to view guest profiles for active stays even if not verified.
-- This is needed for demo data where stays are not verified.
DROP POLICY IF EXISTS "Staff can view profiles for active hotel guests" ON public.profiles;

CREATE POLICY "Staff can view profiles for active hotel guests"
  ON public.profiles
  FOR SELECT
  USING (
    (auth.uid() = id)
    OR (
      EXISTS (
        SELECT 1
        FROM stays s
        JOIN staff_assignments sa ON sa.hotel_id = s.hotel_id
        WHERE s.user_id = profiles.id
          AND sa.user_id = auth.uid()
          AND sa.is_active = true
          AND s.status = 'active'::stay_status
      )
    )
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );
