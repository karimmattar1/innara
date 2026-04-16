-- ================================================
-- SEED: Hotels, Rooms, Menu Data, SLA Configs
-- Must run BEFORE hotel_faqs migration
-- ================================================

-- Hotels
INSERT INTO public.hotels (id, name, slug, type, location, address, description, rating, price_per_night, amenities, is_active, theme_primary_color, theme_accent_color, settings)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'The Sapphire Boutique', 'sapphire-boutique', 'boutique', 'Downtown Dubai', 'Sheikh Zayed Road, Dubai, UAE', 'An intimate luxury boutique hotel in the heart of downtown, offering personalized service and stunning city views.', 4.8, 350, ARRAY['Spa','Pool','Restaurant','Gym','Concierge','WiFi','Room Service'], true, '#1a1f2e', '#d4a853', '{}'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Azure Beach Resort', 'azure-beach-resort', 'resort', 'Palm Jumeirah', 'Palm Jumeirah, Dubai, UAE', 'A world-class beachfront resort with unparalleled ocean views and exceptional dining experiences.', 4.9, 650, ARRAY['Private Beach','Multiple Pools','5 Restaurants','Spa','Water Sports','Kids Club','WiFi'], true, '#1a1f2e', '#d4a853', '{}'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Metropolitan Business Hotel', 'metropolitan-business', 'business', 'DIFC, Dubai', 'DIFC, Dubai, UAE', 'The perfect base for business travelers, featuring state-of-the-art facilities and seamless connectivity.', 4.6, 280, ARRAY['Business Center','Meeting Rooms','Gym','Restaurant','Airport Shuttle','WiFi'], true, '#1a1f2e', '#d4a853', '{}')
ON CONFLICT (id) DO NOTHING;

-- Rooms
INSERT INTO public.rooms (id, hotel_id, room_number, floor, room_type, status, max_occupancy, price_per_night)
VALUES
  ('a58865e9-29a7-43d6-848d-189961f5b71e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '1204', 12, 'Deluxe Suite', 'occupied', 3, 450),
  ('2fabac13-592b-4735-82c4-8778cd53e919', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '305', 3, 'Standard', 'occupied', 2, 280),
  ('359abdb4-dc6b-437a-ad9f-e5ff10e3e31e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '420', 4, 'Superior', 'occupied', 2, 350),
  ('bf98a422-be59-41d9-83cc-21c88f79bc00', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '512', 5, 'Junior Suite', 'occupied', 2, 400),
  ('48250e1b-bb7b-4ae9-8006-33fd30d3620a', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '203', 2, 'Standard', 'occupied', 2, 280),
  ('f3dc5d15-5293-4f8f-94db-cd6cb80dffaf', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '210', 2, 'Deluxe', 'occupied', 2, 380),
  ('08e79be2-285e-4e0f-a97a-43667054c065', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '101', 1, 'Standard', 'available', 2, 280),
  ('5b5ca044-17b9-4079-99db-73936b132e68', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '102', 1, 'Standard', 'available', 2, 280),
  ('6eeed878-588c-41d3-aab6-261aa698f71a', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '801', 8, 'Penthouse Suite', 'available', 4, 1200)
ON CONFLICT (id) DO NOTHING;

-- Menu Categories
INSERT INTO public.menu_categories (id, hotel_id, name, slug, sort_order, is_active)
VALUES
  ('c6ef06a8-fe83-43a3-ba10-c9a37883ce56', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Popular', 'popular', 1, true),
  ('91739e80-1674-499f-8794-9d93c3df0b9b', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Meals', 'meals', 2, true),
  ('6f0720ad-e4df-4a2b-a771-7861aea8464e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Drinks', 'drinks', 3, true),
  ('068cbd66-a1ee-48ea-84b9-15c5a951bdb0', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Desserts', 'desserts', 4, true)
ON CONFLICT (id) DO NOTHING;

-- Menu Items
INSERT INTO public.menu_items (id, hotel_id, name, description, price, is_popular, is_available, sort_order)
VALUES
  ('24984c16-9041-40a0-a128-09506df75041', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Caesar Salad', 'Romaine, croutons, parmesan, caesar dressing', 12, true, true, 1),
  ('cc9a6b71-4257-4667-a3d3-d54ec4414f3c', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Margherita Pizza', 'Tomato, mozzarella, fresh basil', 18, true, true, 2),
  ('06372dd3-7ee5-4500-9bce-471d9519f44f', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Grilled Salmon', 'Asparagus, herb butter, lemon', 24, false, true, 3),
  ('cb0bd25e-9994-48af-8843-571fc2b9d945', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Club Sandwich', 'Chicken, bacon, lettuce, tomato', 16, false, true, 4),
  ('45486c93-2412-4ad3-a409-46abb8e7657e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Beef Burger', 'Angus beef, cheddar, special sauce', 22, true, true, 5),
  ('2a57c46d-db70-4f62-aefb-cef4e371628e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fresh Orange Juice', 'Freshly squeezed', 8, false, true, 6),
  ('87877f8f-81cd-4ef5-af35-189ade708b8e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Cappuccino', 'Double shot espresso, steamed milk', 6, false, true, 7),
  ('9175828c-d2f0-402e-9b0d-638eea849758', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Green Smoothie', 'Spinach, banana, mango, coconut', 10, false, true, 8),
  ('bbb07c22-d595-4eda-b539-4aeaa0160974', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chocolate Cake', 'Rich dark chocolate, ganache', 12, false, true, 9),
  ('61d9763b-afff-4660-8f09-0be8892ea191', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fresh Fruit Platter', 'Seasonal fruits', 14, false, true, 10)
ON CONFLICT (id) DO NOTHING;

-- SLA Configs
INSERT INTO public.sla_configs (id, hotel_id, category, priority, target_minutes)
VALUES
  ('938e7631-582d-40d5-97c4-0038e6e3c1ee', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'housekeeping', 'low', 45),
  ('bff4779e-5270-4336-88dd-7193087b8337', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'housekeeping', 'medium', 30),
  ('d62a2fe8-dc13-4d13-a935-df71934341f3', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'housekeeping', 'high', 15),
  ('ca8f2582-f737-4d29-b835-39afb6565e2d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'housekeeping', 'urgent', 10),
  ('f5763bca-5b1f-40e0-83cf-505a5b65e2cb', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'room_service', 'low', 60),
  ('c1b38f29-2270-4ea4-bae0-0e93ab71b217', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'room_service', 'medium', 45),
  ('c4703391-c20a-48a0-8fe8-cc8211a42914', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'room_service', 'high', 30),
  ('47aa3d7f-82e6-447d-9543-f3ce0f4b2043', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'maintenance', 'low', 120),
  ('13a82200-26f7-43d4-a1b5-6efdb0a14300', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'maintenance', 'medium', 60),
  ('99fa1f61-4b6c-4974-8024-f1e1f4d77933', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'maintenance', 'high', 30),
  ('fe511e85-3534-4348-9812-73af36e37c71', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'maintenance', 'urgent', 15),
  ('4315275d-10cd-45b6-ba1a-bbc642b5617c', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'concierge', 'medium', 15),
  ('d3e5159c-da8f-4cf9-8f3a-c94a2be25563', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'valet', 'medium', 10)
ON CONFLICT (id) DO NOTHING;
