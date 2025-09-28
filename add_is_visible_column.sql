-- Add is_visible column to existing matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT false;

-- Optional: Make all upcoming matches visible by default
-- Uncomment the line below if you want all existing upcoming matches to be visible
-- UPDATE matches SET is_visible = true WHERE status = 'upcoming';