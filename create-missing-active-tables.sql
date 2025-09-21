-- Create Missing Active Tables for EquipGG
-- This script creates tables that are actively used by the website code but may not exist in the database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================
-- CHAT SYSTEM TABLES
-- ===============================

-- Chat channels
CREATE TABLE IF NOT EXISTS chat_channels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    max_members INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, image, system, etc.
    lobby VARCHAR(50), -- for game-specific chat
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat user status
CREATE TABLE IF NOT EXISTS chat_user_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'online', -- online, away, offline
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT false,
    UNIQUE(user_id, channel_id)
);

-- Chat user read status
CREATE TABLE IF NOT EXISTS chat_user_read_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
    last_read_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, channel_id)
);

-- ===============================
-- TRANSACTION SYSTEM TABLES
-- ===============================

-- Main transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- deposit, withdrawal, purchase, bet, win, etc.
    amount INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'coins', -- coins, gems, usd
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, cancelled
    description TEXT,
    reference_id VARCHAR(100), -- external reference (payment processor, etc.)
    metadata JSONB, -- additional data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- User transactions (more detailed)
CREATE TABLE IF NOT EXISTS user_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'coins',
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    reference_type VARCHAR(50), -- game, purchase, bet, etc.
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User balances (for multiple currencies)
CREATE TABLE IF NOT EXISTS user_balances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,
    balance INTEGER DEFAULT 0,
    locked_balance INTEGER DEFAULT 0, -- for pending transactions
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- ===============================
-- SUPPORT SYSTEM TABLES
-- ===============================

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general', -- general, technical, billing, etc.
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    status VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved, closed
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Support ticket replies
CREATE TABLE IF NOT EXISTS support_ticket_replies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_staff_reply BOOLEAN DEFAULT false,
    attachments JSONB, -- file attachments
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- TRADING SYSTEM TABLES
-- ===============================

-- Trade offers
CREATE TABLE IF NOT EXISTS trade_offers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, cancelled, expired
    sender_items JSONB, -- items offered by sender
    receiver_items JSONB, -- items requested from receiver
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade offer items (detailed)
CREATE TABLE IF NOT EXISTS trade_offer_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trade_offer_id UUID REFERENCES trade_offers(id) ON DELETE CASCADE,
    user_inventory_id UUID REFERENCES user_inventory(id) ON DELETE CASCADE,
    is_sender_item BOOLEAN NOT NULL, -- true if sender's item, false if receiver's
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade offer requests (for public trade requests)
CREATE TABLE IF NOT EXISTS trade_offer_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    offering_items JSONB,
    requesting_items JSONB,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade history
CREATE TABLE IF NOT EXISTS trade_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trade_offer_id UUID REFERENCES trade_offers(id) ON DELETE SET NULL,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    items_exchanged JSONB,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- VOTING/POLLING SYSTEM TABLES
-- ===============================

-- Polls
CREATE TABLE IF NOT EXISTS polls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    poll_type VARCHAR(50) DEFAULT 'general', -- general, match_prediction, etc.
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll options
CREATE TABLE IF NOT EXISTS poll_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    option_text VARCHAR(200) NOT NULL,
    option_order INTEGER DEFAULT 0,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll votes
CREATE TABLE IF NOT EXISTS poll_votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, user_id)
);

-- Match predictions
CREATE TABLE IF NOT EXISTS match_predictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    predicted_winner VARCHAR(50) NOT NULL,
    confidence_level INTEGER DEFAULT 50, -- 1-100
    bet_amount INTEGER DEFAULT 0,
    potential_winnings INTEGER DEFAULT 0,
    is_correct BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, match_id)
);

-- ===============================
-- PAYMENT SYSTEM TABLES
-- ===============================

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL, -- stripe, paypal, crypto, etc.
    payment_processor_id VARCHAR(200), -- external payment ID
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    coins_amount INTEGER, -- coins purchased
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ===============================
-- ADDITIONAL SYSTEM TABLES
-- ===============================

-- Admin logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50), -- user, item, etc.
    target_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User crates (owned crates)
CREATE TABLE IF NOT EXISTS user_crates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crate_id UUID REFERENCES crates(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    obtained_from VARCHAR(50), -- purchase, reward, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mission progress (detailed tracking)
CREATE TABLE IF NOT EXISTS mission_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    target INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, mission_id)
);

-- User perk claims
CREATE TABLE IF NOT EXISTS user_perk_claims (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    perk_id UUID REFERENCES perks(id) ON DELETE CASCADE,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, perk_id)
);

-- Coinflip games
CREATE TABLE IF NOT EXISTS coinflip_games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joiner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    bet_amount INTEGER NOT NULL,
    creator_side VARCHAR(10) NOT NULL, -- heads, tails
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    result VARCHAR(10), -- heads, tails
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, active, completed, cancelled
    hash VARCHAR(64), -- for provably fair
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- User profiles (extended profile info)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    location VARCHAR(100),
    website VARCHAR(200),
    social_links JSONB,
    privacy_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Profiles (alternative profile table)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User API keys
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(64) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL,
    permissions JSONB,
    last_used TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Landing panels
CREATE TABLE IF NOT EXISTS landing_panels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200),
    content TEXT,
    image_url TEXT,
    button_text VARCHAR(100),
    button_url TEXT,
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Steam bot config
CREATE TABLE IF NOT EXISTS steam_bot_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bot_name VARCHAR(100) NOT NULL,
    steam_id VARCHAR(20) UNIQUE NOT NULL,
    api_key VARCHAR(100),
    trade_url TEXT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Landing sliders
CREATE TABLE IF NOT EXISTS landing_sliders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    button_text VARCHAR(100),
    button_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User events (for tracking user activities)
CREATE TABLE IF NOT EXISTS user_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- CREATE INDEXES FOR PERFORMANCE
-- ===============================

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_lobby ON chat_messages(lobby);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_user_transactions_user_id ON user_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);

-- Support indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_replies_ticket_id ON support_ticket_replies(ticket_id);

-- Trading indexes
CREATE INDEX IF NOT EXISTS idx_trade_offers_sender_id ON trade_offers(sender_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_receiver_id ON trade_offers(receiver_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_status ON trade_offers(status);

-- Voting indexes
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_match_predictions_user_id ON match_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_match_predictions_match_id ON match_predictions(match_id);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Other indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_crates_user_id ON user_crates(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_progress_user_id ON mission_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_perk_claims_user_id ON user_perk_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_coinflip_games_creator_id ON coinflip_games(creator_id);
CREATE INDEX IF NOT EXISTS idx_coinflip_games_status ON coinflip_games(status);
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON user_events(event_type);

-- ===============================
-- INSERT DEFAULT DATA
-- ===============================

-- Insert default chat channel
INSERT INTO chat_channels (name, description, is_public) VALUES 
('General', 'General discussion channel', true),
('Trading', 'Trading and marketplace discussion', true),
('Support', 'Get help from staff and community', true)
ON CONFLICT DO NOTHING;

-- Insert default landing panels
INSERT INTO landing_panels (type, title, content, display_order, is_active) VALUES 
('hero', 'Welcome to EquipGG', 'The ultimate destination for CS2 gaming and trading', 1, true),
('features', 'Game Features', 'Experience exciting games with fair and transparent gameplay', 2, true),
('stats', 'Platform Statistics', 'Join thousands of active players in our community', 3, true)
ON CONFLICT DO NOTHING;

COMMIT;

-- Success message
SELECT 'All missing active tables have been created successfully!' as result;