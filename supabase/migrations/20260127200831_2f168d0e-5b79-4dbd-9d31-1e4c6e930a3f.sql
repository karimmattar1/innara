-- Update manager role
UPDATE public.user_roles 
SET role = 'manager' 
WHERE user_id = '30be1183-a11c-45ee-8d86-c73590964b35';

-- Update housekeeping to staff role
UPDATE public.user_roles 
SET role = 'staff' 
WHERE user_id = 'ffd5435a-0dcf-4e01-b325-2cb3864a8d82';

-- Create staff assignment for housekeeping user
INSERT INTO public.staff_assignments (user_id, hotel_id, department, is_active)
VALUES ('ffd5435a-0dcf-4e01-b325-2cb3864a8d82', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'housekeeping', true);

-- Also create staff assignment for manager (so they can access hotel data)
INSERT INTO public.staff_assignments (user_id, hotel_id, department, is_active)
VALUES ('30be1183-a11c-45ee-8d86-c73590964b35', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'front_desk', true);