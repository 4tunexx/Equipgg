import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../lib/supabase";
import { getRankByLevel } from "../../../lib/badges-ranks-system";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Get top players by XP from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('id, username, xp, level, avatar_url, role, coins')
      .order('xp', { ascending: false })
      .order('level', { ascending: false })
      .limit(Math.min(limit, 500));
      
    if (error) {
      throw error;
    }
    
    // Add rank field and rank name
    const players = (data || []).map((p, i) => {
      const rank = getRankByLevel(p.level);
      return {
        user_id: p.id,
        username: p.username,
        xp: p.xp,
        level: p.level,
        avatar_url: p.avatar_url,
        role: p.role,
        coins: p.coins,
        rank: rank.name,
        position: i + 1
      };
    });
    
    return NextResponse.json({ 
      success: true,
      players,
      total: players.length
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}