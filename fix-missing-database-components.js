const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with correct credentials
const supabaseUrl = 'https://rxamnospcmbtgzptmmxl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4YW1ub3NwY21idGd6cHRtbXhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA1NjgzOSwiZXhwIjoyMDczNjMyODM5fQ.TLkG3Dgrp0QAq_APeXrukFcrR4Eof15miMYynWFxqMc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingComponents() {
  console.log('🔧 Fixing missing database components...');
  
  try {
    // 1. Add vip_tier column to users table
    console.log('\n📝 Adding vip_tier column to users table...');
    const { error: vipTierError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_tier INTEGER DEFAULT 0;'
    });
    
    if (vipTierError) {
      console.error('❌ Error adding vip_tier column:', vipTierError.message);
    } else {
      console.log('✅ vip_tier column added successfully');
    }
    
    // 2. Create mission_progress table
    console.log('\n📝 Creating mission_progress table...');
    const missionProgressSQL = `
      CREATE TABLE IF NOT EXISTS mission_progress (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
        progress INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, mission_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_mission_progress_user_id ON mission_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_mission_progress_mission_id ON mission_progress(mission_id);
      CREATE INDEX IF NOT EXISTS idx_mission_progress_completed ON mission_progress(completed);
    `;
    
    const { error: missionProgressError } = await supabase.rpc('exec_sql', {
      sql: missionProgressSQL
    });
    
    if (missionProgressError) {
      console.error('❌ Error creating mission_progress table:', missionProgressError.message);
    } else {
      console.log('✅ mission_progress table created successfully');
    }
    
    // 3. Create shop_items table
    console.log('\n📝 Creating shop_items table...');
    const shopItemsSQL = `
      CREATE TABLE IF NOT EXISTS shop_items (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        subcategory VARCHAR(100),
        rarity VARCHAR(50) DEFAULT 'common',
        coin_price INTEGER DEFAULT 0,
        gem_price INTEGER DEFAULT 0,
        image_url TEXT,
        stock INTEGER DEFAULT -1,
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items(category);
      CREATE INDEX IF NOT EXISTS idx_shop_items_rarity ON shop_items(rarity);
      CREATE INDEX IF NOT EXISTS idx_shop_items_active ON shop_items(is_active);
    `;
    
    const { error: shopItemsError } = await supabase.rpc('exec_sql', {
      sql: shopItemsSQL
    });
    
    if (shopItemsError) {
      console.error('❌ Error creating shop_items table:', shopItemsError.message);
    } else {
      console.log('✅ shop_items table created successfully');
    }
    
    // 4. Add some sample mission progress data
    console.log('\n📝 Adding sample mission progress data...');
    const { data: users } = await supabase.from('users').select('id').limit(2);
    const { data: missions } = await supabase.from('missions').select('id, requirement_value').limit(5);
    
    if (users && missions && users.length > 0 && missions.length > 0) {
      for (const user of users) {
        for (const mission of missions) {
          const progress = Math.floor(Math.random() * mission.requirement_value);
          const completed = progress >= mission.requirement_value;
          
          await supabase.from('mission_progress').upsert({
            user_id: user.id,
            mission_id: mission.id,
            progress: progress,
            completed: completed,
            completed_at: completed ? new Date().toISOString() : null
          }, { onConflict: 'user_id,mission_id' });
        }
      }
      console.log('✅ Sample mission progress data added');
    }
    
    // 5. Add some sample shop items
    console.log('\n📝 Adding sample shop items...');
    const sampleShopItems = [
      {
        name: 'Premium Crate Key',
        description: 'Unlock premium crates with rare items',
        category: 'keys',
        rarity: 'rare',
        gem_price: 100,
        image_url: '/assets/items/premium-key.png'
      },
      {
        name: 'XP Booster (24h)',
        description: 'Double XP gain for 24 hours',
        category: 'boosters',
        rarity: 'epic',
        coin_price: 5000,
        image_url: '/assets/items/xp-booster.png'
      },
      {
        name: 'Coin Multiplier',
        description: 'Increase coin rewards by 50% for 12 hours',
        category: 'boosters',
        rarity: 'rare',
        gem_price: 75,
        image_url: '/assets/items/coin-multiplier.png'
      }
    ];
    
    for (const item of sampleShopItems) {
      const { error } = await supabase.from('shop_items').insert(item);
      if (error) {
        console.error(`❌ Error adding shop item ${item.name}:`, error.message);
      }
    }
    console.log('✅ Sample shop items added');
    
    console.log('\n🎯 Database fixes complete!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

fixMissingComponents();