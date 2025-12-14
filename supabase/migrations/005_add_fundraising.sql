-- Add fundraising functionality to elections

-- Add fundraising fields to elections table
ALTER TABLE elections
ADD COLUMN IF NOT EXISTS has_fundraising BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fundraising_goal DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS fundraising_currency TEXT DEFAULT 'BGN',
ADD COLUMN IF NOT EXISTS fundraising_description TEXT,
ADD COLUMN IF NOT EXISTS fundraising_description_bg TEXT;

-- Donations table
CREATE TABLE IF NOT EXISTS election_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL REFERENCES voters(telegram_id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BGN',
  payment_method TEXT, -- 'card', 'bank_transfer', 'paypal', etc.
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_provider TEXT, -- 'stripe', 'paypal', 'local', etc.
  payment_provider_transaction_id TEXT,
  donor_name TEXT,
  donor_message TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_election_donations_election ON election_donations(election_id);
CREATE INDEX idx_election_donations_telegram ON election_donations(telegram_id);
CREATE INDEX idx_election_donations_status ON election_donations(payment_status);
CREATE INDEX idx_election_donations_created_at ON election_donations(created_at DESC);

-- Function to calculate total raised for an election
CREATE OR REPLACE FUNCTION get_election_total_raised(election_uuid UUID)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) 
     FROM election_donations 
     WHERE election_id = election_uuid 
       AND payment_status = 'completed'),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update donation updated_at
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON election_donations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE election_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Donations are viewable by everyone (except anonymous)" ON election_donations
  FOR SELECT USING (
    payment_status = 'completed' AND 
    (is_anonymous = FALSE OR auth.uid()::text = telegram_id::text)
  );

CREATE POLICY "Users can create their own donations" ON election_donations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own donations" ON election_donations
  FOR SELECT USING (auth.uid()::text = telegram_id::text);

-- View for public fundraising stats (aggregated, no personal info)
CREATE OR REPLACE VIEW election_fundraising_stats AS
SELECT 
  election_id,
  COUNT(*) FILTER (WHERE payment_status = 'completed') as total_donations,
  COUNT(*) FILTER (WHERE payment_status = 'completed' AND is_anonymous = FALSE) as public_donations,
  SUM(amount) FILTER (WHERE payment_status = 'completed') as total_raised,
  AVG(amount) FILTER (WHERE payment_status = 'completed') as average_donation,
  MIN(amount) FILTER (WHERE payment_status = 'completed') as min_donation,
  MAX(amount) FILTER (WHERE payment_status = 'completed') as max_donation
FROM election_donations
GROUP BY election_id;
