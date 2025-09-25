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

async function seedActivity() {
  try {
    console.log('Seeding activity data...');
    
    // Get some existing users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .limit(5);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No users found to create activity');
      return;
    }

    const activities = [];
    const actions = ['won_game', 'lost_game', 'opened_crate', 'placed_bet', 'won_bet', 'traded_up', 'unlocked_achievement', 'leveled_up'];
    const icons = ['cs2', 'dota2', 'general', 'vip'];

    // Create 10 sample activities
    for (let i = 0; i < 10; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const icon = icons[Math.floor(Math.random() * icons.length)];
      const xp = Math.floor(Math.random() * 1000) + 10;
      
      activities.push({
        user_id: user.id,
        action: action,
        xp: xp,
        icon: icon,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    const { data, error } = await supabase
      .from('activity_feed')
      .insert(activities);

    if (error) {
      console.error('Error seeding activities:', error);
    } else {
      console.log('Successfully seeded', activities.length, 'activities');
    }

  } catch (error) {
    console.error('Error in seedActivity:', error);
  }
}

seedActivity();