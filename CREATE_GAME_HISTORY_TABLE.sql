-- Run this SQL in Supabase Dashboard > SQL Editor
-- This will create the game_history table with the correct schema from all2.txt

-- Drop existing table if it exists
DROP TABLE IF EXISTS game_history CASCADE;

-- Create table with exact schema from all2.txt
CREATE TABLE public.game_history (
  id text NOT NULL,
  user_id text,
  game_type text,
  bet_amount integer,
  winnings integer DEFAULT 0,
  profit integer,
  multiplier real,
  game_data text,
  result text,
  tiles_cleared integer DEFAULT 0,
  xp_gained integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT game_history_pkey PRIMARY KEY (id),
  CONSTRAINT game_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_game_history_user_id ON game_history(user_id);
CREATE INDEX idx_game_history_game_type ON game_history(game_type);  
CREATE INDEX idx_game_history_created_at ON game_history(created_at DESC);

-- Insert a test record to verify the structure
INSERT INTO game_history (
  id,
  user_id,
  game_type,
  bet_amount,
  winnings,
  profit,
  multiplier,
  game_data,
  result,
  tiles_cleared,
  xp_gained
) VALUES (
  'test_game_' || extract(epoch from now())::text,
  (SELECT id FROM users LIMIT 1),  -- Use any existing user
  'crash',
  100,
  250,
  150,
  2.5,
  '{"target": 2.5, "result": "win"}',
  'win',
  0,
  10
);

-- Verify the table was created correctly
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'game_history' 
ORDER BY ordinal_position;

-- Show the test record
SELECT * FROM game_history WHERE id LIKE 'test_game_%' LIMIT 1;