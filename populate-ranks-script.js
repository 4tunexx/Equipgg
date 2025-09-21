const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateRanks() {
    try {
        console.log('🔄 Starting ranks population...');
        
        // Define ranks data
        const ranksData = [
            // Silver Tier (Levels 1-20)
            { name: 'Silver I', tier: 'Silver Tier', min_level: 1, max_level: 2, description: 'Starting rank for new players', icon_url: '/ranks/silver-1.png' },
            { name: 'Silver II', tier: 'Silver Tier', min_level: 3, max_level: 4, description: 'Basic progression in Silver tier', icon_url: '/ranks/silver-2.png' },
            { name: 'Silver III', tier: 'Silver Tier', min_level: 5, max_level: 6, description: 'Advancing through Silver ranks', icon_url: '/ranks/silver-3.png' },
            { name: 'Silver IV', tier: 'Silver Tier', min_level: 7, max_level: 8, description: 'Mid-tier Silver rank', icon_url: '/ranks/silver-4.png' },
            { name: 'Silver V', tier: 'Silver Tier', min_level: 9, max_level: 10, description: 'Upper Silver progression', icon_url: '/ranks/silver-5.png' },
            { name: 'Silver VI', tier: 'Silver Tier', min_level: 11, max_level: 12, description: 'Advanced Silver rank', icon_url: '/ranks/silver-6.png' },
            { name: 'Silver VII', tier: 'Silver Tier', min_level: 13, max_level: 14, description: 'High Silver tier', icon_url: '/ranks/silver-7.png' },
            { name: 'Silver VIII', tier: 'Silver Tier', min_level: 15, max_level: 16, description: 'Elite Silver progression', icon_url: '/ranks/silver-8.png' },
            { name: 'Silver IX', tier: 'Silver Tier', min_level: 17, max_level: 18, description: 'Top Silver rank', icon_url: '/ranks/silver-9.png' },
            { name: 'Silver Elite', tier: 'Silver Tier', min_level: 19, max_level: 20, description: 'Master of Silver tier', icon_url: '/ranks/silver-elite.png' },
            
            // Gold Nova Tier (Levels 21-40)
            { name: 'Gold Nova I', tier: 'Gold Nova Tier', min_level: 21, max_level: 22, description: 'Entry into Gold Nova tier', icon_url: '/ranks/gold-nova-1.png' },
            { name: 'Gold Nova II', tier: 'Gold Nova Tier', min_level: 23, max_level: 24, description: 'Progressing through Gold Nova', icon_url: '/ranks/gold-nova-2.png' },
            { name: 'Gold Nova III', tier: 'Gold Nova Tier', min_level: 25, max_level: 26, description: 'Mid Gold Nova rank', icon_url: '/ranks/gold-nova-3.png' },
            { name: 'Gold Nova IV', tier: 'Gold Nova Tier', min_level: 27, max_level: 28, description: 'Advanced Gold Nova', icon_url: '/ranks/gold-nova-4.png' },
            { name: 'Gold Nova V', tier: 'Gold Nova Tier', min_level: 29, max_level: 30, description: 'Upper Gold Nova tier', icon_url: '/ranks/gold-nova-5.png' },
            { name: 'Gold Nova VI', tier: 'Gold Nova Tier', min_level: 31, max_level: 32, description: 'High Gold Nova rank', icon_url: '/ranks/gold-nova-6.png' },
            { name: 'Gold Nova VII', tier: 'Gold Nova Tier', min_level: 33, max_level: 34, description: 'Elite Gold Nova', icon_url: '/ranks/gold-nova-7.png' },
            { name: 'Gold Nova VIII', tier: 'Gold Nova Tier', min_level: 35, max_level: 36, description: 'Top Gold Nova progression', icon_url: '/ranks/gold-nova-8.png' },
            { name: 'Gold Nova IX', tier: 'Gold Nova Tier', min_level: 37, max_level: 38, description: 'Peak Gold Nova rank', icon_url: '/ranks/gold-nova-9.png' },
            { name: 'Gold Nova Master', tier: 'Gold Nova Tier', min_level: 39, max_level: 40, description: 'Master of Gold Nova tier', icon_url: '/ranks/gold-nova-master.png' },
            
            // Master Guardian Tier (Levels 41-60)
            { name: 'Master Guardian I', tier: 'Master Guardian Tier', min_level: 41, max_level: 42, description: 'Entry into Master Guardian tier', icon_url: '/ranks/master-guardian-1.png' },
            { name: 'Master Guardian II', tier: 'Master Guardian Tier', min_level: 43, max_level: 44, description: 'Advancing Master Guardian', icon_url: '/ranks/master-guardian-2.png' },
            { name: 'Master Guardian III', tier: 'Master Guardian Tier', min_level: 45, max_level: 46, description: 'Mid Master Guardian rank', icon_url: '/ranks/master-guardian-3.png' },
            { name: 'Master Guardian IV', tier: 'Master Guardian Tier', min_level: 47, max_level: 48, description: 'Advanced Master Guardian', icon_url: '/ranks/master-guardian-4.png' },
            { name: 'Master Guardian V', tier: 'Master Guardian Tier', min_level: 49, max_level: 50, description: 'Upper Master Guardian', icon_url: '/ranks/master-guardian-5.png' },
            { name: 'Master Guardian Elite I', tier: 'Master Guardian Tier', min_level: 51, max_level: 52, description: 'Elite Master Guardian entry', icon_url: '/ranks/master-guardian-elite-1.png' },
            { name: 'Master Guardian Elite II', tier: 'Master Guardian Tier', min_level: 53, max_level: 54, description: 'Advanced Elite Guardian', icon_url: '/ranks/master-guardian-elite-2.png' },
            { name: 'Master Guardian Elite III', tier: 'Master Guardian Tier', min_level: 55, max_level: 56, description: 'Top Elite Guardian', icon_url: '/ranks/master-guardian-elite-3.png' },
            { name: 'Distinguished Master Guardian', tier: 'Master Guardian Tier', min_level: 57, max_level: 58, description: 'Distinguished Guardian rank', icon_url: '/ranks/distinguished-master-guardian.png' },
            { name: 'Prime Master Guardian', tier: 'Master Guardian Tier', min_level: 59, max_level: 60, description: 'Prime Guardian achievement', icon_url: '/ranks/prime-master-guardian.png' },
            
            // Legendary Tier (Levels 61-80)
            { name: 'Legendary Eagle I', tier: 'Legendary Tier', min_level: 61, max_level: 62, description: 'Entry into Legendary tier', icon_url: '/ranks/legendary-eagle-1.png' },
            { name: 'Legendary Eagle II', tier: 'Legendary Tier', min_level: 63, max_level: 64, description: 'Advancing Legendary Eagle', icon_url: '/ranks/legendary-eagle-2.png' },
            { name: 'Legendary Eagle III', tier: 'Legendary Tier', min_level: 65, max_level: 66, description: 'High Legendary Eagle', icon_url: '/ranks/legendary-eagle-3.png' },
            { name: 'Legendary Eagle Master I', tier: 'Legendary Tier', min_level: 67, max_level: 68, description: 'Eagle Master entry', icon_url: '/ranks/legendary-eagle-master-1.png' },
            { name: 'Legendary Eagle Master II', tier: 'Legendary Tier', min_level: 69, max_level: 70, description: 'Advanced Eagle Master', icon_url: '/ranks/legendary-eagle-master-2.png' },
            { name: 'Supreme Master First Class', tier: 'Legendary Tier', min_level: 71, max_level: 72, description: 'Supreme Master achievement', icon_url: '/ranks/supreme-master-first-class.png' },
            { name: 'Supreme Master Second Class', tier: 'Legendary Tier', min_level: 73, max_level: 74, description: 'Elite Supreme Master', icon_url: '/ranks/supreme-master-second-class.png' },
            { name: 'Supreme Master Guardian', tier: 'Legendary Tier', min_level: 75, max_level: 76, description: 'Guardian Supreme Master', icon_url: '/ranks/supreme-master-guardian.png' },
            { name: 'Legendary Guardian', tier: 'Legendary Tier', min_level: 77, max_level: 78, description: 'Legendary Guardian rank', icon_url: '/ranks/legendary-guardian.png' },
            { name: 'Mythic Guardian', tier: 'Legendary Tier', min_level: 79, max_level: 80, description: 'Mythic Guardian achievement', icon_url: '/ranks/mythic-guardian.png' },
            
            // Global Elite Tier (Levels 81-100)
            { name: 'Global Initiate', tier: 'Global Elite Tier', min_level: 81, max_level: 82, description: 'Entry into Global Elite', icon_url: '/ranks/global-initiate.png' },
            { name: 'Global Sentinel', tier: 'Global Elite Tier', min_level: 83, max_level: 84, description: 'Global Sentinel rank', icon_url: '/ranks/global-sentinel.png' },
            { name: 'Global Paragon', tier: 'Global Elite Tier', min_level: 85, max_level: 86, description: 'Global Paragon achievement', icon_url: '/ranks/global-paragon.png' },
            { name: 'Global Vanguard', tier: 'Global Elite Tier', min_level: 87, max_level: 88, description: 'Global Vanguard rank', icon_url: '/ranks/global-vanguard.png' },
            { name: 'Global Warlord', tier: 'Global Elite Tier', min_level: 89, max_level: 90, description: 'Global Warlord achievement', icon_url: '/ranks/global-warlord.png' },
            { name: 'Global Overlord', tier: 'Global Elite Tier', min_level: 91, max_level: 92, description: 'Global Overlord rank', icon_url: '/ranks/global-overlord.png' },
            { name: 'Global Elite Guardian', tier: 'Global Elite Tier', min_level: 93, max_level: 94, description: 'Elite Guardian rank', icon_url: '/ranks/global-elite-guardian.png' },
            { name: 'Global Elite Master', tier: 'Global Elite Tier', min_level: 95, max_level: 96, description: 'Elite Master achievement', icon_url: '/ranks/global-elite-master.png' },
            { name: 'Supreme Global Elite', tier: 'Global Elite Tier', min_level: 97, max_level: 98, description: 'Supreme Global Elite', icon_url: '/ranks/supreme-global-elite.png' },
            { name: 'The Global Elite', tier: 'Global Elite Tier', min_level: 99, max_level: 100, description: 'The ultimate rank achievement', icon_url: '/ranks/the-global-elite.png' }
        ];
        
        // Insert ranks data
        const { data, error } = await supabase
            .from('ranks')
            .insert(ranksData);
            
        if (error) {
            console.error('❌ Error inserting ranks:', error);
            return;
        }
        
        console.log('✅ Ranks populated successfully!');
        
        // Check total ranks
        const { data: countData, error: countError } = await supabase
            .from('ranks')
            .select('*', { count: 'exact' });
            
        if (countError) {
            console.error('❌ Error counting ranks:', countError);
        } else {
            console.log(`📊 Total ranks in database: ${countData.length}`);
        }
        
        // Update users with proper ranks based on their level
        console.log('🔄 Updating user ranks based on levels...');
        
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, level');
            
        if (usersError) {
            console.error('❌ Error fetching users:', usersError);
            return;
        }
        
        for (const user of users) {
            if (user.level) {
                const rank = ranksData.find(r => user.level >= r.min_level && user.level <= r.max_level);
                if (rank) {
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ current_rank: rank.name })
                        .eq('id', user.id);
                        
                    if (updateError) {
                        console.error(`❌ Error updating user ${user.id} rank:`, updateError);
                    }
                }
            }
        }
        
        console.log('✅ User ranks updated successfully!');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

populateRanks();