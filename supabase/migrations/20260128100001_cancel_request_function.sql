-- Cancel Request Function with validation
-- Ensures only the owner can cancel and only cancellable statuses are allowed

CREATE OR REPLACE FUNCTION cancel_request(
  p_request_id uuid,
  p_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request requests%ROWTYPE;
  v_result jsonb;
BEGIN
  -- Validate inputs
  IF p_request_id IS NULL OR p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Request ID and User ID are required'
    );
  END IF;

  -- Get the request and verify ownership
  SELECT * INTO v_request
  FROM requests
  WHERE id = p_request_id;

  IF v_request IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Request not found'
    );
  END IF;

  -- Check ownership - only the request owner can cancel
  IF v_request.user_id != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You can only cancel your own requests'
    );
  END IF;

  -- Check if request is in a cancellable state
  -- Only 'new' and 'pending' can be cancelled by guests
  IF v_request.status NOT IN ('new', 'pending') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This request can no longer be cancelled. Please contact the front desk.'
    );
  END IF;

  -- Update the request status
  UPDATE requests
  SET
    status = 'cancelled'::request_status,
    updated_at = now()
  WHERE id = p_request_id;

  -- Create cancellation event
  INSERT INTO request_events (
    request_id,
    status,
    notes,
    created_by
  ) VALUES (
    p_request_id,
    'cancelled'::request_status,
    COALESCE(p_reason, 'Cancelled by guest'),
    p_user_id
  );

  -- If there's an associated order, cancel it too
  UPDATE orders
  SET
    status = 'cancelled',
    updated_at = now()
  WHERE request_id = p_request_id
    AND status IN ('pending', 'preparing');

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Request cancelled successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cancel_request TO authenticated;

COMMENT ON FUNCTION cancel_request IS
'Cancels a request with validation. Only the owner can cancel and only when status is new or pending.';
