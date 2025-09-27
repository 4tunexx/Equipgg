// PandaScore API Integration for CS:GO matches
import { supabase } from './supabase';

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
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .eq('pandascore_id', match.id)
          .single();

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

  // Get main stream URL
  const mainStream = matchData.streams?.find((s: any) => s.main && s.official);
  const streamUrl = mainStream?.raw_url || null;

  // Create match record
  const newMatchData = {
    id: `pandascore-${matchData.id}`,
    pandascore_id: matchData.id,
    team_a_name: teamA.name,
    team_a_logo: teamA.image_url || null,
    team_a_odds: 1.5, // Default odds - would need betting API for real odds
    team_b_name: teamB.name,
    team_b_logo: teamB.image_url || null,
    team_b_odds: 2.5, // Default odds
    event_name: matchData.tournament?.name || matchData.serie?.name || 'Unknown Tournament',
    start_time: matchData.begin_at,
    match_date: new Date(matchData.begin_at).toISOString().split('T')[0],
    stream_url: streamUrl,
    status: convertMatchStatus(matchData.status),
    winner: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('matches')
    .insert(newMatchData);

  if (error) {
    console.error(`Error creating match ${match.id}:`, error);
    throw error;
  }

  console.log(`Created new match: ${teamA.name} vs ${teamB.name}`);
}

// Update existing match
async function updateExistingMatch(match: PandaScoreMatch) {
  const matchData = match as any;
  
  const updateData: {
    status: 'upcoming' | 'live' | 'finished';
    start_time: string;
    updated_at: string;
    winner?: 'team_a' | 'team_b' | null;
  } = {
    status: convertMatchStatus(matchData.status),
    start_time: matchData.begin_at,
    updated_at: new Date().toISOString()
  };

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

  const { error } = await supabase
    .from('matches')
    .update(updateData)
    .eq('pandascore_id', matchData.id);

  if (error) {
    console.error(`Error updating match ${matchData.id}:`, error);
    throw error;
  }

  console.log(`Updated match ${matchData.id} status: ${matchData.status}`);
}

// Process completed match results
export async function processMatchResults(): Promise<unknown[]> {
  try {
    console.log('Processing completed match results...');

    // Get recently finished matches that haven't been processed
    const { data: finishedMatches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'finished')
      .is('winner', null)
      .not('pandascore_id', 'is', null);

    if (error) {
      console.error('Error fetching finished matches:', error);
      return [];
    }

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
            const { error: updateError } = await supabase
              .from('matches')
              .update({ 
                winner,
                updated_at: new Date().toISOString()
              })
              .eq('id', match.id);

            if (!updateError) {
              processedMatches.push({
                id: match.id,
                winner,
                score: `${team1Score}-${team2Score}`
              });

              // TODO: Process user bets and payouts here
              console.log(`Processed match result: ${match.team_a_name} vs ${match.team_b_name} - Winner: ${winner}`);
            }
          }
        }

      } catch (error) {
        console.error(`Error processing match ${match.id}:`, error);
      }
    }

    console.log(`Processed ${processedMatches.length} match results`);
    return processedMatches;

  } catch (error) {
    console.error('Error processing match results:', error);
    throw error;
  }
}