const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with correct credentials
const supabaseUrl = 'https://rxamnospcmbtgzptmmxl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4YW1ub3NwY21idGd6cHRtbXhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA1NjgzOSwiZXhwIjoyMDczNjMyODM5fQ.TLkG3Dgrp0QAq_APeXrukFcrR4Eof15miMYynWFxqMc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...');
  
  try {
    // Check all tables exist
    const tables = ['users', 'ranks', 'achievements', 'badges', 'items', 'missions', 'mission_progress', 'shop_items'];
    
    for (const table of tables) {
      console.log(`\n📋 Checking table: ${table}`);
      
      // Get table structure
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error accessing ${table}:`, error.message);
        continue;
      }
      
      // Get count
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error(`❌ Error counting ${table}:`, countError.message);
      } else {
        console.log(`✅ ${table}: ${count} records`);
      }
      
      // Show sample data if exists
      if (data && data.length > 0) {
        console.log(`📄 Sample columns:`, Object.keys(data[0]).join(', '));
      }
    }
    
    // Check specific required columns
    console.log('\n🔧 Checking specific column requirements...');
    
    // Check users table for vip_tier column
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, email, role, level, xp, coins, gems, vip_tier')
      .limit(1);
    
    if (userError) {
      console.error('❌ Users table missing required columns:', userError.message);
    } else {
      console.log('✅ Users table has all required columns');
    }
    
    // Check mission_progress table
    const { data: progressData, error: progressError } = await supabase
      .from('mission_progress')
      .select('id, user_id, mission_id, progress, completed')
      .limit(1);
    
    if (progressError) {
      console.error('❌ Mission progress table issue:', progressError.message);
    } else {
      console.log('✅ Mission progress table exists and accessible');
    }
    
    console.log('\n🎯 Database structure check complete!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

checkDatabaseStructure();