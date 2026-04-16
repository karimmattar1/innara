-- ================================================
-- DATA IMPORT: All remaining data from old database
-- ================================================

-- Fix staff assignments to point to correct hotel (Sapphire Boutique, not Azure Beach)
UPDATE public.staff_assignments
SET hotel_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE user_id IN ('ffd5435a-0dcf-4e01-b325-2cb3864a8d82', '30be1183-a11c-45ee-8d86-c73590964b35');

-- Stays (guest active stay)
INSERT INTO public.stays (id, user_id, hotel_id, room_number, check_in, check_out, status, created_at, updated_at)
VALUES
  ('437d9bf3-d5fa-4dca-9e7c-9ba964523391', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '1204', '2026-01-26T19:35:32.364134+00:00', '2026-02-28T19:35:32.364134+00:00', 'active', '2026-01-26T19:35:32.364134+00:00', '2026-01-26T19:35:32.364134+00:00')
ON CONFLICT (id) DO NOTHING;

-- Create active stay for guest@innara.app (was missing in old DB!)
INSERT INTO public.stays (id, user_id, hotel_id, room_number, check_in, check_out, status, created_at, updated_at)
VALUES
  (gen_random_uuid(), '7938b42e-57b1-48e4-a508-6ed8daa9375e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '305', now(), now() + interval '7 days', 'active', now(), now())
ON CONFLICT DO NOTHING;

-- Requests
INSERT INTO public.requests (id, hotel_id, user_id, room_number, category, item, description, status, priority, eta_minutes, completed_at, created_at, updated_at, stay_id)
VALUES
  ('1eeff4af-bf0c-455b-bc28-47b7ab7cb063', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'room_service', 'Dinner Order', NULL, 'completed', 'medium', 30, '2026-01-15T12:46:31.484054+00:00', '2026-01-15T12:18:31.484054+00:00', '2026-01-27T12:18:31.484054+00:00', NULL),
  ('74e4bde0-7cfc-49b6-8219-df698432d2b0', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'housekeeping', 'Extra Pillows', NULL, 'completed', 'low', 10, '2026-01-17T12:27:31.484054+00:00', '2026-01-17T12:18:31.484054+00:00', '2026-01-27T12:18:31.484054+00:00', NULL),
  ('40b99b2f-d4d6-47e3-b910-a535607661a0', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'spa', 'Massage Booking', NULL, 'completed', 'low', 5, '2026-01-19T12:21:31.484054+00:00', '2026-01-19T12:18:31.484054+00:00', '2026-01-27T12:18:31.484054+00:00', NULL),
  ('6295baf7-30cf-4612-86eb-eb3c6b636675', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'valet', 'Car Pickup', NULL, 'completed', 'medium', 10, '2026-01-20T12:25:31.484054+00:00', '2026-01-20T12:18:31.484054+00:00', '2026-01-27T12:18:31.484054+00:00', NULL),
  ('57f680f9-50de-4a56-9171-eae1e61d2537', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'concierge', 'Restaurant Reservation', NULL, 'completed', 'medium', 15, '2026-01-21T12:28:31.484054+00:00', '2026-01-21T12:18:31.484054+00:00', '2026-01-27T12:18:31.484054+00:00', NULL),
  ('b822defd-c2a0-44fc-a93c-240fab92a902', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'maintenance', 'AC Issue', NULL, 'completed', 'high', 30, '2026-01-22T12:43:31.484054+00:00', '2026-01-22T12:18:31.484054+00:00', '2026-01-27T12:18:31.484054+00:00', NULL),
  ('9390a586-7cc6-465b-9139-98f9d78d7b41', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'room_service', 'Late Night Snack', NULL, 'completed', 'low', 20, '2026-01-23T12:36:31.484054+00:00', '2026-01-23T12:18:31.484054+00:00', '2026-01-27T12:18:31.484054+00:00', NULL),
  ('84e11dfb-458c-45f1-ae6d-a741dbf0f6f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'housekeeping', 'Extra Towels', NULL, 'completed', 'low', 10, '2026-01-24T12:26:31.484054+00:00', '2026-01-24T12:18:31.484054+00:00', '2026-01-27T12:18:31.484054+00:00', NULL),
  ('41a61380-8976-44f6-8fd2-eb310d69a646', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'housekeeping', 'Room Cleaning', NULL, 'completed', 'medium', 15, '2026-01-25T12:30:31.484054+00:00', '2026-01-25T12:18:31.484054+00:00', '2026-01-27T12:18:31.484054+00:00', NULL),
  ('7b1f7aa0-454e-4ab7-9c10-5b8c4c121936', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'room_service', 'Breakfast Order', NULL, 'completed', 'medium', 25, '2026-01-26T12:40:31.484054+00:00', '2026-01-26T12:18:31.484054+00:00', '2026-01-27T12:18:31.484054+00:00', NULL),
  ('e11765c0-b969-4aaf-9212-390f82592872', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'room_service', 'Margherita Pizza', 'No olives please', 'in_progress', 'medium', 30, NULL, '2026-01-26T19:21:37.925482+00:00', '2026-01-26T19:36:37.925482+00:00', NULL),
  ('35044574-338c-4bc3-a074-322335bfba9b', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'maintenance', 'AC Not Working', 'Room is too warm', 'pending', 'high', 20, NULL, '2026-01-26T19:26:37.925482+00:00', '2026-01-26T19:36:37.925482+00:00', NULL),
  ('55fd3376-0241-4694-afe4-385de340d73f', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'housekeeping', 'Room Cleaning', 'Please clean room', 'in_progress', 'medium', 25, NULL, '2026-01-26T19:31:37.925482+00:00', '2026-01-27T12:01:47.578098+00:00', NULL),
  ('56d3de5e-9fff-4705-a4d7-4fdf002e8875', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'housekeeping', 'Extra Towels', 'Need 2 extra bath towels', 'completed', 'low', 15, '2026-01-27T12:01:48.89+00:00', '2026-01-26T19:34:37.925482+00:00', '2026-01-27T12:01:49.072857+00:00', NULL),
  ('c65015d0-4ed9-4fec-9684-6da7587655a0', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'housekeeping', 'Room Cleaning', 'Requested immediately', 'completed', 'medium', 15, '2026-01-27T12:01:41.839+00:00', '2026-01-27T11:55:43.014857+00:00', '2026-01-27T12:01:42.029129+00:00', NULL),
  ('51e6a0ed-2c2c-4f23-bb9c-ac0cd6f25507', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'room_service', 'Room Service Order (1 items)', '', 'completed', 'medium', 30, '2026-01-27T12:07:06.828+00:00', '2026-01-27T12:06:51.46215+00:00', '2026-01-27T12:07:07.035582+00:00', '437d9bf3-d5fa-4dca-9e7c-9ba964523391'),
  ('b604571c-2f83-4be2-bc74-663d5ae33a6e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'housekeeping', 'Room Cleaning', NULL, 'new', 'medium', 15, NULL, '2026-01-27T17:38:31.351461+00:00', '2026-01-27T17:38:31.351461+00:00', NULL),
  ('47b61b92-e2f8-4263-a1b0-8ba7f4a8d9ae', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'room_service', 'Room Service Order (1 items)', '', 'new', 'medium', 30, NULL, '2026-01-27T19:42:28.269723+00:00', '2026-01-27T19:42:28.269723+00:00', '437d9bf3-d5fa-4dca-9e7c-9ba964523391'),
  ('d57b9acf-a1a0-4fb9-8bfb-199ded145e87', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'concierge', 'Airport Pickup', 'Concierge request: Airport Pickup', 'new', 'medium', 30, NULL, '2026-01-27T19:42:46.229969+00:00', '2026-01-27T19:42:46.229969+00:00', NULL),
  ('b06b81fd-f352-4cbe-8ef1-4a0215a34802', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'maintenance', 'Plumbing', 'Guest reported: Plumbing', 'new', 'high', 15, NULL, '2026-01-27T19:46:40.33862+00:00', '2026-01-27T19:46:40.33862+00:00', NULL)
ON CONFLICT (id) DO NOTHING;

-- Request Events
INSERT INTO public.request_events (id, request_id, status, notes, created_at)
VALUES
  ('324843a7-c3e1-43ac-a659-274389784ae7', 'c65015d0-4ed9-4fec-9684-6da7587655a0', 'pending', 'Status changed to pending', '2026-01-27T12:01:23.87702+00:00'),
  ('b6541598-77e2-4278-81f4-1c40a11c52b1', 'c65015d0-4ed9-4fec-9684-6da7587655a0', 'in_progress', 'Status changed to in_progress', '2026-01-27T12:01:30.713284+00:00'),
  ('225ef9df-9d5b-4b00-a827-8ba98aded4c7', '56d3de5e-9fff-4705-a4d7-4fdf002e8875', 'pending', 'Status changed to pending', '2026-01-27T12:01:37.661472+00:00'),
  ('9141f3d9-df10-4fd1-b2a9-1b4c664ba1ed', '56d3de5e-9fff-4705-a4d7-4fdf002e8875', 'in_progress', 'Status changed to in_progress', '2026-01-27T12:01:38.595117+00:00'),
  ('4d5f1939-3014-4bbb-8acb-500e9f3bb34b', 'c65015d0-4ed9-4fec-9684-6da7587655a0', 'completed', 'Status changed to completed', '2026-01-27T12:01:42.127328+00:00'),
  ('4dc9873f-a94a-48d8-ae60-b5a9457c48da', '55fd3376-0241-4694-afe4-385de340d73f', 'in_progress', 'Status changed to in_progress', '2026-01-27T12:01:47.653943+00:00'),
  ('5bcfa3f1-75c0-4ed0-9b88-90611baeb383', '56d3de5e-9fff-4705-a4d7-4fdf002e8875', 'completed', 'Status changed to completed', '2026-01-27T12:01:49.177853+00:00'),
  ('4a1420e1-090d-437c-b1d5-f41c56781ced', '51e6a0ed-2c2c-4f23-bb9c-ac0cd6f25507', 'pending', 'Status changed to pending', '2026-01-27T12:07:05.579556+00:00'),
  ('28f8c04a-fbb8-45d9-a916-48a77863559c', '51e6a0ed-2c2c-4f23-bb9c-ac0cd6f25507', 'in_progress', 'Status changed to in_progress', '2026-01-27T12:07:06.619169+00:00'),
  ('2f5bb425-f438-4d5c-a914-45f01c0d41ec', '51e6a0ed-2c2c-4f23-bb9c-ac0cd6f25507', 'completed', 'Status changed to completed', '2026-01-27T12:07:07.111126+00:00')
ON CONFLICT (id) DO NOTHING;

-- Orders
INSERT INTO public.orders (id, hotel_id, user_id, room_number, status, subtotal, tax, tip, total, created_at, updated_at, request_id, stay_id)
VALUES
  ('8cb6873e-1326-4a1e-9ef8-341a2e0d4edd', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'delivered', 98, 9.8, 12, 119.8, '2026-01-07T12:18:04.860214+00:00', '2026-01-27T12:18:04.860214+00:00', NULL, NULL),
  ('8d3d69c5-0c99-443e-9726-6f415b38d644', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'delivered', 45, 4.5, 5, 54.5, '2026-01-09T12:18:04.860214+00:00', '2026-01-27T12:18:04.860214+00:00', NULL, NULL),
  ('f0d24cb9-e659-47dc-a2e4-9bfe712aacdb', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'delivered', 234, 23.4, 30, 287.4, '2026-01-12T12:18:04.860214+00:00', '2026-01-27T12:18:04.860214+00:00', NULL, NULL),
  ('22d19799-bd3e-4321-9a05-c01131a10619', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'delivered', 67, 6.7, 8, 81.7, '2026-01-15T12:18:04.860214+00:00', '2026-01-27T12:18:04.860214+00:00', NULL, NULL),
  ('815f6ea3-caae-48f0-b20a-716e23f4537d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'delivered', 156, 15.6, 20, 191.6, '2026-01-17T12:18:04.860214+00:00', '2026-01-27T12:18:04.860214+00:00', NULL, NULL),
  ('7b5cb753-d0b4-44fd-b3be-08341949ee63', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'delivered', 89, 8.9, 12, 109.9, '2026-01-20T12:18:04.860214+00:00', '2026-01-27T12:18:04.860214+00:00', NULL, NULL),
  ('c085995c-5ded-4794-b491-53de592af1fb', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'delivered', 35, 3.5, 5, 43.5, '2026-01-22T12:18:04.860214+00:00', '2026-01-27T12:18:04.860214+00:00', NULL, NULL),
  ('84edc0fd-c800-4a00-9916-c7e565b30d46', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'delivered', 120, 12, 15, 147, '2026-01-24T12:18:04.860214+00:00', '2026-01-27T12:18:04.860214+00:00', NULL, NULL),
  ('cbdec27a-dc86-49af-8064-5b8d9482bf61', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'delivered', 78, 7.8, 10, 95.8, '2026-01-25T12:18:04.860214+00:00', '2026-01-27T12:18:04.860214+00:00', NULL, NULL),
  ('eb146d28-e6aa-4dea-85c6-a310bf3ebfd3', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'delivered', 45, 4.5, 5, 54.5, '2026-01-26T12:18:04.860214+00:00', '2026-01-27T12:18:04.860214+00:00', NULL, NULL),
  ('78e35cc8-c06a-4bbd-88f3-8a490c4c9129', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'pending', 12, 0.6, 0, 12.6, '2026-01-27T12:06:51.567295+00:00', '2026-01-27T12:06:51.567295+00:00', '51e6a0ed-2c2c-4f23-bb9c-ac0cd6f25507', '437d9bf3-d5fa-4dca-9e7c-9ba964523391'),
  ('a68687b6-e3d2-4117-a549-71a4a981c43b', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', '1204', 'pending', 12, 0.6, 0, 12.6, '2026-01-27T19:42:28.426058+00:00', '2026-01-27T19:42:28.426058+00:00', '47b61b92-e2f8-4263-a1b0-8ba7f4a8d9ae', '437d9bf3-d5fa-4dca-9e7c-9ba964523391')
ON CONFLICT (id) DO NOTHING;

-- Order Items
INSERT INTO public.order_items (id, order_id, menu_item_id, name, quantity, unit_price, total_price, modifiers)
VALUES
  ('0ca19caa-526b-4daf-a890-291d34eb5d4c', '78e35cc8-c06a-4bbd-88f3-8a490c4c9129', '24984c16-9041-40a0-a128-09506df75041', 'Caesar Salad', 1, 12, 12, '{}'),
  ('56a1a100-a875-4d29-ab85-06f41d2f2c01', 'a68687b6-e3d2-4117-a549-71a4a981c43b', '24984c16-9041-40a0-a128-09506df75041', 'Caesar Salad', 1, 12, 12, '{}')
ON CONFLICT (id) DO NOTHING;

-- Messages
INSERT INTO public.messages (id, request_id, sender_id, sender_type, content, is_internal, created_at)
VALUES
  ('84e94fc3-d1c5-4242-a0e3-777f69286ddf', '35044574-338c-4bc3-a074-322335bfba9b', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', 'staff', 'hello its me', true, '2026-01-27T12:02:01.176176+00:00')
ON CONFLICT (id) DO NOTHING;

-- Ratings
INSERT INTO public.ratings (id, user_id, hotel_id, rating, comment, created_at)
VALUES
  ('8b6f633a-231b-4709-a6f8-e080089090bb', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5, 'Highly recommend', '2026-01-12T12:18:49.692173+00:00'),
  ('23591e21-5479-40a9-aba5-856f5652c442', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4, 'Good service overall', '2026-01-17T12:18:49.692173+00:00'),
  ('92c245c9-fed4-4bab-8a5a-373bb96c56ab', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5, 'Perfect!', '2026-01-20T12:18:49.692173+00:00'),
  ('d4838afd-3d9e-493c-af48-3f604f33e7a7', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5, 'Amazing experience', '2026-01-22T12:18:49.692173+00:00'),
  ('9e9c6136-311c-4209-83ec-e6ee7473bee6', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4, 'Very good, quick response', '2026-01-24T12:18:49.692173+00:00'),
  ('11c5dd82-a9ae-4084-aab5-3864a24ac558', '4611d89a-514b-4d4e-ac37-d544a1c5d82e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5, 'Excellent service!', '2026-01-26T12:18:49.692173+00:00')
ON CONFLICT (id) DO NOTHING;
