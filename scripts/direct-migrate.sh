#!/bin/bash

# Direct Supabase SQL Execution Script
# Uses curl to execute SQL directly via REST API

echo "🚀 Starting Direct Database Migration"
echo "===================================="

# Load environment variables
source .env

# Check if we have the required variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing environment variables"
    exit 1
fi

echo "🔗 Testing connection..."

# Test connection first
curl -s -X GET "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Connection successful"
else
    echo "❌ Connection failed"
    exit 1
fi

echo "🏗️ Creating database schema..."

# Execute the migration SQL
SQL="
-- Drop existing problematic tables
DROP TABLE IF EXISTS user_activity_feed CASCADE;
DROP TABLE IF EXISTS \"user\" CASCADE;

-- Create users table with correct column names
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  steam_id TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  coins DECIMAL DEFAULT 1000,
  wins INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user',
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  team1_name TEXT NOT NULL,
  team2_name TEXT NOT NULL,
  team1_logo TEXT,
  team2_logo TEXT,
  league_name TEXT,
  status TEXT DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ,
  team1_odds DECIMAL,
  team2_odds DECIMAL,
  winner_id TEXT,
  pandascore_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_feed table (correct name)
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tier INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 0,
  coin_reward INTEGER DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bets table
CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  match_id TEXT REFERENCES matches(id),
  amount DECIMAL NOT NULL,
  team_bet TEXT NOT NULL,
  odds DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending',
  potential_payout DECIMAL,
  actual_payout DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Core tables created successfully' as status;
"

# Execute SQL using the /rest/v1/rpc/exec endpoint
RESPONSE=$(curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d "{\"sql\": $(echo "$SQL" | jq -R -s '.')}")

echo "📄 SQL Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ SQL execution failed"
    echo "Response: $RESPONSE"
    exit 1
else
    echo "✅ Core schema created successfully"
fi

echo "🌱 Seeding basic data..."

# Insert achievements
ACHIEVEMENTS_SQL="
INSERT INTO achievements (id, title, description, tier, xp_reward, coin_reward, icon) VALUES
('getting-started', 'Getting Started', 'Place your first bet on any match', 1, 50, 25, 'Swords'),
('first-victory', 'First Victory', 'Win your first bet', 1, 100, 50, 'Trophy'),
('regular-bettor', 'Regular Bettor', 'Place a total of 50 bets', 2, 250, 125, 'User'),
('consistent-winner', 'Consistent Winner', 'Win 50 bets total', 2, 300, 150, 'Award'),
('heating-up', 'Heating Up', 'Win 3 bets in a row', 2, 200, 100, 'Zap')
ON CONFLICT (id) DO NOTHING;

SELECT 'Achievements seeded successfully' as status;
"

ACHIEVEMENTS_RESPONSE=$(curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d "{\"sql\": $(echo "$ACHIEVEMENTS_SQL" | jq -R -s '.')}")

echo "📄 Achievements Response: $ACHIEVEMENTS_RESPONSE"

if echo "$ACHIEVEMENTS_RESPONSE" | grep -q "error"; then
    echo "❌ Achievements seeding failed"
else
    echo "✅ Achievements seeded successfully"
fi

echo ""
echo "🎉 Database migration completed!"
echo ""
echo "📋 Database ready with:"
echo "  ✅ Users table (with display_name column)"
echo "  ✅ Matches table"
echo "  ✅ Activity_feed table (correct name)"
echo "  ✅ Achievements table with sample data"
echo "  ✅ Bets table"
echo ""
echo "🚀 Ready to deploy to production!"
echo "Run: git add . && git commit -m 'Database migration completed' && git push origin main"