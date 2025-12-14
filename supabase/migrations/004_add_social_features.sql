-- Add social features: likes, comments, shares for elections

-- Likes table (users can like elections)
CREATE TABLE election_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL REFERENCES voters(telegram_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One like per user per election
  CONSTRAINT election_likes_unique UNIQUE (election_id, telegram_id)
);

CREATE INDEX idx_election_likes_election ON election_likes(election_id);
CREATE INDEX idx_election_likes_telegram ON election_likes(telegram_id);
CREATE INDEX idx_election_likes_created_at ON election_likes(created_at DESC);

-- Comments table (users can comment on elections)
CREATE TABLE election_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL REFERENCES voters(telegram_id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_election_comments_election ON election_comments(election_id);
CREATE INDEX idx_election_comments_telegram ON election_comments(telegram_id);
CREATE INDEX idx_election_comments_created_at ON election_comments(created_at DESC);

-- Shares table (users can share elections)
CREATE TABLE election_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL REFERENCES voters(telegram_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One share per user per election (optional - remove if users can share multiple times)
  CONSTRAINT election_shares_unique UNIQUE (election_id, telegram_id)
);

CREATE INDEX idx_election_shares_election ON election_shares(election_id);
CREATE INDEX idx_election_shares_telegram ON election_shares(telegram_id);
CREATE INDEX idx_election_shares_created_at ON election_shares(created_at DESC);

-- Enable RLS
ALTER TABLE election_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies - public read, users can create their own
CREATE POLICY "Likes are viewable by everyone" ON election_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON election_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own likes" ON election_likes
  FOR DELETE USING (true);

CREATE POLICY "Comments are viewable by everyone" ON election_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own comments" ON election_comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own comments" ON election_comments
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own comments" ON election_comments
  FOR DELETE USING (true);

CREATE POLICY "Shares are viewable by everyone" ON election_shares
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own shares" ON election_shares
  FOR INSERT WITH CHECK (true);

-- Function to update comment updated_at
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON election_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
