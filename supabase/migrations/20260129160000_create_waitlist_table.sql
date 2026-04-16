-- Create waitlist table for email collection
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('hotel', 'guest')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  source TEXT DEFAULT 'landing_page'
);

-- Add RLS policies
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public signup)
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view waitlist entries
CREATE POLICY "Admins can view waitlist" ON public.waitlist
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'super_admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_type ON public.waitlist(type);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at);

-- Add comment
COMMENT ON TABLE public.waitlist IS 'Stores waitlist signups from landing page';
