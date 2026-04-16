-- Update all user emails from innara.ai to innara.app

-- Update auth.users emails
UPDATE auth.users
SET email = REPLACE(email, '@innara.ai', '@innara.app')
WHERE email LIKE '%@innara.ai';

-- Update auth.users raw_user_meta_data
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{email}',
  to_jsonb(REPLACE(raw_user_meta_data->>'email', '@innara.ai', '@innara.app'))
)
WHERE raw_user_meta_data->>'email' LIKE '%@innara.ai';

-- Update auth.identities identity_data
UPDATE auth.identities
SET identity_data = jsonb_set(
  identity_data,
  '{email}',
  to_jsonb(REPLACE(identity_data->>'email', '@innara.ai', '@innara.app'))
)
WHERE identity_data->>'email' LIKE '%@innara.ai';

-- Update profiles emails
UPDATE public.profiles
SET email = REPLACE(email, '@innara.ai', '@innara.app')
WHERE email LIKE '%@innara.ai';
