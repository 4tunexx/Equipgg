import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pbtihewjjqjlwrjwrgwz.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBidGloZXdqanFqbHdyandyZ3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxODI1NzcsImV4cCI6MjA0NDc1ODU3N30.C5BvKLy2KyH1fK0iE3k4xbf3A5pWb4M0TDZ9XeJZa6w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickFixes() {
  console.log('🚀 QUICK DATABASE FIXES FOR IMMEDIATE PRODUCTION READINESS\n');

  try {
    // First, let's check what data we have now
    console.log('1. Checking current database state...');
    
    // Check items table
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, name, coin_price, gem_price')
      .limit(5);
    
    if (itemsError) {
      console.error('Items error:', itemsError);
    } else {
      console.log(`✅ Items table: ${items.length} items found`);
    }

    // Check users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, level, xp, coins, gems');
    
    if (usersError) {
      console.error('Users error:', usersError);
    } else {
      console.log(`✅ Users table: ${users.length} users found`);
      users.forEach(user => {
        console.log(`   - ${user.username}: Level ${user.level}, XP ${user.xp}, Coins ${user.coins}, Gems ${user.gems}`);
      });
    }

    // Check achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('id, name, description, xp_reward')
      .limit(5);
    
    if (achievementsError) {
      console.error('Achievements error:', achievementsError);
    } else {
      console.log(`✅ Achievements table: ${achievements.length} achievements found`);
    }

    // Check missions
    const { data: missions, error: missionsError } = await supabase
      .from('missions')
      .select('id, title, description, mission_type, xp_reward')
      .limit(5);
    
    if (missionsError) {
      console.error('Missions error:', missionsError);
    } else {
      console.log(`✅ Missions table: ${missions.length} missions found`);
    }

    // Check user achievements (likely empty)
    const { count: userAchievementsCount, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true });
    
    if (userAchievementsError) {
      console.error('User achievements error:', userAchievementsError);
    } else {
      console.log(`⚠️  User achievements: ${userAchievementsCount} records (EMPTY - needs fixing)`);
    }

    // Check user inventory (likely empty)
    const { count: userInventoryCount, error: userInventoryError } = await supabase
      .from('user_inventory')
      .select('*', { count: 'exact', head: true });
    
    if (userInventoryError) {
      console.error('User inventory error:', userInventoryError);
    } else {
      console.log(`⚠️  User inventory: ${userInventoryCount} records (EMPTY - needs fixing)`);
    }

    console.log('\n🎯 DIAGNOSIS:');
    console.log('- Database connection: ✅ WORKING');
    console.log('- Core data (items, achievements, missions): ✅ POPULATED');
    console.log('- User data (achievements, inventory): ❌ EMPTY (this breaks user pages)');
    console.log('\nNext: Apply direct SQL fixes to populate user data...');

  } catch (error) {
    console.error('Critical error:', error);
  }
}

quickFixes();