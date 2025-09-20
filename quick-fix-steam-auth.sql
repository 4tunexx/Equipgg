-- QUICK FIX: Add Steam authentication columns to users table
-- Copy and paste this entire SQL block into Supabase SQL Editor

-- Add missing Steam authentication columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_trade_url TEXT;

-- Add other required user columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 1000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS matches_played INTEGER DEFAULT 0;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id) WHERE steam_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_steam_verified ON users(steam_verified) WHERE steam_verified = true;
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- Add unique constraint for steam_id (PostgreSQL compatible)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_steam_id' 
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users ADD CONSTRAINT unique_steam_id UNIQUE(steam_id);
    END IF;
END $$;

-- Update existing users with default values
UPDATE users 
SET 
  steam_verified = COALESCE(steam_verified, false),
  account_status = COALESCE(account_status, 'pending'),
  coins = COALESCE(coins, 1000),
  xp = COALESCE(xp, 0),
  level = COALESCE(level, 1),
  wins = COALESCE(wins, 0),
  matches_played = COALESCE(matches_played, 0)
WHERE 
  steam_verified IS NULL 
  OR account_status IS NULL 
  OR coins IS NULL 
  OR xp IS NULL 
  OR level IS NULL 
  OR wins IS NULL 
  OR matches_played IS NULL;

-- Verify the table structure (optional - shows what columns exist)
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;