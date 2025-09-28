const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVisibleMatches() {
  console.log('🔍 Checking for visible matches...\n');

  // Check for visible matches
  const { data: visibleMatches, error: visibleError } = await supabase
    .from('matches')
    .select('*')
    .eq('is_visible', true);

  if (visibleError) {
    console.log('❌ Error fetching visible matches:', visibleError);
  } else {
    console.log(`✅ Found ${visibleMatches.length} visible matches:`);
    visibleMatches.forEach(match => {
      console.log(`   - ID: ${match.id}`);
      console.log(`     Event: ${match.event_name}`);
      console.log(`     Teams: ${match.team_a_name} vs ${match.team_b_name}`);
      console.log(`     Status: ${match.status}`);
      console.log(`     Date: ${match.match_date} ${match.start_time}`);
      console.log('');
    });
  }

  // Check total matches
  const { data: allMatches, error: allError } = await supabase
    .from('matches')
    .select('id, is_visible, status')
    .limit(10);

  if (!allError) {
    console.log(`📊 Total matches: ${allMatches.length}`);
    console.log(`📊 Visible: ${allMatches.filter(m => m.is_visible).length}`);
    console.log(`📊 Hidden: ${allMatches.filter(m => !m.is_visible).length}`);
  }
}

checkVisibleMatches().catch(console.error);