-- Add missing columns to matches table for winner tracking
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_a_score INTEGER DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_b_score INTEGER DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_winner ON matches(winner);
CREATE INDEX IF NOT EXISTS idx_matches_completed_at ON matches(completed_at);

-- Update RLS policies to allow admin updates to winner fields
DROP POLICY IF EXISTS "Allow admins to manage matches" ON matches;
CREATE POLICY "Allow admins to manage matches" ON matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );