-- SECURITY HARDENING: Add explicit deny policies for anonymous access

-- 1. Deny anonymous access to profiles
CREATE POLICY "deny_anon_profiles" ON public.profiles 
FOR SELECT TO anon 
USING (false);

-- 2. Deny anonymous access to bookings
CREATE POLICY "deny_anon_bookings" ON public.bookings 
FOR SELECT TO anon 
USING (false);

-- 3. Restrict room visibility to only show available rooms publicly
DROP POLICY IF EXISTS "Rooms are publicly viewable" ON public.rooms;
CREATE POLICY "Available rooms are publicly viewable" ON public.rooms 
FOR SELECT 
USING (status = 'available' OR auth.uid() IS NOT NULL);

-- 4. Deny anonymous access to orders
CREATE POLICY "deny_anon_orders" ON public.orders 
FOR SELECT TO anon 
USING (false);

-- 5. Deny anonymous access to stays
CREATE POLICY "deny_anon_stays" ON public.stays 
FOR SELECT TO anon 
USING (false);

-- 6. Deny anonymous access to requests
CREATE POLICY "deny_anon_requests" ON public.requests 
FOR SELECT TO anon 
USING (false);

-- 7. Strengthen messages policy for internal flag
DROP POLICY IF EXISTS "Users can view messages for their requests" ON public.messages;
CREATE POLICY "Users can view non-internal messages for their requests" 
ON public.messages 
FOR SELECT 
USING (
  (is_internal = false AND EXISTS (
    SELECT 1 FROM requests r
    WHERE r.id = messages.request_id AND r.user_id = auth.uid()
  ))
  OR sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM requests r
    JOIN staff_assignments sa ON sa.hotel_id = r.hotel_id
    WHERE r.id = messages.request_id 
    AND sa.user_id = auth.uid() 
    AND sa.is_active = true
  )
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 8. Deny anonymous access to ratings
CREATE POLICY "deny_anon_ratings" ON public.ratings 
FOR SELECT TO anon 
USING (false);

-- 9. Deny anonymous access to order_items
CREATE POLICY "deny_anon_order_items" ON public.order_items 
FOR SELECT TO anon 
USING (false);

-- 10. Deny anonymous access to request_events
CREATE POLICY "deny_anon_request_events" ON public.request_events 
FOR SELECT TO anon 
USING (false);