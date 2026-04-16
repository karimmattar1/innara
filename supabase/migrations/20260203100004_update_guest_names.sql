-- ================================================
-- UPDATE GUEST PROFILES WITH MIDDLE EASTERN NAMES
-- ================================================

DO $$
DECLARE
  v_names TEXT[] := ARRAY[
    'Omar Al-Rashid',
    'Layla Hassan',
    'Khalid Al-Farsi',
    'Fatima Nasser',
    'Ahmed Mansour',
    'Noor Al-Qasimi',
    'Youssef Khoury',
    'Salma Ibrahim',
    'Tariq Al-Mahmoud',
    'Hana Bakri',
    'Rami Shamsi',
    'Dalia Haddad'
  ];
  v_user RECORD;
  i INTEGER := 1;
BEGIN
  -- Update each profile with a name
  FOR v_user IN
    SELECT id FROM public.profiles
    ORDER BY created_at
  LOOP
    UPDATE public.profiles
    SET full_name = v_names[((i - 1) % array_length(v_names, 1)) + 1]
    WHERE id = v_user.id;

    RAISE NOTICE 'Updated user % with name %', v_user.id, v_names[((i - 1) % array_length(v_names, 1)) + 1];
    i := i + 1;
  END LOOP;

  RAISE NOTICE 'Updated % guest profiles with Middle Eastern names', i - 1;
END $$;
