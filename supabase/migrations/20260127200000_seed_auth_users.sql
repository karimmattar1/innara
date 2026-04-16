-- ================================================
-- SEED: Auth users, profiles, and roles
-- Must run BEFORE staff_assignments migration
-- ================================================

-- Insert auth users with their original IDs and password hashes
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
VALUES
  (
    '4611d89a-514b-4d4e-ac37-d544a1c5d82e',
    '00000000-0000-0000-0000-000000000000',
    'karimmattar11@gmail.com',
    '$2a$10$OT4NMkD2Ln4vmkudIoPCB.UdVXis.EY7QAXf4A9w2JXssV3ypNse6',
    now(), 'authenticated', 'authenticated',
    '{"email":"karimmattar11@gmail.com","email_verified":true,"full_name":"Karim Mattar","phone_verified":false,"sub":"4611d89a-514b-4d4e-ac37-d544a1c5d82e"}',
    '2026-01-26T19:16:45.934075+00:00', now(), '', ''
  ),
  (
    '30be1183-a11c-45ee-8d86-c73590964b35',
    '00000000-0000-0000-0000-000000000000',
    'manager@innara.app',
    '$2a$10$dnvJasUXQhwl0Ye0JDsq2.4d.U45c00xWqNu6AJ9eAWmPdnKfSv9u',
    now(), 'authenticated', 'authenticated',
    '{"email":"manager@innara.app","email_verified":true,"full_name":"Manager Test","phone_verified":false,"sub":"30be1183-a11c-45ee-8d86-c73590964b35"}',
    '2026-01-27T20:06:19.887542+00:00', now(), '', ''
  ),
  (
    'ffd5435a-0dcf-4e01-b325-2cb3864a8d82',
    '00000000-0000-0000-0000-000000000000',
    'housekeeping@innara.app',
    '$2a$10$r/PFn1LHieW6AsJjpcS9ruGe/Ee43Vwps6tXvi3Z/bbjk0/N1.pOa',
    now(), 'authenticated', 'authenticated',
    '{"email":"housekeeping@innara.app","email_verified":true,"full_name":"Housekeeping Test","phone_verified":false,"sub":"ffd5435a-0dcf-4e01-b325-2cb3864a8d82"}',
    '2026-01-27T20:06:42.359618+00:00', now(), '', ''
  ),
  (
    '7938b42e-57b1-48e4-a508-6ed8daa9375e',
    '00000000-0000-0000-0000-000000000000',
    'guest@innara.app',
    '$2a$10$RiY..sOint8QnX2z3dNeQ.EUI0iNnTyV9ttlaCnrHGr3Mj8oqDX1K',
    now(), 'authenticated', 'authenticated',
    '{"email":"guest@innara.app","email_verified":true,"full_name":"Guest Test","phone_verified":false,"sub":"7938b42e-57b1-48e4-a508-6ed8daa9375e"}',
    '2026-01-27T20:07:12.882855+00:00', now(), '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- Insert auth.identities for each user (required for login to work)
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at)
VALUES
  (
    '4611d89a-514b-4d4e-ac37-d544a1c5d82e',
    '4611d89a-514b-4d4e-ac37-d544a1c5d82e',
    '{"sub":"4611d89a-514b-4d4e-ac37-d544a1c5d82e","email":"karimmattar11@gmail.com","email_verified":true}',
    'email', '4611d89a-514b-4d4e-ac37-d544a1c5d82e',
    '2026-01-26T19:16:45.934075+00:00', now(), now()
  ),
  (
    '30be1183-a11c-45ee-8d86-c73590964b35',
    '30be1183-a11c-45ee-8d86-c73590964b35',
    '{"sub":"30be1183-a11c-45ee-8d86-c73590964b35","email":"manager@innara.app","email_verified":true}',
    'email', '30be1183-a11c-45ee-8d86-c73590964b35',
    '2026-01-27T20:06:19.887542+00:00', now(), now()
  ),
  (
    'ffd5435a-0dcf-4e01-b325-2cb3864a8d82',
    'ffd5435a-0dcf-4e01-b325-2cb3864a8d82',
    '{"sub":"ffd5435a-0dcf-4e01-b325-2cb3864a8d82","email":"housekeeping@innara.app","email_verified":true}',
    'email', 'ffd5435a-0dcf-4e01-b325-2cb3864a8d82',
    '2026-01-27T20:06:42.359618+00:00', now(), now()
  ),
  (
    '7938b42e-57b1-48e4-a508-6ed8daa9375e',
    '7938b42e-57b1-48e4-a508-6ed8daa9375e',
    '{"sub":"7938b42e-57b1-48e4-a508-6ed8daa9375e","email":"guest@innara.app","email_verified":true}',
    'email', '7938b42e-57b1-48e4-a508-6ed8daa9375e',
    '2026-01-27T20:07:12.882855+00:00', now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- The handle_new_user trigger will auto-create profiles and guest roles.
-- But we need to set the correct roles for staff/manager.
-- Wait for the trigger to fire, then update roles in the next migration.
