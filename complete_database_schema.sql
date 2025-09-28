-- Complete Database Schema for EquipGG
-- This file creates all missing tables for the admin and voting systems

-- Ranks table for user progression system (CS:GO style)
CREATE TABLE IF NOT EXISTS ranks (
    id TEXT PRIMARY KEY,
    rank_number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    tier TEXT NOT NULL CHECK (tier IN ('silver', 'gold_nova', 'master_guardian', 'legendary', 'global_elite')),
    min_level INTEGER NOT NULL,
    max_level INTEGER NOT NULL,
    icon_url TEXT,
    prestige_icon_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (min_level <= max_level)
);

-- Badges table for achievement system
CREATE TABLE IF NOT EXISTS badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL CHECK (category IN ('achievement', 'special', 'seasonal', 'community')),
    rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    requirement_type TEXT CHECK (requirement_type IN ('xp', 'wins', 'bets', 'referrals', 'special')),
    requirement_value INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Perks table for user enhancement system
CREATE TABLE IF NOT EXISTS perks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('boost', 'cosmetic', 'utility', 'special')),
    perk_type TEXT NOT NULL CHECK (perk_type IN ('xp_multiplier', 'coin_multiplier', 'luck_boost', 'skin_unlock', 'name_color', 'special_effect')),
    effect_value NUMERIC(5,2) DEFAULT 1.0,
    duration_hours INTEGER DEFAULT 24,
    coin_price INTEGER DEFAULT 0,
    gem_price INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table for customer support
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'account', 'betting', 'general')),
    assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support replies table for ticket conversations
CREATE TABLE IF NOT EXISTS support_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_staff_reply BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flash sales table for limited-time offers
CREATE TABLE IF NOT EXISTS flash_sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    original_price INTEGER NOT NULL,
    sale_price INTEGER NOT NULL,
    discount_percent NUMERIC(5,2) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (sale_price < original_price),
    CHECK (end_time > start_time)
);

-- Polls table for community voting
CREATE TABLE IF NOT EXISTS polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    ends_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll options table
CREATE TABLE IF NOT EXISTS poll_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll votes table
CREATE TABLE IF NOT EXISTS poll_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, user_id)
);

-- Match votes table for match outcome predictions (renamed from match_predictions)
CREATE TABLE IF NOT EXISTS match_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prediction TEXT NOT NULL CHECK (prediction IN ('team1_win', 'team2_win', 'draw')),
    confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, user_id)
);

-- User perks table for tracking active perks
CREATE TABLE IF NOT EXISTS user_perks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    perk_id UUID NOT NULL REFERENCES perks(id) ON DELETE CASCADE,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, perk_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ranks_rank_number ON ranks(rank_number);
CREATE INDEX IF NOT EXISTS idx_ranks_tier ON ranks(tier);
CREATE INDEX IF NOT EXISTS idx_ranks_min_level ON ranks(min_level);
CREATE INDEX IF NOT EXISTS idx_ranks_max_level ON ranks(max_level);
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_active ON badges(is_active);
CREATE INDEX IF NOT EXISTS idx_perks_category ON perks(category);
CREATE INDEX IF NOT EXISTS idx_perks_type ON perks(perk_type);
CREATE INDEX IF NOT EXISTS idx_perks_active ON perks(is_active);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_replies_ticket ON support_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_item ON flash_sales(item_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_active ON flash_sales(active);
CREATE INDEX IF NOT EXISTS idx_flash_sales_end_time ON flash_sales(end_time);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_ends_at ON polls(ends_at);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_match_predictions_match ON match_votes(match_id);
CREATE INDEX IF NOT EXISTS idx_match_predictions_user ON match_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_perks_user ON user_perks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_perks_perk ON user_perks(perk_id);
CREATE INDEX IF NOT EXISTS idx_user_perks_active ON user_perks(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE perks ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_perks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Ranks: readable by all authenticated users
CREATE POLICY "Allow authenticated users to read ranks" ON ranks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage ranks" ON ranks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- Badges: readable by all authenticated users
CREATE POLICY "Allow authenticated users to read badges" ON badges
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage badges" ON badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- Perks: readable by all authenticated users
CREATE POLICY "Allow authenticated users to read perks" ON perks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage perks" ON perks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- Support tickets: users can read/write their own, staff can read all
CREATE POLICY "Allow users to read own tickets" ON support_tickets
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Allow users to create tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Allow staff to read all tickets" ON support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Allow staff to update tickets" ON support_tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role IN ('admin', 'moderator')
        )
    );

