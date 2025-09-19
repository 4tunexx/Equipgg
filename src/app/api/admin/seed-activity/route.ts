import { NextRequest, NextResponse } from 'next/server';
import secureDb from "../../../../lib/secureDb";
import { v4 as uuidv4 } from 'uuid';
import { RouteContext, RouteHandler, createApiHandler } from '../../../../types/api';
import { User, Activity } from '../../../../types/database';

export const POST: RouteHandler = createApiHandler(async (request: NextRequest) => {
  // Get some users to create activities for
  const users = await secureDb.select<User>('users');
  const limitedUsers = users?.slice(0, 5) || [];
  
  if (limitedUsers.length === 0) {
    return NextResponse.json({ 
      success: false,
      error: 'No users found to create activities for' 
    }, { status: 400 });
  }

  const activities = limitedUsers.flatMap<Activity>(user => {
    const baseTimestamp = Date.now();
    return [
      {
        id: uuidv4(),
        user_id: user.id,
        username: user.username,
        activity_type: 'game_win',
        amount: 2500,
        game_type: 'crash',
        multiplier: 2.5,
        created_at: new Date(baseTimestamp - 2 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        user_id: user.id,
        username: user.username,
        activity_type: 'crate_open',
        item_name: 'AK-47 | Redline',
        item_rarity: 'Rare',
        created_at: new Date(baseTimestamp - 5 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        user_id: user.id,
        username: user.username,
        activity_type: 'bet_placed',
        amount: 1000,
        game_type: 'coinflip',
        created_at: new Date(baseTimestamp - 8 * 60 * 1000).toISOString()
      }
    ];
  });

  // Insert activities using secureDb
  await secureDb.insert<Activity>('user_activity_feed', activities);

  return NextResponse.json({ 
    success: true,
    message: 'Activity data seeded successfully',
    count: activities.length 
  });
});
