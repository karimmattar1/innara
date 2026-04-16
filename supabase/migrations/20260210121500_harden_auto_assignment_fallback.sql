-- Harden auto-assignment so demo requests do not remain unassigned.
-- Strategy:
-- 1) same hotel + mapped department
-- 2) same hotel + any department
-- 3) any hotel + mapped department
-- 4) any active staff assignment
-- Also backfills currently open, unassigned requests.

CREATE OR REPLACE FUNCTION public.assign_request_to_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_department department_type;
  v_staff_id UUID;
BEGIN
  IF NEW.assigned_staff_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_department := CASE NEW.category
    WHEN 'housekeeping' THEN 'housekeeping'::department_type
    WHEN 'maintenance' THEN 'maintenance'::department_type
    WHEN 'room_service' THEN 'fb'::department_type
    WHEN 'concierge' THEN 'concierge'::department_type
    WHEN 'valet' THEN 'valet'::department_type
    WHEN 'spa' THEN 'spa'::department_type
    ELSE NULL
  END;

  IF v_department IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1) exact hotel + exact department
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

  -- 2) exact hotel + any department
  IF v_staff_id IS NULL THEN
    SELECT sa.user_id
    INTO v_staff_id
    FROM public.staff_assignments sa
    LEFT JOIN public.requests r
      ON r.assigned_staff_id = sa.user_id
     AND r.status IN ('new', 'pending', 'in_progress')
     AND r.hotel_id = NEW.hotel_id
    WHERE sa.hotel_id = NEW.hotel_id
      AND sa.is_active = true
    GROUP BY sa.user_id
    ORDER BY COUNT(r.id) ASC, RANDOM()
    LIMIT 1;
  END IF;

  -- 3) any hotel + exact department
  IF v_staff_id IS NULL THEN
    SELECT sa.user_id
    INTO v_staff_id
    FROM public.staff_assignments sa
    LEFT JOIN public.requests r
      ON r.assigned_staff_id = sa.user_id
     AND r.status IN ('new', 'pending', 'in_progress')
    WHERE sa.department = v_department
      AND sa.is_active = true
    GROUP BY sa.user_id
    ORDER BY COUNT(r.id) ASC, RANDOM()
    LIMIT 1;
  END IF;

  -- 4) any active assignment
  IF v_staff_id IS NULL THEN
    SELECT sa.user_id
    INTO v_staff_id
    FROM public.staff_assignments sa
    LEFT JOIN public.requests r
      ON r.assigned_staff_id = sa.user_id
     AND r.status IN ('new', 'pending', 'in_progress')
    WHERE sa.is_active = true
    GROUP BY sa.user_id
    ORDER BY COUNT(r.id) ASC, RANDOM()
    LIMIT 1;
  END IF;

  IF v_staff_id IS NOT NULL THEN
    NEW.assigned_staff_id := v_staff_id;
    IF NEW.status = 'new' THEN
      NEW.status := 'pending';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_request_to_staff ON public.requests;

CREATE TRIGGER trg_assign_request_to_staff
BEFORE INSERT ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.assign_request_to_staff();

WITH request_candidates AS (
  SELECT
    r.id,
    COALESCE(
      (
        SELECT sa.user_id
        FROM public.staff_assignments sa
        LEFT JOIN public.requests ar
          ON ar.assigned_staff_id = sa.user_id
         AND ar.status IN ('new', 'pending', 'in_progress')
         AND ar.hotel_id = r.hotel_id
        WHERE sa.hotel_id = r.hotel_id
          AND sa.department = CASE r.category
            WHEN 'housekeeping' THEN 'housekeeping'::department_type
            WHEN 'maintenance' THEN 'maintenance'::department_type
            WHEN 'room_service' THEN 'fb'::department_type
            WHEN 'concierge' THEN 'concierge'::department_type
            WHEN 'valet' THEN 'valet'::department_type
            WHEN 'spa' THEN 'spa'::department_type
            ELSE NULL
          END
          AND sa.is_active = true
        GROUP BY sa.user_id
        ORDER BY COUNT(ar.id) ASC, RANDOM()
        LIMIT 1
      ),
      (
        SELECT sa.user_id
        FROM public.staff_assignments sa
        LEFT JOIN public.requests ar
          ON ar.assigned_staff_id = sa.user_id
         AND ar.status IN ('new', 'pending', 'in_progress')
         AND ar.hotel_id = r.hotel_id
        WHERE sa.hotel_id = r.hotel_id
          AND sa.is_active = true
        GROUP BY sa.user_id
        ORDER BY COUNT(ar.id) ASC, RANDOM()
        LIMIT 1
      ),
      (
        SELECT sa.user_id
        FROM public.staff_assignments sa
        LEFT JOIN public.requests ar
          ON ar.assigned_staff_id = sa.user_id
         AND ar.status IN ('new', 'pending', 'in_progress')
        WHERE sa.department = CASE r.category
          WHEN 'housekeeping' THEN 'housekeeping'::department_type
          WHEN 'maintenance' THEN 'maintenance'::department_type
          WHEN 'room_service' THEN 'fb'::department_type
          WHEN 'concierge' THEN 'concierge'::department_type
          WHEN 'valet' THEN 'valet'::department_type
          WHEN 'spa' THEN 'spa'::department_type
          ELSE NULL
        END
          AND sa.is_active = true
        GROUP BY sa.user_id
        ORDER BY COUNT(ar.id) ASC, RANDOM()
        LIMIT 1
      ),
      (
        SELECT sa.user_id
        FROM public.staff_assignments sa
        LEFT JOIN public.requests ar
          ON ar.assigned_staff_id = sa.user_id
         AND ar.status IN ('new', 'pending', 'in_progress')
        WHERE sa.is_active = true
        GROUP BY sa.user_id
        ORDER BY COUNT(ar.id) ASC, RANDOM()
        LIMIT 1
      )
    ) AS staff_id
  FROM public.requests r
  WHERE r.assigned_staff_id IS NULL
    AND r.status IN ('new', 'pending', 'in_progress')
)
UPDATE public.requests r
SET
  assigned_staff_id = c.staff_id,
  status = CASE WHEN r.status = 'new' THEN 'pending' ELSE r.status END
FROM request_candidates c
WHERE r.id = c.id
  AND c.staff_id IS NOT NULL;
