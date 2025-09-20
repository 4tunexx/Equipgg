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

-- Add unique constraint for steam_id
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS unique_steam_id UNIQUE(steam_id);

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