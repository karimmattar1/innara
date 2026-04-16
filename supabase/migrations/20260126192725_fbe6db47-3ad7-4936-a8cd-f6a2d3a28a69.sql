-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Add staff and manager policies to view all hotel requests
CREATE POLICY "Staff can view all hotel requests"
ON public.requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.staff_assignments sa
    WHERE sa.user_id = auth.uid() 
    AND sa.hotel_id = requests.hotel_id
    AND sa.is_active = true
  )
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Staff can update requests for their hotel
CREATE POLICY "Staff can update hotel requests"
ON public.requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.staff_assignments sa
    WHERE sa.user_id = auth.uid() 
    AND sa.hotel_id = requests.hotel_id
    AND sa.is_active = true
  )
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Staff can view all hotel stays
CREATE POLICY "Staff can view hotel stays"
ON public.stays FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.staff_assignments sa
    WHERE sa.user_id = auth.uid() 
    AND sa.hotel_id = stays.hotel_id
    AND sa.is_active = true
  )
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Staff can view all hotel orders
CREATE POLICY "Staff can view hotel orders"
ON public.orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.staff_assignments sa
    WHERE sa.user_id = auth.uid() 
    AND sa.hotel_id = orders.hotel_id
    AND sa.is_active = true
  )
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Allow profiles to be read by authenticated users for displaying guest names
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);