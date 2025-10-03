// PandaScore API Integration for CS:GO matches
import { secureDb } from './secure-db';

const PANDASCORE_API_KEY = process.env.PANDASCORE_API_KEY;
const PANDASCORE_BASE_URL = 'https://api.pandascore.co';

// PandaScore API types
interface PandaScoreMatch {
  id: number;
  status: 'not_started' | 'running' | 'finished';
  begin_at: string;
  end_at?: string;
  tournament: {
    id: number;
    name: string;
    slug: string;
  };
  serie: {
    id: number;
    name: string;
  };
  opponents: Array<{
    opponent: {
      id: number;
      name: string;
      slug: string;
      image_url?: string;
    };
  }>;
  results?: Array<{
    score: number;
    team_id: number;
  }>;
  streams?: Array<{
    main: boolean;
    official: boolean;
    raw_url: string;
    language: string;
  }>;
  live?: {
    opens_at?: string;
    supported: boolean;
    url?: string;
  };
}

// Fetch matches from PandaScore API
async function fetchFromPandaScore(endpoint: string): Promise<PandaScoreMatch[]> {
  if (!PANDASCORE_API_KEY) {
    throw new Error('PANDASCORE_API_KEY environment variable is not set');
  }

  const response = await fetch(`${PANDASCORE_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${PANDASCORE_API_KEY}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`PandaScore API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Convert PandaScore match status to our format
function convertMatchStatus(status: string): 'upcoming' | 'live' | 'finished' {
  switch (status) {
    case 'not_started':
      return 'upcoming';
    case 'running':
      return 'live';
    case 'finished':
      return 'finished';
    default:
      return 'upcoming';
  }
}

// Sync matches from PandaScore
export async function syncMatchesFromPandaScore(): Promise<unknown[]> {
  try {
    console.log('Starting PandaScore match sync...');

    // Fetch upcoming and running CS:GO matches
    const upcomingMatches = await fetchFromPandaScore('/csgo/matches/upcoming?per_page=50');
    const runningMatches = await fetchFromPandaScore('/csgo/matches/running?per_page=20');
    const recentMatches = await fetchFromPandaScore('/csgo/matches/past?per_page=30');

    const allMatches = [...upcomingMatches, ...runningMatches, ...recentMatches];
    console.log(`Fetched ${allMatches.length} matches from PandaScore`);

    const syncedMatches = [];

    for (const match of allMatches) {
      try {
        // Check if match already exists
        const existingMatches = await secureDb.findMany('matches', { pandascore_id: match.id });
        const existingMatch = existingMatches[0];

        if (existingMatch) {
          // Update existing match
          await updateExistingMatch(match);
        } else {
          // Create new match
          await createNewMatch(match);
        }

        const opponents = (match as any).opponents;
        const tournament = (match as any).tournament;
        
        syncedMatches.push({
          id: (match as any).id,
          status: (match as any).status,
          tournament: tournament?.name,
          teams: opponents?.map((o: { opponent: { name: string } }) => o.opponent.name).join(' vs ')
        });

      } catch (error) {
        console.error(`Error processing match ${(match as any).id}:`, error);
      }
    }

    console.log(`Successfully synced ${syncedMatches.length} matches`);
    return syncedMatches;

  } catch (error) {
    console.error('Error syncing matches from PandaScore:', error);
    throw error;
  }
}

// Create new match from PandaScore data
async function createNewMatch(match: PandaScoreMatch) {
  const matchData = match as any;
  
  if (!matchData.opponents || matchData.opponents.length < 2) {
    console.log(`Skipping match ${matchData.id}: insufficient opponents`);
    return;
  }

  const teamA = matchData.opponents[0]?.opponent;
  const teamB = matchData.opponents[1]?.opponent;

  if (!teamA || !teamB) {
    console.log(`Skipping match ${matchData.id}: missing team data`);
    return;
  }

  // Get stream URL - try multiple sources
  let streamUrl = null;

  // First try to find main official stream
  const mainOfficialStream = matchData.streams?.find((s: any) => s.main && s.official);
  if (mainOfficialStream?.raw_url) {
    streamUrl = mainOfficialStream.raw_url;
  }

  // If no main official stream, try any official stream
  if (!streamUrl) {
    const officialStream = matchData.streams?.find((s: any) => s.official);
    if (officialStream?.raw_url) {
      streamUrl = officialStream.raw_url;
    }
  }

  // If still no stream, try any main stream
  if (!streamUrl) {
    const mainStream = matchData.streams?.find((s: any) => s.main);
    if (mainStream?.raw_url) {
      streamUrl = mainStream.raw_url;
    }
  }

  // As last resort, try live streaming URL
  if (!streamUrl && matchData.live?.url) {
    streamUrl = matchData.live.url;
  }

  // Log stream finding for debugging
  if (matchData.streams && matchData.streams.length > 0) {
    console.log(`Found ${matchData.streams.length} streams for match ${matchData.id}, using: ${streamUrl || 'none'}`);
  }

  // Create match record
  const newMatchData = {
    pandascore_id: matchData.id,
    team_a_name: teamA.name,
    team_a_logo: teamA.image_url || null,
    team_a_odds: 1.5, // Default odds - would need betting API for real odds
    team_b_name: teamB.name,
    team_b_logo: teamB.image_url || null,
    team_b_odds: 2.5, // Default odds
    event_name: matchData.tournament?.name || matchData.serie?.name || 'Unknown Tournament',
    start_time: matchData.begin_at ? new Date(matchData.begin_at).toTimeString().split(' ')[0] : null,
    match_date: matchData.begin_at ? new Date(matchData.begin_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    stream_url: streamUrl,
    status: convertMatchStatus(matchData.status)
  };

  await secureDb.create('matches', newMatchData);

  console.log(`Created new match: ${teamA.name} vs ${teamB.name}`);
}

// Update existing match
async function updateExistingMatch(match: PandaScoreMatch) {
  const matchData = match as any;
  
  // Get stream URL for existing matches too
  let streamUrl = null;
  const mainOfficialStream = matchData.streams?.find((s: any) => s.main && s.official);
  if (mainOfficialStream?.raw_url) {
    streamUrl = mainOfficialStream.raw_url;
  } else {
    const officialStream = matchData.streams?.find((s: any) => s.official);
    if (officialStream?.raw_url) {
      streamUrl = officialStream.raw_url;
    } else {
      const mainStream = matchData.streams?.find((s: any) => s.main);
      if (mainStream?.raw_url) {
        streamUrl = mainStream.raw_url;
      } else if (matchData.live?.url) {
        streamUrl = matchData.live.url;
      }
    }
  }
  
  const updateData: {
    status: 'upcoming' | 'live' | 'finished';
    start_time: string | null;
    updated_at: string;
    stream_url?: string | null;
    winner?: 'team_a' | 'team_b' | null;
  } = {
    status: convertMatchStatus(matchData.status),
    start_time: matchData.begin_at ? new Date(matchData.begin_at).toTimeString().split(' ')[0] : null,
    updated_at: new Date().toISOString()
  };

  // Update stream URL if we found one and it's different
  if (streamUrl) {
    updateData.stream_url = streamUrl;
  }

  // If match is finished, try to get winner
  if (matchData.status === 'finished' && matchData.results) {
    const results = matchData.results;
    if (results.length >= 2) {
      const team1Score = results[0]?.score || 0;
      const team2Score = results[1]?.score || 0;

      if (team1Score > team2Score) {
        updateData.winner = 'team_a';
      } else if (team2Score > team1Score) {
        updateData.winner = 'team_b';
      }
    }
  }

  await secureDb.update('matches', { pandascore_id: matchData.id }, updateData);

  console.log(`Updated match ${matchData.id} status: ${matchData.status}`);
}

// Process completed match results
export async function processMatchResults(): Promise<unknown[]> {
  try {
    console.log('Processing completed match results...');

    // Get recently finished matches that haven't been processed
    const finishedMatches = await secureDb.findMany('matches', {
      status: 'finished',
      winner: null,
      pandascore_id: { not: null }
    });

    const processedMatches = [];

    for (const match of finishedMatches || []) {
      try {
        // Fetch detailed match results from PandaScore
        const matchDetails = await fetchFromPandaScore(`/csgo/matches/${match.pandascore_id}`);
        const matchDetailsData = matchDetails as any;
        
        if (matchDetailsData.results && matchDetailsData.results.length >= 2) {
          const team1Score = matchDetailsData.results[0]?.score || 0;
          const team2Score = matchDetailsData.results[1]?.score || 0;
          
          let winner = null;
          if (team1Score > team2Score) {
            winner = 'team_a';
          } else if (team2Score > team1Score) {
            winner = 'team_b';
          }

          if (winner) {
            // Update match with winner
            await secureDb.update('matches', { id: match.id }, {
              winner,
              updated_at: new Date().toISOString()
            });

            processedMatches.push({
              id: match.id,
              winner,
              score: `${team1Score}-${team2Score}`
            });

            // Process user bets and payouts here
            try {
              // Fetch active bets for this match
              const bets = await secureDb.findMany('user_bets', { match_id: match.id, status: 'active' });

              if (bets && bets.length > 0) {
                // Use server-side supabase client to perform updates and payouts
                const { createServerSupabaseClient } = await import('./supabase');
                const server = createServerSupabaseClient();

                for (const bet of bets) {
                  const isWinner = bet.team_choice === winner;
                  const newStatus = isWinner ? 'won' : 'lost';

                  // Update bet status and settled_at
                  await secureDb.update('user_bets', { id: bet.id }, {
                    status: newStatus,
                    settled_at: new Date().toISOString()
                  });

                  if (isWinner) {
                    // Payout
                    const user = await secureDb.findOne('users', { id: bet.user_id });
                    if (user) {
                      const currentCoins = Number(user.coins || 0);
                      const payoutAmount = Number(bet.potential_payout || 0);
                      const newBalance = currentCoins + payoutAmount;
                      await secureDb.update('users', { id: bet.user_id }, { coins: newBalance });

                      // Award XP for winning a bet
                      try {
                        const { addXP } = await import('./xp-service');
                        await addXP(String(bet.user_id), 25, 'betting', `Won bet on ${match.team_a_name} vs ${match.team_b_name} (+${payoutAmount} coins)`);
                      } catch (xpError) {
                        console.warn('Failed to award XP for winning bet (scheduler):', xpError);
                      }
                    }
                  }
                }
              }

              console.log(`Processed match result: ${match.team_a_name} vs ${match.team_b_name} - Winner: ${winner}`);
            } catch (payoutError) {
              console.error('Error processing payouts in scheduler for match', match.id, payoutError);
            }
          }
        }

      } catch (error) {
        console.error(`Error processing match ${match.id}:`, error);
      }
    }

    console.log(`Processed ${processedMatches.length} match results`);
    // Cleanup: delete matches that finished more than 2 days ago (and their bets)
    try {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      // Find matches finished and older than 2 days
      const oldMatches = await secureDb.findMany('matches', { status: 'finished' });
      for (const m of oldMatches || []) {
        const completedAt = m.completed_at || m.updated_at || m.match_date;
  if (!completedAt) continue;
  const completedAtStr = String(completedAt);
  const completedDate = new Date(completedAtStr);
  if (isNaN(completedDate.getTime())) continue;
  if (completedDate.getTime() < Date.now() - 2 * 24 * 60 * 60 * 1000) {
          try {
            // Delete related bets first
            await secureDb.delete('user_bets', { match_id: m.id });
            await secureDb.delete('matches', { id: m.id });
            console.log(`Deleted old match ${m.id} and its bets`);
          } catch (delErr) {
            console.warn('Failed to delete old match', m.id, delErr);
          }
        }
      }
    } catch (cleanupError) {
      console.error('Error cleaning up old matches:', cleanupError);
    }

    return processedMatches;

  } catch (error) {
    console.error('Error processing match results:', error);
    throw error;
  }
}