-- Support replies: users can read replies to their tickets, staff can read all
CREATE POLICY "Allow users to read replies to own tickets" ON support_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = ticket_id
            AND support_tickets.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Allow users to create replies to own tickets" ON support_replies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = ticket_id
            AND support_tickets.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Allow staff to read all replies" ON support_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Allow staff to create replies" ON support_replies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role IN ('admin', 'moderator')
        )
    );

-- Flash sales: readable by all authenticated users
CREATE POLICY "Allow authenticated users to read flash sales" ON flash_sales
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage flash sales" ON flash_sales
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- Polls: readable by all authenticated users
CREATE POLICY "Allow authenticated users to read polls" ON polls
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to create polls" ON polls
    FOR INSERT WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Allow admins to manage polls" ON polls
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- Poll options: readable by all authenticated users
CREATE POLICY "Allow authenticated users to read poll options" ON poll_options
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow poll creators to manage options" ON poll_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM polls
            WHERE polls.id = poll_id
            AND polls.created_by = auth.uid()::text
        )
    );

-- Poll votes: users can read all votes, but only insert their own
CREATE POLICY "Allow authenticated users to read poll votes" ON poll_votes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to create their own votes" ON poll_votes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Match predictions: users can read all predictions, but only manage their own
CREATE POLICY "Allow authenticated users to read match votes" ON match_votes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to manage their own match votes" ON match_votes
    FOR ALL USING (auth.uid()::text = user_id);

-- User perks: users can read their own perks
CREATE POLICY "Allow users to read their own perks" ON user_perks
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Allow users to manage their own perks" ON user_perks
    FOR ALL USING (auth.uid()::text = user_id);

