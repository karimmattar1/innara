-- Clean up QA test artifacts (requests/orders/ratings/events created by automated tests).

DO $$
DECLARE
  v_req_ids UUID[];
BEGIN
  -- Collect QA request ids (items created by QA tests)
  SELECT array_agg(id) INTO v_req_ids
  FROM public.requests
  WHERE item ILIKE 'QA %'
     OR item ILIKE 'QA Test%'
     OR description ILIKE '%QA test%';

  -- Delete request_events tied to QA requests
  DELETE FROM public.request_events
  WHERE request_id = ANY(v_req_ids);

  -- Delete ratings tied to QA requests
  DELETE FROM public.ratings
  WHERE request_id = ANY(v_req_ids);

  -- Delete QA requests
  DELETE FROM public.requests
  WHERE id = ANY(v_req_ids);

  -- Delete QA orders
  DELETE FROM public.orders
  WHERE notes ILIKE '%QA test%';
END $$;
