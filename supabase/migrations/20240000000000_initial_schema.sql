-- Enable UUID extension for unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE rarity_enum AS ENUM ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary');
CREATE TYPE match_status_enum AS ENUM ('Upcoming', 'Live', 'Finished');

-- Create base tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    steam_id TEXT UNIQUE,
    username TEXT NOT NULL,
    avatar TEXT,
    coins BIGINT DEFAULT 0,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    wins INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    rarity rarity_enum NOT NULL,
    image TEXT,
    data_ai_hint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    item_id UUID REFERENCES items(id),
    equipped BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    xp_reward INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    achievement_id UUID REFERENCES achievements(id),
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE crates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crate_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crate_id UUID REFERENCES crates(id),
    item_id UUID REFERENCES items(id),
    drop_chance DECIMAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    xp_reward INTEGER DEFAULT 0,
    coin_reward INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    mission_id UUID REFERENCES missions(id),
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, mission_id)
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo TEXT,
    data_ai_hint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team1_id UUID REFERENCES teams(id),
    team2_id UUID REFERENCES teams(id),
    odds1 DECIMAL,
    odds2 DECIMAL,
    tournament TEXT,
    event_name TEXT,
    start_time TIMESTAMPTZ,
    map TEXT,
    status match_status_enum DEFAULT 'Upcoming',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shop_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    item_id UUID REFERENCES items(id),
    stock INTEGER DEFAULT -1, -- -1 means unlimited
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    item_id UUID REFERENCES items(id),
    xp INTEGER,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_missions_user_id ON user_missions(user_id);
CREATE INDEX idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_start_time ON matches(start_time);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can only read their own inventory
CREATE POLICY "Users can read own inventory" ON inventory_items
    FOR ALL
    USING (auth.uid() = user_id);

-- Users can only read their own achievements
CREATE POLICY "Users can read own achievements" ON user_achievements
    FOR ALL
    USING (auth.uid() = user_id);

-- Users can only read their own missions
CREATE POLICY "Users can read own missions" ON user_missions
    FOR ALL
    USING (auth.uid() = user_id);

-- Users can only read their own activity feed
CREATE POLICY "Users can read own activity feed" ON activity_feed
    FOR SELECT
    USING (auth.uid() = user_id);

-- Everyone can read public data
CREATE POLICY "Everyone can read items" ON items FOR SELECT USING (true);
CREATE POLICY "Everyone can read crates" ON crates FOR SELECT USING (true);
CREATE POLICY "Everyone can read missions" ON missions FOR SELECT USING (true);
CREATE POLICY "Everyone can read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Everyone can read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Everyone can read shop items" ON shop_items FOR SELECT USING (true);