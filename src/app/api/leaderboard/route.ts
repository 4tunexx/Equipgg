import { NextResponse } from 'next/server';
import { supabase } from "../../../lib/supabase";

export async function GET() {
  try {
    // Get top players by XP from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('id, displayName, xp, level, avatar_url, role')
      .order('xp', { ascending: false })
      .order('level', { ascending: false })
      .limit(50);
    if (error) {
      throw error;
    }
    // Add rank field
    const players = (data || []).map((p, i) => ({
      id: p.id,
      name: p.displayName,
      xp: p.xp,
      level: p.level,
      avatar: p.avatar_url,
      role: p.role,
      rank: i + 1
    }));
    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}