-- ================================================
-- EQUIPGG - MISSING DATABASE SCHEMA
-- Run this SQL in your Supabase SQL Editor
-- ================================================

-- ============================================
-- 1. REFERRAL & LOYALTY SYSTEM TABLES
-- ============================================

-- Referral codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_personal BOOLEAN DEFAULT true,
  uses INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 9999,
  reward_type TEXT DEFAULT 'standard',
  expires_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Referral uses tracking
CREATE TABLE IF NOT EXISTS public.referral_uses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  referral_code_id TEXT NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  referrer_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rewards_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Loyalty points log
CREATE TABLE IF NOT EXISTS public.loyalty_points_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  balance INTEGER NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. TOURNAMENT SYSTEM TABLES
-- ============================================

-- Tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss')),
  game_type TEXT NOT NULL CHECK (game_type IN ('crash', 'coinflip', 'plinko', 'sweeper', 'mixed')),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration', 'in_progress', 'completed', 'cancelled')),
  start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  end_time TIMESTAMP WITHOUT TIME ZONE,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  entry_fee INTEGER DEFAULT 0,
  prize_pool INTEGER DEFAULT 0,
  prizes JSONB DEFAULT '[]'::jsonb,
  rules JSONB DEFAULT '[]'::jsonb,
  created_by TEXT NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tournament participants
CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tournament_id TEXT NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seed INTEGER,
  current_round INTEGER DEFAULT 0,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'active', 'eliminated', 'winner', 'disqualified')),
  points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  position INTEGER,
  registered_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Tournament matches
CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tournament_id TEXT NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id TEXT NOT NULL REFERENCES public.users(id),
  player2_id TEXT NOT NULL REFERENCES public.users(id),
  winner_id TEXT REFERENCES public.users(id),
  score_player1 INTEGER,
  score_player2 INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  scheduled_time TIMESTAMP WITHOUT TIME ZONE,
  completed_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Escrow releases for trades
CREATE TABLE IF NOT EXISTS public.escrow_releases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  trade_id TEXT NOT NULL REFERENCES public.trade_offers(id) ON DELETE CASCADE,
  release_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. MISSING USER COLUMNS
-- ============================================

-- Add loyalty and referral columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_tier INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_loyalty_claim TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_trades INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_trade_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS trade_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trade_ban_reason TEXT,
ADD COLUMN IF NOT EXISTS coins_in_escrow INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS vip_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS displayName TEXT;

-- ============================================
-- 4. MISSING INVENTORY COLUMNS
-- ============================================

-- Add escrow columns to user_inventory
ALTER TABLE public.user_inventory
ADD COLUMN IF NOT EXISTS in_escrow BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS escrow_locked_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS traded_at TIMESTAMP WITHOUT TIME ZONE;

-- ============================================
-- 5. PAYMENT INTENTS COLUMNS
-- ============================================

-- Add missing payment columns
ALTER TABLE public.payment_intents
ADD COLUMN IF NOT EXISTS package_id TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITHOUT TIME ZONE;

-- ============================================
-- 6. TRADE OFFERS COLUMNS
-- ============================================

-- Add missing trade columns
ALTER TABLE public.trade_offers
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS sender_value INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS receiver_value INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS message TEXT;

-- ============================================
-- 7. FRAUD DETECTION TABLES
-- ============================================

-- Fraud alerts table
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT false,
  resolved_by TEXT REFERENCES public.users(id),
  resolved_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Job queue for async tasks
CREATE TABLE IF NOT EXISTS public.job_queue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_for TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITHOUT TIME ZONE,
  completed_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Error logs
CREATE TABLE IF NOT EXISTS public.error_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id TEXT REFERENCES public.users(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- User activity tracking
CREATE TABLE IF NOT EXISTS public.user_activity (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

-- Referral indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_uses_referrer ON public.referral_uses(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_uses_referred ON public.referral_uses(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_log_user ON public.loyalty_points_log(user_id);

-- Tournament indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_time ON public.tournaments(start_time);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON public.tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON public.tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON public.tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON public.tournament_matches(status);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_steam_id ON public.users(steam_id);
CREATE INDEX IF NOT EXISTS idx_users_loyalty_tier ON public.users(loyalty_tier);
CREATE INDEX IF NOT EXISTS idx_users_total_trades ON public.users(total_trades);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_in_escrow ON public.user_inventory(in_escrow);
CREATE INDEX IF NOT EXISTS idx_user_inventory_item_id ON public.user_inventory(item_id);

-- Trade indexes
CREATE INDEX IF NOT EXISTS idx_trade_offers_sender ON public.trade_offers(sender_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_receiver ON public.trade_offers(receiver_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_status ON public.trade_offers(status);
CREATE INDEX IF NOT EXISTS idx_trade_offers_created ON public.trade_offers(created_at);

-- Mission indexes
CREATE INDEX IF NOT EXISTS idx_user_mission_progress_user ON public.user_mission_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mission_progress_completed ON public.user_mission_progress(completed);
CREATE INDEX IF NOT EXISTS idx_missions_type ON public.missions(mission_type);
CREATE INDEX IF NOT EXISTS idx_missions_active ON public.missions(is_active);

-- Match indexes
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON public.matches(match_date);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payment_intents_user ON public.payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON public.payment_intents(status);

-- Activity indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON public.user_activity(created_at);

-- ============================================
-- 9. ROW LEVEL SECURITY (ENABLE FOR PRODUCTION)
-- ============================================

-- Enable RLS on sensitive tables
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own referral data
DROP POLICY IF EXISTS "Users can view their own referral codes" ON public.referral_codes;
CREATE POLICY "Users can view their own referral codes" 
  ON public.referral_codes FOR SELECT 
  USING (auth.uid()::text = user_id);

-- Users can view their own loyalty data
DROP POLICY IF EXISTS "Users can view their own loyalty points" ON public.loyalty_points_log;
CREATE POLICY "Users can view their own loyalty points" 
  ON public.loyalty_points_log FOR SELECT 
  USING (auth.uid()::text = user_id);

-- Everyone can view active tournaments
DROP POLICY IF EXISTS "Everyone can view active tournaments" ON public.tournaments;
CREATE POLICY "Everyone can view active tournaments" 
  ON public.tournaments FOR SELECT 
  USING (status IN ('upcoming', 'registration', 'in_progress', 'completed'));

-- Users can view their own tournament participation
DROP POLICY IF EXISTS "Users can view their own tournament data" ON public.tournament_participants;
CREATE POLICY "Users can view their own tournament data" 
  ON public.tournament_participants FOR SELECT 
  USING (auth.uid()::text = user_id);

-- ============================================
-- DONE! ✅
-- ============================================

-- Run this message to confirm
SELECT 'DATABASE SCHEMA UPDATE COMPLETE! ✅' as status;
