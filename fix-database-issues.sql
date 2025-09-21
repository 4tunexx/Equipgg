-- Fix database issues: Add missing columns and tables

-- Add vip_tier column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_tier INTEGER DEFAULT 0;

-- Create mission_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS mission_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, mission_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_mission_progress_user_id ON mission_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_progress_mission_id ON mission_progress(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_progress_completed ON mission_progress(completed);

-- Add some sample mission progress data
INSERT INTO mission_progress (user_id, mission_id, progress, completed) 
SELECT 
  u.id as user_id,
  m.id as mission_id,
  CASE 
    WHEN random() > 0.7 THEN m.requirement_value
    ELSE floor(random() * m.requirement_value)::integer
  END as progress,
  CASE 
    WHEN random() > 0.7 THEN true
    ELSE false
  END as completed
FROM users u
CROSS JOIN missions m
WHERE u.role = 'user'
LIMIT 50
ON CONFLICT (user_id, mission_id) DO NOTHING;

-- Update completed_at for completed missions
UPDATE mission_progress 
SET completed_at = NOW() - (random() * interval '30 days')
WHERE completed = true AND completed_at IS NULL;

COMMIT;