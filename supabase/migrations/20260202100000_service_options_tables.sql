-- ================================================
-- SERVICE OPTIONS TABLES
-- Enables hotel managers to configure all service
-- options from the catalog (not just room service)
-- ================================================

-- Service Options Table
-- Stores configurable options for all service types
CREATE TABLE IF NOT EXISTS public.service_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL, -- 'housekeeping', 'valet', 'spa', 'laundry', 'fitness', 'shopping', 'local', 'gift-shop', 'breakfast', 'concierge', 'maintenance'
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  eta_minutes INTEGER DEFAULT 30,
  icon_name TEXT, -- Lucide icon name
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Service Time Options Table
-- Stores time slot options per service type
CREATE TABLE IF NOT EXISTS public.service_time_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  label TEXT NOT NULL, -- 'Now / ASAP', 'In 30 minutes', etc.
  minutes INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_options_hotel_type ON public.service_options(hotel_id, service_type);
CREATE INDEX IF NOT EXISTS idx_service_time_options_hotel_type ON public.service_time_options(hotel_id, service_type);

-- Enable RLS
ALTER TABLE public.service_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_time_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_options
CREATE POLICY "Anyone can read service_options" ON public.service_options
  FOR SELECT USING (true);

CREATE POLICY "Managers can insert service_options" ON public.service_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'super_admin')
    )
  );

CREATE POLICY "Managers can update service_options" ON public.service_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'super_admin')
    )
  );

CREATE POLICY "Managers can delete service_options" ON public.service_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'super_admin')
    )
  );

-- RLS Policies for service_time_options
CREATE POLICY "Anyone can read service_time_options" ON public.service_time_options
  FOR SELECT USING (true);

CREATE POLICY "Managers can insert service_time_options" ON public.service_time_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'super_admin')
    )
  );

CREATE POLICY "Managers can update service_time_options" ON public.service_time_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'super_admin')
    )
  );

CREATE POLICY "Managers can delete service_time_options" ON public.service_time_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'super_admin')
    )
  );

-- Trigger for updated_at on service_options
CREATE OR REPLACE FUNCTION update_service_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_options_updated_at
  BEFORE UPDATE ON public.service_options
  FOR EACH ROW
  EXECUTE FUNCTION update_service_options_updated_at();
