-- ================================================
-- ADD DEMO RATINGS FOR SATISFACTION METRICS
-- ================================================

DO $$
DECLARE
  v_hotel_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_request RECORD;
BEGIN
  -- Delete existing ratings for this hotel
  DELETE FROM public.ratings WHERE hotel_id = v_hotel_id;

  -- Add ratings for completed requests
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
END $$;
