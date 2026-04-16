-- PHASE 1: CRITICAL SECURITY FIXES - Staff RLS Policies

-- 1. Fix profiles table - Remove overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Add staff policy to view profiles for guests in their hotel
CREATE POLICY "Staff can view profiles for hotel guests" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM stays s
    JOIN staff_assignments sa ON sa.hotel_id = s.hotel_id
    WHERE s.user_id = profiles.id 
    AND sa.user_id = auth.uid() 
    AND sa.is_active = true
  )
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 2. Staff can view bookings for their hotel
CREATE POLICY "Staff can view hotel bookings" 
ON public.bookings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM staff_assignments sa 
    WHERE sa.user_id = auth.uid() 
    AND sa.hotel_id = bookings.hotel_id 
    AND sa.is_active = true
  )
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 3. Staff can update stays (check-in/check-out)
CREATE POLICY "Staff can update hotel stays" 
ON public.stays 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM staff_assignments sa 
    WHERE sa.user_id = auth.uid() 
    AND sa.hotel_id = stays.hotel_id 
    AND sa.is_active = true
  )
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 4. Staff can update orders
CREATE POLICY "Staff can update hotel orders" 
ON public.orders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM staff_assignments sa 
    WHERE sa.user_id = auth.uid() 
    AND sa.hotel_id = orders.hotel_id 
    AND sa.is_active = true
  )
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 5. Staff can insert request_events
CREATE POLICY "Staff can insert request events" 
ON public.request_events 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM requests r
    JOIN staff_assignments sa ON sa.hotel_id = r.hotel_id
    WHERE r.id = request_events.request_id 
    AND sa.user_id = auth.uid() 
    AND sa.is_active = true
  )
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 6. Staff can view and send messages
CREATE POLICY "Staff can view hotel messages" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM requests r
    JOIN staff_assignments sa ON sa.hotel_id = r.hotel_id
    WHERE r.id = messages.request_id 
    AND sa.user_id = auth.uid() 
    AND sa.is_active = true
  )
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Staff can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id 
  AND (
    EXISTS (
      SELECT 1 FROM requests r
      JOIN staff_assignments sa ON sa.hotel_id = r.hotel_id
      WHERE r.id = messages.request_id 
      AND sa.user_id = auth.uid() 
      AND sa.is_active = true
    )
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- 7. Staff can view ratings for their hotel
CREATE POLICY "Staff can view hotel ratings" 
ON public.ratings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM staff_assignments sa 
    WHERE sa.user_id = auth.uid() 
    AND sa.hotel_id = ratings.hotel_id 
    AND sa.is_active = true
  )
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 8. Staff can view order items
CREATE POLICY "Staff can view hotel order items" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN staff_assignments sa ON sa.hotel_id = o.hotel_id
    WHERE o.id = order_items.order_id 
    AND sa.user_id = auth.uid() 
    AND sa.is_active = true
  )
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 9. Staff can update order items (mark as prepared, etc.)
CREATE POLICY "Staff can update hotel order items" 
ON public.order_items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN staff_assignments sa ON sa.hotel_id = o.hotel_id
    WHERE o.id = order_items.order_id 
    AND sa.user_id = auth.uid() 
    AND sa.is_active = true
  )
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 10. Managers can view all staff assignments for their hotel
CREATE POLICY "Managers can view hotel staff assignments"
ON public.staff_assignments
FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 11. Managers can manage hotel configuration (menu items, categories)
CREATE POLICY "Managers can manage menu categories"
ON public.menu_categories
FOR ALL
USING (
  has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Managers can manage menu items"
ON public.menu_items
FOR ALL
USING (
  has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 12. Managers can manage staff assignments
CREATE POLICY "Managers can manage staff assignments"
ON public.staff_assignments
FOR ALL
USING (
  has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 13. Managers can manage SLA configs
CREATE POLICY "Managers can manage SLA configs"
ON public.sla_configs
FOR ALL
USING (
  has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);