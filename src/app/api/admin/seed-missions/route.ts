import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';
import { getDb, run } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin') {
      return createForbiddenResponse('Only admins can seed missions');
    }

    console.log('🌱 Seeding missions...');
    const db = await getDb();

    // Clear existing missions
    await run('DELETE FROM missions');
    console.log('✅ Cleared existing missions');

    // Daily missions
    const dailyMissions = [
      {
        id: 'login',
        title: 'Log In',
        description: 'Kick off your day with a simple login.',
        type: 'daily',
        tier: 1,
        xp_reward: 50,
        coin_reward: 0,
        gem_reward: 0,
        requirement_type: 'login',
        requirement_value: 1
      },
      {
        id: 'place-bet',
        title: 'Place a Bet',
        description: 'Test your prediction skills on any match.',
        type: 'daily',
        tier: 1,
        xp_reward: 100,
        coin_reward: 0,
        gem_reward: 0,
        requirement_type: 'place_bet',
        requirement_value: 1
      },
      {
        id: 'cast-vote',
        title: 'Cast a Vote',
        description: 'Make your voice heard in a community vote.',
        type: 'daily',
        tier: 1,
        xp_reward: 25,
        coin_reward: 0,
        gem_reward: 0,
        requirement_type: 'cast_vote',
        requirement_value: 1
      },
      {
        id: 'chatterbox',
        title: 'Chatterbox',
        description: 'Send 5 messages in any chat room.',
        type: 'daily',
        tier: 1,
        xp_reward: 50,
        coin_reward: 0,
        gem_reward: 0,
        requirement_type: 'send_messages',
        requirement_value: 5
      },
      {
        id: 'place-3-bets',
        title: 'Place 3 Bets',
        description: 'Up the ante by placing three separate bets.',
        type: 'daily',
        tier: 1,
        xp_reward: 150,
        coin_reward: 0,
        gem_reward: 0,
        requirement_type: 'place_bet',
        requirement_value: 3
      },
      {
        id: 'window-shopper',
        title: 'Window Shopper',
        description: 'Explore the shop for new skins and crates.',
        type: 'daily',
        tier: 1,
        xp_reward: 25,
        coin_reward: 0,
        gem_reward: 0,
        requirement_type: 'visit_shop',
        requirement_value: 1
      },
      {
        id: 'coin-earner',
        title: 'Coin Earner',
        description: 'Rack up at least 500 Coins from winning bets.',
        type: 'daily',
        tier: 1,
        xp_reward: 200,
        coin_reward: 0,
        gem_reward: 0,
        requirement_type: 'earn_coins',
        requirement_value: 500
      },
      {
        id: 'check-ranks',
        title: 'Check the Ranks',
        description: 'Visit the leaderboard page.',
        type: 'daily',
        tier: 1,
        xp_reward: 25,
        coin_reward: 0,
        gem_reward: 0,
        requirement_type: 'visit_leaderboard',
        requirement_value: 1
      },
      {
        id: 'win-bet',
        title: 'Win a Bet',
        description: 'Successfully predict a match outcome.',
        type: 'daily',
        tier: 1,
        xp_reward: 250,
        coin_reward: 0,
        gem_reward: 0,
        requirement_type: 'win_bet',
        requirement_value: 1
      }
    ];

    // Main missions
    const mainMissions = [
      {
        id: 'main-1',
        title: 'The First Step',
        description: 'Take your first bet and step into the world of predictions.',
        type: 'main',
        tier: 1,
        xp_reward: 100,
        coin_reward: 50,
        gem_reward: 0,
        requirement_type: 'place_bet',
        requirement_value: 1
      },
      {
        id: 'main-2',
        title: 'A Winner is You',
        description: 'Win your very first bet.',
        type: 'main',
        tier: 1,
        xp_reward: 250,
        coin_reward: 100,
        gem_reward: 0,
        requirement_type: 'win_bet',
        requirement_value: 1
      },
      {
        id: 'main-3',
        title: 'Join the Conversation',
        description: 'Cast your first community vote.',
        type: 'main',
        tier: 1,
        xp_reward: 50,
        coin_reward: 0,
        gem_reward: 0,
        requirement_type: 'cast_vote',
        requirement_value: 1
      },
      {
        id: 'main-4',
        title: 'Getting Paid',
        description: 'Earn your first 1,000 Coins.',
        type: 'main',
        tier: 1,
        xp_reward: 150,
        coin_reward: 250,
        gem_reward: 0,
        requirement_type: 'earn_coins',
        requirement_value: 1000
      },
      {
        id: 'main-5',
        title: 'Moving Up',
        description: 'Reach Level 5.',
        type: 'main',
        tier: 1,
        xp_reward: 500,
        coin_reward: 0,
        gem_reward: 0,
        crate_reward: 'Level Up Crate',
        requirement_type: 'reach_level',
        requirement_value: 5
      },
      {
        id: 'main-6',
        title: 'What\'s in the Box?',
        description: 'Open your first Crate.',
        type: 'main',
        tier: 1,
        xp_reward: 100,
        coin_reward: 0,
        gem_reward: 0,
        requirement_type: 'open_crate',
        requirement_value: 1
      },
      {
        id: 'main-7',
        title: 'Gear Up',
        description: 'Equip your first item to your profile.',
        type: 'main',
        tier: 1,
        xp_reward: 75,
        coin_reward: 0,
        gem_reward: 0,
        requirement_type: 'equip_item',
        requirement_value: 1
      },
      {
        id: 'main-8',
        title: 'Liquidate Assets',
        description: 'Sell an item back to the shop for the first time.',
        type: 'main',
        tier: 1,
        xp_reward: 50,
        coin_reward: 25,
        gem_reward: 0,
        requirement_type: 'sell_item',
        requirement_value: 1
      },
      {
        id: 'main-9',
        title: 'Sizing Up Competition',
        description: 'Check out the leaderboard to see where you stand.',
        type: 'main',
        tier: 1,
        xp_reward: 25,
        coin_reward: 0,
        gem_reward: 0,
        requirement_type: 'visit_leaderboard',
        requirement_value: 1
      },
      {
        id: 'main-10',
        title: 'Speak Your Mind',
        description: 'Make your first forum post.',
        type: 'main',
        tier: 1,
        xp_reward: 50,
        coin_reward: 0,
        gem_reward: 0,
        requirement_type: 'forum_post',
        requirement_value: 1
      }
    ];

    // Insert daily missions
    for (const mission of dailyMissions) {
      await run(`
        INSERT INTO missions (id, title, description, type, tier, xp_reward, coin_reward, gem_reward, requirement_type, requirement_value)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        mission.id, mission.title, mission.description, mission.type, mission.tier,
        mission.xp_reward, mission.coin_reward, mission.gem_reward,
        mission.requirement_type, mission.requirement_value
      ]);
    }

    // Insert main missions
    for (const mission of mainMissions) {
      await run(`
        INSERT INTO missions (id, title, description, type, tier, xp_reward, coin_reward, gem_reward, crate_reward, requirement_type, requirement_value)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        mission.id, mission.title, mission.description, mission.type, mission.tier,
        mission.xp_reward, mission.coin_reward, mission.gem_reward, mission.crate_reward || null,
        mission.requirement_type, mission.requirement_value
      ]);
    }

    console.log(`✅ Seeded ${dailyMissions.length} daily missions and ${mainMissions.length} main missions`);
    
    // Persist changes
    await db.export();
    console.log('✅ Database changes persisted');

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${dailyMissions.length} daily missions and ${mainMissions.length} main missions`,
      dailyMissions: dailyMissions.length,
      mainMissions: mainMissions.length
    });

  } catch (error) {
    console.error('❌ Error seeding missions:', error);
    return NextResponse.json(
      { error: 'Failed to seed missions' },
      { status: 500 }
    );
  }
}

