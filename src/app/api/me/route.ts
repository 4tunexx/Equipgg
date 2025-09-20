import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../lib/auth-utils";
import { createServerSupabaseClient } from "../../../lib/supabase";

interface User {
  id: string;
  email: string;
  displayname: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  role: string;
  coins: number;
  gems?: number;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    
    if (!session) {
      return NextResponse.json({ user: null });
    }
    
    const supabase = createServerSupabaseClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, displayname, avatar_url, xp, level, role, coins, gems')
      .eq('id', session.user_id)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ user: null });
    }
    
    if (user) {
      // Map to expected frontend fields
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayname,
          avatarUrl: user.avatar_url,
          xp: user.xp || 0,
          level: user.level || 1,
          role: user.role || 'user',
          coins: user.coins || 0,
          gems: user.gems || 0,
        }
      });
    }
    return NextResponse.json({ user: null });
  } catch (error) {
    console.error('Error in /api/me:', error);
    return NextResponse.json({ user: null, error: 'Internal error' });
  }
}


