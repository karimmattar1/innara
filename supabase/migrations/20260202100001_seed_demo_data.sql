-- ================================================
-- COMPREHENSIVE DEMO DATA SEED
-- Populates realistic data for analytics & testing
-- ================================================

-- Use the default hotel ID
DO $$
DECLARE
  v_hotel_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_guest_id UUID;
  v_staff_id UUID;
  v_request_id UUID;
  v_order_id UUID;
  i INTEGER;
BEGIN

  -- Get a guest user ID (or use first profile if exists)
  SELECT id INTO v_guest_id FROM public.profiles LIMIT 1;

  -- Get a staff user ID
  SELECT ur.user_id INTO v_staff_id
  FROM public.user_roles ur
  WHERE ur.role IN ('staff', 'manager')
  LIMIT 1;

  -- If no users exist, we'll create placeholder IDs
  IF v_guest_id IS NULL THEN
    v_guest_id := gen_random_uuid();
  END IF;

  IF v_staff_id IS NULL THEN
    v_staff_id := v_guest_id;
  END IF;

  -- ============================================
  -- SEED SERVICE OPTIONS (from guestServiceConfigs)
  -- ============================================

  -- Clear existing service options for this hotel
  DELETE FROM public.service_options WHERE hotel_id = v_hotel_id;
  DELETE FROM public.service_time_options WHERE hotel_id = v_hotel_id;

  -- HOUSEKEEPING OPTIONS
  INSERT INTO public.service_options (hotel_id, service_type, name, description, icon_name, sort_order) VALUES
    (v_hotel_id, 'housekeeping', 'Room Cleaning', 'Full room cleaning service', 'Sparkles', 1),
    (v_hotel_id, 'housekeeping', 'Extra Towels', 'Fresh towels delivered to your room', 'Droplets', 2),
    (v_hotel_id, 'housekeeping', 'Extra Pillows', 'Additional pillows for comfort', 'Bed', 3),
    (v_hotel_id, 'housekeeping', 'Toiletries', 'Shampoo, soap, and essentials', 'Package', 4),
    (v_hotel_id, 'housekeeping', 'Turn Down Service', 'Evening bed preparation', 'Moon', 5),
    (v_hotel_id, 'housekeeping', 'Fresh Linens', 'Clean sheets and bedding', 'Bed', 6);

  -- VALET OPTIONS
  INSERT INTO public.service_options (hotel_id, service_type, name, description, sort_order) VALUES
    (v_hotel_id, 'valet', 'Request Vehicle', 'Bring the car to the entrance', 1),
    (v_hotel_id, 'valet', 'Schedule Pickup', 'Have the car ready at a time', 2),
    (v_hotel_id, 'valet', 'Luggage Assistance', 'Help with bags and loading', 3);

  -- SPA OPTIONS
  INSERT INTO public.service_options (hotel_id, service_type, name, description, price, sort_order) VALUES
    (v_hotel_id, 'spa', 'Relaxing Massage', '60-minute signature massage', 150.00, 1),
    (v_hotel_id, 'spa', 'Facial Treatment', 'Hydrating skin refresh', 120.00, 2),
    (v_hotel_id, 'spa', 'Sauna Session', 'Private wellness session', 50.00, 3),
    (v_hotel_id, 'spa', 'Manicure & Pedicure', 'Complete hand and foot care', 80.00, 4);

  -- LAUNDRY OPTIONS
  INSERT INTO public.service_options (hotel_id, service_type, name, description, price, sort_order) VALUES
    (v_hotel_id, 'laundry', 'Standard Laundry', 'Same-day turnaround', 25.00, 1),
    (v_hotel_id, 'laundry', 'Express Laundry', '2-hour turnaround', 45.00, 2),
    (v_hotel_id, 'laundry', 'Dry Cleaning', 'Delicate garment care', 35.00, 3),
    (v_hotel_id, 'laundry', 'Pressing Only', 'Steam and press service', 15.00, 4);

  -- FITNESS OPTIONS
  INSERT INTO public.service_options (hotel_id, service_type, name, description, sort_order) VALUES
    (v_hotel_id, 'fitness', 'Gym Access', 'Reserve a time slot', 1),
    (v_hotel_id, 'fitness', 'Personal Trainer', 'Book a trainer session', 2),
    (v_hotel_id, 'fitness', 'Equipment Request', 'Weights, mat, or accessories', 3),
    (v_hotel_id, 'fitness', 'Towel Refresh', 'Fresh towels delivered', 4);

  -- SHOPPING OPTIONS
  INSERT INTO public.service_options (hotel_id, service_type, name, description, sort_order) VALUES
    (v_hotel_id, 'shopping', 'In-room Essentials', 'Snacks, toiletries, and basics', 1),
    (v_hotel_id, 'shopping', 'Local Boutique Delivery', 'Curated local items', 2),
    (v_hotel_id, 'shopping', 'Pharmacy Items', 'Convenience pharmacy pickup', 3),
    (v_hotel_id, 'shopping', 'Souvenirs', 'Gifts and keepsakes', 4);

  -- LOCAL EXPERIENCES OPTIONS
  INSERT INTO public.service_options (hotel_id, service_type, name, description, sort_order) VALUES
    (v_hotel_id, 'local', 'Restaurant Reservation', 'Top local dining spots', 1),
    (v_hotel_id, 'local', 'City Tour', 'Guided tours and highlights', 2),
    (v_hotel_id, 'local', 'Event Tickets', 'Shows, concerts, and more', 3),
    (v_hotel_id, 'local', 'Transportation', 'Car service or rides', 4);

  -- GIFT SHOP OPTIONS
  INSERT INTO public.service_options (hotel_id, service_type, name, description, price, sort_order) VALUES
    (v_hotel_id, 'gift-shop', 'Snack Bundle', 'Premium snacks and drinks', 25.00, 1),
    (v_hotel_id, 'gift-shop', 'Gift Set', 'Local artisan gifts', 75.00, 2),
    (v_hotel_id, 'gift-shop', 'Travel Essentials', 'Adapters, chargers, and more', 35.00, 3),
    (v_hotel_id, 'gift-shop', 'Postcards & Stationery', 'Send a note home', 10.00, 4);

  -- BREAKFAST OPTIONS
  INSERT INTO public.service_options (hotel_id, service_type, name, description, price, sort_order) VALUES
    (v_hotel_id, 'breakfast', 'Continental Breakfast', 'Pastries, fruit, and coffee', 22.00, 1),
    (v_hotel_id, 'breakfast', 'Classic Breakfast', 'Eggs, toast, and sides', 28.00, 2),
    (v_hotel_id, 'breakfast', 'Healthy Bowl', 'Yogurt, granola, and berries', 18.00, 3),
    (v_hotel_id, 'breakfast', 'Coffee & Pastry', 'Fresh brew and baked goods', 12.00, 4);

  -- MAINTENANCE OPTIONS
  INSERT INTO public.service_options (hotel_id, service_type, name, description, sort_order) VALUES
    (v_hotel_id, 'maintenance', 'AC/Heating Issue', 'Temperature control problems', 1),
    (v_hotel_id, 'maintenance', 'Plumbing Issue', 'Sink, toilet, or shower problems', 2),
    (v_hotel_id, 'maintenance', 'Electrical Issue', 'Lights, outlets, or TV problems', 3),
    (v_hotel_id, 'maintenance', 'Other Issue', 'General maintenance request', 4);

  -- CONCIERGE OPTIONS
  INSERT INTO public.service_options (hotel_id, service_type, name, description, sort_order) VALUES
    (v_hotel_id, 'concierge', 'Wake-up Call', 'Scheduled morning call', 1),
    (v_hotel_id, 'concierge', 'Package Pickup', 'Retrieve delivered packages', 2),
    (v_hotel_id, 'concierge', 'Special Request', 'Custom assistance', 3),
    (v_hotel_id, 'concierge', 'Information Request', 'Local info and directions', 4);

  -- ============================================
  -- SEED TIME OPTIONS (universal time slots)
  -- ============================================

  -- Default time options for most services
  INSERT INTO public.service_time_options (hotel_id, service_type, label, minutes, sort_order)
  SELECT v_hotel_id, service_type, label, minutes, sort_order
  FROM (
    VALUES
      ('housekeeping', 'Now / ASAP', 15, 1),
      ('housekeeping', 'In 30 minutes', 30, 2),
      ('housekeeping', 'In 1 hour', 60, 3),
      ('housekeeping', 'In 2 hours', 120, 4),
      ('valet', 'Now / ASAP', 15, 1),
      ('valet', 'In 15 minutes', 15, 2),
      ('valet', 'In 30 minutes', 30, 3),
      ('valet', 'In 1 hour', 60, 4),
      ('spa', 'Today (next available)', 60, 1),
      ('spa', 'In 90 minutes', 90, 2),
      ('spa', 'This evening', 180, 3),
      ('spa', 'Tomorrow morning', 720, 4),
      ('laundry', 'Pickup now', 30, 1),
      ('laundry', 'This afternoon', 240, 2),
      ('laundry', 'This evening', 360, 3),
      ('laundry', 'Tomorrow morning', 720, 4),
      ('fitness', 'Now / ASAP', 15, 1),
      ('fitness', 'In 30 minutes', 30, 2),
      ('fitness', 'In 1 hour', 60, 3),
      ('fitness', 'Later today', 180, 4),
      ('shopping', 'Next available', 45, 1),
      ('shopping', 'Within 2 hours', 120, 2),
      ('shopping', 'This evening', 240, 3),
      ('shopping', 'Tomorrow morning', 720, 4),
      ('local', 'Today (next available)', 120, 1),
      ('local', 'This evening', 240, 2),
      ('local', 'Tomorrow', 720, 3),
      ('local', 'This weekend', 2880, 4),
      ('gift-shop', 'Next available', 45, 1),
      ('gift-shop', 'Within 2 hours', 120, 2),
      ('gift-shop', 'This evening', 240, 3),
      ('gift-shop', 'Tomorrow morning', 720, 4),
      ('breakfast', 'Now / ASAP', 20, 1),
      ('breakfast', 'In 30 minutes', 30, 2),
      ('breakfast', 'In 1 hour', 60, 3),
      ('breakfast', 'Tomorrow morning', 720, 4),
      ('maintenance', 'Urgent - Now', 15, 1),
      ('maintenance', 'Within 1 hour', 60, 2),
      ('maintenance', 'Today', 240, 3),
      ('maintenance', 'Scheduled', 480, 4),
      ('concierge', 'Now / ASAP', 15, 1),
      ('concierge', 'In 30 minutes', 30, 2),
      ('concierge', 'In 1 hour', 60, 3),
      ('concierge', 'Later today', 180, 4)
  ) AS t(service_type, label, minutes, sort_order);

  -- ============================================
  -- SEED DEMO REQUESTS (50+ across categories)
  -- ============================================

  -- Create requests spread over the last 30 days
  FOR i IN 1..60 LOOP
    v_request_id := gen_random_uuid();

    INSERT INTO public.requests (
      id, hotel_id, user_id, room_number, category, item, description,
      status, priority, eta_minutes, assigned_staff_id, completed_at, created_at
    ) VALUES (
      v_request_id,
      v_hotel_id,
      v_guest_id,
      (ARRAY['101', '102', '201', '202', '301', '302', '401', '402', '501', '502'])[1 + (i % 10)],
      (ARRAY['housekeeping', 'room_service', 'maintenance', 'concierge', 'valet', 'spa', 'other']::request_category[])[1 + (i % 7)],
      (ARRAY['Room Cleaning', 'Club Sandwich', 'AC Issue', 'Restaurant Reservation', 'Request Vehicle', 'Massage', 'Extra Pillows',
             'Caesar Salad', 'Plumbing Issue', 'City Tour', 'Luggage Assistance', 'Facial Treatment', 'Fresh Towels',
             'Burger', 'Electrical Issue', 'Event Tickets', 'Schedule Pickup', 'Sauna Session', 'Toiletries'])[1 + (i % 19)],
      CASE WHEN i % 3 = 0 THEN 'Guest requested special attention' ELSE NULL END,
      CASE
        WHEN i <= 10 THEN 'new'::request_status
        WHEN i <= 20 THEN 'pending'::request_status
        WHEN i <= 30 THEN 'in_progress'::request_status
        WHEN i <= 55 THEN 'completed'::request_status
        ELSE 'cancelled'::request_status
      END,
      (ARRAY['low', 'medium', 'medium', 'high', 'urgent']::request_priority[])[1 + (i % 5)],
      (ARRAY[15, 20, 30, 45, 60])[1 + (i % 5)],
      CASE WHEN i > 10 THEN v_staff_id ELSE NULL END,
      CASE WHEN i > 30 AND i <= 55 THEN now() - ((60 - i) * INTERVAL '12 hours') + (INTERVAL '20 minutes') ELSE NULL END,
      now() - ((60 - i) * INTERVAL '12 hours')
    );

    -- Add request events for completed requests
    IF i > 30 AND i <= 55 THEN
      -- New event
      INSERT INTO public.request_events (request_id, status, notes, created_by, created_at)
      VALUES (v_request_id, 'new', 'Request created', v_guest_id, now() - ((60 - i) * INTERVAL '12 hours'));

      -- Pending event
      INSERT INTO public.request_events (request_id, status, notes, created_by, created_at)
      VALUES (v_request_id, 'pending', 'Request accepted by staff', v_staff_id, now() - ((60 - i) * INTERVAL '12 hours') + INTERVAL '5 minutes');

      -- In progress event
      INSERT INTO public.request_events (request_id, status, notes, created_by, created_at)
      VALUES (v_request_id, 'in_progress', 'Staff started working', v_staff_id, now() - ((60 - i) * INTERVAL '12 hours') + INTERVAL '8 minutes');

      -- Completed event
      INSERT INTO public.request_events (request_id, status, notes, created_by, created_at)
      VALUES (v_request_id, 'completed', 'Request completed', v_staff_id, now() - ((60 - i) * INTERVAL '12 hours') + INTERVAL '20 minutes');
    END IF;
  END LOOP;

  -- ============================================
  -- SEED DEMO ORDERS (with revenue)
  -- ============================================

  FOR i IN 1..30 LOOP
    v_order_id := gen_random_uuid();
    v_request_id := gen_random_uuid();

    -- Create the associated request first
    INSERT INTO public.requests (
      id, hotel_id, user_id, room_number, category, item,
      status, priority, eta_minutes, assigned_staff_id, completed_at, created_at
    ) VALUES (
      v_request_id,
      v_hotel_id,
      v_guest_id,
      (ARRAY['101', '102', '201', '202', '301', '302'])[1 + (i % 6)],
      'room_service'::request_category,
      'Room Service Order',
      'completed'::request_status,
      'medium'::request_priority,
      30,
      v_staff_id,
      now() - ((30 - i) * INTERVAL '24 hours') + INTERVAL '25 minutes',
      now() - ((30 - i) * INTERVAL '24 hours')
    );

    -- Create the order
    INSERT INTO public.orders (
      id, hotel_id, user_id, room_number, request_id,
      subtotal, tax, tip, total, status, created_at
    ) VALUES (
      v_order_id,
      v_hotel_id,
      v_guest_id,
      (ARRAY['101', '102', '201', '202', '301', '302'])[1 + (i % 6)],
      v_request_id,
      (20 + (i * 5))::decimal,
      ((20 + (i * 5)) * 0.08)::decimal,
      (ARRAY[0, 5, 10, 15, 20])[1 + (i % 5)]::decimal,
      ((20 + (i * 5)) * 1.08 + (ARRAY[0, 5, 10, 15, 20])[1 + (i % 5)])::decimal,
      'completed',
      now() - ((30 - i) * INTERVAL '24 hours')
    );

    -- Add order items
    INSERT INTO public.order_items (
      order_id, name, unit_price, quantity, total_price
    ) VALUES
      (v_order_id, (ARRAY['Club Sandwich', 'Caesar Salad', 'Burger', 'Pasta', 'Steak'])[1 + (i % 5)], (15 + (i % 10))::decimal, 1, (15 + (i % 10))::decimal),
      (v_order_id, (ARRAY['Coffee', 'Juice', 'Soda', 'Water', 'Tea'])[1 + (i % 5)], 5::decimal, 1, 5::decimal);
  END LOOP;

  -- ============================================
  -- SEED DEMO RATINGS
  -- ============================================

  FOR i IN 1..20 LOOP
    INSERT INTO public.ratings (
      hotel_id, user_id, rating, comment, created_at
    ) VALUES (
      v_hotel_id,
      v_guest_id,
      (ARRAY[4, 4, 5, 5, 5, 3, 4, 5, 4, 5])[1 + (i % 10)],
      (ARRAY['Great service!', 'Very quick response', 'Excellent staff', 'Could be faster', 'Perfect experience', NULL, 'Friendly staff', 'Will recommend', NULL, 'Outstanding'])[1 + (i % 10)],
      now() - ((20 - i) * INTERVAL '36 hours')
    );
  END LOOP;

  -- ============================================
  -- ENSURE ACTIVE STAYS EXIST
  -- ============================================

  -- Add some active stays if none exist
  IF NOT EXISTS (SELECT 1 FROM public.stays WHERE hotel_id = v_hotel_id AND status = 'active') THEN
    FOR i IN 1..8 LOOP
      INSERT INTO public.stays (
        hotel_id, user_id, room_number, status, check_in, check_out
      ) VALUES (
        v_hotel_id,
        v_guest_id,
        (ARRAY['101', '102', '201', '202', '301', '302', '401', '402'])[i],
        'active'::stay_status,
        now() - INTERVAL '2 days',
        now() + INTERVAL '3 days'
      );
    END LOOP;
  END IF;

  RAISE NOTICE 'Demo data seeded successfully!';

END $$;
