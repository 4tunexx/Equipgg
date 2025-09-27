const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function addMissingPerks() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Adding missing perks...');

  const missingPerks = [
    {
      name: 'Daily Bonus',
      description: 'Claim free coins every 24 hours',
      category: 'daily',
      perk_type: 'daily_bonus',
      effect_value: 100,
      duration_hours: 24,
      coin_price: 0,
      gem_price: 0,
      is_active: true
    },
    {
      name: 'Level Bonus',
      description: 'Get bonus coins based on your level',
      category: 'progression',
      perk_type: 'level_bonus',
      effect_value: 10,
      duration_hours: 0,
      coin_price: 0,
      gem_price: 0,
      is_active: true
    },
    {
      name: 'Referral Bonus',
      description: 'Earn coins for successful referrals',
      category: 'social',
      perk_type: 'referral_bonus',
      effect_value: 500,
      duration_hours: 0,
      coin_price: 0,
      gem_price: 0,
      is_active: true
    },
    {
      name: 'Login Streak',
      description: 'Extra coins for consecutive daily logins',
      category: 'daily',
      perk_type: 'streak_bonus',
      effect_value: 25,
      duration_hours: 24,
      coin_price: 0,
      gem_price: 0,
      is_active: true
    }
  ];

  for (const perk of missingPerks) {
    const { data, error } = await supabase.from('perks').insert(perk).select();
    if (error) {
      console.log('Error inserting perk:', perk.name, error);
    } else {
      console.log('Inserted perk:', perk.name);
    }
  }

  console.log('Done adding missing perks');
}

addMissingPerks().catch(console.error);