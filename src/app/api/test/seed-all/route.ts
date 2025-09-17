import { NextRequest, NextResponse } from 'next/server';
import { secureDb } from '@/lib/secure-db';

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting test data seeding...');
  // No legacy DB

    const results = {
      missions: 0,
      matches: 0,
      forum: { categories: 0, topics: 0 },
      shop: 0,
      crates: 0,
      achievements: 0,
      errors: [] as string[]
    };

    try {
      // 1. Seed Missions
      console.log('📋 Seeding missions...');
      await secureDb.delete('missions', {});

      const dailyMissions = [
        { id: 'login', title: 'Log In', description: 'Kick off your day with a simple login.', type: 'daily', tier: 1, xp_reward: 50, coin_reward: 0, gem_reward: 0, crate_reward: null, requirement_type: 'login', requirement_value: 1 },
        { id: 'place-bet', title: 'Place a Bet', description: 'Test your prediction skills on any match.', type: 'daily', tier: 1, xp_reward: 100, coin_reward: 0, gem_reward: 0, crate_reward: null, requirement_type: 'place_bet', requirement_value: 1 },
        { id: 'cast-vote', title: 'Cast a Vote', description: 'Make your voice heard in a community vote.', type: 'daily', tier: 1, xp_reward: 25, coin_reward: 0, gem_reward: 0, crate_reward: null, requirement_type: 'cast_vote', requirement_value: 1 },
        { id: 'chatterbox', title: 'Chatterbox', description: 'Send 5 messages in any chat room.', type: 'daily', tier: 1, xp_reward: 50, coin_reward: 0, gem_reward: 0, crate_reward: null, requirement_type: 'send_messages', requirement_value: 5 },
        { id: 'place-3-bets', title: 'Place 3 Bets', description: 'Up the ante by placing three separate bets.', type: 'daily', tier: 1, xp_reward: 150, coin_reward: 0, gem_reward: 0, crate_reward: null, requirement_type: 'place_bet', requirement_value: 3 },
        { id: 'window-shopper', title: 'Window Shopper', description: 'Explore the shop for new skins and crates.', type: 'daily', tier: 1, xp_reward: 25, coin_reward: 0, gem_reward: 0, crate_reward: null, requirement_type: 'visit_shop', requirement_value: 1 },
        { id: 'coin-earner', title: 'Coin Earner', description: 'Rack up at least 500 Coins from winning bets.', type: 'daily', tier: 1, xp_reward: 200, coin_reward: 0, gem_reward: 0, crate_reward: null, requirement_type: 'earn_coins', requirement_value: 500 },
        { id: 'check-ranks', title: 'Check the Ranks', description: 'Visit the leaderboard page.', type: 'daily', tier: 1, xp_reward: 25, coin_reward: 0, gem_reward: 0, crate_reward: null, requirement_type: 'visit_leaderboard', requirement_value: 1 },
        { id: 'win-bet', title: 'Win a Bet', description: 'Successfully predict a match outcome.', type: 'daily', tier: 1, xp_reward: 250, coin_reward: 0, gem_reward: 0, crate_reward: null, requirement_type: 'win_bet', requirement_value: 1 }
      ];

      const mainMissions = [
        { id: 'main-1', title: 'The First Step', description: 'Take your first bet and step into the world of predictions.', type: 'main', tier: 1, xp_reward: 100, coin_reward: 50, gem_reward: 0, crate_reward: null, requirement_type: 'place_bet', requirement_value: 1 },
        { id: 'main-2', title: 'A Winner is You', description: 'Win your very first bet.', type: 'main', tier: 1, xp_reward: 250, coin_reward: 100, gem_reward: 0, crate_reward: null, requirement_type: 'win_bet', requirement_value: 1 },
        { id: 'main-3', title: 'Join the Conversation', description: 'Cast your first community vote.', type: 'main', tier: 1, xp_reward: 50, coin_reward: 0, gem_reward: 0, crate_reward: null, requirement_type: 'cast_vote', requirement_value: 1 },
        { id: 'main-4', title: 'Getting Paid', description: 'Earn your first 1,000 Coins.', type: 'main', tier: 1, xp_reward: 150, coin_reward: 250, gem_reward: 0, crate_reward: null, requirement_type: 'earn_coins', requirement_value: 1000 },
        { id: 'main-5', title: 'Moving Up', description: 'Reach Level 5.', type: 'main', tier: 1, xp_reward: 500, coin_reward: 0, gem_reward: 0, crate_reward: 'Level Up Crate', requirement_type: 'reach_level', requirement_value: 5 },
        { id: 'main-6', title: 'What\'s in the Box?', description: 'Open your first Crate.', type: 'main', tier: 1, xp_reward: 100, coin_reward: 0, gem_reward: 0, crate_reward: null, requirement_type: 'open_crate', requirement_value: 1 },
        { id: 'main-7', title: 'Gear Up', description: 'Equip your first item to your profile.', type: 'main', tier: 1, xp_reward: 75, coin_reward: 0, gem_reward: 0, crate_reward: null, requirement_type: 'equip_item', requirement_value: 1 },
        { id: 'main-8', title: 'Liquidate Assets', description: 'Sell an item back to the shop for the first time.', type: 'main', tier: 1, xp_reward: 50, coin_reward: 25, gem_reward: 0, crate_reward: null, requirement_type: 'sell_item', requirement_value: 1 },
        { id: 'main-9', title: 'Sizing Up Competition', description: 'Check out the leaderboard to see where you stand.', type: 'main', tier: 1, xp_reward: 25, coin_reward: 0, gem_reward: 0, crate_reward: null, requirement_type: 'visit_leaderboard', requirement_value: 1 },
        { id: 'main-10', title: 'Speak Your Mind', description: 'Make your first forum post.', type: 'main', tier: 1, xp_reward: 50, coin_reward: 0, gem_reward: 0, crate_reward: null, requirement_type: 'forum_post', requirement_value: 1 }
      ];

      for (const mission of [...dailyMissions, ...mainMissions]) {
        await secureDb.create('missions', mission);
      }
      results.missions = dailyMissions.length + mainMissions.length;
      console.log(`✅ Seeded ${results.missions} missions`);

    } catch (error) {
      results.errors.push(`Missions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // 2. Seed Matches
      console.log('🏆 Seeding matches...');
      await secureDb.delete('matches', {});
      const matches = [
        // ...existing matches array...
        { id: 'match-nav-g2-1', team_a_name: 'NAVI', team_a_logo: 'https://img-cdn.hltv.org/teamlogo/4608.png', team_a_odds: 1.65, team_b_name: 'G2 Esports', team_b_logo: 'https://img-cdn.hltv.org/teamlogo/5995.png', team_b_odds: 2.20, event_name: 'ESL Pro League Season 19', start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), match_date: new Date().toISOString().split('T')[0], stream_url: 'https://www.twitch.tv/esl_csgo', status: 'upcoming', winner: null, pandascore_id: 1001 },
        { id: 'match-ast-vit-1', team_a_name: 'Astralis', team_a_logo: 'https://img-cdn.hltv.org/teamlogo/6665.png', team_a_odds: 1.80, team_b_name: 'Vitality', team_b_logo: 'https://img-cdn.hltv.org/teamlogo/9565.png', team_b_odds: 1.95, event_name: 'IEM Katowice 2024', start_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), match_date: new Date().toISOString().split('T')[0], stream_url: 'https://www.twitch.tv/esl_csgo', status: 'upcoming', winner: null, pandascore_id: 1002 },
        { id: 'match-fnc-faze-1', team_a_name: 'Fnatic', team_a_logo: 'https://img-cdn.hltv.org/teamlogo/4991.png', team_a_odds: 2.10, team_b_name: 'FaZe Clan', team_b_logo: 'https://img-cdn.hltv.org/teamlogo/6667.png', team_b_odds: 1.70, event_name: 'BLAST Premier Spring 2024', start_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), match_date: new Date().toISOString().split('T')[0], stream_url: 'https://www.twitch.tv/blastpremier', status: 'upcoming', winner: null, pandascore_id: 1003 },
        { id: 'match-live-1', team_a_name: 'Astralis', team_a_logo: 'https://img-cdn.hltv.org/teamlogo/6665.png', team_a_odds: 1.60, team_b_name: 'Vitality', team_b_logo: 'https://img-cdn.hltv.org/teamlogo/9565.png', team_b_odds: 2.25, event_name: 'IEM Katowice 2024', start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), match_date: new Date().toISOString().split('T')[0], stream_url: 'https://www.twitch.tv/esl_csgo', status: 'live', winner: null, pandascore_id: 1008 }
      ];
      for (const match of matches) {
        await secureDb.create('matches', { ...match, created_at: new Date().toISOString() });
      }
      results.matches = matches.length;
      console.log(`✅ Seeded ${results.matches} matches`);

    } catch (error) {
      results.errors.push(`Matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // 3. Seed Forum
      console.log('💬 Seeding forum...');
      await secureDb.delete('forum_topics', {});
      await secureDb.delete('forum_categories', {});
      const categories = [
        { id: 'cat-general', name: 'General Discussion', description: 'General chat about anything and everything', icon: '💬', display_order: 1 },
        { id: 'cat-strategy', name: 'Game Strategy', description: 'Share your winning strategies and tips', icon: '🎯', display_order: 2 },
        { id: 'cat-support', name: 'Technical Support', description: 'Get help with technical issues', icon: '🔧', display_order: 3 },
        { id: 'cat-announcements', name: 'Announcements', description: 'Official announcements and updates', icon: '📢', display_order: 4 }
      ];
      for (const category of categories) {
        await secureDb.create('forum_categories', { ...category, topic_count: 0, post_count: 0 });
      }
      const topics = [
        { id: 'topic-welcome', title: 'Welcome to EquipGG.net! 🎉', content: 'Welcome to the official EquipGG.net forum! This is your place to discuss everything related to CS2 betting, share strategies, and connect with other players.', category_id: 'cat-announcements', author_id: '15e06c6d-c8b6-4c47-959a-65b6ed2b540c' },
        { id: 'topic-betting-guide', title: 'Complete Betting Guide for Beginners 📚', content: 'Getting Started: 1. Understand the Basics 2. Start Small 3. Research Teams 4. Manage Your Bankroll', category_id: 'cat-strategy', author_id: '15e06c6d-c8b6-4c47-959a-65b6ed2b540c' }
      ];
      for (const topic of topics) {
        await secureDb.create('forum_topics', { ...topic, reply_count: 0, view_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      }
      results.forum.categories = categories.length;
      results.forum.topics = topics.length;
      console.log(`✅ Seeded ${results.forum.categories} categories and ${results.forum.topics} topics`);

    } catch (error) {
      results.errors.push(`Forum: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // 4. Seed Shop Items
      console.log('🛒 Seeding shop items...');
      await secureDb.delete('shop_items', {});
      const shopItems = [
        { id: 'item-ak-redline', name: 'AK-47 | Redline', image_url: 'https://picsum.photos/seed/ak47-redline/300/200', description: 'A classic AK-47 with red line design', category: 'weapon', rarity: 'Classified', price: 2500, stock_quantity: 10, item_type: 'weapon' },
        { id: 'item-awp-dragon', name: 'AWP | Dragon Lore', image_url: 'https://picsum.photos/seed/awp-dragon/300/200', description: 'Legendary AWP with dragon design', category: 'weapon', rarity: 'Covert', price: 15000, stock_quantity: 2, item_type: 'weapon' },
        { id: 'item-knife-fade', name: '★ Karambit | Fade', image_url: 'https://picsum.photos/seed/karambit-fade/300/200', description: 'Rare karambit knife with fade pattern', category: 'knife', rarity: 'Covert', price: 50000, stock_quantity: 1, item_type: 'knife' },
        { id: 'item-gloves-crimson', name: '★ Specialist Gloves | Crimson Web', image_url: 'https://picsum.photos/seed/gloves-crimson/300/200', description: 'Specialist gloves with crimson web pattern', category: 'gloves', rarity: 'Covert', price: 8000, stock_quantity: 3, item_type: 'gloves' }
      ];
      for (const item of shopItems) {
        await secureDb.create('shop_items', item);
      }
      results.shop = shopItems.length;
      console.log(`✅ Seeded ${results.shop} shop items`);

    } catch (error) {
      results.errors.push(`Shop: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // 5. Seed Achievements
      console.log('🏆 Seeding achievements...');
      await secureDb.delete('achievements', {});
      const achievements = [
        // Betting Achievements
        { id: 'first-bet', name: 'First Bet', description: 'Place your first bet', category: 'betting', rarity: 'common', xp_reward: 50, coin_reward: 100, gem_reward: 0, requirement_type: 'place_bet', requirement_value: 1, icon: '🎯' },
        { id: 'big-winner', name: 'Big Winner', description: 'Win a bet with 3.0x or higher odds', category: 'betting', rarity: 'rare', xp_reward: 200, coin_reward: 500, gem_reward: 0, requirement_type: 'win_high_odds', requirement_value: 1, icon: '💰' },
        { id: 'betting-master', name: 'Betting Master', description: 'Place 100 bets', category: 'betting', rarity: 'epic', xp_reward: 500, coin_reward: 1000, gem_reward: 5, requirement_type: 'place_bet', requirement_value: 100, icon: '🎲' },
        { id: 'lucky-strike', name: 'Lucky Strike', description: 'Win 10 bets in a row', category: 'betting', rarity: 'legendary', xp_reward: 1000, coin_reward: 2000, gem_reward: 10, requirement_type: 'win_streak', requirement_value: 10, icon: '🍀' },
        // Game Achievements
        { id: 'crash-master', name: 'Crash Master', description: 'Reach 10x multiplier in Crash', category: 'games', rarity: 'rare', xp_reward: 300, coin_reward: 750, gem_reward: 0, requirement_type: 'crash_multiplier', requirement_value: 10, icon: '🚀' },
        { id: 'sweeper-pro', name: 'Sweeper Pro', description: 'Clear 50 tiles in Sweeper', category: 'games', rarity: 'epic', xp_reward: 400, coin_reward: 1000, gem_reward: 3, requirement_type: 'sweeper_tiles', requirement_value: 50, icon: '🧹' },
        { id: 'plinko-champion', name: 'Plinko Champion', description: 'Win 1000x in Plinko', category: 'games', rarity: 'legendary', xp_reward: 800, coin_reward: 1500, gem_reward: 8, requirement_type: 'plinko_multiplier', requirement_value: 1000, icon: '🎯' },
        // Collection Achievements
        { id: 'first-purchase', name: 'First Purchase', description: 'Buy your first item from the shop', category: 'collection', rarity: 'common', xp_reward: 50, coin_reward: 0, gem_reward: 0, requirement_type: 'shop_purchase', requirement_value: 1, icon: '🛒' },
        { id: 'crate-opener', name: 'Crate Opener', description: 'Open 10 crates', category: 'collection', rarity: 'rare', xp_reward: 200, coin_reward: 500, gem_reward: 2, requirement_type: 'open_crate', requirement_value: 10, icon: '📦' },
        { id: 'collector', name: 'Collector', description: 'Own 50 items in your inventory', category: 'collection', rarity: 'epic', xp_reward: 400, coin_reward: 1000, gem_reward: 5, requirement_type: 'inventory_items', requirement_value: 50, icon: '🎒' },
        // Social Achievements
        { id: 'chatterbox', name: 'Chatterbox', description: 'Send 100 messages in chat', category: 'social', rarity: 'common', xp_reward: 100, coin_reward: 200, gem_reward: 0, requirement_type: 'chat_messages', requirement_value: 100, icon: '💬' },
        { id: 'forum-poster', name: 'Forum Poster', description: 'Create 10 forum topics', category: 'social', rarity: 'rare', xp_reward: 300, coin_reward: 500, gem_reward: 3, requirement_type: 'forum_topics', requirement_value: 10, icon: '📝' },
        { id: 'community-leader', name: 'Community Leader', description: 'Get 50 likes on your posts', category: 'social', rarity: 'epic', xp_reward: 500, coin_reward: 1000, gem_reward: 5, requirement_type: 'post_likes', requirement_value: 50, icon: '👑' },
        // Progression Achievements
        { id: 'level-10', name: 'Level 10', description: 'Reach level 10', category: 'progression', rarity: 'rare', xp_reward: 0, coin_reward: 1000, gem_reward: 5, requirement_type: 'reach_level', requirement_value: 10, icon: '⭐' },
        { id: 'level-25', name: 'Level 25', description: 'Reach level 25', category: 'progression', rarity: 'epic', xp_reward: 0, coin_reward: 2500, gem_reward: 10, requirement_type: 'reach_level', requirement_value: 25, icon: '🌟' },
        { id: 'level-50', name: 'Level 50', description: 'Reach level 50', category: 'progression', rarity: 'legendary', xp_reward: 0, coin_reward: 5000, gem_reward: 25, requirement_type: 'reach_level', requirement_value: 50, icon: '💎' },
        // Special Achievements
        { id: 'early-bird', name: 'Early Bird', description: 'Be among the first 100 users', category: 'special', rarity: 'legendary', xp_reward: 1000, coin_reward: 5000, gem_reward: 50, requirement_type: 'early_user', requirement_value: 1, icon: '🐦' },
        { id: 'perfect-day', name: 'Perfect Day', description: 'Complete all daily missions in one day', category: 'special', rarity: 'epic', xp_reward: 500, coin_reward: 1000, gem_reward: 10, requirement_type: 'complete_all_daily', requirement_value: 1, icon: '✨' }
      ];
      for (const achievement of achievements) {
        await secureDb.create('achievements', { ...achievement, is_active: 1 });
      }
      results.achievements = achievements.length;
      console.log(`✅ Seeded ${results.achievements} achievements`);

    } catch (error) {
      results.errors.push(`Achievements: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  // No DB export needed for Supabase

    return NextResponse.json({
      success: true,
      message: 'Test data seeding completed',
      results,
      summary: {
        totalItems: results.missions + results.matches + results.forum.categories + results.forum.topics + results.shop + results.achievements,
        errors: results.errors.length
      }
    });

  } catch (error) {
    console.error('❌ Error in test seeding:', error);
    return NextResponse.json(
      { error: 'Failed to seed data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

