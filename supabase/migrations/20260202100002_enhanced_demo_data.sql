-- ================================================
-- ENHANCED DEMO DATA (v3)
-- Uses existing users only - matches actual schema
-- Proper time distribution for analytics
-- ================================================

DO $$
DECLARE
  v_hotel_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_user_id UUID;
  v_order_id UUID;
  v_menu_item_id UUID;
  i INTEGER;
  v_category TEXT;
  v_item TEXT;
  v_hour INTEGER;
  v_day_offset INTEGER;
  v_status TEXT;
  v_priority TEXT;
  v_created_at TIMESTAMP;
  v_completed_at TIMESTAMP;
  v_resolution_minutes INTEGER;
  v_categories TEXT[] := ARRAY['housekeeping', 'room_service', 'maintenance', 'concierge', 'valet', 'spa'];
  v_items_map JSONB := '{
    "housekeeping": ["Room Cleaning", "Extra Towels", "Fresh Linens", "Toiletries", "Turn Down Service", "Mini Bar Restock"],
    "room_service": ["Club Sandwich", "Caesar Salad", "Grilled Salmon", "Pasta Carbonara", "Fresh Juice", "Coffee Service"],
    "maintenance": ["AC Not Working", "Leaky Faucet", "Light Bulb Replacement", "TV Remote Issue", "WiFi Problems", "Safe Not Opening"],
    "concierge": ["Restaurant Reservation", "Airport Transfer", "Theater Tickets", "City Tour", "Flower Delivery", "Luggage Assistance"],
    "valet": ["Car Pickup", "Car Delivery", "Car Wash", "Extended Parking", "EV Charging", "Jump Start"],
    "spa": ["Swedish Massage", "Deep Tissue Massage", "Facial Treatment", "Manicure", "Pedicure", "Aromatherapy"]
  }'::JSONB;
  v_items TEXT[];
  v_room_numbers TEXT[] := ARRAY['101', '102', '103', '201', '202', '203', '301', '302', '303', '401', '402', '501'];
  v_subtotal NUMERIC;
  v_tax NUMERIC;
  v_tip NUMERIC;
BEGIN

  -- Get existing user
  SELECT id INTO v_user_id FROM public.profiles LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No existing user found - skipping demo data';
    RETURN;
  END IF;

  RAISE NOTICE 'Using existing user: %', v_user_id;

  -- ============================================
  -- CLEAR EXISTING DATA FOR FRESH START
  -- ============================================
  DELETE FROM public.request_events WHERE request_id IN (SELECT id FROM public.requests WHERE hotel_id = v_hotel_id);
  DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE hotel_id = v_hotel_id);
  DELETE FROM public.orders WHERE hotel_id = v_hotel_id;
  DELETE FROM public.requests WHERE hotel_id = v_hotel_id;
  DELETE FROM public.ratings WHERE hotel_id = v_hotel_id;
  DELETE FROM public.stays WHERE hotel_id = v_hotel_id;

  -- ============================================
  -- CREATE 220+ REQUESTS OVER 45 DAYS
  -- With proper time distribution
  -- ============================================

  FOR v_day_offset IN 0..45 LOOP
    -- Create 3-7 requests per day
    FOR i IN 1..(3 + floor(random() * 5)::int) LOOP

      -- Pick a category with weighted distribution
      v_category := v_categories[1 + floor(random() * array_length(v_categories, 1))::int];

      -- Get items for this category
      v_items := ARRAY(SELECT jsonb_array_elements_text(v_items_map -> v_category));
      v_item := v_items[1 + floor(random() * array_length(v_items, 1))::int];

      -- Determine status based on age
      IF v_day_offset = 0 THEN
        -- Today: mix of new, pending, in_progress
        v_status := (ARRAY['new', 'pending', 'in_progress', 'pending'])[1 + floor(random() * 4)::int];
        v_completed_at := NULL;
        v_resolution_minutes := NULL;
      ELSIF v_day_offset <= 2 THEN
        -- Last 2 days: mostly in_progress or completed
        v_status := (ARRAY['in_progress', 'completed', 'completed', 'completed'])[1 + floor(random() * 4)::int];
        IF v_status = 'completed' THEN
          v_resolution_minutes := 5 + floor(random() * 25)::int;
        END IF;
      ELSE
        -- Older: all completed
        v_status := 'completed';
        v_resolution_minutes := 5 + floor(random() * 25)::int;
      END IF;

      -- Priority distribution
      v_priority := (ARRAY['low', 'medium', 'medium', 'medium', 'high'])[1 + floor(random() * 5)::int];

      -- Create timestamp with peak hours bias (7-10am, 12-2pm, 6-9pm)
      v_hour := CASE
        WHEN random() < 0.3 THEN 7 + floor(random() * 3)::int   -- Morning peak
        WHEN random() < 0.5 THEN 12 + floor(random() * 2)::int  -- Lunch peak
        WHEN random() < 0.7 THEN 18 + floor(random() * 3)::int  -- Dinner peak
        ELSE floor(random() * 24)::int                           -- Any hour
      END;

      v_created_at := (now() - (v_day_offset || ' days')::interval)::date + (v_hour || ' hours')::interval + (floor(random() * 60) || ' minutes')::interval;

      IF v_status = 'completed' THEN
        v_completed_at := v_created_at + (v_resolution_minutes || ' minutes')::interval;
      ELSE
        v_completed_at := NULL;
      END IF;

      -- Insert request (no guest_name column - using user_id reference)
      INSERT INTO public.requests (
        id, hotel_id, user_id, category, item, description,
        room_number, status, priority,
        eta_minutes, created_at, completed_at
      ) VALUES (
        gen_random_uuid(),
        v_hotel_id,
        v_user_id,
        v_category::request_category,
        v_item,
        CASE WHEN random() > 0.7 THEN 'Please deliver to room' ELSE NULL END,
        v_room_numbers[1 + floor(random() * array_length(v_room_numbers, 1))::int],
        v_status::request_status,
        v_priority::request_priority,
        15 + floor(random() * 45)::int,
        v_created_at,
        v_completed_at
      );

    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created requests';

  -- ============================================
  -- CREATE 80+ ORDERS WITH REVENUE
  -- Schema: subtotal, tax, tip, total (no guest_name)
  -- ============================================

  -- Get a menu item for orders
  SELECT id INTO v_menu_item_id FROM public.menu_items WHERE hotel_id = v_hotel_id LIMIT 1;

  FOR v_day_offset IN 0..30 LOOP
    -- 2-4 orders per day
    FOR i IN 1..(2 + floor(random() * 3)::int) LOOP

      v_created_at := (now() - (v_day_offset || ' days')::interval)::date + (floor(random() * 24) || ' hours')::interval;

      v_order_id := gen_random_uuid();

      -- Calculate realistic financials
      v_subtotal := (25 + floor(random() * 120))::numeric;
      v_tax := round((v_subtotal * 0.08)::numeric, 2);
      v_tip := CASE WHEN random() > 0.3 THEN round((v_subtotal * (0.15 + random() * 0.10))::numeric, 2) ELSE 0 END;

      INSERT INTO public.orders (
        id, hotel_id, user_id, room_number,
        status, subtotal, tax, tip, total, created_at
      ) VALUES (
        v_order_id,
        v_hotel_id,
        v_user_id,
        v_room_numbers[1 + floor(random() * array_length(v_room_numbers, 1))::int],
        CASE WHEN v_day_offset = 0 THEN 'pending' ELSE 'completed' END,
        v_subtotal,
        v_tax,
        v_tip,
        v_subtotal + v_tax + v_tip,
        v_created_at
      );

      -- Add order item (requires name and total_price)
      IF v_menu_item_id IS NOT NULL THEN
        INSERT INTO public.order_items (order_id, menu_item_id, name, quantity, unit_price, total_price)
        VALUES (
          v_order_id,
          v_menu_item_id,
          (ARRAY['Club Sandwich', 'Caesar Salad', 'Grilled Salmon', 'Pasta Carbonara', 'Fresh Juice', 'Steak Frites'])[1 + floor(random() * 6)::int],
          1 + floor(random() * 2)::int,
          (15 + floor(random() * 30))::numeric,
          (20 + floor(random() * 50))::numeric
        );
      END IF;

    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created orders';

  -- ============================================
  -- CREATE 50+ RATINGS
  -- Schema: rating, comment (not feedback/category)
  -- ============================================

  FOR i IN 1..55 LOOP
    v_day_offset := floor(random() * 30)::int;

    INSERT INTO public.ratings (
      hotel_id, user_id, rating, comment, created_at
    ) VALUES (
      v_hotel_id,
      v_user_id,
      3 + floor(random() * 3)::int, -- 3-5 stars
      CASE
        WHEN random() > 0.7 THEN 'Excellent service, very prompt!'
        WHEN random() > 0.5 THEN 'Good experience overall'
        WHEN random() > 0.3 THEN 'Staff was very helpful'
        ELSE NULL
      END,
      now() - (v_day_offset || ' days')::interval
    );
  END LOOP;

  RAISE NOTICE 'Created ratings';

  -- ============================================
  -- CREATE ACTIVE STAYS FOR ALL USERS
  -- Each user gets ONE stay with a unique room
  -- ============================================

  i := 1;
  FOR v_user_id IN SELECT id FROM public.profiles LOOP
    -- Only assign rooms up to available count
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
      i := i + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Created stays for % users', i - 1;

  RAISE NOTICE 'Enhanced demo data created successfully!';
  RAISE NOTICE 'Created: 220+ requests, 80+ orders, 55 ratings, 12 active stays';

END $$;
