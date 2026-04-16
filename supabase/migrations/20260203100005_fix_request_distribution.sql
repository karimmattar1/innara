-- ================================================
-- FIX REQUEST DISTRIBUTION AND ROOM NUMBERS
-- 1. Distribute requests across different guests
-- 2. Fix any "demo" room numbers to match stays
-- ================================================

DO $$
DECLARE
  v_hotel_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_request RECORD;
  v_stay RECORD;
  v_user_count INTEGER;
  v_index INTEGER := 0;
BEGIN
  -- Get all users with active stays
  CREATE TEMP TABLE temp_users_stays AS
  SELECT
    p.id as user_id,
    p.full_name,
    s.room_number
  FROM public.profiles p
  JOIN public.stays s ON s.user_id = p.id
  WHERE s.hotel_id = v_hotel_id
  AND s.status = 'active'
  ORDER BY p.created_at;

  SELECT COUNT(*) INTO v_user_count FROM temp_users_stays;

  IF v_user_count = 0 THEN
    RAISE NOTICE 'No users with stays found - skipping';
    DROP TABLE temp_users_stays;
    RETURN;
  END IF;

  RAISE NOTICE 'Found % users with stays', v_user_count;

  -- Update each request to distribute across users
  FOR v_request IN
    SELECT id, room_number
    FROM public.requests
    WHERE hotel_id = v_hotel_id
    ORDER BY created_at
  LOOP
    -- Get user at current index (cycle through users)
    v_index := v_index + 1;

    SELECT user_id, room_number, full_name INTO v_stay
    FROM temp_users_stays
    OFFSET ((v_index - 1) % v_user_count)
    LIMIT 1;

    -- Update the request with the correct user and room
    UPDATE public.requests
    SET
      user_id = v_stay.user_id,
      room_number = v_stay.room_number
    WHERE id = v_request.id;

    RAISE NOTICE 'Updated request % -> User: % (%), Room: %',
      v_request.id, v_stay.full_name, v_stay.user_id, v_stay.room_number;
  END LOOP;

  -- Also fix any orders that have "demo" room number
  UPDATE public.orders o
  SET room_number = (
    SELECT s.room_number
    FROM public.stays s
    WHERE s.user_id = o.user_id
    AND s.hotel_id = o.hotel_id
    AND s.status = 'active'
    LIMIT 1
  )
  WHERE o.hotel_id = v_hotel_id
  AND (o.room_number IS NULL OR o.room_number = 'demo' OR o.room_number = 'Demo');

  DROP TABLE temp_users_stays;

  RAISE NOTICE 'Request distribution and room number fix completed!';
END $$;
