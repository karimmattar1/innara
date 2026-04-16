-- ================================================
-- ADD REALISTIC ANALYTICS DATA
-- 1. Create orders with revenue spread across 30 days
-- 2. Spread requests across peak hours
-- 3. Assign staff (using existing profiles)
-- 4. Add ratings for satisfaction metrics
-- ================================================

-- Helper function to get random item for category
CREATE OR REPLACE FUNCTION get_random_item(cat TEXT) RETURNS TEXT AS $$
BEGIN
  CASE cat
    WHEN 'housekeeping' THEN
      RETURN (ARRAY['Room Cleaning', 'Extra Towels', 'Fresh Linens', 'Toiletries'])[1 + floor(random() * 4)::int];
    WHEN 'maintenance' THEN
      RETURN (ARRAY['AC Not Working', 'Light Bulb', 'Leaky Faucet', 'WiFi Issue'])[1 + floor(random() * 4)::int];
    WHEN 'room_service' THEN
      RETURN (ARRAY['Club Sandwich', 'Caesar Salad', 'Grilled Salmon', 'Pasta'])[1 + floor(random() * 4)::int];
    WHEN 'concierge' THEN
      RETURN (ARRAY['Restaurant Reservation', 'Airport Transfer', 'Tour Booking', 'Ticket Booking'])[1 + floor(random() * 4)::int];
    WHEN 'spa' THEN
      RETURN (ARRAY['Full Body Massage', 'Facial', 'Manicure', 'Pedicure'])[1 + floor(random() * 4)::int];
    WHEN 'valet' THEN
      RETURN (ARRAY['Car Pickup', 'Car Wash', 'Parking', 'Car Drop-off'])[1 + floor(random() * 4)::int];
    ELSE
      RETURN 'General Request';
  END CASE;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  v_hotel_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_profile_ids UUID[];
  v_staff_names TEXT[] := ARRAY[
    'Ahmed El-Masri',
    'Sara Al-Rashid',
    'Mohammed Khalil',
    'Noura Hamdan',
    'Youssef Bakr'
  ];
  v_request RECORD;
  v_user_id UUID;
  v_staff_id UUID;
  v_order_id UUID;
  v_subtotal NUMERIC;
  v_tax NUMERIC;
  v_tip NUMERIC;
  v_room_numbers TEXT[] := ARRAY['101', '102', '103', '201'];
  v_categories TEXT[] := ARRAY['housekeeping', 'maintenance', 'room_service', 'concierge', 'spa', 'valet'];
  v_peak_hours INT[] := ARRAY[8, 9, 12, 13, 19, 20, 21, 22];
  i INTEGER;
  v_cat TEXT;
  v_item TEXT;
  v_hour INTEGER;
  v_day_offset INTEGER;
  v_request_id UUID;
BEGIN
  -- ============================================
  -- 1. GET EXISTING PROFILE IDS
  -- ============================================

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_profile_ids
  FROM public.profiles
  LIMIT 5;

  IF v_profile_ids IS NULL OR array_length(v_profile_ids, 1) IS NULL THEN
    RAISE NOTICE 'No profiles found - skipping';
    RETURN;
  END IF;

  -- Update existing profiles with staff-like names for demo display
  FOR i IN 1..LEAST(array_length(v_profile_ids, 1), array_length(v_staff_names, 1)) LOOP
    UPDATE public.profiles
    SET full_name = v_staff_names[i]
    WHERE id = v_profile_ids[i];
    RAISE NOTICE 'Updated profile % with name %', v_profile_ids[i], v_staff_names[i];
  END LOOP;

  -- ============================================
  -- 2. DELETE OLD DATA AND CREATE FRESH
  -- ============================================

  DELETE FROM public.request_events WHERE request_id IN (SELECT id FROM public.requests WHERE hotel_id = v_hotel_id);
  DELETE FROM public.ratings WHERE hotel_id = v_hotel_id;
  DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE hotel_id = v_hotel_id);
  DELETE FROM public.orders WHERE hotel_id = v_hotel_id;
  DELETE FROM public.requests WHERE hotel_id = v_hotel_id;

  -- ============================================
  -- 3. CREATE REQUESTS SPREAD ACROSS 30 DAYS AND PEAK HOURS
  -- ============================================

  FOR v_day_offset IN 0..29 LOOP
    -- Create 3-8 requests per day
    FOR i IN 1..(3 + floor(random() * 5)::int) LOOP
      v_request_id := gen_random_uuid();
      v_cat := v_categories[1 + floor(random() * array_length(v_categories, 1))::int];
      v_item := get_random_item(v_cat);
      v_hour := v_peak_hours[1 + floor(random() * array_length(v_peak_hours, 1))::int];
      v_user_id := v_profile_ids[1 + floor(random() * array_length(v_profile_ids, 1))::int];
      v_staff_id := v_profile_ids[1 + floor(random() * array_length(v_profile_ids, 1))::int];

      INSERT INTO public.requests (
        id, hotel_id, user_id, category, item,
        room_number, status, priority, eta_minutes,
        assigned_staff_id, created_at, completed_at
      ) VALUES (
        v_request_id,
        v_hotel_id,
        v_user_id,
        v_cat::request_category,
        v_item,
        v_room_numbers[1 + floor(random() * array_length(v_room_numbers, 1))::int],
        CASE
          WHEN v_day_offset = 0 THEN (ARRAY['new', 'pending', 'in_progress', 'completed'])[1 + floor(random() * 4)::int]
          ELSE 'completed'
        END::request_status,
        (ARRAY['low', 'medium', 'high'])[1 + floor(random() * 3)::int]::request_priority,
        5 + floor(random() * 20)::int,
        v_staff_id,
        now() - (v_day_offset || ' days')::interval + (v_hour || ' hours')::interval + ((floor(random() * 50))::int || ' minutes')::interval,
        CASE
          WHEN v_day_offset > 0 OR random() > 0.3 THEN
            now() - (v_day_offset || ' days')::interval + (v_hour || ' hours')::interval + ((10 + floor(random() * 30))::int || ' minutes')::interval
          ELSE NULL
        END
      );

      -- Add request events for completed requests
      IF v_day_offset > 0 OR random() > 0.3 THEN
        INSERT INTO public.request_events (request_id, status, notes, created_at)
        VALUES (v_request_id, 'new', 'Request submitted',
          now() - (v_day_offset || ' days')::interval + (v_hour || ' hours')::interval);

        INSERT INTO public.request_events (request_id, status, notes, created_at, created_by)
        VALUES (v_request_id, 'pending', 'Accepted by staff',
          now() - (v_day_offset || ' days')::interval + (v_hour || ' hours')::interval + ((2 + floor(random() * 3))::int || ' minutes')::interval,
          v_staff_id);

        INSERT INTO public.request_events (request_id, status, notes, created_at, created_by)
        VALUES (v_request_id, 'in_progress', 'Work started',
          now() - (v_day_offset || ' days')::interval + (v_hour || ' hours')::interval + ((5 + floor(random() * 5))::int || ' minutes')::interval,
          v_staff_id);

        INSERT INTO public.request_events (request_id, status, notes, created_at, created_by)
        VALUES (v_request_id, 'completed', 'Request fulfilled',
          now() - (v_day_offset || ' days')::interval + (v_hour || ' hours')::interval + ((10 + floor(random() * 20))::int || ' minutes')::interval,
          v_staff_id);
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created requests spread across 30 days with peak hours';

  -- ============================================
  -- 4. CREATE ORDERS WITH REVENUE (30 days)
  -- ============================================

  FOR v_day_offset IN 0..29 LOOP
    FOR i IN 1..(2 + floor(random() * 3)::int) LOOP
      v_order_id := gen_random_uuid();
      v_subtotal := (30 + floor(random() * 120))::numeric;
      v_tax := round((v_subtotal * 0.08)::numeric, 2);
      v_tip := CASE WHEN random() > 0.2 THEN round((v_subtotal * (0.15 + random() * 0.10))::numeric, 2) ELSE 0 END;
      v_user_id := v_profile_ids[1 + floor(random() * array_length(v_profile_ids, 1))::int];
      v_hour := v_peak_hours[1 + floor(random() * array_length(v_peak_hours, 1))::int];

      INSERT INTO public.orders (
        id, hotel_id, user_id, room_number,
        status, subtotal, tax, tip, total, created_at
      ) VALUES (
        v_order_id,
        v_hotel_id,
        v_user_id,
        v_room_numbers[1 + floor(random() * array_length(v_room_numbers, 1))::int],
        CASE WHEN v_day_offset = 0 AND random() > 0.7 THEN 'pending' ELSE 'completed' END,
        v_subtotal,
        v_tax,
        v_tip,
        v_subtotal + v_tax + v_tip,
        now() - (v_day_offset || ' days')::interval + (v_hour || ' hours')::interval + ((floor(random() * 50))::int || ' minutes')::interval
      );

      INSERT INTO public.order_items (order_id, menu_item_id, name, quantity, unit_price, total_price)
      VALUES (
        v_order_id,
        NULL,
        (ARRAY['Club Sandwich', 'Caesar Salad', 'Grilled Salmon', 'Pasta Carbonara', 'Fresh Juice', 'Steak Frites', 'Lobster Bisque'])[1 + floor(random() * 7)::int],
        1 + floor(random() * 2)::int,
        (15 + floor(random() * 40))::numeric,
        v_subtotal
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created orders for 30 days with realistic revenue';

  -- ============================================
  -- 5. ADD RATINGS FOR SATISFACTION
  -- ============================================

  FOR v_request IN
    SELECT id, user_id FROM public.requests
    WHERE hotel_id = v_hotel_id AND status = 'completed'
    ORDER BY random()
    LIMIT 50
  LOOP
    INSERT INTO public.ratings (
      hotel_id, request_id, user_id, rating, comment, created_at
    ) VALUES (
      v_hotel_id,
      v_request.id,
      v_request.user_id,
      (4 + floor(random() * 2))::int,
      CASE floor(random() * 4)::int
        WHEN 0 THEN 'Excellent service!'
        WHEN 1 THEN 'Very prompt and professional'
        WHEN 2 THEN 'Great experience'
        ELSE 'Thank you!'
      END,
      now() - ((floor(random() * 30))::int || ' days')::interval
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Added ratings for satisfaction metrics';
  RAISE NOTICE 'Demo analytics data creation completed!';

END $$;

DROP FUNCTION IF EXISTS get_random_item(TEXT);
