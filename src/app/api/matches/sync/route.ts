import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from "../../../../lib/auth-utils";
import { syncMatchesFromPandaScore, processMatchResults } from "../../../../lib/pandascore";

// POST /api/matches/sync - Sync matches from PandaScore (Admin only)
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

    // Sync matches from PandaScore
    await syncMatchesFromPandaScore();
    
    // Process any completed match results
    await processMatchResults();

    return NextResponse.json({ 
      success: true, 
      message: 'Matches synced successfully from PandaScore' 
    });
  } catch (error) {
    console.error('Error syncing matches:', error);
    return NextResponse.json({ 
      error: 'Failed to sync matches',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
