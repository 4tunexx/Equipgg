import { NextRequest, NextResponse } from 'next/server';
import { getAllPerks, getPerksByCategory, getActivePerks, activatePerk } from '@/lib/supabase-integration';
import { getAuthSession } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    const perks = category
      ? await getPerksByCategory(category)
      : await getAllPerks();
    
    // Get active perks if authenticated
    let activePerks: any[] = [];
    try {
      const session = await getAuthSession(request);
      if (session?.user_id) {
        activePerks = await getActivePerks(session.user_id);
      }
    } catch {
      // Not authenticated
    }
    
    return NextResponse.json({
      success: true,
      perks,
      active: activePerks,
      total: perks.length
    });
  } catch (error) {
    console.error('Error fetching perks:', error);
    return NextResponse.json({ error: 'Failed to fetch perks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session?.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { perkId } = await request.json();
    
    const success = await activatePerk(session.user_id, perkId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to activate perk' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error activating perk:', error);
    return NextResponse.json({ error: 'Failed to activate perk' }, { status: 500 });
  }
}
