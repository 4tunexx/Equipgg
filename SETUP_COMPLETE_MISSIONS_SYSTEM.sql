-- ================================================
-- COMPLETE MISSIONS SYSTEM SETUP
-- Ensures all tables exist with proper structure
-- ================================================

-- Step 1: Ensure missions table exists with correct schema
CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    mission_type TEXT NOT NULL CHECK (mission_type IN ('daily', 'weekly', 'main', 'special')),
    tier INTEGER DEFAULT 1,
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER NOT NULL DEFAULT 1,
    xp_reward INTEGER DEFAULT 0,
    coin_reward INTEGER DEFAULT 0,
    gem_reward INTEGER DEFAULT 0,
    is_repeatable BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    icon TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Ensure user_mission_progress table exists
CREATE TABLE IF NOT EXISTS user_mission_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0, -- Legacy field, kept for compatibility
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, mission_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_missions_type ON missions(mission_type);
CREATE INDEX IF NOT EXISTS idx_missions_requirement ON missions(requirement_type);
CREATE INDEX IF NOT EXISTS idx_missions_active ON missions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_mission_progress_user ON user_mission_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mission_progress_mission ON user_mission_progress(mission_id);
CREATE INDEX IF NOT EXISTS idx_user_mission_progress_completed ON user_mission_progress(completed);

-- Step 4: Insert essential daily missions if they don't exist
INSERT INTO missions (id, name, description, mission_type, tier, requirement_type, requirement_value, xp_reward, coin_reward, is_repeatable, is_active)
VALUES 
    ('daily_login', 'Daily Login', 'Log in to the site', 'daily', 1, 'login', 1, 50, 100, true, true),
    ('daily_bet_5', 'Place 5 Bets', 'Place 5 bets today', 'daily', 1, 'bet_placed', 5, 100, 200, true, true),
    ('daily_win_3', 'Win 3 Bets', 'Win 3 bets today', 'daily', 1, 'bet_won', 3, 150, 300, true, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    requirement_type = EXCLUDED.requirement_type,
    requirement_value = EXCLUDED.requirement_value,
    xp_reward = EXCLUDED.xp_reward,
    coin_reward = EXCLUDED.coin_reward,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Step 5: Insert main missions if they don't exist
INSERT INTO missions (id, name, description, mission_type, tier, requirement_type, requirement_value, xp_reward, coin_reward, is_repeatable, is_active)
VALUES 
    ('main_first_bet', 'First Bet', 'Place your first bet', 'main', 1, 'bet_placed', 1, 100, 500, false, true),
    ('main_bet_10', 'Betting Novice', 'Place 10 bets', 'main', 1, 'bet_placed', 10, 200, 1000, false, true),
    ('main_win_5', 'First Wins', 'Win 5 bets', 'main', 1, 'bet_won', 5, 300, 1500, false, true),
    ('main_bet_50', 'Regular Better', 'Place 50 bets', 'main', 2, 'bet_placed', 50, 500, 2500, false, true),
    ('main_win_20', 'Winning Streak', 'Win 20 bets', 'main', 2, 'bet_won', 20, 750, 3000, false, true),
    ('main_bet_100', 'Betting Veteran', 'Place 100 bets', 'main', 3, 'bet_placed', 100, 1000, 5000, false, true),
    ('main_win_50', 'Master Better', 'Win 50 bets', 'main', 3, 'bet_won', 50, 1500, 7500, false, true),
    ('main_bet_500', 'Betting Legend', 'Place 500 bets', 'main', 4, 'bet_placed', 500, 5000, 25000, false, true),
    ('main_win_200', 'Ultimate Champion', 'Win 200 bets', 'main', 4, 'bet_won', 200, 10000, 50000, false, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    requirement_type = EXCLUDED.requirement_type,
    requirement_value = EXCLUDED.requirement_value,
    xp_reward = EXCLUDED.xp_reward,
    coin_reward = EXCLUDED.coin_reward,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Step 6: Verify missions exist
SELECT 
    mission_type,
    COUNT(*) as count,
    STRING_AGG(id, ', ') as mission_ids
FROM missions
WHERE is_active = true
GROUP BY mission_type
ORDER BY mission_type;

-- Step 7: Check requirement types to ensure tracking will work
SELECT DISTINCT requirement_type, COUNT(*) as missions_count
FROM missions
WHERE is_active = true
GROUP BY requirement_type
ORDER BY requirement_type;

SELECT '✅ Missions system setup complete!' as status;
