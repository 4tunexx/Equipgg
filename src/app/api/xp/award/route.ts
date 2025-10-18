import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { getAuthSession } from "../../../../lib/auth-utils";

// Award XP to a user
export async function POST(request: NextRequest) {
  try {
    const authSession = await getAuthSession(request);
    if (!authSession) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { amount, reason, targetUserId } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid XP amount is required' }, { status: 400 });
    }

    // Use target user ID if provided (admin functionality), otherwise award to current user
    const userId = targetUserId && authSession.role === 'admin' ? targetUserId : authSession.user_id;

    // Calculate level from XP (simple formula: level = floor(sqrt(xp / 100)))
    const calculateLevel = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;

    // Get current user stats
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('xp, level')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const newXp = (currentUser.xp || 0) + amount;
    const newLevel = calculateLevel(newXp);
    const leveledUp = newLevel > (currentUser.level || 1);

    // Update user XP and level
    const { error: updateError } = await supabase
      .from('users')
      .update({
        xp: newXp,
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Don't log XP awards to activity feed - only log level ups
    // XP is tracked internally but not shown in public activity feed

    // If user leveled up, award bonus coins
    if (leveledUp) {
      const bonusCoins = newLevel * 50; // 50 coins per level
      const { data: currentCoins } = await supabase
        .from('users')
        .select('coins')
        .eq('id', userId)
        .single();
      
      await supabase
        .from('users')
        .update({
          coins: (currentCoins?.coins || 0) + bonusCoins
        })
        .eq('id', userId);

      // Log level up activity
      await supabase
        .from('activity_feed')
        .insert({
          user_id: userId,
          action: 'leveled_up',
          description: `reached level ${newLevel}`,
          metadata: { 
            new_level: newLevel,
            bonus_coins: bonusCoins,
            amount: bonusCoins
          },
          created_at: new Date().toISOString()
        });
    }

    return NextResponse.json({ 
      success: true,
      xp_awarded: amount,
      total_xp: newXp,
      new_level: newLevel,
      leveled_up: leveledUp,
      bonus_coins: leveledUp ? newLevel * 50 : 0
    });
  } catch (error) {
    console.error('Error awarding XP:', error);
    return NextResponse.json({ error: 'Failed to award XP' }, { status: 500 });
  }
}

// Get XP leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: leaderboard, error } = await supabase
      .from('users')
      .select('id, displayname, avatar, xp, level')
      .order('xp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: offset + index + 1
    }));

    return NextResponse.json({ leaderboard: rankedLeaderboard });
  } catch (error) {
    console.error('Error fetching XP leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

// Admin-only: Bulk XP award
export async function PUT(request: NextRequest) {
  try {
    const authSession = await getAuthSession(request);
    if (!authSession || authSession.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userIds, amount, reason } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs array is required' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid XP amount is required' }, { status: 400 });
    }

    const results: Array<{
      userId: any;
      success: boolean;
      result?: any;
      error?: string;
    }> = [];

    // Award XP to each user
    for (const userId of userIds) {
      try {
        // Use the same logic as POST but for multiple users
        const response = await fetch(`${request.nextUrl.origin}/api/xp/award`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount, 
            reason: reason || `Bulk XP award: ${amount} XP`,
            targetUserId: userId 
          })
        });

        const result = await response.json();
        results.push({ userId, success: response.ok, result });
      } catch (error) {
        results.push({ userId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return NextResponse.json({ 
      success: true, 
      results,
      total_users: userIds.length,
      successful: results.filter(r => r.success).length
    });
  } catch (error) {
    console.error('Error bulk awarding XP:', error);
    return NextResponse.json({ error: 'Failed to bulk award XP' }, { status: 500 });
  }
}
