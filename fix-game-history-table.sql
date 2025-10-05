-- ========================================
-- GAME HISTORY TABLE STRUCTURE FIX
-- ========================================
-- This SQL will properly create/fix the game_history table structure

-- First, let's check what exists
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_history' 
ORDER BY ordinal_position;

-- Drop and recreate the table with correct structure
DROP TABLE IF EXISTS game_history CASCADE;

CREATE TABLE game_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_type VARCHAR(50) NOT NULL,
    bet_amount DECIMAL(10,2) NOT NULL,
    multiplier DECIMAL(10,4),
    payout DECIMAL(10,2) DEFAULT 0,
    profit_loss DECIMAL(10,2) NOT NULL,
    game_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_game_history_user_id ON game_history(user_id);
CREATE INDEX idx_game_history_game_type ON game_history(game_type);
CREATE INDEX idx_game_history_created_at ON game_history(created_at DESC);

-- Insert a test record to verify structure
INSERT INTO game_history (
    user_id,
    game_type,
    bet_amount,
    multiplier,
    payout,
    profit_loss,
    game_data
) VALUES (
    (SELECT id FROM auth.users LIMIT 1), -- Use any existing user
    'crash',
    100.00,
    2.5,
    250.00,
    150.00,
    '{"multiplier_target": 2.5, "result": "win"}'::jsonb
);

-- Verify the structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_history' 
ORDER BY ordinal_position;

-- Show the test record
SELECT * FROM game_history LIMIT 1;