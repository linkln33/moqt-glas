-- Add missing fundraising columns to elections table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/igjkhyisdwezrnjhgsta/sql/new

ALTER TABLE public.elections
ADD COLUMN IF NOT EXISTS has_fundraising BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fundraising_goal DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS fundraising_currency TEXT DEFAULT 'BGN',
ADD COLUMN IF NOT EXISTS fundraising_description TEXT,
ADD COLUMN IF NOT EXISTS fundraising_description_bg TEXT,
ADD COLUMN IF NOT EXISTS fundraising_end_date TIMESTAMPTZ;

-- Create election_donations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.election_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL REFERENCES public.voters(telegram_id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BGN',
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_provider TEXT,
  payment_provider_transaction_id TEXT,
  donor_name TEXT,
  donor_message TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_election_donations_election ON public.election_donations(election_id);
CREATE INDEX IF NOT EXISTS idx_election_donations_telegram ON public.election_donations(telegram_id);
CREATE INDEX IF NOT EXISTS idx_election_donations_status ON public.election_donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_election_donations_created_at ON public.election_donations(created_at DESC);

-- Function to calculate total raised for an election
CREATE OR REPLACE FUNCTION public.get_election_total_raised(election_uuid UUID)
RETURNS DECIMAL(10, 2) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) 
     FROM public.election_donations 
     WHERE election_id = election_uuid 
       AND payment_status = 'completed'),
    0
  );
END;
$$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_donations_updated_at ON public.election_donations;
CREATE TRIGGER update_donations_updated_at 
BEFORE UPDATE ON public.election_donations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.election_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Service role can do everything on election_donations" ON public.election_donations;
CREATE POLICY "Service role can do everything on election_donations"
  ON public.election_donations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- View for public fundraising stats
CREATE OR REPLACE VIEW public.election_fundraising_stats AS
SELECT 
  election_id,
  COUNT(*) FILTER (WHERE payment_status = 'completed') as total_donations,
  COUNT(*) FILTER (WHERE payment_status = 'completed' AND is_anonymous = FALSE) as public_donations,
  SUM(amount) FILTER (WHERE payment_status = 'completed') as total_raised,
  AVG(amount) FILTER (WHERE payment_status = 'completed') as average_donation,
  MIN(amount) FILTER (WHERE payment_status = 'completed') as min_donation,
  MAX(amount) FILTER (WHERE payment_status = 'completed') as max_donation
FROM public.election_donations
GROUP BY election_id;
