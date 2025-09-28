import { NextRequest, NextResponse } from 'next/server';
import { secureDb } from "../../../../lib/secure-db";
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from "../../../../lib/auth-utils";
import { parse } from 'cookie';
import { addXP } from "../../../../lib/xp-service";

// GET /api/admin/matches - Get all matches for admin management
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    // Get all matches (order by match_date DESC, start_time DESC)
    let matches = await secureDb.findMany('matches', undefined, { orderBy: 'match_date DESC' });
    // Secondary sort by start_time DESC (Supabase only allows one orderBy at a time)
    matches = matches.sort((a, b) => {
      const matchA = a as any;
      const matchB = b as any;
      if (matchA.match_date === matchB.match_date) {
        return (matchB.start_time || '').localeCompare(matchA.start_time || '');
      }
      return (matchB.match_date || '').localeCompare(matchA.match_date || '');
    });
    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/matches - Create new match
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const {
      team_a_name,
      team_a_logo,
      team_a_odds,
      team_b_name,
      team_b_logo,
      team_b_odds,
      event_name,
      map,
      start_time,
      match_date,
      stream_url,
      status = 'upcoming'
    } = await request.json();

    if (!team_a_name || !team_b_name || !event_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create match
    const match = await secureDb.create('matches', {
      team_a_name,
      team_a_logo,
      team_a_odds,
      team_b_name,
      team_b_logo,
      team_b_odds,
      event_name,
      map,
      start_time,
      match_date,
      stream_url,
      status
    });
    return NextResponse.json({
      success: true,
      message: 'Match created successfully',
      matchId: match?.id
    });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/matches - Update match
export async function PUT(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookies = parse(cookieHeader);
    const sessionToken = cookies['equipgg_session'];
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use getAuthSession for session validation
    const fakeRequest = { headers: { get: (h: string) => h === 'cookie' ? cookieHeader : undefined } } as NextRequest;
    const session = await getAuthSession(fakeRequest);
    if (!session) {
      return createUnauthorizedResponse();
    }
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const { matchId, updates } = await request.json();
    
    if (!matchId || !updates) {
      return NextResponse.json({ error: 'Missing matchId or updates' }, { status: 400 });
    }

    // Only allow certain fields to be updated
    const allowedFields = [
      'team_a_name', 'team_a_logo', 'team_a_odds',
      'team_b_name', 'team_b_logo', 'team_b_odds',
      'event_name', 'map', 'start_time', 'match_date', 'stream_url', 'status',
      'winner', 'team_a_score', 'team_b_score', 'completed_at'
    ];
    const filteredUpdates: Record<string, any> = {};
    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        filteredUpdates[field] = value;
      }
    }
    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update the match
    const updated = await secureDb.update('matches', { id: matchId }, filteredUpdates);

    // If match status is being set to 'completed' and winner is specified, process bet payouts
    if (filteredUpdates.status === 'completed' && (filteredUpdates.winner || updated.winner)) {
      const winner = filteredUpdates.winner || updated.winner;

      try {
        // Get all active bets for this match
        const bets = await secureDb.findMany('user_bets', {
          match_id: matchId,
          status: 'active'
        });

        if (bets && bets.length > 0) {
          // Process each bet
          for (const bet of bets) {
            const isWinner = bet.team_choice === winner;
            const newStatus = isWinner ? 'won' : 'lost';

            // Update bet status
            await secureDb.update('user_bets', { id: bet.id }, {
              status: newStatus,
              settled_at: new Date().toISOString()
            });

            // If winner, payout the winnings
            if (isWinner) {
              // Get current user balance
              const user = await secureDb.findOne('users', { id: bet.user_id });
              if (user) {
                const currentCoins = Number(user.coins || 0);
                const payoutAmount = Number(bet.potential_payout || 0);
                const newBalance = currentCoins + payoutAmount;
                await secureDb.update('users', { id: bet.user_id }, { coins: newBalance });

                // Award XP for winning a bet
                try {
                  await addXP(
                    String(bet.user_id),
                    25, // 25 XP for winning a bet
                    'betting',
                    `Won bet on ${updated.team_a_name} vs ${updated.team_b_name} (+${payoutAmount} coins)`
                  );
                } catch (xpError) {
                  console.warn('Failed to award XP for winning bet:', xpError);
                }
              }
            }
          }
        }
      } catch (payoutError) {
        console.error('Error processing bet payouts:', payoutError);
        // Don't fail the entire request if payouts fail, just log it
      }
    }

    return NextResponse.json({ success: true, message: 'Match updated successfully', match: updated });
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/matches - Delete match
export async function DELETE(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookies = parse(cookieHeader);
    const sessionToken = cookies['equipgg_session'];
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use getAuthSession for session validation
    const fakeRequest = { headers: { get: (h: string) => h === 'cookie' ? cookieHeader : undefined } } as NextRequest;
    const session = await getAuthSession(fakeRequest);
    if (!session) {
      return createUnauthorizedResponse();
    }
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const { matchId } = await request.json();
    
    if (!matchId) {
      return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
    }

  // Delete related bets first
  await secureDb.delete('user_bets', { match_id: matchId });
  // Delete match
  await secureDb.delete('matches', { id: matchId });
  return NextResponse.json({ success: true, message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/matches - Update match visibility
export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const body = await request.json();
    const { matchId, is_visible } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
    }

    if (typeof is_visible !== 'boolean') {
      return NextResponse.json({ error: 'is_visible must be a boolean' }, { status: 400 });
    }

    // Update match visibility
    await secureDb.update('matches', { id: matchId }, { is_visible });
    
    return NextResponse.json({ success: true, message: 'Match visibility updated successfully' });
  } catch (error) {
    console.error('Error updating match visibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}