-- USERS TABLE COLUMN FIXES ONLY
-- All tables exist, but users table is missing VIP and other columns

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_tier TEXT DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing users with default values
UPDATE users SET vip_tier = 'none' WHERE vip_tier IS NULL;
UPDATE users SET balance = coins WHERE balance = 0 OR balance IS NULL;
UPDATE users SET last_login = last_login_at WHERE last_login IS NULL;
UPDATE users SET is_active = CASE 
  WHEN account_status = 'active' OR account_status = 'verified' THEN true 
  ELSE false 
END WHERE is_active IS NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_vip_tier ON users(vip_tier);
CREATE INDEX IF NOT EXISTS idx_users_vip_expires ON users(vip_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance);