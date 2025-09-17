// PandaScore API integration for CS2 matches
// Removed: import { getOne, run, getAll } from './db';

interface PandaScoreMatch {
  id: number;
  name: string;
  scheduled_at: string;
  begin_at: string;
  status: string;
  league: {
    id: number;
    name: string;
    image_url: string;
  };
  serie: {
    id: number;
    name: string;
  };
  opponents: Array<{
    opponent: {
      id: number;
      name: string;
      image_url: string;
    };
  }>;
  results: Array<{
    score: number;
    team_id: number;
  }>;
  winner_id?: number;
  live_embed_url?: string;
  streams_list: Array<{
    embed_url: string;
    language: string;
    main: boolean;
    official: boolean;
    raw_url: string;
  }>;
}

interface PandaScoreOdds {
  id: number;
  match_id: number;
  bookmaker: {
    id: number;
    name: string;
  };
  odds: Array<{
    id: number;
    label: string;
    value: number;
    probability: number;
    team_id?: number;
  }>;
}

class PandaScoreAPI {
  private apiKey: string;
  private baseUrl = 'https://api.pandascore.co';
  private rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('token', this.apiKey);
    
    // Add additional parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`PandaScore API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('PandaScore API request failed:', error);
      throw error;
    }
  }

  async getUpcomingMatches(limit = 20): Promise<PandaScoreMatch[]> {
    try {
      const matches = await this.makeRequest('/csgo/matches/upcoming', {
        per_page: limit,
        sort: 'scheduled_at',
        'filter[status]': 'not_started'
      });
      return matches;
    } catch (error) {
      console.error('Failed to fetch upcoming matches:', error);
      return [];
    }
  }

  async getRunningMatches(limit = 10): Promise<PandaScoreMatch[]> {
    try {
      const matches = await this.makeRequest('/csgo/matches/running', {
        per_page: limit,
        sort: 'begin_at'
      });
      return matches;
    } catch (error) {
      console.error('Failed to fetch running matches:', error);
      return [];
    }
  }

  async getFinishedMatches(limit = 20): Promise<PandaScoreMatch[]> {
    try {
      const matches = await this.makeRequest('/csgo/matches/past', {
        per_page: limit,
        sort: '-scheduled_at'
      });
      return matches;
    } catch (error) {
      console.error('Failed to fetch finished matches:', error);
      return [];
    }
  }

  async getMatchOdds(matchId: number): Promise<PandaScoreOdds[]> {
    try {
      const odds = await this.makeRequest(`/csgo/matches/${matchId}/odds`);
      return odds;
    } catch (error) {
      console.error(`Failed to fetch odds for match ${matchId}:`, error);
      return [];
    }
  }

  async getMatchDetails(matchId: number): Promise<PandaScoreMatch | null> {
    try {
      const match = await this.makeRequest(`/csgo/matches/${matchId}`);
      return match;
    } catch (error) {
      console.error(`Failed to fetch match details for ${matchId}:`, error);
      return null;
    }
  }
}

// Helper function to get PandaScore API instance
export async function getPandaScoreAPI(): Promise<PandaScoreAPI> {
  const settings = getOne('SELECT pandascore_api_key FROM connection_settings WHERE id = 1');
  const apiKey = settings?.pandascore_api_key || 'k6acJFiAUbzU7tPstkUFcYfRTq1JpvjTG_5TK6-zYiMEYjPKrjI';
  return new PandaScoreAPI(apiKey);
}

// Helper function to convert PandaScore match to our format
export function convertPandaScoreMatch(match: PandaScoreMatch, odds?: PandaScoreOdds[]) {
  const teamA = match.opponents[0]?.opponent;
  const teamB = match.opponents[1]?.opponent;
  
  // Get odds for each team
  let teamAOdds = 1.5; // Default odds
  let teamBOdds = 1.5; // Default odds
  
  if (odds && odds.length > 0) {
    const matchOdds = odds[0];
    if (matchOdds.odds.length >= 2) {
      teamAOdds = matchOdds.odds[0]?.value || 1.5;
      teamBOdds = matchOdds.odds[1]?.value || 1.5;
    }
  }

  // Determine match status
  let status = 'upcoming';
  if (match.status === 'running') {
    status = 'live';
  } else if (match.status === 'finished') {
    status = 'completed';
  }

  // Determine winner
  let winner = null;
  if (match.winner_id) {
    if (teamA?.id === match.winner_id) {
      winner = 'team_a';
    } else if (teamB?.id === match.winner_id) {
      winner = 'team_b';
    }
  }

  return {
    id: `pandascore_${match.id}`,
    team_a_name: teamA?.name || 'TBD',
    team_a_logo: teamA?.image_url || '/default-team-logo.png',
    team_a_odds: teamAOdds,
    team_b_name: teamB?.name || 'TBD',
    team_b_logo: teamB?.image_url || '/default-team-logo.png',
    team_b_odds: teamBOdds,
    event_name: match.league?.name || match.serie?.name || 'CS2 Match',
    map: null, // PandaScore doesn't provide map info in basic match data
    start_time: match.scheduled_at || match.begin_at,
    match_date: match.scheduled_at ? new Date(match.scheduled_at).toISOString().split('T')[0] : null,
    stream_url: match.live_embed_url || match.streams_list?.[0]?.raw_url || null,
    status,
    winner,
    pandascore_id: match.id,
    created_at: new Date().toISOString()
  };
}

// Function to sync matches from PandaScore
export async function syncMatchesFromPandaScore(): Promise<void> {
  try {
    console.log('🔄 Starting PandaScore match sync...');
    const api = await getPandaScoreAPI();
    
    // Get upcoming matches
    const upcomingMatches = await api.getUpcomingMatches(10);
    console.log(`📥 Fetched ${upcomingMatches.length} upcoming matches`);
    
    // Get running matches
    const runningMatches = await api.getRunningMatches(5);
    console.log(`📥 Fetched ${runningMatches.length} running matches`);
    
    // Get recent finished matches
    const finishedMatches = await api.getFinishedMatches(10);
    console.log(`📥 Fetched ${finishedMatches.length} finished matches`);
    
    const allMatches = [...upcomingMatches, ...runningMatches, ...finishedMatches];
    
    for (const match of allMatches) {
      try {
        // Get odds for the match
        const odds = await api.getMatchOdds(match.id);
        
        // Convert to our format
        const convertedMatch = convertPandaScoreMatch(match, odds);
        
        // Check if match already exists
        const existingMatch = getOne('SELECT id FROM matches WHERE pandascore_id = ?', [match.id]);
        
        if (existingMatch) {
          // Update existing match
          run(`
            UPDATE matches SET
              team_a_name = ?, team_a_logo = ?, team_a_odds = ?,
              team_b_name = ?, team_b_logo = ?, team_b_odds = ?,
              event_name = ?, start_time = ?, match_date = ?,
              stream_url = ?, status = ?, winner = ?
            WHERE pandascore_id = ?
          `, [
            convertedMatch.team_a_name,
            convertedMatch.team_a_logo,
            convertedMatch.team_a_odds,
            convertedMatch.team_b_name,
            convertedMatch.team_b_logo,
            convertedMatch.team_b_odds,
            convertedMatch.event_name,
            convertedMatch.start_time,
            convertedMatch.match_date,
            convertedMatch.stream_url,
            convertedMatch.status,
            convertedMatch.winner,
            match.id
          ]);
        } else {
          // Insert new match
          run(`
            INSERT INTO matches (
              id, team_a_name, team_a_logo, team_a_odds,
              team_b_name, team_b_logo, team_b_odds,
              event_name, start_time, match_date,
              stream_url, status, winner, pandascore_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            convertedMatch.id,
            convertedMatch.team_a_name,
            convertedMatch.team_a_logo,
            convertedMatch.team_a_odds,
            convertedMatch.team_b_name,
            convertedMatch.team_b_logo,
            convertedMatch.team_b_odds,
            convertedMatch.event_name,
            convertedMatch.start_time,
            convertedMatch.match_date,
            convertedMatch.stream_url,
            convertedMatch.status,
            convertedMatch.winner,
            convertedMatch.pandascore_id,
            convertedMatch.created_at
          ]);
        }
        
        // Small delay between matches to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to sync match ${match.id}:`, error);
      }
    }
    
    console.log('✅ PandaScore match sync completed');
  } catch (error) {
    console.error('❌ PandaScore match sync failed:', error);
  }
}

// Function to process match results and pay out winnings
export async function processMatchResults(): Promise<void> {
  try {
    console.log('🔄 Processing match results...');
    
    // Get completed matches that haven't been processed yet
    const completedMatches = getAll(`
      SELECT * FROM matches 
      WHERE status = 'completed' AND winner IS NOT NULL
      AND id NOT IN (SELECT DISTINCT match_id FROM user_bets WHERE status = 'completed')
    `);
    
    for (const match of completedMatches) {
      // Get all bets for this match
      const bets = getAll('SELECT * FROM user_bets WHERE match_id = ? AND status = "pending"', [match.id]);
      
      for (const bet of bets) {
        try {
          let payout = 0;
          let result = 'lost';
          
          // Check if user won
          if (bet.team_id === match.winner) {
            payout = bet.potential_payout;
            result = 'won';
          }
          
          // Update bet status
          run(`
            UPDATE user_bets SET
              status = 'completed',
              result = ?,
              payout = ?
            WHERE id = ?
          `, [result, payout, bet.id]);
          
          // Update user balance if they won
          if (payout > 0) {
            run(`
              UPDATE users SET
                coins = coins + ?
              WHERE id = ?
            `, [payout, bet.user_id]);
            
            // Add transaction record
            run(`
              INSERT INTO user_transactions (
                id, user_id, type, amount, currency, description, created_at
              ) VALUES (?, ?, 'betting_win', ?, 'coins', ?, ?)
            `, [
              `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              bet.user_id,
              payout,
              `Betting win: ${match.team_a_name} vs ${match.team_b_name}`,
              new Date().toISOString()
            ]);
            
            // Award XP for winning
            const xpGained = Math.floor(payout / 100); // 1 XP per 100 coins won
            run(`
              UPDATE users SET
                xp = xp + ?
              WHERE id = ?
            `, [xpGained, bet.user_id]);
            
            console.log(`💰 Paid out ${payout} coins to user ${bet.user_id} for match ${match.id}`);
          }
        } catch (error) {
          console.error(`Failed to process bet ${bet.id}:`, error);
        }
      }
    }
    
    console.log('✅ Match results processing completed');
  } catch (error) {
    console.error('❌ Match results processing failed:', error);
  }
}
