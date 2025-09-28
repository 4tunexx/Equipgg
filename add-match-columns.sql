-- Add missing columns to matches table for winner tracking
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_a_score INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_b_score INTEGER;

-- Update any existing finished matches to have proper winner data
-- This will be handled by the processMatchResults function