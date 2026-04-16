-- ================================================
-- CLEANUP: Delete all broken auth records and start fresh
-- ================================================

-- Delete all sessions first
DELETE FROM auth.sessions;

-- Delete all refresh tokens
DELETE FROM auth.refresh_tokens;

-- Delete all identities
DELETE FROM auth.identities;

-- Delete all auth.users (this will cascade to profiles via FK)
DELETE FROM auth.users;

-- Clean up any orphaned profiles (shouldn't exist, but just in case)
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);

-- Clean up any orphaned user_roles
DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT id FROM auth.users);
