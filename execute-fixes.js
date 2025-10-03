const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pbtihewjjqjlwrjwrgwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBidGloZXdqanFqbHdyandyZ3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxODI1NzcsImV4cCI6MjA0NDc1ODU3N30.C5BvKLy2KyH1fK0iE3k4xbf3A5pWb4M0TDZ9XeJZa6w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeFixes() {
  console.log('🔧 Applying critical database fixes...\n');

  try {
    // 1. Add missing featured column
    console.log('1. Adding featured column to items table...');
    const { error: featuredError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE items ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;'
    });
    if (featuredError) console.error('Featured column error:', featuredError);
    else console.log('✅ Featured column added');

    // 2. Add missing lobby column
    console.log('2. Adding lobby column to chat_messages table...');
    const { error: lobbyError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS lobby VARCHAR(50) DEFAULT \'general\';'
    });
    if (lobbyError) console.error('Lobby column error:', lobbyError);
    else console.log('✅ Lobby column added');

    // 3. Set some items as featured
    console.log('3. Setting featured items...');
    const { error: updateFeaturedError } = await supabase.rpc('exec_sql', {
      sql: 'UPDATE items SET featured = true WHERE id IN (SELECT id FROM items ORDER BY RANDOM() LIMIT 10);'
    });
    if (updateFeaturedError) console.error('Update featured error:', updateFeaturedError);
    else console.log('✅ Featured items set');

    // 4. Check current user data
    console.log('4. Checking current user data...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, level, xp, coins, gems');
    
    if (usersError) {
      console.error('Users error:', usersError);
    } else {
      console.log('Current users:', users);
    }

    // 5. Check empty tables that need data
    const tablesToCheck = [
      'user_achievements',
      'user_inventory', 
      'user_stats',
      'user_mission_progress',
      'user_ranks',
      'user_badges',
      'notifications'
    ];

    for (const table of tablesToCheck) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`Error checking ${table}:`, error);
      } else {
        console.log(`${table}: ${count} records`);
      }
    }

    console.log('\n🎯 Database fixes applied! Now check if pages work correctly.');

  } catch (error) {
    console.error('Execution error:', error);
  }
}

executeFixes();