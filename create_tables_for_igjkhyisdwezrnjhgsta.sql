-- Create tables for moqt-glas voting app in project igjkhyisdwezrnjhgsta
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/igjkhyisdwezrnjhgsta/sql/new

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create voting_user_profiles table (main user profiles)
CREATE TABLE IF NOT EXISTS public.voting_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  telegram_id BIGINT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  username TEXT,
  photo_url TEXT,
  email TEXT,
  phone TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  role TEXT DEFAULT 'voter' CHECK (role IN ('voter', 'admin', 'moderator')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  last_vote_at TIMESTAMPTZ
);

-- Create voters table (for backward compatibility)
CREATE TABLE IF NOT EXISTS public.voters (
  telegram_id BIGINT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  username TEXT UNIQUE,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_vote_at TIMESTAMPTZ,
  voting_user_id UUID REFERENCES public.voting_user_profiles(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_voters_voting_user_id ON public.voters(voting_user_id);
CREATE INDEX IF NOT EXISTS idx_voting_user_profiles_telegram_id ON public.voting_user_profiles(telegram_id);

-- Enable RLS
ALTER TABLE public.voting_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow service role (used by backend) to do everything
-- Service role bypasses RLS, but we still need policies for anon key if used
-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Service role can do everything on voting_user_profiles" ON public.voting_user_profiles;
CREATE POLICY "Service role can do everything on voting_user_profiles"
  ON public.voting_user_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can do everything on voters" ON public.voters;
CREATE POLICY "Service role can do everything on voters"
  ON public.voters
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to get or create voting user from Telegram
CREATE OR REPLACE FUNCTION public.get_or_create_voting_user_from_telegram(
  p_telegram_id BIGINT,
  p_first_name TEXT,
  p_last_name TEXT DEFAULT NULL,
  p_username TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL
)
RETURNS public.voting_user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user public.voting_user_profiles;
BEGIN
  -- Try to find existing user
  SELECT * INTO v_user
  FROM public.voting_user_profiles
  WHERE telegram_id = p_telegram_id
  LIMIT 1;

  -- If user exists, update last login and return
  IF v_user IS NOT NULL THEN
    UPDATE public.voting_user_profiles
    SET last_login_at = now(),
        updated_at = now(),
        first_name = p_first_name,
        last_name = COALESCE(p_last_name, last_name),
        username = COALESCE(p_username, username),
        photo_url = COALESCE(p_photo_url, photo_url)
    WHERE id = v_user.id
    RETURNING * INTO v_user;
    RETURN v_user;
  END IF;

  -- Create new user
  INSERT INTO public.voting_user_profiles (
    telegram_id,
    first_name,
    last_name,
    username,
    photo_url,
    is_verified,
    is_active,
    last_login_at
  )
  VALUES (
    p_telegram_id,
    p_first_name,
    p_last_name,
    p_username,
    p_photo_url,
    true,
    true,
    now()
  )
  RETURNING * INTO v_user;

  -- Also create/update voter record for backward compatibility
  INSERT INTO public.voters (
    telegram_id,
    first_name,
    last_name,
    username,
    photo_url,
    voting_user_id
  )
  VALUES (
    p_telegram_id,
    p_first_name,
    p_last_name,
    p_username,
    p_photo_url,
    v_user.id
  )
  ON CONFLICT (telegram_id) DO UPDATE
  SET first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      username = EXCLUDED.username,
      photo_url = EXCLUDED.photo_url,
      voting_user_id = EXCLUDED.voting_user_id;

  RETURN v_user;
END;
$$;

-- Function to update user's last login
CREATE OR REPLACE FUNCTION public.update_voting_user_last_login(
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.voting_user_profiles
  SET last_login_at = now(),
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_voting_user_from_telegram TO service_role;
GRANT EXECUTE ON FUNCTION public.update_voting_user_last_login TO service_role;
