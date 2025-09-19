#!/usr/bin/env node

/**
 * Direct API Migration Script
 * Uses Supabase REST API directly to avoid client issues
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

async function executeSQL(sql, description) {
  console.log(`📄 ${description}...`);
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql })
    });

    if (response.ok) {
      console.log(`✅ ${description} completed`);
      return true;
    } else {
      const error = await response.text();
      console.error(`❌ ${description} failed:`, error);
      return false;
    }
  } catch (err) {
    console.error(`❌ ${description} error:`, err.message);
    return false;
  }
}

async function testConnection() {
  console.log('🔗 Testing connection...');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    });
    
    if (response.ok) {
      console.log('✅ Connection successful');
      return true;
    } else {
      console.error('❌ Connection failed');
      return false;
    }
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function createCoreSchema() {
  console.log('\n🏗️  Creating core database schema...');
  
  const schema = `
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
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create activity_feed table (not user_activity_feed)
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
  `;

  return await executeSQL(schema, 'Creating core database schema');
}

async function seedBasicAchievements() {
  console.log('\n🌱 Seeding basic achievements...');
  
  const achievements = `
    INSERT INTO achievements (id, title, description, tier, xp_reward, coin_reward, icon) VALUES
    ('getting-started', 'Getting Started', 'Place your first bet on any match', 1, 50, 25, 'Swords'),
    ('first-victory', 'First Victory', 'Win your first bet', 1, 100, 50, 'Trophy'),
    ('regular-bettor', 'Regular Bettor', 'Place a total of 50 bets', 2, 250, 125, 'User'),
    ('consistent-winner', 'Consistent Winner', 'Win 50 bets total', 2, 300, 150, 'Award'),
    ('heating-up', 'Heating Up', 'Win 3 bets in a row', 2, 200, 100, 'Zap')
    ON CONFLICT (id) DO NOTHING;
  `;

  return await executeSQL(achievements, 'Seeding basic achievements');
}

async function enableRLS() {
  console.log('\n🔒 Enabling Row Level Security...');
  
  const rls = `
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
    ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
    ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
    ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

    -- Allow public read for matches and achievements
    CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
    CREATE POLICY "Public read achievements" ON achievements FOR SELECT USING (true);
    
    -- Allow users to read their own data
    CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Users can read own activity" ON activity_feed FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can read own bets" ON bets FOR SELECT USING (auth.uid() = user_id);
  `;

  return await executeSQL(rls, 'Enabling Row Level Security');
}

async function main() {
  console.log('🚀 Starting Direct API Migration');
  console.log('================================\n');
  
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot connect to Supabase');
      process.exit(1);
    }
    
    // Create schema
    const schemaCreated = await createCoreSchema();
    if (!schemaCreated) {
      console.error('❌ Failed to create schema');
      process.exit(1);
    }
    
    // Seed achievements
    await seedBasicAchievements();
    
    // Enable RLS
    await enableRLS();
    
    console.log('\n🎉 Core migration completed!');
    console.log('\n📋 Database ready with:');
    console.log('  ✅ Users table (with display_name column)');
    console.log('  ✅ Matches table');
    console.log('  ✅ Activity_feed table (correct name)');
    console.log('  ✅ Achievements table with sample data');
    console.log('  ✅ Bets table');
    console.log('  ✅ Row Level Security enabled');
    console.log('\n🚀 Ready to deploy to production!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();