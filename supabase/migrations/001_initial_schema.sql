-- МОКТ Глас Database Schema
-- Bulgarian Elections Voting Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Voters table (using Telegram ID)
CREATE TABLE voters (
  telegram_id BIGINT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  username TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_vote_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  CONSTRAINT voters_username_unique UNIQUE (username)
);

CREATE INDEX idx_voters_created_at ON voters(created_at);

-- Elections table
CREATE TABLE elections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_bg TEXT NOT NULL, -- Bulgarian title
  description TEXT,
  description_bg TEXT, -- Bulgarian description
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_elections_status ON elections(status);
CREATE INDEX idx_elections_dates ON elections(start_date, end_date);

-- Questions table (for elections with multiple questions)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_text_bg TEXT NOT NULL, -- Bulgarian question
  question_type TEXT NOT NULL CHECK (question_type IN ('single-choice', 'multiple-choice', 'ranked-choice')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT questions_election_order_unique UNIQUE (election_id, order_index)
);

CREATE INDEX idx_questions_election ON questions(election_id);

-- Options table (for question options)
CREATE TABLE options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_text_bg TEXT NOT NULL, -- Bulgarian option text
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT options_question_order_unique UNIQUE (question_id, order_index)
);

CREATE INDEX idx_options_question ON options(question_id);

-- Votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL REFERENCES voters(telegram_id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_options JSONB NOT NULL, -- Array of option IDs
  device_fingerprint TEXT,
  ip_address TEXT,
  risk_score INTEGER DEFAULT 0,
  behavior_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate votes
  CONSTRAINT votes_unique UNIQUE (election_id, telegram_id, question_id)
);

CREATE INDEX idx_votes_election_telegram ON votes(election_id, telegram_id);
CREATE INDEX idx_votes_device ON votes(election_id, device_fingerprint);
CREATE INDEX idx_votes_ip ON votes(election_id, ip_address);
CREATE INDEX idx_votes_risk ON votes(risk_score DESC);
CREATE INDEX idx_votes_created_at ON votes(created_at);

-- Suspicious activities tracking
CREATE TABLE suspicious_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT REFERENCES voters(telegram_id) ON DELETE SET NULL,
  device_fingerprint TEXT,
  ip_address TEXT,
  risk_score INTEGER NOT NULL,
  risk_factors TEXT,
  election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
  vote_id UUID REFERENCES votes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'flagged' CHECK (status IN ('flagged', 'reviewed', 'approved', 'rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_suspicious_telegram ON suspicious_activities(telegram_id);
CREATE INDEX idx_suspicious_election ON suspicious_activities(election_id);
CREATE INDEX idx_suspicious_status ON suspicious_activities(status);
CREATE INDEX idx_suspicious_risk ON suspicious_activities(risk_score DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for elections updated_at
CREATE TRIGGER update_elections_updated_at BEFORE UPDATE ON elections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update voter's last_vote_at
CREATE OR REPLACE FUNCTION update_voter_last_vote()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE voters
  SET last_vote_at = NOW()
  WHERE telegram_id = NEW.telegram_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for votes
CREATE TRIGGER update_voter_last_vote_trigger AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION update_voter_last_vote();

-- Row Level Security (RLS) - Enable for all tables
ALTER TABLE voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow read access to elections, questions, options)
-- Elections: public read, admin write
CREATE POLICY "Elections are viewable by everyone" ON elections
  FOR SELECT USING (true);

-- Questions: public read
CREATE POLICY "Questions are viewable by everyone" ON questions
  FOR SELECT USING (true);

-- Options: public read
CREATE POLICY "Options are viewable by everyone" ON options
  FOR SELECT USING (true);

-- Votes: users can only see their own votes
CREATE POLICY "Users can view their own votes" ON votes
  FOR SELECT USING (auth.uid()::text = telegram_id::text);

-- Voters: users can view their own profile
CREATE POLICY "Users can view their own profile" ON voters
  FOR SELECT USING (auth.uid()::text = telegram_id::text);

-- Note: For production, you'll need to set up proper authentication
-- and adjust RLS policies based on your auth system
