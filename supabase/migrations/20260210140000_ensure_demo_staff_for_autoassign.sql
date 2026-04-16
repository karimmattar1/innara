-- Ensure staff assignments exist for auto-assignment to work
-- Uses existing profiles and creates staff_assignments for them

DO $$
DECLARE
  v_hotel_id UUID;
  v_profile_id UUID;
  v_departments TEXT[] := ARRAY['housekeeping', 'maintenance', 'fb', 'concierge', 'valet', 'spa', 'front_desk'];
  v_dept TEXT;
  v_profile_ids UUID[];
  v_idx INT;
  v_exists BOOLEAN;
BEGIN
  -- Get any existing hotel (preferring The Grand Azure if it exists)
  SELECT id INTO v_hotel_id FROM public.hotels ORDER BY (name = 'The Grand Azure') DESC LIMIT 1;

  IF v_hotel_id IS NULL THEN
    RAISE NOTICE 'No hotels found, skipping staff setup';
    RETURN;
  END IF;

  -- Get all existing profile IDs
  SELECT ARRAY_AGG(id) INTO v_profile_ids
  FROM public.profiles
  WHERE id IS NOT NULL
  LIMIT 50;

  IF v_profile_ids IS NULL OR array_length(v_profile_ids, 1) IS NULL THEN
    RAISE NOTICE 'No profiles found, skipping staff setup';
    RETURN;
  END IF;

  -- Assign profiles to departments round-robin style
  v_idx := 1;
  FOREACH v_dept IN ARRAY v_departments
  LOOP
    -- Get a profile for this department (cycling through available profiles)
    IF v_idx > array_length(v_profile_ids, 1) THEN
      v_idx := 1;
    END IF;

    v_profile_id := v_profile_ids[v_idx];

    -- Check if assignment already exists
    SELECT EXISTS(
      SELECT 1 FROM public.staff_assignments
      WHERE user_id = v_profile_id AND hotel_id = v_hotel_id
    ) INTO v_exists;

    -- Create staff assignment if it doesn't exist
    IF NOT v_exists THEN
      INSERT INTO public.staff_assignments (user_id, hotel_id, department, is_active)
      VALUES (v_profile_id, v_hotel_id, v_dept::department_type, true);
    ELSE
      -- Update existing to active
      UPDATE public.staff_assignments
      SET is_active = true
      WHERE user_id = v_profile_id AND hotel_id = v_hotel_id;
    END IF;

    v_idx := v_idx + 1;

    -- Add a second staff member to each department if we have enough profiles
    IF array_length(v_profile_ids, 1) >= v_idx THEN
      v_profile_id := v_profile_ids[v_idx];

      SELECT EXISTS(
        SELECT 1 FROM public.staff_assignments
        WHERE user_id = v_profile_id AND hotel_id = v_hotel_id
      ) INTO v_exists;

      IF NOT v_exists THEN
        INSERT INTO public.staff_assignments (user_id, hotel_id, department, is_active)
        VALUES (v_profile_id, v_hotel_id, v_dept::department_type, true);
      ELSE
        UPDATE public.staff_assignments
        SET is_active = true
        WHERE user_id = v_profile_id AND hotel_id = v_hotel_id;
      END IF;

      v_idx := v_idx + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Staff assignments created/updated for hotel %', v_hotel_id;
END $$;

-- Backfill any unassigned requests
WITH request_candidates AS (
  SELECT
    r.id,
    COALESCE(
      (
        SELECT sa.user_id
        FROM public.staff_assignments sa
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
        ORDER BY RANDOM()
        LIMIT 1
      ),
      (
        SELECT sa.user_id
        FROM public.staff_assignments sa
        WHERE sa.hotel_id = r.hotel_id
          AND sa.is_active = true
        ORDER BY RANDOM()
        LIMIT 1
      ),
      (
        SELECT sa.user_id
        FROM public.staff_assignments sa
        WHERE sa.is_active = true
        ORDER BY RANDOM()
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
