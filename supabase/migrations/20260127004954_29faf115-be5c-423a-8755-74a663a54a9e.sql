-- FIX: Restrict SECURITY DEFINER functions to only allow checking the caller's own role
-- This prevents any authenticated user from querying other users' roles

-- Drop and recreate has_role function with self-check enforcement
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role = _role
    AND _user_id = auth.uid()  -- SECURITY: Only allow checking own role
  )
$$;

-- Drop and recreate get_user_role function with self-check enforcement
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  AND _user_id = auth.uid()  -- SECURITY: Only allow checking own role
  ORDER BY 
    CASE role 
      WHEN 'super_admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'front_desk' THEN 3
      WHEN 'staff' THEN 4
      WHEN 'guest' THEN 5
    END
  LIMIT 1
$$;