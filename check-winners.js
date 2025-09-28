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

async function checkMatchWinners() {
  console.log('🔍 Checking for finished matches and winners...\n');

  // Check for finished matches
  const { data: finishedMatches, error: finishedError } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'finished');

  if (finishedError) {
    console.log('❌ Error fetching finished matches:', finishedError);
  } else {
    console.log(`✅ Found ${finishedMatches.length} finished matches:`);
    finishedMatches.forEach(match => {
      console.log(`   - ID: ${match.id}`);
      console.log(`     Teams: ${match.team_a_name} vs ${match.team_b_name}`);
      console.log(`     Winner: ${match.winner || 'NOT SET'}`);
      console.log(`     Scores: ${match.team_a_score || 'N/A'}-${match.team_b_score || 'N/A'}`);
      console.log('');
    });
  }

  // Check matches table structure for winner column
  const { data: sampleMatch, error: sampleError } = await supabase
    .from('matches')
    .select('*')
    .limit(1);

  if (!sampleError && sampleMatch && sampleMatch.length > 0) {
    const columns = Object.keys(sampleMatch[0]);
    console.log('📊 Matches table columns:', columns.join(', '));
    console.log('🏆 Has winner column:', columns.includes('winner'));
  }
}

checkMatchWinners().catch(console.error);