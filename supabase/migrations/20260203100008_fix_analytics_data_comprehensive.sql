-- ================================================
-- COMPREHENSIVE ANALYTICS DATA FIX
-- Fixes: staff names, peak hours, resolution times,
--        category distribution, change percentages
-- ================================================

-- Helper function
CREATE OR REPLACE FUNCTION get_demo_item(cat TEXT) RETURNS TEXT AS $$
BEGIN
  CASE cat
    WHEN 'housekeeping' THEN
      RETURN (ARRAY['Room Cleaning', 'Extra Towels', 'Fresh Linens', 'Toiletries', 'Turn Down Service'])[1 + floor(random() * 5)::int];
    WHEN 'maintenance' THEN
      RETURN (ARRAY['AC Not Working', 'Light Bulb', 'Leaky Faucet', 'WiFi Issue', 'TV Problem'])[1 + floor(random() * 5)::int];
    WHEN 'room_service' THEN
      RETURN (ARRAY['Club Sandwich', 'Caesar Salad', 'Grilled Salmon', 'Pasta', 'Steak'])[1 + floor(random() * 5)::int];
    WHEN 'concierge' THEN
      RETURN (ARRAY['Restaurant Reservation', 'Airport Transfer', 'Tour Booking', 'Ticket Booking'])[1 + floor(random() * 4)::int];
    WHEN 'spa' THEN
      RETURN (ARRAY['Full Body Massage', 'Facial', 'Manicure', 'Pedicure'])[1 + floor(random() * 4)::int];
    WHEN 'valet' THEN
      RETURN (ARRAY['Car Pickup', 'Car Wash', 'Parking'])[1 + floor(random() * 3)::int];
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
    'Noura Hamdan'
  ];
  v_request RECORD;
  v_user_id UUID;
  v_staff_id UUID;
  v_order_id UUID;
  v_subtotal NUMERIC;
  v_tax NUMERIC;
  v_tip NUMERIC;
  v_room_numbers TEXT[] := ARRAY['101', '102', '103', '201'];
  -- Realistic distribution: housekeeping 40%, room_service 25%, maintenance 15%, concierge 10%, spa 5%, valet 5%
  v_category_weights INT[] := ARRAY[40, 25, 15, 10, 5, 5]; -- cumulative: 40, 65, 80, 90, 95, 100
  v_categories TEXT[] := ARRAY['housekeeping', 'room_service', 'maintenance', 'concierge', 'spa', 'valet'];
  -- Peak hours in UTC - adjust for typical hotel timezone (assuming UTC-5 for demo)
  -- Breakfast 7-9 UTC = 8-10 local, Lunch 17-19 UTC = 12-14 local, Dinner 0-2 UTC = 19-21 local, Evening 3-5 UTC = 22-24 local
  v_peak_hours_sets INT[][] := ARRAY[
    ARRAY[7, 8, 9],      -- Breakfast
    ARRAY[17, 18, 19],   -- Lunch
    ARRAY[0, 1, 2],      -- Dinner
    ARRAY[3, 4, 5]       -- Evening
  ];
  v_peak_idx INT;
  v_cat_roll INT;
  v_cat TEXT;
  v_item TEXT;
  v_hour INTEGER;
  v_day_offset INTEGER;
  v_request_id UUID;
  v_base_time TIMESTAMPTZ;
  v_resolution_mins INT;
  i INTEGER;
