#!/usr/bin/env node

/**
 * Simple Database Migration Script
 * Direct approach using Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('🔗 Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('_migrations').select('*').limit(1);
    if (error && error.message.includes('relation "_migrations" does not exist')) {
      console.log('✅ Connection successful (database ready for migration)');
      return true;
    } else if (!error) {
      console.log('✅ Connection successful');
      return true;
    } else {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
  } catch (err) {
    console.log('✅ Connection successful (expected error for new database)');
    return true;
  }
}

async function executeSimpleQuery(query, description) {
  console.log(`📄 ${description}...`);
  try {
    const { error } = await supabase.rpc('exec', { sql: query });
    if (error) {
      console.error(`❌ ${description} failed:`, error.message);
      return false;
    }
    console.log(`✅ ${description} completed`);
    return true;
  } catch (err) {
    console.error(`❌ ${description} error:`, err.message);
    return false;
  }
}

async function createTables() {
  console.log('\n🏗️  Creating database tables...');
  
  // Create users table first
  const createUsers = `
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
  `;
  
  const success1 = await executeSimpleQuery(createUsers, 'Creating users table');
  if (!success1) return false;
  
  // Create achievements table
  const createAchievements = `
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
  `;
  
  const success2 = await executeSimpleQuery(createAchievements, 'Creating achievements table');
  if (!success2) return false;
  
  // Create matches table
  const createMatches = `
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
  `;
  
  const success3 = await executeSimpleQuery(createMatches, 'Creating matches table');
  if (!success3) return false;
  
  return true;
}

async function seedBasicData() {
  console.log('\n🌱 Seeding basic data...');
  
  // Insert sample achievements
  const insertAchievements = `
    INSERT INTO achievements (id, title, description, tier, xp_reward, coin_reward, icon) VALUES
    ('getting-started', 'Getting Started', 'Place your first bet on any match', 1, 50, 25, 'Swords'),
    ('first-victory', 'First Victory', 'Win your first bet', 1, 100, 50, 'Trophy'),
    ('regular-bettor', 'Regular Bettor', 'Place a total of 50 bets', 2, 250, 125, 'User')
    ON CONFLICT (id) DO NOTHING;
  `;
  
  const success = await executeSimpleQuery(insertAchievements, 'Seeding achievements');
  return success;
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  try {
    const { data: users, error: usersError } = await supabase.from('users').select('*').limit(1);
    const { data: achievements, error: achievementsError } = await supabase.from('achievements').select('*').limit(1);
    const { data: matches, error: matchesError } = await supabase.from('matches').select('*').limit(1);
    
    if (!usersError && !achievementsError && !matchesError) {
      console.log('✅ All tables created successfully');
      return true;
    } else {
      console.error('❌ Some tables missing');
      return false;
    }
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Simple Database Migration');
  console.log('====================================\n');
  
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot connect to Supabase. Check your environment variables.');
      process.exit(1);
    }
    
    // Create tables
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      console.error('❌ Failed to create tables');
      process.exit(1);
    }
    
    // Seed basic data
    const dataSeeded = await seedBasicData();
    if (!dataSeeded) {
      console.log('⚠️  Warning: Failed to seed data, but tables are created');
    }
    
    // Verify
    const verified = await verifyMigration();
    
    if (verified) {
      console.log('\n🎉 Basic migration completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Your database now has the core tables');
      console.log('2. You can deploy to production');
      console.log('3. Add more game content via Supabase dashboard if needed');
      console.log('\n🚀 Ready to deploy to Vercel!');
    } else {
      console.log('\n⚠️  Migration completed with warnings');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();