-- Insert default CS:GO style ranks data
INSERT INTO ranks (id, rank_number, name, tier, min_level, max_level, icon_url, prestige_icon_url) VALUES
('1', 1, 'Silver I', 'silver', 1, 2, null, null),
('2', 2, 'Silver II', 'silver', 3, 4, null, null),
('3', 3, 'Silver III', 'silver', 5, 6, null, null),
('4', 4, 'Silver IV', 'silver', 7, 8, null, null),
('5', 5, 'Silver V', 'silver', 9, 10, null, null),
('6', 6, 'Silver VI', 'silver', 11, 12, null, null),
('7', 7, 'Silver VII', 'silver', 13, 14, null, null),
('8', 8, 'Silver VIII', 'silver', 15, 16, null, null),
('9', 9, 'Silver IX', 'silver', 17, 18, null, null),
('10', 10, 'Silver Elite', 'silver', 19, 20, null, null),
('11', 11, 'Gold Nova I', 'gold_nova', 21, 22, null, null),
('12', 12, 'Gold Nova II', 'gold_nova', 23, 24, null, null),
('13', 13, 'Gold Nova III', 'gold_nova', 25, 26, null, null),
('14', 14, 'Gold Nova IV', 'gold_nova', 27, 28, null, null),
('15', 15, 'Gold Nova V', 'gold_nova', 29, 30, null, null),
('16', 16, 'Gold Nova VI', 'gold_nova', 31, 32, null, null),
('17', 17, 'Gold Nova VII', 'gold_nova', 33, 34, null, null),
('18', 18, 'Gold Nova VIII', 'gold_nova', 35, 36, null, null),
('19', 19, 'Gold Nova IX', 'gold_nova', 37, 38, null, null),
('20', 20, 'Gold Nova Master', 'gold_nova', 39, 40, null, null),
('21', 21, 'Master Guardian I', 'master_guardian', 41, 42, null, null),
('22', 22, 'Master Guardian II', 'master_guardian', 43, 44, null, null),
('23', 23, 'Master Guardian III', 'master_guardian', 45, 46, null, null),
('24', 24, 'Master Guardian IV', 'master_guardian', 47, 48, null, null),
('25', 25, 'Master Guardian V', 'master_guardian', 49, 50, null, null),
('26', 26, 'Master Guardian Elite I', 'master_guardian', 51, 52, null, null),
('27', 27, 'Master Guardian Elite II', 'master_guardian', 53, 54, null, null),
('28', 28, 'Master Guardian Elite III', 'master_guardian', 55, 56, null, null),
('29', 29, 'Distinguished Master Guardian', 'master_guardian', 57, 58, null, null),
('30', 30, 'Prime Master Guardian', 'master_guardian', 59, 60, null, null),
('31', 31, 'Legendary Eagle I', 'legendary', 61, 62, null, null),
('32', 32, 'Legendary Eagle II', 'legendary', 63, 64, null, null),
('33', 33, 'Legendary Eagle III', 'legendary', 65, 66, null, null),
('34', 34, 'Legendary Eagle Master I', 'legendary', 67, 68, null, null),
('35', 35, 'Legendary Eagle Master II', 'legendary', 69, 70, null, null),
('36', 36, 'Supreme Master First Class', 'legendary', 71, 72, null, null),
('37', 37, 'Supreme Master Second Class', 'legendary', 73, 74, null, null),
('38', 38, 'Supreme Master Guardian', 'legendary', 75, 76, null, null),
('39', 39, 'Legendary Guardian', 'legendary', 77, 78, null, null),
('40', 40, 'Mythic Guardian', 'legendary', 79, 80, null, null),
('41', 41, 'Global Initiate', 'global_elite', 81, 82, null, null),
('42', 42, 'Global Sentinel', 'global_elite', 83, 84, null, null),
('43', 43, 'Global Paragon', 'global_elite', 85, 86, null, null),
('44', 44, 'Global Vanguard', 'global_elite', 87, 88, null, null),
('45', 45, 'Global Warlord', 'global_elite', 89, 90, null, null),
('46', 46, 'Global Overlord', 'global_elite', 91, 92, null, null),
('47', 47, 'Global Elite Guardian', 'global_elite', 93, 94, null, null),
('48', 48, 'Global Elite Master', 'global_elite', 95, 96, null, null),
('49', 49, 'Supreme Global Elite', 'global_elite', 97, 98, null, null),
('50', 50, 'The Global Elite', 'global_elite', 99, 100, null, null)
ON CONFLICT (id) DO NOTHING;

INSERT INTO badges (name, description, image_url, category, rarity, requirement_type, requirement_value) VALUES
('First Win', 'Awarded for your first betting win', '/badges/first-win.png', 'achievement', 'common', 'wins', 1),
('High Roller', 'Placed bets totaling over 10,000 coins', '/badges/high-roller.png', 'achievement', 'rare', 'bets', 10000),
('Lucky Streak', 'Won 5 bets in a row', '/badges/lucky-streak.png', 'achievement', 'uncommon', 'special', 5),
('Community Hero', 'Helped 10 other players', '/badges/community-hero.png', 'community', 'epic', 'special', 10)
ON CONFLICT (name) DO NOTHING;

INSERT INTO perks (name, description, category, perk_type, effect_value, duration_hours, coin_price, gem_price) VALUES
('XP Boost', 'Increases XP gain by 50% for 24 hours', 'boost', 'xp_multiplier', 1.5, 24, 500, 0),
('Coin Multiplier', 'Doubles coin rewards for 12 hours', 'boost', 'coin_multiplier', 2.0, 12, 1000, 0),
('Lucky Charm', 'Increases luck by 25% for betting', 'utility', 'luck_boost', 1.25, 48, 0, 50),
('Golden Name', 'Makes your name appear in gold', 'cosmetic', 'name_color', 1.0, 168, 0, 100)
ON CONFLICT (name) DO NOTHING;</content>
<parameter name="filePath">c:\Users\Airis\Desktop\equipgg3\Equipgg\complete_database_schema.sql