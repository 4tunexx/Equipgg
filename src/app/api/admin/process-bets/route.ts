import { NextRequest, NextResponse } from "next/server";
import { processBetsForMatch, processAllCompletedMatches } from "../../../../lib/bet-result-processor";
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { secureDb } from "../../../../lib/secure-db";

// POST /api/admin/process-bets - Process betting results for completed matches
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { matchId, winner } = body;

    if (matchId && winner) {
      // Process specific match
      const result = await processBetsForMatch(matchId, winner);
      return NextResponse.json({
        success: true,
        message: `Processed ${result.betsProcessed} bets for match ${matchId}`,
        result
      });
    } else {
      // Process all completed matches
      const results = await processAllCompletedMatches();
      const totalBetsProcessed = results.reduce((sum, r) => sum + r.betsProcessed, 0);
      const totalPayouts = results.reduce((sum, r) => sum + r.payoutTotal, 0);
      
      return NextResponse.json({
        success: true,
        message: `Processed ${totalBetsProcessed} bets across ${results.length} matches`,
        totalPayouts,
        results
      });
    }

  } catch (error) {
    console.error('Error processing bets:', error);
    return NextResponse.json({
      error: "Failed to process bets",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// GET /api/admin/process-bets - Get betting processing status
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get matches with unprocessed bets
    const completedMatches = await secureDb.findMany('matches', {
      status: 'finished'
    });

    const matchesWithUnprocessedBets: Array<{
      matchId: string;
      teamA: string;
      teamB: string;
      winner: string | null;
      activeBetsCount: number;
    }> = [];
    
    for (const match of completedMatches || []) {
      const activeBets = await secureDb.findMany('user_bets', {
        match_id: match.id,
        status: 'active'
      });
      
      if (activeBets && activeBets.length > 0) {
        matchesWithUnprocessedBets.push({
          matchId: String(match.id),
          teamA: String(match.team_a_name || 'Unknown'),
          teamB: String(match.team_b_name || 'Unknown'),
          winner: match.winner ? String(match.winner) : null,
          activeBetsCount: activeBets.length
        });
      }
    }

    return NextResponse.json({
      completedMatches: completedMatches?.length || 0,
      matchesWithUnprocessedBets: matchesWithUnprocessedBets.length,
      details: matchesWithUnprocessedBets
    });

  } catch (error) {
    console.error('Error getting betting status:', error);
    return NextResponse.json({
      error: "Failed to get betting status",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}