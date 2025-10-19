import { NextRequest, NextResponse } from 'next/server';
import { getAllRanks, getRankByLevel } from '@/lib/supabase-integration';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    
    if (level) {
      const rank = await getRankByLevel(parseInt(level));
      return NextResponse.json({ success: true, rank });
    }
    
    const ranks = await getAllRanks();
    return NextResponse.json({ success: true, ranks, total: ranks.length });
  } catch (error) {
    console.error('Error fetching ranks:', error);
    return NextResponse.json({ error: 'Failed to fetch ranks' }, { status: 500 });
  }
}
