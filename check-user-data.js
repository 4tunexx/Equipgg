const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserData() {
  try {
    // Get first user's data
    const { data: users, error } = await supabase
      .from('users')
      .select('id, xp, level, coins, gems')
      .limit(1);

    if (error) {
      console.error('❌ Error fetching user data:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found');
      return;
    }

    const user = users[0];
    console.log('📊 Current user data in database:');
    console.log('User ID:', user.id);
    console.log('XP:', user.xp);
    console.log('Level:', user.level);
    console.log('Coins:', user.coins);
    console.log('Gems:', user.gems);
    
    // Calculate what level should be based on XP using our XP config
    const { getLevelFromXP, getLevelInfo } = require('./src/lib/xp-config.ts');
    
    console.log('\n🧮 Calculated level from XP:');
    try {
      const calculatedLevel = getLevelFromXP(user.xp || 0);
      const levelInfo = getLevelInfo(user.xp || 0);
      
      console.log('Calculated Level:', calculatedLevel);
      console.log('Level Info:', levelInfo);
      
      if (user.level !== calculatedLevel) {
        console.log('⚠️  MISMATCH! Database level does not match calculated level');
        console.log('Database has Level:', user.level);
        console.log('Should be Level:', calculatedLevel);
      } else {
        console.log('✅ Level is consistent');
      }
    } catch (error) {
      console.log('❌ Error calculating level:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkUserData();