-- Create missing tables for EquipGG platform features
-- This script creates tables that are referenced in the API endpoints but may not exist yet

-- User inventory table for storing items from crates, trades, etc.
CREATE TABLE IF NOT EXISTS user_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_type TEXT NOT NULL DEFAULT 'skin', -- skin, sticker, case, etc.
    rarity TEXT, -- common, uncommon, rare, epic, legendary, etc.
    condition TEXT, -- factory_new, minimal_wear, etc.
    obtained_from TEXT, -- crate_opening, trade_up, purchase, etc.
    obtained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    equipped BOOLEAN DEFAULT FALSE,
    tradeable BOOLEAN DEFAULT TRUE,
    market_value INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Betting system tables
CREATE TABLE IF NOT EXISTS matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    external_id TEXT UNIQUE,
    team1_name TEXT NOT NULL,
    team2_name TEXT NOT NULL,
    team1_logo TEXT,
    team2_logo TEXT,
    tournament TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'upcoming', -- upcoming, live, finished, cancelled
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    winner TEXT, -- team1, team2, draw
    team1_odds DECIMAL(4,2) DEFAULT 2.0,
    team2_odds DECIMAL(4,2) DEFAULT 2.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    team TEXT NOT NULL, -- team1, team2
    bet_type TEXT DEFAULT 'match_winner',
    odds DECIMAL(4,2) NOT NULL,
    potential_winnings INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, won, lost, cancelled
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provably fair system
CREATE TABLE IF NOT EXISTS provably_fair_seeds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    server_seed TEXT NOT NULL,
    server_seed_hash TEXT NOT NULL,
    client_seed TEXT NOT NULL,
    nonce INTEGER DEFAULT 1,
    revealed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revealed_at TIMESTAMP WITH TIME ZONE
);

-- Game history for tracking all game plays
CREATE TABLE IF NOT EXISTS game_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL, -- crash, coinflip, plinko, sweeper
    bet_amount INTEGER NOT NULL,
    multiplier DECIMAL(10,2),
    payout INTEGER DEFAULT 0,
    profit INTEGER GENERATED ALWAYS AS (payout - bet_amount) STORED,
    game_data JSONB, -- Store game-specific data
    server_seed TEXT,
    client_seed TEXT,
    nonce INTEGER,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crates and case opening
CREATE TABLE IF NOT EXISTS crates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL CHECK (price > 0),
    currency TEXT DEFAULT 'coins', -- coins, gems
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    items JSONB, -- Store possible items and their probabilities
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crate_openings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crate_id UUID REFERENCES crates(id),
    cost INTEGER NOT NULL,
    item_won JSONB NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade-up contracts
CREATE TABLE IF NOT EXISTS trade_up_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    input_items JSONB NOT NULL, -- Array of item IDs/data
    result_item JSONB NOT NULL,
    contract_type TEXT DEFAULT 'standard',
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Steam bot specific tables
CREATE TABLE IF NOT EXISTS steam_bot_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_enabled BOOLEAN DEFAULT FALSE,
    steam_username TEXT,
    steam_password TEXT, -- Should be encrypted in production
    steam_api_key TEXT,
    trade_offer_message TEXT DEFAULT 'Trade from EquipGG.net',
    max_trade_value INTEGER DEFAULT 1000,
    auto_accept_gifts BOOLEAN DEFAULT FALSE,
    sync_interval INTEGER DEFAULT 300, -- seconds
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS steam_bot_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    steam_item_id TEXT UNIQUE NOT NULL,
    asset_id TEXT,
    name TEXT NOT NULL,
    market_name TEXT,
    type TEXT,
    rarity TEXT,
    exterior TEXT,
    image_url TEXT,
    gem_price INTEGER NOT NULL DEFAULT 0,
    market_value INTEGER DEFAULT 0,
    tradeable BOOLEAN DEFAULT TRUE,
    available BOOLEAN DEFAULT TRUE,
    reserved_by UUID REFERENCES users(id),
    reserved_until TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS steam_trade_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    steam_trade_offer_id TEXT,
    items JSONB NOT NULL,
    total_value INTEGER NOT NULL,
    gems_cost INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, sent, accepted, declined, expired, error
    steam_profile_url TEXT,
    trade_offer_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- VIP system
CREATE TABLE IF NOT EXISTS vip_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL, -- bronze, silver, gold, platinum
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    payment_method TEXT,
    amount_paid INTEGER,
    status TEXT DEFAULT 'active', -- active, expired, cancelled
    perks JSONB, -- Store VIP perks data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages/notifications system
CREATE TABLE IF NOT EXISTS user_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- system, promotion, warning, info
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Site settings for landing page customization
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    category TEXT DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_item_type ON user_inventory(item_type);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_match_id ON bets(match_id);
CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_game_type ON game_history(game_type);
CREATE INDEX IF NOT EXISTS idx_steam_bot_inventory_available ON steam_bot_inventory(available);
CREATE INDEX IF NOT EXISTS idx_steam_trade_offers_user_id ON steam_trade_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_steam_trade_offers_status ON steam_trade_offers(status);
CREATE INDEX IF NOT EXISTS idx_user_messages_user_id ON user_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_read ON user_messages(read);

-- Insert some default crates
INSERT INTO crates (name, description, price, currency, items) VALUES 
('Prime Crate', 'Contains rare CS2 skins and items', 100, 'coins', '[
  {"name": "AK-47 Redline", "rarity": "restricted", "chance": 0.3, "value": 50},
  {"name": "AWP Dragon Lore", "rarity": "covert", "chance": 0.05, "value": 500},
  {"name": "Karambit Fade", "rarity": "covert", "chance": 0.02, "value": 800},
  {"name": "M4A4 Howl", "rarity": "contraband", "chance": 0.01, "value": 1000},
  {"name": "Glock-18 Water Elemental", "rarity": "classified", "chance": 0.62, "value": 25}
]'::jsonb),
('Community Crate', 'Community-selected items with great value', 250, 'coins', '[
  {"name": "M4A1-S Knight", "rarity": "classified", "chance": 0.4, "value": 120},
  {"name": "AK-47 Fire Serpent", "rarity": "covert", "chance": 0.15, "value": 300},
  {"name": "Desert Eagle Blaze", "rarity": "restricted", "chance": 0.35, "value": 80},
  {"name": "Butterfly Knife Doppler", "rarity": "covert", "chance": 0.1, "value": 600}
]'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert default site settings
INSERT INTO site_settings (key, value, category, description) VALUES 
('hero_title', '"Welcome to EquipGG.net"', 'landing', 'Main hero section title'),
('hero_subtitle', '"The ultimate CS2 betting and trading platform"', 'landing', 'Hero section subtitle'),
('platform_enabled', 'true', 'general', 'Whether the platform is enabled'),
('maintenance_mode', 'false', 'general', 'Maintenance mode toggle'),
('max_bet_amount', '10000', 'betting', 'Maximum bet amount in coins'),
('min_bet_amount', '10', 'betting', 'Minimum bet amount in coins')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE user_inventory IS 'Stores user-owned items from various sources';
COMMENT ON TABLE bets IS 'User betting history and active bets';
COMMENT ON TABLE game_history IS 'Complete history of all game plays';
COMMENT ON TABLE steam_bot_inventory IS 'Items available in Steam bot for trading';
COMMENT ON TABLE steam_trade_offers IS 'Trade offers sent to users via Steam bot';