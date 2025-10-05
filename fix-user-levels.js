const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// XP Configuration (copied from xp-config.ts)
const defaultXPConfig = {
  base: 500,    
  step: 200,    
  scale: 10     
};

function getLevelFromXP(totalXP, config = defaultXPConfig) {
  if (totalXP < 0) return 1;
  
  let level = 1;
  let xpNeeded = 0;
  
  while (xpNeeded <= totalXP) {
    level++;
    const levelXP = config.base + (config.step * (level - 1)) + (config.scale * Math.pow(level - 1, 2));
    xpNeeded += levelXP;
  }
  
  return level - 1;
}

async function fixAllUserLevels() {
  console.log('🔧 Starting user level synchronization...');
  
  try {
    // Get all users with their current XP and level
    const { data: users, error } = await supabase
      .from('users')
      .select('id, xp, level');

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    console.log(`📊 Found ${users.length} users to check`);
    
    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    
    for (const user of users) {
      const currentXP = user.xp || 0;
      const currentLevel = user.level || 1;
      const calculatedLevel = getLevelFromXP(currentXP);
      
      if (currentLevel !== calculatedLevel) {
        console.log(`🔧 Fixing user ${user.id}: XP=${currentXP}, Level=${currentLevel} → ${calculatedLevel}`);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ level: calculatedLevel })
          .eq('id', user.id);
          
        if (updateError) {
          console.error(`❌ Error updating user ${user.id}:`, updateError);
        } else {
          fixedCount++;
        }
      } else {
        alreadyCorrectCount++;
      }
    }
    
    console.log(`✅ Level synchronization complete!`);
    console.log(`   Fixed: ${fixedCount} users`);
    console.log(`   Already correct: ${alreadyCorrectCount} users`);
    
  } catch (error) {
    console.error('❌ Level synchronization failed:', error);
  }
}

fixAllUserLevels();