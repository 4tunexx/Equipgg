-- Profile System Database Schema
-- Run this SQL to add all required tables and columns for the profile system

-- Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_match_reminders BOOLEAN DEFAULT true,
  push_match_reminders BOOLEAN DEFAULT true,
  email_bet_results BOOLEAN DEFAULT false,
  push_bet_results BOOLEAN DEFAULT true,
  email_level_up BOOLEAN DEFAULT false,
  push_level_up BOOLEAN DEFAULT true,
  email_promotions BOOLEAN DEFAULT true,
  push_promotions BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create gem_transactions table
CREATE TABLE IF NOT EXISTS gem_transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'purchase', 'exchange', 'reward'
  description TEXT,
  balance_after INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id SERIAL PRIMARY KEY,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_showcase table (for profile card customization)
CREATE TABLE IF NOT EXISTS user_showcase (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER REFERENCES achievements(id) ON DELETE SET NULL,
  item_id_1 TEXT,
  item_id_2 TEXT,
  item_id_3 TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_gem_transactions_user_id ON gem_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_gem_transactions_created_at ON gem_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at DESC);

-- Create RLS policies for security
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE gem_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_showcase ENABLE ROW LEVEL SECURITY;

-- Notification preferences policies
CREATE POLICY "Users can view own notification prefs" 
  ON user_notification_preferences FOR SELECT 
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own notification prefs" 
  ON user_notification_preferences FOR UPDATE 
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own notification prefs" 
  ON user_notification_preferences FOR INSERT 
  WITH CHECK (user_id::text = auth.uid()::text);

-- Gem transactions policies
CREATE POLICY "Users can view own gem transactions" 
  ON gem_transactions FOR SELECT 
  USING (user_id::text = auth.uid()::text);

-- Direct messages policies
CREATE POLICY "Users can view messages they sent or received" 
  ON direct_messages FOR SELECT 
  USING (sender_id::text = auth.uid()::text OR receiver_id::text = auth.uid()::text);

CREATE POLICY "Users can send messages" 
  ON direct_messages FOR INSERT 
  WITH CHECK (sender_id::text = auth.uid()::text);

-- User showcase policies
CREATE POLICY "Users can view anyone's showcase" 
  ON user_showcase FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own showcase" 
  ON user_showcase FOR UPDATE 
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own showcase" 
  ON user_showcase FOR INSERT 
  WITH CHECK (user_id::text = auth.uid()::text);

-- Database functions
CREATE OR REPLACE FUNCTION increment_user_gems(p_user_id TEXT, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET gems = COALESCE(gems, 0) + p_amount 
  WHERE id = p_user_id;
  
  -- Log the transaction
  INSERT INTO gem_transactions (user_id, amount, type, description, balance_after)
  SELECT p_user_id, p_amount, 'system', 'Gem adjustment', 
         (SELECT gems FROM users WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE user_notification_preferences IS 'Stores user notification preferences for email and push notifications';
COMMENT ON TABLE gem_transactions IS 'Tracks all gem purchases, exchanges, and rewards';
COMMENT ON TABLE direct_messages IS 'Private messages between users';
COMMENT ON TABLE user_showcase IS 'Items and achievements displayed on user profile card';

