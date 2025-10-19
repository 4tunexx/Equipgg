import { NextRequest, NextResponse } from 'next/server';
import { getAllBadges, getUserBadges } from '@/lib/supabase-integration';
import { getAuthSession } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    const badges = await getAllBadges();
    
    // Get user's unlocked badges if authenticated
    let unlockedIds: number[] = [];
    try {
      const session = await getAuthSession(request);
      if (session?.user_id) {
        unlockedIds = await getUserBadges(session.user_id);
      }
    } catch {
      // Not authenticated, continue without user badges
    }
    
    const filteredBadges = category
      ? badges.filter(b => b.category === category)
      : badges;
    
    return NextResponse.json({
      success: true,
      badges: filteredBadges,
      unlocked: unlockedIds,
      total: filteredBadges.length
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}
