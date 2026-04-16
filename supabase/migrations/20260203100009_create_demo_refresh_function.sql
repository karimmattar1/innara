-- ================================================
-- CREATE DEMO DATA REFRESH FUNCTION
-- Can be called manually or via pg_cron for daily refresh
-- ================================================

-- Helper function for random items
CREATE OR REPLACE FUNCTION get_demo_item_v2(cat TEXT) RETURNS TEXT AS $$
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

-- Main refresh function
CREATE OR REPLACE FUNCTION refresh_demo_data() RETURNS void AS $$
DECLARE
  v_hotel_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_profile_ids UUID[];
  v_staff_names TEXT[] := ARRAY['Ahmed El-Masri', 'Sara Al-Rashid', 'Mohammed Khalil', 'Noura Hamdan'];
  v_request RECORD;
  v_user_id UUID;
  v_staff_id UUID;
  v_order_id UUID;
  v_subtotal NUMERIC;
  v_tax NUMERIC;
  v_tip NUMERIC;
  v_room_numbers TEXT[] := ARRAY['101', '102', '103', '201'];
  v_categories TEXT[] := ARRAY['housekeeping', 'room_service', 'maintenance', 'concierge', 'spa', 'valet'];
  v_peak_hours_sets INT[][] := ARRAY[ARRAY[7,8,9], ARRAY[17,18,19], ARRAY[0,1,2], ARRAY[3,4,5]];
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
  -- Get profiles
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_profile_ids FROM public.profiles LIMIT 4;
  IF v_profile_ids IS NULL THEN RETURN; END IF;

  -- Update profile names
  FOR i IN 1..LEAST(array_length(v_profile_ids, 1), 4) LOOP
    UPDATE public.profiles SET full_name = v_staff_names[i] WHERE id = v_profile_ids[i];
  END LOOP;

  -- Clear old demo data
  DELETE FROM public.request_events WHERE request_id IN (SELECT id FROM public.requests WHERE hotel_id = v_hotel_id);
  DELETE FROM public.ratings WHERE hotel_id = v_hotel_id;
  DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE hotel_id = v_hotel_id);
  DELETE FROM public.orders WHERE hotel_id = v_hotel_id;
  DELETE FROM public.requests WHERE hotel_id = v_hotel_id;

  -- Create 60 days of requests
  FOR v_day_offset IN 0..59 LOOP
    FOR i IN 1..(4 + floor(random() * 6)::int + CASE WHEN v_day_offset % 7 < 2 THEN 3 ELSE 0 END) LOOP
      v_request_id := gen_random_uuid();

      -- Weighted category
      v_cat_roll := floor(random() * 100)::int;
      IF v_cat_roll < 40 THEN v_cat := 'housekeeping';
      ELSIF v_cat_roll < 65 THEN v_cat := 'room_service';
      ELSIF v_cat_roll < 80 THEN v_cat := 'maintenance';
      ELSIF v_cat_roll < 90 THEN v_cat := 'concierge';
      ELSIF v_cat_roll < 95 THEN v_cat := 'spa';
      ELSE v_cat := 'valet';
      END IF;

      v_item := get_demo_item_v2(v_cat);

      -- Peak hour selection
      v_cat_roll := floor(random() * 100)::int;
      IF v_cat_roll < 30 THEN v_peak_idx := 1;
      ELSIF v_cat_roll < 65 THEN v_peak_idx := 2;
      ELSIF v_cat_roll < 90 THEN v_peak_idx := 3;
      ELSE v_peak_idx := 4;
      END IF;

      v_hour := v_peak_hours_sets[v_peak_idx][1 + floor(random() * 3)::int];
      v_user_id := v_profile_ids[1 + floor(random() * array_length(v_profile_ids, 1))::int];
      v_staff_id := v_profile_ids[1 + floor(random() * array_length(v_profile_ids, 1))::int];

      v_base_time := (now() AT TIME ZONE 'UTC') - (v_day_offset || ' days')::interval;
      v_base_time := date_trunc('day', v_base_time) + (v_hour || ' hours')::interval + ((floor(random() * 50))::int || ' minutes')::interval;
      v_resolution_mins := 5 + floor(random() * 10)::int + floor(random() * 20)::int;

      INSERT INTO public.requests (id, hotel_id, user_id, category, item, room_number, status, priority, eta_minutes, assigned_staff_id, created_at, completed_at)
      VALUES (
        v_request_id, v_hotel_id, v_user_id, v_cat::request_category, v_item,
        v_room_numbers[1 + floor(random() * 4)::int],
        CASE WHEN v_day_offset = 0 AND random() > 0.7 THEN (ARRAY['new', 'pending', 'in_progress'])[1 + floor(random() * 3)::int] ELSE 'completed' END::request_status,
        (ARRAY['low', 'medium', 'high'])[1 + floor(random() * 3)::int]::request_priority,
        v_resolution_mins, v_staff_id, v_base_time,
        CASE WHEN v_day_offset > 0 OR random() > 0.3 THEN v_base_time + (v_resolution_mins || ' minutes')::interval ELSE NULL END
      );

      IF v_day_offset > 0 OR random() > 0.3 THEN
        INSERT INTO public.request_events (request_id, status, notes, created_at) VALUES (v_request_id, 'new', 'Request submitted', v_base_time);
        INSERT INTO public.request_events (request_id, status, notes, created_at, created_by) VALUES (v_request_id, 'pending', 'Accepted', v_base_time + ((2 + floor(random() * 3))::int || ' minutes')::interval, v_staff_id);
        INSERT INTO public.request_events (request_id, status, notes, created_at, created_by) VALUES (v_request_id, 'in_progress', 'Started', v_base_time + ((5 + floor(random() * 5))::int || ' minutes')::interval, v_staff_id);
        INSERT INTO public.request_events (request_id, status, notes, created_at, created_by) VALUES (v_request_id, 'completed', 'Fulfilled', v_base_time + (v_resolution_mins || ' minutes')::interval, v_staff_id);
      END IF;
    END LOOP;
  END LOOP;

  -- Create 60 days of orders
  FOR v_day_offset IN 0..59 LOOP
    FOR i IN 1..(3 + floor(random() * 4)::int) LOOP
      v_order_id := gen_random_uuid();
      v_subtotal := (35 + floor(random() * 115))::numeric;
      v_tax := round((v_subtotal * 0.08)::numeric, 2);
      v_tip := CASE WHEN random() > 0.15 THEN round((v_subtotal * (0.18 + random() * 0.07))::numeric, 2) ELSE 0 END;
      v_user_id := v_profile_ids[1 + floor(random() * array_length(v_profile_ids, 1))::int];

      v_cat_roll := floor(random() * 100)::int;
      IF v_cat_roll < 25 THEN v_hour := 8 + floor(random() * 2)::int;
      ELSIF v_cat_roll < 60 THEN v_hour := 12 + floor(random() * 2)::int;
      ELSE v_hour := 19 + floor(random() * 3)::int;
      END IF;

      v_base_time := (now() AT TIME ZONE 'UTC') - (v_day_offset || ' days')::interval;
      v_base_time := date_trunc('day', v_base_time) + (v_hour || ' hours')::interval + ((floor(random() * 50))::int || ' minutes')::interval;

      INSERT INTO public.orders (id, hotel_id, user_id, room_number, status, subtotal, tax, tip, total, created_at)
      VALUES (v_order_id, v_hotel_id, v_user_id, v_room_numbers[1 + floor(random() * 4)::int],
        CASE WHEN v_day_offset = 0 AND random() > 0.8 THEN 'pending' ELSE 'completed' END,
        v_subtotal, v_tax, v_tip, v_subtotal + v_tax + v_tip, v_base_time);

      INSERT INTO public.order_items (order_id, menu_item_id, name, quantity, unit_price, total_price)
      VALUES (v_order_id, NULL,
        (ARRAY['Club Sandwich', 'Caesar Salad', 'Grilled Salmon', 'Pasta', 'Steak', 'Lobster', 'Burger'])[1 + floor(random() * 7)::int],
        1 + floor(random() * 2)::int, (18 + floor(random() * 45))::numeric, v_subtotal);
    END LOOP;
  END LOOP;

  -- Add ratings
  FOR v_request IN SELECT id, user_id FROM public.requests WHERE hotel_id = v_hotel_id AND status = 'completed' ORDER BY random() LIMIT 80 LOOP
    INSERT INTO public.ratings (hotel_id, request_id, user_id, rating, comment, created_at)
    VALUES (v_hotel_id, v_request.id, v_request.user_id,
      CASE WHEN random() < 0.6 THEN 5 WHEN random() < 0.9 THEN 4 ELSE 3 END,
      (ARRAY['Excellent!', 'Great service', 'Very helpful', 'Quick response', 'Thank you!'])[1 + floor(random() * 5)::int],
      now() - ((floor(random() * 60))::int || ' days')::interval)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Demo data refreshed at %', now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule daily refresh at 3 AM UTC (requires pg_cron extension)
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('refresh-demo-data', '0 3 * * *', 'SELECT refresh_demo_data()');

COMMENT ON FUNCTION refresh_demo_data() IS 'Refreshes demo data with 60 days of requests, orders, and ratings. Call manually or schedule with pg_cron.';
