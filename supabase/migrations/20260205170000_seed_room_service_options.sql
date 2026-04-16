-- Seed room_service service options and time options if missing (demo).

DO $$
DECLARE
  v_hotel_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_exists INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_exists
  FROM public.service_options
  WHERE hotel_id = v_hotel_id
    AND service_type = 'room_service';

  IF v_exists = 0 THEN
    INSERT INTO public.service_options (hotel_id, service_type, name, description, price, eta_minutes, icon_name, sort_order)
    VALUES
      (v_hotel_id, 'room_service', 'Breakfast Order', 'Classic breakfast selection', 24.00, 30, 'Utensils', 1),
      (v_hotel_id, 'room_service', 'Caesar Salad', 'Crisp romaine, parmesan, croutons', 18.00, 25, 'Utensils', 2),
      (v_hotel_id, 'room_service', 'Pasta', 'Chef-made pasta of the day', 28.00, 35, 'Utensils', 3),
      (v_hotel_id, 'room_service', 'Grilled Salmon', 'Fresh Atlantic salmon', 34.00, 35, 'Utensils', 4),
      (v_hotel_id, 'room_service', 'Dessert', 'Daily dessert selection', 12.00, 20, 'Utensils', 5);
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM public.service_time_options
  WHERE hotel_id = v_hotel_id
    AND service_type = 'room_service';

  IF v_exists = 0 THEN
    INSERT INTO public.service_time_options (hotel_id, service_type, label, minutes, sort_order)
    VALUES
      (v_hotel_id, 'room_service', 'Now / ASAP', 20, 1),
      (v_hotel_id, 'room_service', 'In 30 minutes', 30, 2),
      (v_hotel_id, 'room_service', 'In 1 hour', 60, 3),
      (v_hotel_id, 'room_service', 'In 2 hours', 120, 4);
  END IF;
END $$;
