-- Fix Steam Authentication Columns
-- Run this in Supabase SQL Editor to fix the missing column errors

-- Add missing Steam authentication columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS displayname TEXT;

-- Ensure all users have required fields for authentication
UPDATE users 
SET 
  steam_verified = COALESCE(steam_verified, false),
  account_status = COALESCE(account_status, 'active'),
  displayname = COALESCE(displayname, username, email, 'User')
WHERE 
  steam_verified IS NULL 
  OR account_status IS NULL 
  OR displayname IS NULL;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id) WHERE steam_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_steam_verified ON users(steam_verified) WHERE steam_verified = true;
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- Add unique constraint for steam_id
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

-- Verify the fix
SELECT 'Steam authentication columns added successfully!' as status;