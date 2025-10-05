const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rxamnospcmbtgzptmmxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4YW1ub3NwY21idGd6cHRtbXhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA1NjgzOSwiZXhwIjoyMDczNjMyODM5fQ.TLkG3Dgrp0QAq_APeXrukFcrR4Eof15miMYynWFxqMc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDatabaseFixes() {
  console.log('🔧 APPLYING DATABASE SCHEMA FIXES...\n');

  // Step 1: Add missing columns to users table using raw SQL
  console.log('1. 👤 Adding missing columns to users table...');
  try {
    // Check current users table structure first
    const { data: currentUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking users table:', checkError);
      return;
    }

    console.log('✅ Users table accessible');
    
    if (currentUsers && currentUsers.length > 0) {
      const sampleUser = currentUsers[0];
      console.log('Current user columns:', Object.keys(sampleUser));
      
      const missingColumns = [];
      if (!sampleUser.hasOwnProperty('vip_tier')) missingColumns.push('vip_tier');
      if (!sampleUser.hasOwnProperty('vip_expires_at')) missingColumns.push('vip_expires_at');
      if (!sampleUser.hasOwnProperty('balance')) missingColumns.push('balance');
      if (!sampleUser.hasOwnProperty('last_login')) missingColumns.push('last_login');
      if (!sampleUser.hasOwnProperty('is_active')) missingColumns.push('is_active');
      
      if (missingColumns.length > 0) {
        console.log('❌ Missing columns in users table:', missingColumns.join(', '));
        console.log('⚠️ These columns need to be added manually in Supabase dashboard');
      } else {
        console.log('✅ All required columns exist in users table');
      }
    }
  } catch (e) {
    console.error('Error checking users table:', e.message);
  }

  // Step 2: Check for missing tables
  console.log('\n2. 📋 Checking for missing tables...');
  
  const requiredTables = [
    'trade_history',
    'trade_offer_items', 
    'trade_offer_requests',
    'match_predictions'
  ];

  const missingTables = [];

  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          missingTables.push(tableName);
          console.log(`❌ Table ${tableName} does not exist`);
        } else {
          console.log(`✅ Table ${tableName} exists`);
        }
      } else {
        console.log(`✅ Table ${tableName} exists`);
      }
    } catch (e) {
      missingTables.push(tableName);
      console.log(`❌ Table ${tableName} does not exist`);
    }
  }

  // Step 3: Check specific existing tables from schema
  console.log('\n3. 🔍 Verifying key existing tables...');
  
  const existingTables = [
    'users', 'items', 'matches', 'trade_offers', 'achievements', 
    'badges', 'missions', 'crates', 'notifications', 'support_tickets'
  ];

  let existingCount = 0;
  for (const tableName of existingTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);
      
      if (!error) {
        existingCount++;
        console.log(`✅ ${tableName} table exists`);
      } else {
        console.log(`❌ ${tableName} table missing`);
      }
    } catch (e) {
      console.log(`❌ ${tableName} table missing`);
    }
  }

  // Summary
  console.log('\n📊 CURRENT STATUS SUMMARY:');
  console.log(`✅ Existing core tables: ${existingCount}/${existingTables.length}`);
  console.log(`❌ Missing critical tables: ${missingTables.length}/4`);
  
  if (missingTables.length > 0) {
    console.log('\n🚨 MISSING TABLES THAT NEED TO BE CREATED:');
    missingTables.forEach(table => console.log(`- ${table}`));
  }

  console.log('\n⚠️ MANUAL ACTION REQUIRED:');
  console.log('1. Open Supabase Dashboard → SQL Editor');
  console.log('2. Run the contents of MANUAL_SCHEMA_FIXES.sql');
  console.log('3. This will add all missing tables and columns');
  
  return {
    missingTables,
    existingCount,
    totalRequired: existingTables.length + requiredTables.length
  };
}

applyDatabaseFixes().catch(console.error);