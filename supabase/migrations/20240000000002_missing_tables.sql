-- Missing tables for full functionality

-- Provably Fair System Tables
CREATE TABLE server_seeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hashed_seed TEXT NOT NULL,
    revealed_seed TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revealed_at TIMESTAMPTZ
);

CREATE TABLE client_seeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    seed TEXT NOT NULL,
    nonce INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE game_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id),
    game_type TEXT NOT NULL,
    server_seed_id UUID REFERENCES server_seeds(id),
    server_seed_hash TEXT NOT NULL,
    client_seed TEXT NOT NULL,
    nonce INTEGER NOT NULL,
    bet_amount INTEGER NOT NULL,
    result JSONB NOT NULL,
    payout INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game History Tables
CREATE TABLE crash_game_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    game_id TEXT NOT NULL,
    bet_amount INTEGER NOT NULL,
    multiplier DECIMAL,
    cashed_out_at DECIMAL,
    winnings INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coinflip_lobbies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES users(id),
    bet_amount INTEGER NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('heads', 'tails')),
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
    opponent_id UUID REFERENCES users(id),
    winner_id UUID REFERENCES users(id),
    result TEXT CHECK (result IN ('heads', 'tails')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Settings Table
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mission Progress Table (more detailed than user_missions)
CREATE TABLE mission_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    mission_id UUID REFERENCES missions(id),
    progress_data JSONB DEFAULT '{}',
    current_progress INTEGER DEFAULT 0,
    max_progress INTEGER DEFAULT 1,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, mission_id)
);

-- User Inventory Table (different from inventory_items for quantity tracking)
CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    item_id UUID REFERENCES items(id),
    quantity INTEGER DEFAULT 1,
    obtained_from TEXT, -- 'crate', 'shop', 'mission', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Betting History Table
CREATE TABLE betting_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    match_id UUID REFERENCES matches(id),
    team_bet_on UUID REFERENCES teams(id),
    bet_amount INTEGER NOT NULL,
    potential_winnings INTEGER NOT NULL,
    actual_winnings INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing tables
ALTER TABLE matches ADD COLUMN IF NOT EXISTS pandascore_id INTEGER UNIQUE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner TEXT CHECK (winner IN ('team_a', 'team_b'));

-- Update missions table structure to match what's being used
ALTER TABLE missions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'daily';
ALTER TABLE missions ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS crate_reward TEXT;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{}';

-- Add user role column for admin functions  
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_server_seeds_active ON server_seeds(is_active);
CREATE INDEX IF NOT EXISTS idx_game_results_user_id ON game_results(user_id);
CREATE INDEX IF NOT EXISTS idx_game_results_game_type ON game_results(game_type);
CREATE INDEX IF NOT EXISTS idx_crash_game_history_user_id ON crash_game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_coinflip_lobbies_status ON coinflip_lobbies(status);
CREATE INDEX IF NOT EXISTS idx_mission_progress_user_id ON mission_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_betting_history_user_id ON betting_history(user_id);
CREATE INDEX IF NOT EXISTS idx_betting_history_match_id ON betting_history(match_id);

-- Add triggers for updated_at columns
CREATE TRIGGER set_timestamp_coinflip_lobbies
    BEFORE UPDATE ON coinflip_lobbies
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_site_settings
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_mission_progress
    BEFORE UPDATE ON mission_progress
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_user_inventory
    BEFORE UPDATE ON user_inventory
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_betting_history
    BEFORE UPDATE ON betting_history
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Enable RLS on new tables
ALTER TABLE server_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE crash_game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE coinflip_lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE betting_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Server seeds are public readable
CREATE POLICY "Everyone can read server seeds" ON server_seeds FOR SELECT USING (true);

-- Client seeds are private to the user
CREATE POLICY "Users can manage own client seeds" ON client_seeds
    FOR ALL USING (auth.uid() = user_id);

-- Game results are private to the user
CREATE POLICY "Users can read own game results" ON game_results
    FOR SELECT USING (auth.uid() = user_id);

-- Crash game history is private to the user
CREATE POLICY "Users can read own crash history" ON crash_game_history
    FOR SELECT USING (auth.uid() = user_id);

-- Coinflip lobbies are public readable, but only creator can modify
CREATE POLICY "Everyone can read coinflip lobbies" ON coinflip_lobbies FOR SELECT USING (true);
CREATE POLICY "Creators can manage own lobbies" ON coinflip_lobbies
    FOR ALL USING (auth.uid() = creator_id);

-- Site settings are public readable
CREATE POLICY "Everyone can read site settings" ON site_settings FOR SELECT USING (true);

-- Mission progress is private to the user
CREATE POLICY "Users can read own mission progress" ON mission_progress
    FOR ALL USING (auth.uid() = user_id);

-- User inventory is private to the user
CREATE POLICY "Users can read own inventory" ON user_inventory
    FOR ALL USING (auth.uid() = user_id);

-- Betting history is private to the user
CREATE POLICY "Users can read own betting history" ON betting_history
    FOR SELECT USING (auth.uid() = user_id);