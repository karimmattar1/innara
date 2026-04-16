-- ================================================
-- FIX DEMO STATS
-- 1. Add orders for TODAY (for revenue metrics)
-- 2. Add request_events for completed requests (for resolution time)
-- ================================================

DO $$
DECLARE
  v_hotel_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_user_id UUID;
  v_order_id UUID;
  v_menu_item_id UUID;
  v_request RECORD;
  v_subtotal NUMERIC;
  v_tax NUMERIC;
  v_tip NUMERIC;
  v_room_numbers TEXT[] := ARRAY['101', '102', '103', '201', '202', '203', '301', '302', '303', '401', '402', '501'];
  i INTEGER;
BEGIN
  -- Get existing user
  SELECT id INTO v_user_id FROM public.profiles LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No existing user found - skipping';
    RETURN;
  END IF;

  -- Get a menu item for orders
  SELECT id INTO v_menu_item_id FROM public.menu_items WHERE hotel_id = v_hotel_id LIMIT 1;

  -- ============================================
  -- 1. ADD ORDERS FOR TODAY (5-8 orders)
  -- ============================================

  FOR i IN 1..7 LOOP
    v_order_id := gen_random_uuid();
    v_subtotal := (30 + floor(random() * 100))::numeric;
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
      CASE WHEN i <= 2 THEN 'pending' ELSE 'completed' END,
      v_subtotal,
      v_tax,
      v_tip,
      v_subtotal + v_tax + v_tip,
      now() - ((floor(random() * 12))::int || ' hours')::interval -- Spread across today
    );

    -- Add order item
    IF v_menu_item_id IS NOT NULL THEN
      INSERT INTO public.order_items (order_id, menu_item_id, name, quantity, unit_price, total_price)
      VALUES (
        v_order_id,
        v_menu_item_id,
        (ARRAY['Club Sandwich', 'Caesar Salad', 'Grilled Salmon', 'Pasta Carbonara', 'Fresh Juice', 'Steak Frites'])[1 + floor(random() * 6)::int],
        1 + floor(random() * 2)::int,
        (15 + floor(random() * 30))::numeric,
        v_subtotal
      );
    END IF;
  END LOOP;

  RAISE NOTICE 'Created 7 orders for today';

  -- ============================================
  -- 2. ADD REQUEST_EVENTS FOR COMPLETED REQUESTS
  -- This enables resolution time calculation
  -- ============================================

  -- Clear existing events for this hotel's requests to avoid duplicates
  DELETE FROM public.request_events
  WHERE request_id IN (SELECT id FROM public.requests WHERE hotel_id = v_hotel_id);

  -- Add events for all completed requests
  FOR v_request IN
    SELECT id, created_at, completed_at, status
    FROM public.requests
    WHERE hotel_id = v_hotel_id AND status = 'completed' AND completed_at IS NOT NULL
  LOOP
    -- Add 'new' event at creation time
    INSERT INTO public.request_events (request_id, status, notes, created_at)
    VALUES (v_request.id, 'new', 'Request submitted', v_request.created_at);

    -- Add 'pending' event (accepted) - 2-5 min after creation
    INSERT INTO public.request_events (request_id, status, notes, created_at)
    VALUES (
      v_request.id,
      'pending',
      'Request accepted by staff',
      v_request.created_at + ((2 + floor(random() * 3))::int || ' minutes')::interval
    );

    -- Add 'in_progress' event - 5-10 min after creation
    INSERT INTO public.request_events (request_id, status, notes, created_at)
    VALUES (
      v_request.id,
      'in_progress',
      'Work started',
      v_request.created_at + ((5 + floor(random() * 5))::int || ' minutes')::interval
    );

    -- Add 'completed' event at completion time
    INSERT INTO public.request_events (request_id, status, notes, created_at)
    VALUES (v_request.id, 'completed', 'Request completed', v_request.completed_at);
  END LOOP;

  RAISE NOTICE 'Created request_events for all completed requests';

  -- ============================================
  -- 3. ADD A FEW MORE ACTIVE REQUESTS FOR TODAY
  -- ============================================

  FOR i IN 1..3 LOOP
    INSERT INTO public.requests (
      id, hotel_id, user_id, category, item, description,
      room_number, status, priority, eta_minutes, created_at
    ) VALUES (
      gen_random_uuid(),
      v_hotel_id,
      v_user_id,
      (ARRAY['housekeeping', 'room_service', 'maintenance'])[i]::request_category,
      (ARRAY['Room Cleaning', 'Club Sandwich', 'AC Not Working'])[i],
      NULL,
      v_room_numbers[1 + floor(random() * array_length(v_room_numbers, 1))::int],
      (ARRAY['new', 'pending', 'in_progress'])[i]::request_status,
      'medium'::request_priority,
      15 + floor(random() * 30)::int,
      now() - ((floor(random() * 3))::int || ' hours')::interval
    );
  END LOOP;

  RAISE NOTICE 'Created 3 active requests for today';
  RAISE NOTICE 'Demo stats fix completed!';

END $$;
