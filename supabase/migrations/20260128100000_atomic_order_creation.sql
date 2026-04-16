-- Atomic Order Creation Function
-- This function creates a request, order, and order_items in a single transaction
-- ensuring data integrity and preventing orphan records

-- First, create a custom type for order items input
CREATE TYPE order_item_input AS (
  menu_item_id uuid,
  name text,
  unit_price numeric,
  quantity integer,
  notes text
);

-- Create the atomic order creation function
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_user_id uuid,
  p_hotel_id uuid,
  p_room_number text,
  p_stay_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_tip numeric DEFAULT 0,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
  v_order_id uuid;
  v_subtotal numeric := 0;
  v_tax numeric;
  v_total numeric;
  v_item_count integer;
  v_item jsonb;
  v_result jsonb;
BEGIN
  -- Validate user is authenticated
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  -- Validate hotel exists and is active
  IF NOT EXISTS (SELECT 1 FROM hotels WHERE id = p_hotel_id AND is_active = true) THEN
    RAISE EXCEPTION 'Invalid or inactive hotel';
  END IF;

  -- Validate items array is not empty
  v_item_count := jsonb_array_length(p_items);
  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- Calculate subtotal from items
  SELECT COALESCE(SUM((item->>'unit_price')::numeric * (item->>'quantity')::integer), 0)
  INTO v_subtotal
  FROM jsonb_array_elements(p_items) AS item;

  -- Calculate tax and total
  v_tax := v_subtotal * 0.05; -- 5% tax
  v_total := v_subtotal + v_tax + COALESCE(p_tip, 0);

  -- Create the request first
  INSERT INTO requests (
    user_id,
    hotel_id,
    room_number,
    category,
    item,
    description,
    priority,
    status,
    stay_id,
    eta_minutes
  ) VALUES (
    p_user_id,
    p_hotel_id,
    p_room_number,
    'room_service'::request_category,
    'Room Service Order (' || v_item_count || ' items)',
    p_notes,
    'medium'::request_priority,
    'new'::request_status,
    p_stay_id,
    30
  )
  RETURNING id INTO v_request_id;

  -- Create the order
  INSERT INTO orders (
    user_id,
    hotel_id,
    room_number,
    stay_id,
    request_id,
    subtotal,
    tax,
    tip,
    total,
    notes,
    status
  ) VALUES (
    p_user_id,
    p_hotel_id,
    p_room_number,
    p_stay_id,
    v_request_id,
    v_subtotal,
    v_tax,
    COALESCE(p_tip, 0),
    v_total,
    p_notes,
    'pending'
  )
  RETURNING id INTO v_order_id;

  -- Create order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      menu_item_id,
      name,
      unit_price,
      quantity,
      total_price,
      notes
    ) VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::uuid,
      v_item->>'name',
      (v_item->>'unit_price')::numeric,
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric * (v_item->>'quantity')::integer,
      v_item->>'notes'
    );
  END LOOP;

  -- Create initial request event
  INSERT INTO request_events (
    request_id,
    status,
    notes
  ) VALUES (
    v_request_id,
    'new'::request_status,
    'Order placed'
  );

  -- Build and return result
  v_result := jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'request_id', v_request_id,
    'subtotal', v_subtotal,
    'tax', v_tax,
    'tip', COALESCE(p_tip, 0),
    'total', v_total,
    'item_count', v_item_count
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction will be rolled back automatically
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_order_with_items TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION create_order_with_items IS
'Atomically creates a room service order with all related records (request, order, order_items) in a single transaction.
Returns a JSON object with success status and order details or error message.';
