-- Fix security vulnerability: Hotel FAQs should only be managed by managers/super_admins
-- Drop the overly permissive policy that allows any authenticated user to manage FAQs
DROP POLICY IF EXISTS "Authenticated can manage FAQs" ON public.hotel_faqs;

-- Create manager-only policy for FAQ management (INSERT, UPDATE, DELETE)
CREATE POLICY "Managers can manage FAQs"
ON public.hotel_faqs
FOR ALL
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Note: The existing "Anyone can read active FAQs" policy remains in place for public read access