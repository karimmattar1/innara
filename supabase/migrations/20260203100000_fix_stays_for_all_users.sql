-- ================================================
-- FIX STAYS - Create one stay per user
-- ================================================

DO $$
DECLARE
  v_hotel_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_user_id UUID;
  v_room_numbers TEXT[] := ARRAY['101', '102', '103', '201', '202', '203', '301', '302', '303', '401', '402', '501'];
  i INTEGER;
BEGIN
  -- Clear existing stays for this hotel
  DELETE FROM public.stays WHERE hotel_id = v_hotel_id;

  -- Create one stay per user
  i := 1;
  FOR v_user_id IN SELECT id FROM public.profiles LOOP
    IF i <= array_length(v_room_numbers, 1) THEN
      INSERT INTO public.stays (
        hotel_id, user_id, room_number, status, check_in, check_out
      ) VALUES (
        v_hotel_id,
        v_user_id,
        v_room_numbers[i],
        'active'::stay_status,
        now() - ((floor(random() * 3))::int || ' days')::interval,
        now() + ((2 + floor(random() * 5))::int || ' days')::interval
      );
      RAISE NOTICE 'Created stay for user % in room %', v_user_id, v_room_numbers[i];
      i := i + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Created stays for % users', i - 1;
END $$;
