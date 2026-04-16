-- Add additional demo housekeeping staff for smarter auto-assignment.
-- Creates auth users, identities, profiles, roles, and staff assignments.

DO $$
DECLARE
  v_hotel_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_instance_id UUID;
  v_password TEXT;
BEGIN
  SELECT instance_id, encrypted_password
  INTO v_instance_id, v_password
  FROM auth.users
  WHERE email = 'housekeeping@innara.app'
  LIMIT 1;

  -- Auth users
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES
    ('b1111111-1111-1111-1111-111111111111', v_instance_id, 'housekeeping2@innara.app', v_password, now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Amina Hassan"}'),
    ('b2222222-2222-2222-2222-222222222222', v_instance_id, 'housekeeping3@innara.app', v_password, now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sofia Reyes"}'),
    ('b3333333-3333-3333-3333-333333333333', v_instance_id, 'housekeeping4@innara.app', v_password, now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rina Dela Cruz"}')
  ON CONFLICT (id) DO NOTHING;

  -- Identities
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES
    (gen_random_uuid(), 'b1111111-1111-1111-1111-111111111111', '{"sub":"b1111111-1111-1111-1111-111111111111","email":"housekeeping2@innara.app","email_verified":true}'::jsonb, 'email', 'b1111111-1111-1111-1111-111111111111', now(), now()),
    (gen_random_uuid(), 'b2222222-2222-2222-2222-222222222222', '{"sub":"b2222222-2222-2222-2222-222222222222","email":"housekeeping3@innara.app","email_verified":true}'::jsonb, 'email', 'b2222222-2222-2222-2222-222222222222', now(), now()),
    (gen_random_uuid(), 'b3333333-3333-3333-3333-333333333333', '{"sub":"b3333333-3333-3333-3333-333333333333","email":"housekeeping4@innara.app","email_verified":true}'::jsonb, 'email', 'b3333333-3333-3333-3333-333333333333', now(), now())
  ON CONFLICT DO NOTHING;

  -- Profiles (ensure full_name is present)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES
    ('b1111111-1111-1111-1111-111111111111', 'housekeeping2@innara.app', 'Amina Hassan'),
    ('b2222222-2222-2222-2222-222222222222', 'housekeeping3@innara.app', 'Sofia Reyes'),
    ('b3333333-3333-3333-3333-333333333333', 'housekeeping4@innara.app', 'Rina Dela Cruz')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

  -- Roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES
    ('b1111111-1111-1111-1111-111111111111', 'staff'),
    ('b2222222-2222-2222-2222-222222222222', 'staff'),
    ('b3333333-3333-3333-3333-333333333333', 'staff')
  ON CONFLICT DO NOTHING;

  -- Staff assignments
  INSERT INTO public.staff_assignments (user_id, hotel_id, department, is_active)
  VALUES
    ('b1111111-1111-1111-1111-111111111111', v_hotel_id, 'housekeeping', true),
    ('b2222222-2222-2222-2222-222222222222', v_hotel_id, 'housekeeping', true),
    ('b3333333-3333-3333-3333-333333333333', v_hotel_id, 'housekeeping', true)
  ON CONFLICT (user_id, hotel_id, department) DO UPDATE SET is_active = true;
END $$;
