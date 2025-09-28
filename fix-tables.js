const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rxamnospcmbtgzptmmxl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4YW1ub3NwY21idGd6cHRtbXhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA1NjgzOSwiZXhwIjoyMDczNjMyODM5fQ.TLkG3Dgrp0QAq_APeXrukFcrR4Eof15miMYynWFxqMc'
);

async function fixTables() {
  console.log('Adding missing columns to user_bets...');

  // Add columns to user_bets
  const userBetsQueries = [
    `ALTER TABLE user_bets ADD COLUMN IF NOT EXISTS team_choice TEXT CHECK (team_choice IN ('team_a', 'team_b'))`,
    `ALTER TABLE user_bets ADD COLUMN IF NOT EXISTS amount INTEGER CHECK (amount > 0)`,
    `ALTER TABLE user_bets ADD COLUMN IF NOT EXISTS odds DECIMAL(5,2)`,
    `ALTER TABLE user_bets ADD COLUMN IF NOT EXISTS potential_payout DECIMAL(10,2)`,
    `ALTER TABLE user_bets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'cancelled'))`,
    `ALTER TABLE user_bets ADD COLUMN IF NOT EXISTS placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
    `ALTER TABLE user_bets ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE user_bets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
    `ALTER TABLE user_bets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
  ];

  for (const query of userBetsQueries) {
    try {
      const { error } = await supabase.rpc('exec', { query });
      if (error) {
        console.log(`Error executing: ${query}`, error);
      } else {
        console.log(`Successfully executed: ${query}`);
      }
    } catch (e) {
      console.log(`Exception executing: ${query}`, e);
    }
  }

  console.log('Adding missing columns to match_votes...');

  // Add columns to match_votes
  const matchVotesQueries = [
    `ALTER TABLE match_votes ADD COLUMN IF NOT EXISTS prediction TEXT CHECK (prediction IN ('team_a', 'team_b'))`,
    `ALTER TABLE match_votes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
    `ALTER TABLE match_votes ADD CONSTRAINT IF NOT EXISTS unique_user_match_vote UNIQUE(user_id, match_id)`
  ];

  for (const query of matchVotesQueries) {
    try {
      const { error } = await supabase.rpc('exec', { query });
      if (error) {
        console.log(`Error executing: ${query}`, error);
      } else {
        console.log(`Successfully executed: ${query}`);
      }
    } catch (e) {
      console.log(`Exception executing: ${query}`, e);
    }
  }

  console.log('Table fixes completed');
}

fixTables().catch(console.error);