-- Fix users table - Add missing steam_id and other Steam verification columns
-- This addresses the "column users.steam_id does not exist" error in production

-- Add missing Steam authentication columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_trade_url TEXT;

-- Create indexes for better performance on Steam lookups
CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id) WHERE steam_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_steam_verified ON users(steam_verified) WHERE steam_verified = true;
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- Add constraints to ensure data integrity
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

-- Update existing users with default values if needed
UPDATE users 
SET 
  steam_verified = COALESCE(steam_verified, false),
  account_status = COALESCE(account_status, 'pending')
WHERE 
  steam_verified IS NULL 
  OR account_status IS NULL;

-- Ensure the users table has all required columns for the application
-- Based on the DBUser interface and Steam authentication requirements
DO $$
BEGIN
    -- Check and add username column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
        ALTER TABLE users ADD COLUMN username TEXT;
    END IF;
    
    -- Check and add avatar column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar') THEN
        ALTER TABLE users ADD COLUMN avatar TEXT;
    END IF;
    
    -- Check and add coins column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'coins') THEN
        ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 1000;
    END IF;
    
    -- Check and add xp column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'xp') THEN
        ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0;
    END IF;
    
    -- Check and add level column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'level') THEN
        ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;
    END IF;
    
    -- Check and add wins column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'wins') THEN
        ALTER TABLE users ADD COLUMN wins INTEGER DEFAULT 0;
    END IF;
    
    -- Check and add matches_played column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'matches_played') THEN
        ALTER TABLE users ADD COLUMN matches_played INTEGER DEFAULT 0;
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;