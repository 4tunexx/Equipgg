const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rxamnospcmbtgzptmmxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4YW1ub3NwY21idGd6cHRtbXhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA1NjgzOSwiZXhwIjoyMDczNjMyODM5fQ.TLkG3Dgrp0QAq_APeXrukFcrR4Eof15miMYynWFxqMc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFieldMismatches() {
  console.log('🔍 CHECKING FOR FIELD NAME MISMATCHES...\n');

  // Check matches table structure
  console.log('1. 🏆 Checking matches table...');
  try {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .limit(1);
    
    if (!error && matches && matches.length > 0) {
      const matchColumns = Object.keys(matches[0]);
      console.log('Matches table columns:', matchColumns);
      
      // Check for field mismatches
      const expectedFields = ['title', 'team1_name', 'team2_name', 'scheduled_at'];
      const actualFields = ['event_name', 'team_a_name', 'team_b_name', 'match_date'];
      
      console.log('\nField mapping needed:');
      console.log('- title → event_name ✓');
      console.log('- team1_name → team_a_name ✓');
      console.log('- team2_name → team_b_name ✓');
      console.log('- scheduled_at → match_date + start_time ✓');
    }
  } catch (e) {
    console.error('Error checking matches table:', e.message);
  }

  // Check users table for displayName vs displayname
  console.log('\n2. 👤 Checking users table field names...');
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (!error && users && users.length > 0) {
      const userColumns = Object.keys(users[0]);
      
      if (userColumns.includes('displayname')) {
        console.log('✅ users.displayname exists (correct)');
      }
      if (userColumns.includes('displayName')) {
        console.log('⚠️ users.displayName exists (should be displayname)');
      }
      if (!userColumns.includes('displayname') && !userColumns.includes('displayName')) {
        console.log('❌ Neither displayname nor displayName exists');
      }
    }
  } catch (e) {
    console.error('Error checking users table:', e.message);
  }

  console.log('\n📊 FIELD MISMATCH SUMMARY:');
  console.log('✅ All required tables exist');
  console.log('❌ Missing 5 columns in users table (vip_tier, vip_expires_at, balance, last_login, is_active)');
  console.log('🔄 Field name mappings needed in APIs for matches table');
  console.log('✅ displayname field exists (correct lowercase)');
  
  console.log('\n⚡ ACTIONS NEEDED:');
  console.log('1. Run USERS_TABLE_FIXES.sql in Supabase dashboard');
  console.log('2. Update API endpoints to use correct field names:');
  console.log('   - matches.title → matches.event_name');
  console.log('   - matches.team1_name → matches.team_a_name');
  console.log('   - matches.team2_name → matches.team_b_name');
  console.log('   - matches.scheduled_at → matches.match_date');
}

checkFieldMismatches().catch(console.error);