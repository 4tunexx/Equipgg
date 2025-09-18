import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';
import secureDb from '@/lib/secureDb';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin') {
      return createForbiddenResponse('Only admins can seed achievements');
    }

    console.log('🏆 Seeding achievements...');

    // Clear existing achievements
    await secureDb.delete('user_achievements', {});
    console.log('✅ Cleared existing user achievements');

    // Initialize tables (in Supabase this would be done via migrations)
    // For local development or testing, we can create tables via raw SQL
    await secureDb.raw(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        requirement_type TEXT NOT NULL,
        requirement_value INTEGER NOT NULL DEFAULT 1,
        xp_reward INTEGER NOT NULL DEFAULT 0,
        coin_reward INTEGER NOT NULL DEFAULT 0,
        gem_reward INTEGER NOT NULL DEFAULT 0,
        icon TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Clear existing achievements
    await secureDb.delete('achievements', {});
    console.log('✅ Cleared existing achievements');

    // Define comprehensive achievements
    const achievements = [
      // Betting Achievements
      {
        id: 'first-bet',
        title: 'Getting Started',
        description: 'Place your first bet on any match and kick off your betting adventure!',
        category: 'betting',
        requirement_type: 'place_bet',
        requirement_value: 1,
        xp_reward: 100,
        coin_reward: 50,
        gem_reward: 0,
        icon: '🎯'
      },
      {
        id: 'first-win',
        title: 'First Victory',
        description: 'Win your first bet and celebrate with a triumphant start.',
        category: 'betting',
        requirement_type: 'win_bet',
        requirement_value: 1,
        xp_reward: 200,
        coin_reward: 100,
        gem_reward: 0,
        icon: '🏆'
      },
      {
        id: 'regular-bettor',
        title: 'Regular Bettor',
        description: 'Place a total of 50 bets and earn recognition as a regular player.',
        category: 'betting',
        requirement_type: 'place_bet',
        requirement_value: 50,
        xp_reward: 500,
        coin_reward: 250,
        gem_reward: 5,
        icon: '🎲'
      },
      {
        id: 'consistent-winner',
        title: 'Consistent Winner',
        description: 'Win 50 bets total and prove your prediction skills.',
        category: 'betting',
        requirement_type: 'win_bet',
        requirement_value: 50,
        xp_reward: 1000,
        coin_reward: 500,
        gem_reward: 10,
        icon: '⭐'
      },
      {
        id: 'win-streak-3',
        title: 'Heating Up',
        description: 'Win 3 bets in a row and feel the momentum building!',
        category: 'betting',
        requirement_type: 'win_streak',
        requirement_value: 3,
        xp_reward: 300,
        coin_reward: 150,
        gem_reward: 3,
        icon: '🔥'
      },
      {
        id: 'against-odds',
        title: 'Against The Odds',
        description: 'Win a bet on a team with odds of 3.0 or higher—defy the odds!',
        category: 'betting',
        requirement_type: 'high_odds_win',
        requirement_value: 1,
        xp_reward: 400,
        coin_reward: 200,
        gem_reward: 5,
        icon: '💪'
      },
      {
        id: 'veteran-bettor',
        title: 'Seasoned Veteran',
        description: 'Place 500 bets total and claim your veteran status.',
        category: 'betting',
        requirement_type: 'place_bet',
        requirement_value: 500,
        xp_reward: 2000,
        coin_reward: 1000,
        gem_reward: 25,
        icon: '🎖️'
      },

      // Arcade Game Achievements
      {
        id: 'first-crash',
        title: 'Crash Course',
        description: 'Play your first crash game and experience the thrill!',
        category: 'arcade',
        requirement_type: 'play_crash',
        requirement_value: 1,
        xp_reward: 50,
        coin_reward: 25,
        gem_reward: 0,
        icon: '🚀'
      },
      {
        id: 'crash-cashout-3x',
        title: 'Triple Threat',
        description: 'Cash out at 3x or higher in a crash game.',
        category: 'arcade',
        requirement_type: 'crash_cashout_3x',
        requirement_value: 1,
        xp_reward: 150,
        coin_reward: 75,
        gem_reward: 2,
        icon: '💎'
      },
      {
        id: 'crash-streak-3',
        title: 'Crash Master',
        description: 'Win 3 crash games in a row.',
        category: 'arcade',
        requirement_type: 'crash_win_streak',
        requirement_value: 3,
        xp_reward: 300,
        coin_reward: 150,
        gem_reward: 5,
        icon: '⚡'
      },
      {
        id: 'first-coinflip',
        title: 'Heads or Tails',
        description: 'Play your first coinflip game.',
        category: 'arcade',
        requirement_type: 'play_coinflip',
        requirement_value: 1,
        xp_reward: 50,
        coin_reward: 25,
        gem_reward: 0,
        icon: '🪙'
      },
      {
        id: 'coinflip-winner',
        title: 'Lucky Coin',
        description: 'Win your first coinflip game.',
        category: 'arcade',
        requirement_type: 'win_coinflip',
        requirement_value: 1,
        xp_reward: 100,
        coin_reward: 50,
        gem_reward: 1,
        icon: '🍀'
      },
      {
        id: 'first-sweeper',
        title: 'Mine Sweeper',
        description: 'Play your first sweeper game.',
        category: 'arcade',
        requirement_type: 'play_sweeper',
        requirement_value: 1,
        xp_reward: 50,
        coin_reward: 25,
        gem_reward: 0,
        icon: '💣'
      },
      {
        id: 'sweeper-clear-10',
        title: 'Clear Skies',
        description: 'Clear 10 tiles in a single sweeper game.',
        category: 'arcade',
        requirement_type: 'sweeper_clear_10',
        requirement_value: 1,
        xp_reward: 200,
        coin_reward: 100,
        gem_reward: 3,
        icon: '☀️'
      },

      // Social Achievements
      {
        id: 'first-forum-post',
        title: 'Community Voice',
        description: 'Make your first forum post and join the conversation.',
        category: 'social',
        requirement_type: 'forum_post',
        requirement_value: 1,
        xp_reward: 100,
        coin_reward: 50,
        gem_reward: 1,
        icon: '💬'
      },
      {
        id: 'forum-active',
        title: 'Active Member',
        description: 'Make 10 forum posts and become an active community member.',
        category: 'social',
        requirement_type: 'forum_post',
        requirement_value: 10,
        xp_reward: 300,
        coin_reward: 150,
        gem_reward: 5,
        icon: '🗣️'
      },
      {
        id: 'first-vote',
        title: 'Democracy',
        description: 'Cast your first vote in a community poll.',
        category: 'social',
        requirement_type: 'cast_vote',
        requirement_value: 1,
        xp_reward: 50,
        coin_reward: 25,
        gem_reward: 0,
        icon: '🗳️'
      },

      // Progression Achievements
      {
        id: 'level-5',
        title: 'Rising Star',
        description: 'Reach level 5 and show your dedication.',
        category: 'progression',
        requirement_type: 'reach_level',
        requirement_value: 5,
        xp_reward: 200,
        coin_reward: 100,
        gem_reward: 5,
        icon: '⭐'
      },
      {
        id: 'level-10',
        title: 'Experienced Player',
        description: 'Reach level 10 and prove your commitment.',
        category: 'progression',
        requirement_type: 'reach_level',
        requirement_value: 10,
        xp_reward: 500,
        coin_reward: 250,
        gem_reward: 10,
        icon: '🌟'
      },
      {
        id: 'level-25',
        title: 'Elite Player',
        description: 'Reach level 25 and join the elite ranks.',
        category: 'progression',
        requirement_type: 'reach_level',
        requirement_value: 25,
        xp_reward: 1000,
        coin_reward: 500,
        gem_reward: 25,
        icon: '👑'
      },
      {
        id: 'level-50',
        title: 'Legend',
        description: 'Reach level 50 and become a legend.',
        category: 'progression',
        requirement_type: 'reach_level',
        requirement_value: 50,
        xp_reward: 2500,
        coin_reward: 1250,
        gem_reward: 50,
        icon: '🏆'
      },

      // Collection Achievements
      {
        id: 'first-crate',
        title: 'What\'s in the Box?',
        description: 'Open your first crate and discover what\'s inside.',
        category: 'collection',
        requirement_type: 'open_crate',
        requirement_value: 1,
        xp_reward: 100,
        coin_reward: 50,
        gem_reward: 1,
        icon: '📦'
      },
      {
        id: 'crate-collector',
        title: 'Crate Collector',
        description: 'Open 25 crates and become a true collector.',
        category: 'collection',
        requirement_type: 'open_crate',
        requirement_value: 25,
        xp_reward: 500,
        coin_reward: 250,
        gem_reward: 10,
        icon: '🎁'
      },
      {
        id: 'first-shop-purchase',
        title: 'Window Shopper',
        description: 'Make your first purchase from the shop.',
        category: 'collection',
        requirement_type: 'shop_purchase',
        requirement_value: 1,
        xp_reward: 50,
        coin_reward: 25,
        gem_reward: 0,
        icon: '🛒'
      },
      {
        id: 'big-spender',
        title: 'Big Spender',
        description: 'Spend a total of 10,000 coins in the shop.',
        category: 'collection',
        requirement_type: 'shop_spend',
        requirement_value: 10000,
        xp_reward: 1000,
        coin_reward: 500,
        gem_reward: 20,
        icon: '💰'
      },

      // Special Achievements
      {
        id: 'daily-login-7',
        title: 'Dedicated',
        description: 'Log in for 7 consecutive days.',
        category: 'special',
        requirement_type: 'daily_login_streak',
        requirement_value: 7,
        xp_reward: 300,
        coin_reward: 150,
        gem_reward: 5,
        icon: '📅'
      },
      {
        id: 'daily-login-30',
        title: 'Loyalty',
        description: 'Log in for 30 consecutive days.',
        category: 'special',
        requirement_type: 'daily_login_streak',
        requirement_value: 30,
        xp_reward: 1000,
        coin_reward: 500,
        gem_reward: 25,
        icon: '💎'
      },
      {
        id: 'jackpot-winner',
        title: 'Jackpot!',
        description: 'Win a bet with 10x or higher multiplier.',
        category: 'special',
        requirement_type: 'jackpot_win',
        requirement_value: 1,
        xp_reward: 1000,
        coin_reward: 500,
        gem_reward: 50,
        icon: '🎰'
      }
    ];

    // Insert achievements
    await secureDb.insert('achievements', achievements);

    console.log(`✅ Seeded ${achievements.length} achievements`);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${achievements.length} achievements`,
      achievements: achievements.length,
      categories: {
        betting: achievements.filter(a => a.category === 'betting').length,
        arcade: achievements.filter(a => a.category === 'arcade').length,
        social: achievements.filter(a => a.category === 'social').length,
        progression: achievements.filter(a => a.category === 'progression').length,
        collection: achievements.filter(a => a.category === 'collection').length,
        special: achievements.filter(a => a.category === 'special').length
      }
    });

  } catch (error) {
    console.error('❌ Error seeding achievements:', error);
    return NextResponse.json(
      { error: 'Failed to seed achievements' },
      { status: 500 }
    );
  }
}

