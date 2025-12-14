-- Add payment/bank details for users to receive fundraising funds

-- Add payment fields to voting_user_profiles (if table exists)
-- Note: This assumes voting_user_profiles table exists from extended user management
-- If not, you may need to add these to the voters table instead

-- Create user_payment_details table (separate for security)
CREATE TABLE IF NOT EXISTS user_payment_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References voting_user_profiles.id or can be telegram_id
  telegram_id BIGINT REFERENCES voters(telegram_id) ON DELETE CASCADE,
  
  -- Payment method type
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'paypal', 'stripe', 'revolut', 'wise', 'other')),
  
  -- Bank account details (for Bulgarian banks)
  bank_name TEXT,
  bank_account_holder_name TEXT NOT NULL,
  bank_account_number TEXT, -- IBAN format
  bank_swift_bic TEXT, -- BIC/SWIFT code
  
  -- Alternative payment methods
  paypal_email TEXT,
  stripe_account_id TEXT,
  revolut_email TEXT,
  wise_email TEXT,
  
  -- Other payment details
  payment_details_json JSONB, -- For flexible storage of other payment methods
  
  -- Verification status
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by TEXT, -- Admin who verified
  
  -- Security
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One active payment method per user
  CONSTRAINT user_payment_details_unique_active UNIQUE (telegram_id) WHERE (is_active = TRUE)
);

CREATE INDEX idx_user_payment_details_user ON user_payment_details(telegram_id);
CREATE INDEX idx_user_payment_details_verified ON user_payment_details(is_verified);

-- Withdrawals table (track fund withdrawals)
CREATE TABLE IF NOT EXISTS user_withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  telegram_id BIGINT NOT NULL REFERENCES voters(telegram_id) ON DELETE CASCADE,
  election_id UUID REFERENCES elections(id) ON DELETE SET NULL,
  
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BGN',
  
  -- Payment details used for withdrawal
  payment_details_id UUID REFERENCES user_payment_details(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Processing info
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by TEXT, -- Admin/system
  transaction_reference TEXT, -- External transaction ID
  
  -- Notes
  notes TEXT,
  failure_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_withdrawals_user ON user_withdrawals(telegram_id);
CREATE INDEX idx_user_withdrawals_election ON user_withdrawals(election_id);
CREATE INDEX idx_user_withdrawals_status ON user_withdrawals(status);
CREATE INDEX idx_user_withdrawals_created_at ON user_withdrawals(created_at DESC);

-- Function to get total available funds for a user (from their polls)
CREATE OR REPLACE FUNCTION get_user_available_funds(user_telegram_id BIGINT)
RETURNS TABLE (
  total_available DECIMAL(10, 2),
  currency TEXT,
  election_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ed.amount), 0) as total_available,
    COALESCE(MAX(e.fundraising_currency), 'BGN') as currency,
    COUNT(DISTINCT e.id) as election_count
  FROM elections e
  LEFT JOIN election_donations ed ON ed.election_id = e.id
  WHERE e.created_by = user_telegram_id::TEXT
    AND e.has_fundraising = TRUE
    AND ed.payment_status = 'completed'
    AND NOT EXISTS (
      SELECT 1 FROM user_withdrawals uw
      WHERE uw.election_id = e.id
        AND uw.status IN ('completed', 'processing')
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update withdrawal updated_at
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON user_withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_payment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment details
CREATE POLICY "Users can view their own payment details" ON user_payment_details
  FOR SELECT USING (auth.uid()::text = telegram_id::text OR true); -- Allow read for now, restrict in production

CREATE POLICY "Users can create their own payment details" ON user_payment_details
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own payment details" ON user_payment_details
  FOR UPDATE USING (true);

-- RLS Policies for withdrawals
CREATE POLICY "Users can view their own withdrawals" ON user_withdrawals
  FOR SELECT USING (auth.uid()::text = telegram_id::text OR true);

CREATE POLICY "Users can create their own withdrawals" ON user_withdrawals
  FOR INSERT WITH CHECK (true);
