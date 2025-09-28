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

async function checkTableStructure() {
  console.log('🔍 Checking table structures...\n');

  // Check matches table structure
  console.log('📊 MATCHES TABLE STRUCTURE:');
  const { data: matchesData, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .limit(1);

  if (matchesError) {
    console.log('❌ Error:', matchesError);
  } else if (matchesData && matchesData.length > 0) {
    console.log('✅ Columns found:', Object.keys(matchesData[0]));
    console.log('📋 Sample data:', matchesData[0]);
  } else {
    console.log('⚠️  Table exists but no data');
  }

  // Check match_votes table structure
  console.log('\n📊 MATCH_VOTES TABLE STRUCTURE:');
  const { data: votesData, error: votesError } = await supabase
    .from('match_votes')
    .select('*')
    .limit(1);

  if (votesError && votesError.code !== 'PGRST116') {
    console.log('❌ Error:', votesError);
  } else {
    console.log('✅ Table exists (empty)');
  }
}

checkTableStructure().catch(console.error);