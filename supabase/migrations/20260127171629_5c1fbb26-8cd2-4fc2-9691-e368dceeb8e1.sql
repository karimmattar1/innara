-- Fix PUBLIC_HOTEL_DATA: Restrict hotels table to authenticated users
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Hotels are publicly viewable" ON public.hotels;

-- Create new policy: Only authenticated users can view active hotels
CREATE POLICY "Authenticated users can view active hotels"
ON public.hotels
FOR SELECT
TO authenticated
USING (is_active = true);

-- Fix PUBLIC_ROOM_DATA: Restrict rooms table access
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Available rooms are publicly viewable" ON public.rooms;

-- Create new policy: Only authenticated users can view rooms
-- Users with active stays/bookings at a hotel can see all rooms for that hotel
-- Staff can see rooms for their assigned hotels
CREATE POLICY "Authenticated users can view rooms for their hotel"
ON public.rooms
FOR SELECT
TO authenticated
USING (
  -- Users with active stays at this hotel
  EXISTS (
    SELECT 1 FROM stays s
    WHERE s.hotel_id = rooms.hotel_id
    AND s.user_id = auth.uid()
    AND s.status = 'active'
  )
  OR
  -- Users with bookings at this hotel
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.hotel_id = rooms.hotel_id
    AND b.user_id = auth.uid()
    AND b.status IN ('pending', 'confirmed', 'checked_in')
  )
  OR
  -- Staff assigned to this hotel
  EXISTS (
    SELECT 1 FROM staff_assignments sa
    WHERE sa.hotel_id = rooms.hotel_id
    AND sa.user_id = auth.uid()
    AND sa.is_active = true
  )
  OR
  -- Managers and super admins
  has_role(auth.uid(), 'manager')
  OR has_role(auth.uid(), 'super_admin')
);