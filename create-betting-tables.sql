-- Drop existing tables if they exist (to ensure clean recreation)
DROP TABLE IF EXISTS user_bets CASCADE;
DROP TABLE IF EXISTS match_votes CASCADE;

-- Create user_bets table for storing betting transactions
CREATE TABLE user_bets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_choice TEXT NOT NULL CHECK (team_choice IN ('team_a', 'team_b')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    odds DECIMAL(5,2) NOT NULL,
    potential_payout DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'cancelled')),
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create match_votes table for storing match predictions
CREATE TABLE match_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    prediction TEXT NOT NULL CHECK (prediction IN ('team_a', 'team_b')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, match_id) -- One vote per user per match
);

-- Add indexes for better performance
CREATE INDEX idx_user_bets_user_id ON user_bets(user_id);
CREATE INDEX idx_user_bets_match_id ON user_bets(match_id);
CREATE INDEX idx_user_bets_status ON user_bets(status);
CREATE INDEX idx_match_votes_user_id ON match_votes(user_id);
CREATE INDEX idx_match_votes_match_id ON match_votes(match_id);

-- Enable RLS
ALTER TABLE user_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_bets
CREATE POLICY "Users can view their own bets" ON user_bets
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own bets" ON user_bets
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own active bets" ON user_bets
    FOR UPDATE USING (auth.uid()::text = user_id::text AND status = 'active');

CREATE POLICY "Admins can manage all bets" ON user_bets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- RLS Policies for match_votes
CREATE POLICY "Users can view all match votes" ON match_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own votes" ON match_votes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own votes" ON match_votes
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can manage all votes" ON match_votes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );