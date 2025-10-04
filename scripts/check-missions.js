// Check existing missions
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMissions() {
  try {
    console.log('🔍 Checking existing missions...');
    
    const { data: missions, error } = await supabase
      .from('missions')
      .select('id, name, description, requirement_type, requirement_value, mission_type')
      .eq('is_active', true)
      .order('id');
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log(`📋 Found ${missions.length} active missions:`);
    missions.forEach(m => {
      console.log(`  ${m.id}. ${m.name} (${m.mission_type})`);
      console.log(`     Type: ${m.requirement_type}, Value: ${m.requirement_value}`);
    });
    
    // Check for betting-specific missions
    const bettingMissions = missions.filter(m => 
      m.requirement_type === 'bet_placed' || 
      m.requirement_type === 'bet_amount' || 
      m.requirement_type === 'bet_won'
    );
    
    console.log(`\n🎲 Betting missions: ${bettingMissions.length}`);
    bettingMissions.forEach(m => {
      console.log(`  - ${m.name}: ${m.requirement_type} (${m.requirement_value})`);
    });
    
  } catch (error) {
    console.error('💥 Failed:', error);
  }
}

checkMissions().then(() => process.exit(0));