BEGIN
  -- ============================================
  -- 1. GET AND UPDATE PROFILE NAMES
  -- ============================================

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_profile_ids
  FROM public.profiles
  LIMIT 4;

  IF v_profile_ids IS NULL OR array_length(v_profile_ids, 1) IS NULL THEN
    RAISE NOTICE 'No profiles found - skipping';
    RETURN;
  END IF;

  -- Update all profiles with proper names
  FOR i IN 1..LEAST(array_length(v_profile_ids, 1), array_length(v_staff_names, 1)) LOOP
    UPDATE public.profiles
    SET full_name = v_staff_names[i]
    WHERE id = v_profile_ids[i];
    RAISE NOTICE 'Updated profile % with name %', v_profile_ids[i], v_staff_names[i];
  END LOOP;

  -- ============================================
  -- 2. CLEAR ALL OLD DATA
  -- ============================================

  DELETE FROM public.request_events WHERE request_id IN (SELECT id FROM public.requests WHERE hotel_id = v_hotel_id);
  DELETE FROM public.ratings WHERE hotel_id = v_hotel_id;
  DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE hotel_id = v_hotel_id);
  DELETE FROM public.orders WHERE hotel_id = v_hotel_id;
  DELETE FROM public.requests WHERE hotel_id = v_hotel_id;

  RAISE NOTICE 'Cleared old data';

  -- ============================================
  -- 3. CREATE 60 DAYS OF REQUESTS (for comparison data)
  -- ============================================

  FOR v_day_offset IN 0..59 LOOP
    -- Create 4-10 requests per day (more on weekends represented by day%7 < 2)
    FOR i IN 1..(4 + floor(random() * 6)::int + CASE WHEN v_day_offset % 7 < 2 THEN 3 ELSE 0 END) LOOP
      v_request_id := gen_random_uuid();

      -- Weighted category selection
      v_cat_roll := floor(random() * 100)::int;
      IF v_cat_roll < 40 THEN v_cat := 'housekeeping';
      ELSIF v_cat_roll < 65 THEN v_cat := 'room_service';
      ELSIF v_cat_roll < 80 THEN v_cat := 'maintenance';
      ELSIF v_cat_roll < 90 THEN v_cat := 'concierge';
      ELSIF v_cat_roll < 95 THEN v_cat := 'spa';
      ELSE v_cat := 'valet';
      END IF;

      v_item := get_demo_item(v_cat);

      -- Select peak hour set with distribution: Breakfast 30%, Lunch 35%, Dinner 25%, Evening 10%
      v_cat_roll := floor(random() * 100)::int;
      IF v_cat_roll < 30 THEN v_peak_idx := 1;      -- Breakfast
      ELSIF v_cat_roll < 65 THEN v_peak_idx := 2;   -- Lunch
      ELSIF v_cat_roll < 90 THEN v_peak_idx := 3;   -- Dinner
      ELSE v_peak_idx := 4;                          -- Evening
      END IF;

      v_hour := v_peak_hours_sets[v_peak_idx][1 + floor(random() * 3)::int];
      v_user_id := v_profile_ids[1 + floor(random() * array_length(v_profile_ids, 1))::int];
      v_staff_id := v_profile_ids[1 + floor(random() * array_length(v_profile_ids, 1))::int];

      -- Calculate base time properly
      v_base_time := (now() AT TIME ZONE 'UTC') - (v_day_offset || ' days')::interval;
      v_base_time := date_trunc('day', v_base_time) + (v_hour || ' hours')::interval + ((floor(random() * 50))::int || ' minutes')::interval;

      -- Resolution time: 5-35 min (weighted towards 10-20)
      v_resolution_mins := 5 + floor(random() * 10)::int + floor(random() * 20)::int;

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
          WHEN v_day_offset = 0 AND random() > 0.7 THEN (ARRAY['new', 'pending', 'in_progress'])[1 + floor(random() * 3)::int]
          ELSE 'completed'
        END::request_status,
        (ARRAY['low', 'medium', 'high'])[1 + floor(random() * 3)::int]::request_priority,
        v_resolution_mins,
        v_staff_id,
        v_base_time,
        CASE WHEN v_day_offset > 0 OR random() > 0.3 THEN v_base_time + (v_resolution_mins || ' minutes')::interval ELSE NULL END
      );

      -- Add request events for completed requests (timestamps AFTER request creation)
      IF v_day_offset > 0 OR random() > 0.3 THEN
        INSERT INTO public.request_events (request_id, status, notes, created_at)
        VALUES (v_request_id, 'new', 'Request submitted', v_base_time);

        INSERT INTO public.request_events (request_id, status, notes, created_at, created_by)
        VALUES (v_request_id, 'pending', 'Accepted by staff',
          v_base_time + ((2 + floor(random() * 3))::int || ' minutes')::interval,
          v_staff_id);

        INSERT INTO public.request_events (request_id, status, notes, created_at, created_by)
        VALUES (v_request_id, 'in_progress', 'Work started',
          v_base_time + ((5 + floor(random() * 5))::int || ' minutes')::interval,
          v_staff_id);

        INSERT INTO public.request_events (request_id, status, notes, created_at, created_by)
        VALUES (v_request_id, 'completed', 'Request fulfilled',
          v_base_time + (v_resolution_mins || ' minutes')::interval,
          v_staff_id);
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created 60 days of requests';

  -- ============================================
  -- 4. CREATE 60 DAYS OF ORDERS
  -- ============================================

  FOR v_day_offset IN 0..59 LOOP
    FOR i IN 1..(3 + floor(random() * 4)::int) LOOP
      v_order_id := gen_random_uuid();
      v_subtotal := (35 + floor(random() * 115))::numeric;
      v_tax := round((v_subtotal * 0.08)::numeric, 2);
      v_tip := CASE WHEN random() > 0.15 THEN round((v_subtotal * (0.18 + random() * 0.07))::numeric, 2) ELSE 0 END;
      v_user_id := v_profile_ids[1 + floor(random() * array_length(v_profile_ids, 1))::int];

      -- Select meal hour
      v_cat_roll := floor(random() * 100)::int;
      IF v_cat_roll < 25 THEN v_hour := 8 + floor(random() * 2)::int;      -- Breakfast
      ELSIF v_cat_roll < 60 THEN v_hour := 12 + floor(random() * 2)::int;  -- Lunch
      ELSE v_hour := 19 + floor(random() * 3)::int;                         -- Dinner
      END IF;

      v_base_time := (now() AT TIME ZONE 'UTC') - (v_day_offset || ' days')::interval;
      v_base_time := date_trunc('day', v_base_time) + (v_hour || ' hours')::interval + ((floor(random() * 50))::int || ' minutes')::interval;

      INSERT INTO public.orders (
        id, hotel_id, user_id, room_number,
        status, subtotal, tax, tip, total, created_at
      ) VALUES (
        v_order_id,
        v_hotel_id,
        v_user_id,
        v_room_numbers[1 + floor(random() * array_length(v_room_numbers, 1))::int],
        CASE WHEN v_day_offset = 0 AND random() > 0.8 THEN 'pending' ELSE 'completed' END,
        v_subtotal,
        v_tax,
        v_tip,
        v_subtotal + v_tax + v_tip,
        v_base_time
      );

      INSERT INTO public.order_items (order_id, menu_item_id, name, quantity, unit_price, total_price)
      VALUES (
        v_order_id,
        NULL,
        (ARRAY['Club Sandwich', 'Caesar Salad', 'Grilled Salmon', 'Pasta Carbonara', 'Fresh Juice', 'Steak Frites', 'Lobster Bisque', 'Eggs Benedict', 'Wagyu Burger'])[1 + floor(random() * 9)::int],
        1 + floor(random() * 2)::int,
        (18 + floor(random() * 45))::numeric,
        v_subtotal
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created 60 days of orders';

  -- ============================================
  -- 5. ADD RATINGS (spread across 60 days)
  -- ============================================

  FOR v_request IN
    SELECT id, user_id FROM public.requests
    WHERE hotel_id = v_hotel_id AND status = 'completed'
    ORDER BY random()
    LIMIT 80
  LOOP
    INSERT INTO public.ratings (
      hotel_id, request_id, user_id, rating, comment, created_at
    ) VALUES (
      v_hotel_id,
      v_request.id,
      v_request.user_id,
      -- Weighted ratings: 60% 5-star, 30% 4-star, 10% 3-star
      CASE
        WHEN random() < 0.6 THEN 5
        WHEN random() < 0.9 THEN 4
        ELSE 3
      END,
      CASE floor(random() * 6)::int
        WHEN 0 THEN 'Excellent service!'
        WHEN 1 THEN 'Very prompt and professional'
        WHEN 2 THEN 'Great experience'
        WHEN 3 THEN 'Quick response, thank you!'
        WHEN 4 THEN 'Staff was very helpful'
        ELSE 'Good service'
      END,
      now() - ((floor(random() * 60))::int || ' days')::interval
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Added ratings for satisfaction metrics';
  RAISE NOTICE 'Comprehensive analytics data creation completed!';

END $$;

DROP FUNCTION IF EXISTS get_demo_item(TEXT);
