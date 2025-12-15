-- Add creator profiles and subscription system for Patreon-like features

-- Creator Profiles table
CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT NOT NULL REFERENCES voters(telegram_id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  bio_bg TEXT, -- Bulgarian bio
  avatar_url TEXT,
  banner_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT creator_profiles_telegram_unique UNIQUE (telegram_id)
);

CREATE INDEX idx_creator_profiles_telegram ON creator_profiles(telegram_id);
CREATE INDEX idx_creator_profiles_username ON creator_profiles(username);
CREATE INDEX idx_creator_profiles_active ON creator_profiles(is_active);

-- Subscription Tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_telegram_id BIGINT NOT NULL REFERENCES creator_profiles(telegram_id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Basic", "Premium", "VIP"
  name_bg TEXT, -- Bulgarian name
  description TEXT,
  description_bg TEXT, -- Bulgarian description
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'BGN',
  billing_period TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  tier_level INTEGER NOT NULL DEFAULT 0, -- For access comparison (0=free, 1=basic, 2=premium, 3=vip)
  benefits JSONB, -- Array of benefits: ["Early access", "Exclusive content", etc.]
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_tiers_creator ON subscription_tiers(creator_telegram_id);
CREATE INDEX idx_subscription_tiers_active ON subscription_tiers(is_active);
CREATE INDEX idx_subscription_tiers_level ON subscription_tiers(tier_level);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscriber_telegram_id BIGINT NOT NULL REFERENCES voters(telegram_id) ON DELETE CASCADE,
  creator_telegram_id BIGINT NOT NULL REFERENCES creator_profiles(telegram_id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES subscription_tiers(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE, -- Stripe subscription ID
  stripe_customer_id TEXT, -- Stripe customer ID
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One active subscription per user per creator
  CONSTRAINT subscriptions_unique_active UNIQUE (subscriber_telegram_id, creator_telegram_id) 
    WHERE (status = 'active')
);

CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_telegram_id);
CREATE INDEX idx_subscriptions_creator ON subscriptions(creator_telegram_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- Creator Videos table
CREATE TABLE IF NOT EXISTS creator_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_telegram_id BIGINT NOT NULL REFERENCES creator_profiles(telegram_id) ON DELETE CASCADE,
  youtube_video_id TEXT, -- YouTube video ID
  platform TEXT DEFAULT 'youtube' CHECK (platform IN ('youtube', 'vimeo', 'cloudflare')),
  title TEXT NOT NULL,
  title_bg TEXT, -- Bulgarian title
  description TEXT,
  description_bg TEXT, -- Bulgarian description
  thumbnail_url TEXT,
  duration INTEGER, -- Duration in seconds
  access_tier_id UUID REFERENCES subscription_tiers(id) ON DELETE SET NULL, -- NULL = free/public
  views_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_creator_videos_creator ON creator_videos(creator_telegram_id);
CREATE INDEX idx_creator_videos_tier ON creator_videos(access_tier_id);
CREATE INDEX idx_creator_videos_published ON creator_videos(is_published);
CREATE INDEX idx_creator_videos_created ON creator_videos(created_at DESC);
CREATE INDEX idx_creator_videos_youtube ON creator_videos(youtube_video_id);

-- Subscription Payments table (track recurring payments)
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BGN',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_payments_subscription ON subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX idx_subscription_payments_stripe ON subscription_payments(stripe_payment_intent_id);

-- Video Views tracking (optional, for analytics)
CREATE TABLE IF NOT EXISTS video_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES creator_videos(id) ON DELETE CASCADE,
  viewer_telegram_id BIGINT REFERENCES voters(telegram_id) ON DELETE SET NULL,
  ip_address TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_video_views_video ON video_views(video_id);
CREATE INDEX idx_video_views_viewer ON video_views(viewer_telegram_id);
CREATE INDEX idx_video_views_date ON video_views(viewed_at DESC);

-- Functions

-- Function to check if user has access to video
CREATE OR REPLACE FUNCTION check_video_access(
  p_video_id UUID,
  p_user_telegram_id BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_required_tier_id UUID;
  v_required_tier_level INTEGER;
  v_user_tier_level INTEGER;
  v_has_subscription BOOLEAN;
BEGIN
  -- Get required tier for video
  SELECT access_tier_id INTO v_required_tier_id
  FROM creator_videos
  WHERE id = p_video_id;
  
  -- If no tier required (NULL), it's free/public
  IF v_required_tier_id IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Get required tier level
  SELECT tier_level INTO v_required_tier_level
  FROM subscription_tiers
  WHERE id = v_required_tier_id;
  
  -- Check if user has active subscription to creator
  SELECT 
    COALESCE(MAX(st.tier_level), 0) INTO v_user_tier_level
  FROM subscriptions s
  JOIN subscription_tiers st ON s.tier_id = st.id
  WHERE s.subscriber_telegram_id = p_user_telegram_id
    AND s.creator_telegram_id = (
      SELECT creator_telegram_id 
      FROM creator_videos 
      WHERE id = p_video_id
    )
    AND s.status = 'active';
  
  -- User has access if their tier level >= required tier level
  RETURN v_user_tier_level >= v_required_tier_level;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON creator_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_tiers_updated_at BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_videos_updated_at BEFORE UPDATE ON creator_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Creator profiles: public read, owners can update
CREATE POLICY "Creator profiles are viewable by everyone" ON creator_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own creator profile" ON creator_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own creator profile" ON creator_profiles
  FOR UPDATE USING (true);

-- Subscription tiers: public read (to see available tiers)
CREATE POLICY "Subscription tiers are viewable by everyone" ON subscription_tiers
  FOR SELECT USING (true);

CREATE POLICY "Creators can manage their own tiers" ON subscription_tiers
  FOR ALL USING (true);

-- Subscriptions: users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (true);

CREATE POLICY "Users can create subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (true);

-- Creator videos: public read (metadata), access control via function
CREATE POLICY "Creator videos metadata is viewable by everyone" ON creator_videos
  FOR SELECT USING (true);

CREATE POLICY "Creators can manage their own videos" ON creator_videos
  FOR ALL USING (true);

-- Subscription payments: users can view their own payments
CREATE POLICY "Users can view their own subscription payments" ON subscription_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_payments.subscription_id
      AND s.subscriber_telegram_id::text = COALESCE(current_setting('app.telegram_id', true), '0')
    )
  );

-- Video views: public insert (for analytics)
CREATE POLICY "Anyone can track video views" ON video_views
  FOR INSERT WITH CHECK (true);
