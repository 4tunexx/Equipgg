const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkPerks() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Checking perks table...');

  const { data, error } = await supabase.from('perks').select('*');

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Perks data:', data);
    console.log(`Found ${data.length} perks`);
  }
}

checkPerks().catch(console.error);