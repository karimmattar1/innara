-- ================================================
-- ENSURE ALL USERS HAVE STAYS
-- Creates a stay for any user who doesn't have one
-- ================================================

DO $$
DECLARE
  v_hotel_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_user RECORD;
  v_room_number TEXT;
  v_room_counter INTEGER := 100;
BEGIN
  -- Loop through ALL users in profiles who don't have an active stay
  FOR v_user IN
    SELECT p.id, p.full_name
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.stays s
      WHERE s.user_id = p.id
      AND s.hotel_id = v_hotel_id
      AND s.status = 'active'
    )
  LOOP
    -- Generate room number
    v_room_counter := v_room_counter + 1;
    v_room_number := v_room_counter::text;

    INSERT INTO public.stays (
      hotel_id, user_id, room_number, status, check_in, check_out
    ) VALUES (
      v_hotel_id,
      v_user.id,
      v_room_number,
      'active'::stay_status,
      now() - interval '1 day',
      now() + interval '5 days'
    );

    RAISE NOTICE 'Created stay for user % (%) in room %', v_user.id, v_user.full_name, v_room_number;
  END LOOP;

  -- Also delete any duplicate/old stays to clean up
  DELETE FROM public.stays
  WHERE hotel_id = v_hotel_id
  AND status != 'active';

  RAISE NOTICE 'All users now have active stays!';
END $$;
