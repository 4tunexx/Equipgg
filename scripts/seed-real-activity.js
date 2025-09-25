const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedRealActivity() {
  try {
    console.log('Seeding real activity data...');
    
    // Get some existing users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .limit(3);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No users found to create activity');
      return;
    }

    console.log('Found users:', users.map(u => ({ id: u.id, username: u.username })));

    const activities = [];
    const actions = ['won_game', 'lost_game', 'opened_crate', 'placed_bet', 'won_bet'];
    
    // Create 5 sample activities
    for (let i = 0; i < 5; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const xp = Math.floor(Math.random() * 500) + 50;
      
      activities.push({
        user_id: user.id,
        action: action,
        description: `${user.username || 'User'} ${action.replace('_', ' ')} and earned ${xp} XP`,
        metadata: { xp: xp, gameType: 'cs2' },
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    console.log('Inserting activities:', activities);

    const { data, error } = await supabase
      .from('activity_feed')
      .insert(activities)
      .select();

    if (error) {
      console.error('Error seeding activities:', error);
    } else {
      console.log('Successfully seeded', data.length, 'activities');
      console.log('Sample activity:', data[0]);
    }

  } catch (error) {
    console.error('Error in seedRealActivity:', error);
  }
}

seedRealActivity();