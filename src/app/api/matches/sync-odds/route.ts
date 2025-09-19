import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from "../../../../lib/auth-utils";
import { syncOddsFromHLTV } from "../../../../lib/hltv-scraper";

// POST /api/matches/sync-odds - Sync odds from HLTV (Admin only)
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

    // Sync odds from HLTV
    await syncOddsFromHLTV();

    return NextResponse.json({ 
      success: true, 
      message: 'Odds synced successfully from HLTV' 
    });
  } catch (error) {
    console.error('Error syncing odds from HLTV:', error);
    return NextResponse.json({ 
      error: 'Failed to sync odds from HLTV',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
