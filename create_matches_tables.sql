-- Add missing columns to users table for Steam verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email';

-- Create matches table for Pandascore integration
CREATE TABLE matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    team1_name TEXT NOT NULL,
    team1_logo TEXT,
    team1_odds NUMERIC(5,2) DEFAULT 1.0,
    team2_name TEXT NOT NULL,
    team2_logo TEXT,
    team2_odds NUMERIC(5,2) DEFAULT 1.0,
    event_name TEXT NOT NULL,
    map TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    stream_url TEXT,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
    pandascore_id INTEGER UNIQUE,
    is_visible BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_rewards table for reward system
CREATE TABLE user_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('login_bonus', 'level_up', 'achievement', 'referral', 'purchase', 'event')),
    trigger_condition TEXT,
    reward_coins INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    reward_gems INTEGER DEFAULT 0,
    reward_item TEXT,
    is_active BOOLEAN DEFAULT true,
    max_claims_per_user INTEGER DEFAULT 1,
    cooldown_hours INTEGER DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_reward_claims table to track claims
CREATE TABLE user_reward_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES user_rewards(id) ON DELETE CASCADE,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_bets table for betting system
CREATE TABLE user_bets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_bet TEXT NOT NULL CHECK (team_bet IN ('team1', 'team2')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    odds DECIMAL(5,2) NOT NULL CHECK (odds > 1.0),
    potential_winnings DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_matches_scheduled_at ON matches(scheduled_at);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_pandascore_id ON matches(pandascore_id);
CREATE INDEX idx_matches_visible ON matches(is_visible);
CREATE INDEX idx_user_rewards_active ON user_rewards(is_active);
CREATE INDEX idx_user_reward_claims_user ON user_reward_claims(user_id);
CREATE INDEX idx_user_reward_claims_reward ON user_reward_claims(reward_id);
CREATE INDEX idx_user_bets_user ON user_bets(user_id);
CREATE INDEX idx_user_bets_match ON user_bets(match_id);
CREATE INDEX idx_user_bets_status ON user_bets(status);

-- Create unique index to allow only one claim per user per reward per day
CREATE UNIQUE INDEX idx_user_reward_claims_unique_daily 
ON user_reward_claims(user_id, reward_id);

-- Enable RLS (Row Level Security)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bets ENABLE ROW LEVEL SECURITY;

-- Create policies (allow read for all authenticated users, write for admins)
CREATE POLICY "Allow authenticated users to read matches" ON matches
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage matches" ON matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Allow authenticated users to read user_rewards" ON user_rewards
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage user_rewards" ON user_rewards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Allow users to manage their own bets" ON user_bets
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Allow admins to view all bets" ON user_bets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );