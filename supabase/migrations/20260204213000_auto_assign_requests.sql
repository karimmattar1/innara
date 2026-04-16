-- Auto-assign new requests to best-fit staff (demo heuristic).
-- Chooses active staff in same department with fewest active requests.

CREATE OR REPLACE FUNCTION public.assign_request_to_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_department TEXT;
  v_staff_id UUID;
BEGIN
  -- Only assign if not already assigned
  IF NEW.assigned_staff_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Map request category to staff department
  v_department := CASE NEW.category
    WHEN 'housekeeping' THEN 'housekeeping'
    WHEN 'maintenance' THEN 'maintenance'
    WHEN 'room_service' THEN 'fb'
    WHEN 'concierge' THEN 'concierge'
    WHEN 'valet' THEN 'valet'
    WHEN 'spa' THEN 'spa'
    ELSE NULL
  END;

  IF v_department IS NULL THEN
    RETURN NEW;
  END IF;

  -- Pick staff with fewest active requests in same hotel/department
  SELECT sa.user_id
  INTO v_staff_id
  FROM public.staff_assignments sa
  LEFT JOIN public.requests r
    ON r.assigned_staff_id = sa.user_id
   AND r.status IN ('new', 'pending', 'in_progress')
   AND r.hotel_id = NEW.hotel_id
  WHERE sa.hotel_id = NEW.hotel_id
    AND sa.department = v_department
    AND sa.is_active = true
  GROUP BY sa.user_id
  ORDER BY COUNT(r.id) ASC, RANDOM()
  LIMIT 1;

  IF v_staff_id IS NOT NULL THEN
    NEW.assigned_staff_id := v_staff_id;
    NEW.status := 'pending';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_request_to_staff ON public.requests;

CREATE TRIGGER trg_assign_request_to_staff
BEFORE INSERT ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.assign_request_to_staff();
