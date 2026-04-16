-- Delete the broken test users from auth.users (cascade will clean up profiles/roles)
DELETE FROM auth.users 
WHERE id IN (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0003'
);