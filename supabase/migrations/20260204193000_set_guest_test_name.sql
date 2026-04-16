-- Ensure demo guest account has the expected display name.
UPDATE public.profiles
SET full_name = 'Karim Mattar'
WHERE lower(email) = 'guest@innara.app';
