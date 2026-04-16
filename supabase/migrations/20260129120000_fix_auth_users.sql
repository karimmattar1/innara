-- ================================================
-- FIX: Clean up broken auth.users and recreate properly
-- The original SQL inserts broke the auth schema
-- ================================================

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- First, remove the broken auth.users (this cascades to profiles and identities)
-- But we need to preserve FK references in other tables, so we can't delete users that are referenced

-- Delete broken identities first
DELETE FROM auth.identities WHERE user_id IN (
  '4611d89a-514b-4d4e-ac37-d544a1c5d82e',
  '30be1183-a11c-45ee-8d86-c73590964b35',
  'ffd5435a-0dcf-4e01-b325-2cb3864a8d82',
  '7938b42e-57b1-48e4-a508-6ed8daa9375e'
);

-- Delete broken auth.users (profiles will cascade)
DELETE FROM auth.users WHERE id IN (
  '4611d89a-514b-4d4e-ac37-d544a1c5d82e',
  '30be1183-a11c-45ee-8d86-c73590964b35',
  'ffd5435a-0dcf-4e01-b325-2cb3864a8d82',
  '7938b42e-57b1-48e4-a508-6ed8daa9375e'
);

-- Also delete the testuser we created
DELETE FROM auth.identities WHERE user_id = 'e33cab4d-4f33-4ffa-9378-9d09fcc5dec8';
DELETE FROM auth.users WHERE id = 'e33cab4d-4f33-4ffa-9378-9d09fcc5dec8';

-- Now recreate users using proper Supabase auth format
-- The key is to include all required columns with proper defaults

-- User 1: Karim Mattar (guest)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at,
  is_anonymous, is_sso_user
)
VALUES (
  '4611d89a-514b-4d4e-ac37-d544a1c5d82e',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'karimmattar11@gmail.com',
  extensions.crypt('test123', extensions.gen_salt('bf')),
  now(),
  '{"full_name":"Karim Mattar","email":"karimmattar11@gmail.com","email_verified":true}'::jsonb,
  '{"provider":"email","providers":["email"]}'::jsonb,
  now(), now(),
  false, false
);

-- User 2: Manager
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at,
  is_anonymous, is_sso_user
)
VALUES (
  '30be1183-a11c-45ee-8d86-c73590964b35',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'manager@innara.app',
  extensions.crypt('test123', extensions.gen_salt('bf')),
  now(),
  '{"full_name":"Manager Test","email":"manager@innara.app","email_verified":true}'::jsonb,
  '{"provider":"email","providers":["email"]}'::jsonb,
  now(), now(),
  false, false
);

-- User 3: Housekeeping
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at,
  is_anonymous, is_sso_user
)
VALUES (
  'ffd5435a-0dcf-4e01-b325-2cb3864a8d82',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'housekeeping@innara.app',
  extensions.crypt('test123', extensions.gen_salt('bf')),
  now(),
  '{"full_name":"Housekeeping Test","email":"housekeeping@innara.app","email_verified":true}'::jsonb,
  '{"provider":"email","providers":["email"]}'::jsonb,
  now(), now(),
  false, false
);

-- User 4: Guest
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at,
  is_anonymous, is_sso_user
)
VALUES (
  '7938b42e-57b1-48e4-a508-6ed8daa9375e',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'guest@innara.app',
  extensions.crypt('test123', extensions.gen_salt('bf')),
  now(),
  '{"full_name":"Guest Test","email":"guest@innara.app","email_verified":true}'::jsonb,
  '{"provider":"email","providers":["email"]}'::jsonb,
  now(), now(),
  false, false
);

-- Create identities for each user (required for email login)
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  created_at, updated_at, last_sign_in_at
)
VALUES
  (
    gen_random_uuid(),
    '4611d89a-514b-4d4e-ac37-d544a1c5d82e',
    '{"sub":"4611d89a-514b-4d4e-ac37-d544a1c5d82e","email":"karimmattar11@gmail.com","email_verified":true}'::jsonb,
    'email', '4611d89a-514b-4d4e-ac37-d544a1c5d82e',
    now(), now(), now()
  ),
  (
    gen_random_uuid(),
    '30be1183-a11c-45ee-8d86-c73590964b35',
    '{"sub":"30be1183-a11c-45ee-8d86-c73590964b35","email":"manager@innara.app","email_verified":true}'::jsonb,
    'email', '30be1183-a11c-45ee-8d86-c73590964b35',
    now(), now(), now()
  ),
  (
    gen_random_uuid(),
    'ffd5435a-0dcf-4e01-b325-2cb3864a8d82',
    '{"sub":"ffd5435a-0dcf-4e01-b325-2cb3864a8d82","email":"housekeeping@innara.app","email_verified":true}'::jsonb,
    'email', 'ffd5435a-0dcf-4e01-b325-2cb3864a8d82',
    now(), now(), now()
  ),
  (
    gen_random_uuid(),
    '7938b42e-57b1-48e4-a508-6ed8daa9375e',
    '{"sub":"7938b42e-57b1-48e4-a508-6ed8daa9375e","email":"guest@innara.app","email_verified":true}'::jsonb,
    'email', '7938b42e-57b1-48e4-a508-6ed8daa9375e',
    now(), now(), now()
  );

-- The handle_new_user trigger will auto-create profiles
-- Now update the user_roles for non-guest users
UPDATE public.user_roles SET role = 'manager' WHERE user_id = '30be1183-a11c-45ee-8d86-c73590964b35';
UPDATE public.user_roles SET role = 'staff' WHERE user_id = 'ffd5435a-0dcf-4e01-b325-2cb3864a8d82';

-- Recreate staff assignments
INSERT INTO public.staff_assignments (user_id, hotel_id, department, is_active)
VALUES
  ('ffd5435a-0dcf-4e01-b325-2cb3864a8d82', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'housekeeping', true),
  ('30be1183-a11c-45ee-8d86-c73590964b35', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'front_desk', true)
ON CONFLICT (user_id, hotel_id, department) DO UPDATE SET is_active = true;

-- Recreate stays for karim and guest
INSERT INTO public.stays (user_id, hotel_id, room_number, check_in, check_out, status)
VALUES
  ('4611d89a-514b-4d4e-ac37-d544a1c5d82e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '1204', '2026-01-26', '2026-02-28', 'active'),
  ('7938b42e-57b1-48e4-a508-6ed8daa9375e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '305', now(), now() + interval '7 days', 'active')
ON CONFLICT DO NOTHING;
