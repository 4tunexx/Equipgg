-- CRITICAL DATABASE SCHEMA FIXES
-- Run these SQL statements in Supabase SQL Editor to fix website functionality

-- 1. Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_tier TEXT DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing users with default values
UPDATE users SET vip_tier = 'none' WHERE vip_tier IS NULL;
UPDATE users SET balance = coins WHERE balance = 0 OR balance IS NULL;
UPDATE users SET last_login = last_login_at WHERE last_login IS NULL;
UPDATE users SET is_active = CASE WHEN account_status = 'active' THEN true ELSE false END WHERE is_active IS NULL;

-- 2. Create trade_history table
CREATE TABLE IF NOT EXISTS trade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_offer_id UUID,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  items_exchanged JSONB DEFAULT '[]'::jsonb,
  trade_type TEXT DEFAULT 'item_trade',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create trade_offer_items table
CREATE TABLE IF NOT EXISTS trade_offer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES trade_offers(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create trade_offer_requests table
CREATE TABLE IF NOT EXISTS trade_offer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES trade_offers(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create match_predictions table
CREATE TABLE IF NOT EXISTS match_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  prediction TEXT NOT NULL CHECK (prediction IN ('team_a', 'team_b', 'draw')),
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  points_wagered INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- 6. Enable Row Level Security on new tables
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_offer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_offer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_predictions ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for trade_history
CREATE POLICY "Users can view own trade history" ON trade_history
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- 8. Create RLS policies for trade_offer_items
CREATE POLICY "Users can view trade offer items" ON trade_offer_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trade_offers 
      WHERE trade_offers.id = offer_id 
      AND (trade_offers.sender_id = auth.uid() OR trade_offers.receiver_id = auth.uid())
    )
  );

-- 9. Create RLS policies for trade_offer_requests
CREATE POLICY "Users can view trade offer requests" ON trade_offer_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trade_offers 
      WHERE trade_offers.id = offer_id 
      AND (trade_offers.sender_id = auth.uid() OR trade_offers.receiver_id = auth.uid())
    )
  );

-- 10. Create RLS policies for match_predictions
CREATE POLICY "Users can view own predictions" ON match_predictions
  FOR SELECT USING (user_id = auth.uid());
  
CREATE POLICY "Users can create predictions" ON match_predictions
  FOR INSERT WITH CHECK (user_id = auth.uid());
  
CREATE POLICY "Users can update own predictions" ON match_predictions
  FOR UPDATE USING (user_id = auth.uid());

-- 11. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_trade_history_sender ON trade_history(sender_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_receiver ON trade_history(receiver_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_completed ON trade_history(completed_at);

CREATE INDEX IF NOT EXISTS idx_trade_offer_items_offer ON trade_offer_items(offer_id);
CREATE INDEX IF NOT EXISTS idx_trade_offer_items_item ON trade_offer_items(item_id);

CREATE INDEX IF NOT EXISTS idx_trade_offer_requests_offer ON trade_offer_requests(offer_id);
CREATE INDEX IF NOT EXISTS idx_trade_offer_requests_item ON trade_offer_requests(item_id);

CREATE INDEX IF NOT EXISTS idx_match_predictions_user ON match_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_match_predictions_match ON match_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_match_predictions_created ON match_predictions(created_at);

CREATE INDEX IF NOT EXISTS idx_users_vip_tier ON users(vip_tier);
CREATE INDEX IF NOT EXISTS idx_users_vip_expires ON users(vip_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);