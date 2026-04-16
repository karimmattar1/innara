-- Create test accounts directly in auth.users
-- Password: test123 (bcrypt hashed)

-- 1. Manager account
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  aud,
  role
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  '00000000-0000-0000-0000-000000000000',
  'manager@innara.app',
  crypt('test123', gen_salt('bf')),
  now(),
  '{"full_name": "Sarah Manager"}'::jsonb,
  now(),
  now(),
  '',
  'authenticated',
  'authenticated'
);

-- 2. Housekeeping staff account
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  aud,
  role
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  '00000000-0000-0000-0000-000000000000',
  'housekeeping@innara.app',
  crypt('test123', gen_salt('bf')),
  now(),
  '{"full_name": "Maria Housekeeping"}'::jsonb,
  now(),
  now(),
  '',
  'authenticated',
  'authenticated'
);

-- 3. Guest test account
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  aud,
  role
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0003',
  '00000000-0000-0000-0000-000000000000',
  'guest@innara.app',
  crypt('test123', gen_salt('bf')),
  now(),
  '{"full_name": "Test Guest"}'::jsonb,
  now(),
  now(),
  '',
  'authenticated',
  'authenticated'
);

-- Create profiles (trigger should do this, but let's ensure)
INSERT INTO public.profiles (id, email, full_name) VALUES
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001', 'manager@innara.app', 'Sarah Manager'),
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002', 'housekeeping@innara.app', 'Maria Housekeeping'),
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0003', 'guest@innara.app', 'Test Guest')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Assign roles
INSERT INTO public.user_roles (user_id, role) VALUES
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001', 'manager'),
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002', 'staff'),
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0003', 'guest')
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign staff to The Sapphire Boutique hotel
INSERT INTO public.staff_assignments (user_id, hotel_id, department, is_active) VALUES
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'front_desk', true),
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'housekeeping', true)
ON CONFLICT DO NOTHING;

-- Create an active stay for the guest account at The Sapphire Boutique
INSERT INTO public.stays (id, user_id, hotel_id, room_number, check_in, check_out, status) VALUES
  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '1205', now(), now() + interval '3 days', 'active')
ON CONFLICT DO NOTHING;