-- Add extended fundraising columns to elections table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/igjkhyisdwezrnjhgsta/sql/new

ALTER TABLE public.elections
ADD COLUMN IF NOT EXISTS fundraising_purpose TEXT,
ADD COLUMN IF NOT EXISTS fundraising_min_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS fundraising_suggested_amounts TEXT,
ADD COLUMN IF NOT EXISTS fundraising_payment_methods JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS fundraising_show_donors BOOLEAN DEFAULT TRUE;

-- Add comments for documentation
COMMENT ON COLUMN public.elections.fundraising_purpose IS 'Purpose/category of the fundraising campaign (charity, political, community, etc.)';
COMMENT ON COLUMN public.elections.fundraising_min_amount IS 'Minimum donation amount allowed';
COMMENT ON COLUMN public.elections.fundraising_suggested_amounts IS 'Comma-separated list of suggested donation amounts';
COMMENT ON COLUMN public.elections.fundraising_payment_methods IS 'Array of accepted payment methods (card, bank_transfer, paypal, crypto)';
COMMENT ON COLUMN public.elections.fundraising_show_donors IS 'Whether to show donor names publicly (if not anonymous)';
