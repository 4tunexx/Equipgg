import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'test_steam_columns') {
      return await testDatabaseSchema();
    } else if (action === 'add_steam_columns') {
      return await addSteamColumns();
    } else if (action === 'complete_database_setup') {
      return await completeDatabaseSetup();
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { error: 'Server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

async function testDatabaseSchema() {
  const results: string[] = [];
  const requiredColumns = [
    'id', 'email', 'steam_id', 'steam_verified', 'account_status',
    'username', 'avatar', 'coins', 'xp', 'level', 'wins', 'matches_played'
  ];

  results.push('🔍 Testing database schema...\n');

  // Test basic connection
  try {
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (testError) {
      results.push(`❌ Database connection failed: ${testError.message}`);
      return NextResponse.json({ error: results.join('\n') }, { status: 500 });
    } else {
      results.push(`✅ Database connection successful`);
      results.push(`📊 Users table exists with ${testData || 0} rows\n`);
    }
  } catch (error) {
    results.push(`❌ Connection error: ${(error as Error).message}`);
    return NextResponse.json({ error: results.join('\n') }, { status: 500 });
  }

  // Check each required column
  const missingColumns: string[] = [];
  const existingColumns: string[] = [];

  for (const column of requiredColumns) {
    try {
      const { error } = await supabase
        .from('users')
        .select(column)
        .limit(1);

      if (error && (
        error.message.includes(`column "${column}" does not exist`) ||
        error.message.includes(`column users.${column} does not exist`)
      )) {
        missingColumns.push(column);
        results.push(`❌ Missing: ${column}`);
      } else if (error) {
        results.push(`⚠️  Error checking ${column}: ${error.message}`);
      } else {
        existingColumns.push(column);
        results.push(`✅ Found: ${column}`);
      }
    } catch (error) {
      results.push(`⚠️  Exception checking ${column}: ${(error as Error).message}`);
    }
  }

  results.push(`\n📊 Summary:`);
  results.push(`✅ Existing columns (${existingColumns.length}): ${existingColumns.join(', ')}`);
  results.push(`❌ Missing columns (${missingColumns.length}): ${missingColumns.join(', ')}`);

  if (missingColumns.length === 0) {
    results.push(`\n🎉 All required columns exist! Your database should work.`);
    
    // Test the specific Steam lookup query that was failing
    try {
      const { data: steamTest, error: steamTestError } = await supabase
        .from('users')
        .select('id, email, steam_id')
        .eq('steam_id', 'test_steam_id_that_does_not_exist')
        .limit(1);

      if (steamTestError) {
        results.push(`❌ Steam lookup test failed: ${steamTestError.message}`);
      } else {
        results.push(`✅ Steam lookup query works perfectly!`);
      }
    } catch (error) {
      results.push(`❌ Steam lookup test error: ${(error as Error).message}`);
    }
  } else {
    results.push(`\n⚡ Run the migration to add the missing columns and fix authentication.`);
  }

  return NextResponse.json({ message: results.join('\n') });
}

async function addSteamColumns() {
  const results: string[] = [];
  results.push('🚀 Starting database migration...\n');

  // Since we can't run DDL directly through Supabase client easily,
  // we'll use a workaround approach or provide manual instructions
  
  // First, let's try to detect what's missing
  const { data: testData, error: testError } = await supabase
    .from('users')
    .select('steam_id')
    .limit(1);

  if (testError && testError.message.includes('steam_id does not exist')) {
    results.push('❌ Confirmed: steam_id column is missing');
    results.push('🔧 This requires manual SQL execution in Supabase dashboard\n');
    
    results.push('📋 Please execute this SQL in your Supabase SQL Editor:');
    results.push('👉 Go to: https://supabase.com/dashboard/project/[your-project]/sql\n');
    
    const migrationSQL = `-- Add missing Steam authentication columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_trade_url TEXT;

-- Add other required columns if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 1000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS matches_played INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id) WHERE steam_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_steam_verified ON users(steam_verified) WHERE steam_verified = true;
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- Add unique constraint for steam_id (with safe check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_steam_id' 
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users ADD CONSTRAINT unique_steam_id UNIQUE(steam_id);
    END IF;
END $$;

-- Update existing users with default values
UPDATE users 
SET 
  steam_verified = COALESCE(steam_verified, false),
  account_status = COALESCE(account_status, 'pending'),
  coins = COALESCE(coins, 1000),
  xp = COALESCE(xp, 0),
  level = COALESCE(level, 1),
  wins = COALESCE(wins, 0),
  matches_played = COALESCE(matches_played, 0)
WHERE 
  steam_verified IS NULL 
  OR account_status IS NULL 
  OR coins IS NULL 
  OR xp IS NULL 
  OR level IS NULL 
  OR wins IS NULL 
  OR matches_played IS NULL;`;

    results.push('```sql');
    results.push(migrationSQL);
    results.push('```\n');
    
    results.push('📝 Steps:');
    results.push('1. Copy the SQL above');
    results.push('2. Go to Supabase Dashboard > SQL Editor');
    results.push('3. Paste and run the SQL');
    results.push('4. Come back and test again');
    results.push('5. Try logging in - it should work!');

    return NextResponse.json({ message: results.join('\n') });
  } else {
    results.push('✅ steam_id column exists or different error');
    results.push('🔍 Running full schema test...');
    
    // If steam_id exists, run the test to see what else might be missing
    return await testDatabaseSchema();
  }
}

async function completeDatabaseSetup() {
  const results: string[] = [];
  results.push('🚀 Starting complete database setup for CS2 gambling platform...\n');
  
  results.push('🎯 This will create the COMPLETE EquipGG platform with:');
  results.push('• 50+ achievements and badges');
  results.push('• 110+ CS2 skins, knives, gloves, and operators');
  results.push('• 59 missions (daily + main campaign)');
  results.push('• 16 perks and 50 rank levels');
  results.push('• Full crate system and inventory management');
  results.push('• Complete user authentication with Steam integration\n');
  
  results.push('⚠️ IMPORTANT: This is a FULL database setup - run this on a clean database!');
  results.push('If you already have data, backup first!\n');
  
  results.push('📋 Please execute these SQL files in order in your Supabase SQL Editor:');
  results.push('👉 Go to: https://supabase.com/dashboard/project/[your-project]/sql\n');
  
  results.push('🔥 STEP 1: Run complete-database-setup.sql');
  results.push('This creates all tables and basic structure.\n');
  
  results.push('🔥 STEP 2: Run database-population-part1.sql');
  results.push('This adds achievements, badges, and user system data.\n');
  
  results.push('🔥 STEP 3: Run database-population-part2.sql');
  results.push('This adds all CS2 items, skins, knives, and gloves.\n');
  
  results.push('🔥 STEP 4: Run database-population-part3.sql');
  results.push('This adds missions, perks, ranks, and crates.\n');
  
  results.push('📝 Files are located in your project:');
  results.push('• complete-database-setup.sql');
  results.push('• database-population-part1.sql');
  results.push('• database-population-part2.sql');
  results.push('• database-population-part3.sql\n');
  
  results.push('🎯 After running all 4 files, your platform will have:');
  results.push('✅ Full authentication system with Steam verification');
  results.push('✅ Complete CS2 item database with real skins');
  results.push('✅ Achievement and badge system');
  results.push('✅ Mission and perk progression');
  results.push('✅ Crate opening and inventory management');
  results.push('✅ User rankings and leaderboards');
  results.push('✅ Administrative tools and moderation');
  results.push('✅ All platform features ready for production!\n');
  
  results.push('🚨 CRITICAL: Run the files in the exact order above!');
  results.push('The setup creates foreign key relationships that depend on the correct order.\n');
  
  results.push('💡 Pro tip: After setup, test authentication at /updatesql to verify everything works!');
  
  return NextResponse.json({ message: results.join('\n') });
}