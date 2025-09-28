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

async function checkData() {
  console.log('🔍 Checking database data...\n');

  // Check matches table
  console.log('📊 MATCHES TABLE:');
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .limit(5);

  if (matchesError) {
    console.log('❌ Error fetching matches:', matchesError);
  } else {
    console.log(`✅ Found ${matches.length} matches:`);
    matches.forEach(match => {
      console.log(`   - ID: ${match.id}, Title: ${match.title}, Status: ${match.status}`);
    });
  }

  // Check match_votes table
  console.log('\n📊 MATCH_VOTES TABLE:');
  const { data: votes, error: votesError } = await supabase
    .from('match_votes')
    .select('*')
    .limit(5);

  if (votesError) {
    console.log('❌ Error fetching match_votes:', votesError);
  } else {
    console.log(`✅ Found ${votes.length} match votes:`);
    votes.forEach(vote => {
      console.log(`   - Match: ${vote.match_id}, User: ${vote.user_id}, Prediction: ${vote.prediction}`);
    });
  }

  // Check if the specific match IDs from the error exist
  const testMatchIds = [
    '357fb9ab-ea33-49b2-8d73-761e024b36b4',
    '2214219c-a0f2-4a66-b606-dbb93a4dda5b',
    'fd36ce96-04b4-4352-8525-f95906eaf23b',
    'c9658c29-d5a0-4581-9ab2-3bb2c3ce2d82'
  ];

  console.log('\n🔍 CHECKING SPECIFIC MATCH IDs:');
  for (const matchId of testMatchIds) {
    const { data: match, error } = await supabase
      .from('matches')
      .select('id, title, status')
      .eq('id', matchId)
      .single();

    if (error && error.code === 'PGRST116') {
      console.log(`❌ Match ${matchId}: NOT FOUND`);
    } else if (error) {
      console.log(`⚠️  Match ${matchId}: Error - ${error.message}`);
    } else {
      console.log(`✅ Match ${matchId}: FOUND - ${match.title} (${match.status})`);
    }
  }
}

checkData().catch(console.error);