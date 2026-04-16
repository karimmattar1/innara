-- Create hotel_faqs table for per-hotel knowledge base
CREATE TABLE public.hotel_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast hotel-specific look-ups
CREATE INDEX idx_hotel_faqs_hotel ON public.hotel_faqs (hotel_id);
CREATE INDEX idx_hotel_faqs_keywords ON public.hotel_faqs USING GIN (keywords);

-- Enable RLS
ALTER TABLE public.hotel_faqs ENABLE ROW LEVEL SECURITY;

-- Public read for guests
CREATE POLICY "Anyone can read active FAQs"
  ON public.hotel_faqs
  FOR SELECT
  USING (is_active = true);

-- Staff / managers can manage FAQs
CREATE POLICY "Authenticated can manage FAQs"
  ON public.hotel_faqs
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Updated_at trigger (uses existing function)
CREATE TRIGGER update_hotel_faqs_updated_at
  BEFORE UPDATE ON public.hotel_faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Seed demo FAQs for the demo hotel
INSERT INTO public.hotel_faqs (hotel_id, question, answer, keywords) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'What is the WiFi password?', 'Connect to network "Sapphire_Guest" and use password "Welcome2026".', ARRAY['wifi', 'internet', 'password', 'connection']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'What time is checkout?', 'Standard checkout is 12:00 PM. Late checkout until 3 PM is available for $50.', ARRAY['checkout', 'leaving', 'checkout time', 'late checkout']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'What time is breakfast served?', 'Breakfast is served from 6:30 AM to 10:30 AM daily in the main restaurant.', ARRAY['breakfast', 'morning', 'eat']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Is there a gym or fitness center?', 'Yes! Our fitness center is open 24 hours on the 4th floor.', ARRAY['gym', 'fitness', 'workout', 'exercise']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Where can I park my car?', 'Valet parking is available at $35/night. Self-parking is on level B1 for $25/night.', ARRAY['parking', 'valet', 'car', 'garage']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Is the pool open?', 'The rooftop pool is open from 7 AM to 10 PM daily. Towels are provided.', ARRAY['pool', 'swim', 'rooftop']);