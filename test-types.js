const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rxamnospcmbtgzptmmxl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4YW1ub3NwY21idGd6cHRtbXhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA1NjgzOSwiZXhwIjoyMDczNjMyODM5fQ.TLkG3Dgrp0QAq_APeXrukFcrR4Eof15miMYynWFxqMc'
);

async function testColumnTypes() {
  console.log('Testing column types by checking existing data...');

  // Check users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
    .limit(1);

  if (usersError) {
    console.log('Users query error:', usersError);
  } else if (users && users.length > 0) {
    console.log('Users.id type:', typeof users[0].id, 'value:', users[0].id);
  }

  // Check matches table
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id')
    .limit(1);

  if (matchesError) {
    console.log('Matches query error:', matchesError);
  } else if (matches && matches.length > 0) {
    console.log('Matches.id type:', typeof matches[0].id, 'value:', matches[0].id);
  }
}

testColumnTypes().catch(console.error);