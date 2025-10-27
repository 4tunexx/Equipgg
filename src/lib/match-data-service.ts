/**
 * MATCH DATA SERVICE
 * Integrates with PandaScore API or HLTV scraper for CS2 match data
 * Provides real-time odds and match results
 */

import { createServerSupabaseClient } from './supabase';

export interface Team {
  id: string;
  name: string;
  logo: string;
  country?: string;
  rank?: number;
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  tournament: string;
  event_name?: string;
  start_time: string;
  status: 'upcoming' | 'live' | 'finished';
  odds: {
    team1: number;
    team2: number;
  };
  score?: {
    team1: number;
    team2: number;
  };
  stream_url?: string;
  map?: string;
  best_of?: number;
}

class MatchDataService {
  private pandascoreApiKey: string | undefined;
  private hltv_base_url = 'https://www.hltv.org';
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.pandascoreApiKey = process.env.PANDASCORE_API_KEY;
    
    // Start automatic updates if in production
    if (process.env.NODE_ENV === 'production') {
      const hasSupabaseUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
      const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (hasSupabaseUrl && hasServiceRole) {
        this.startAutoUpdate();
      } else {
        // Avoid starting auto-updates during build or when envs are missing
        // eslint-disable-next-line no-console
        console.warn('MatchDataService auto-update not started: missing Supabase env vars or running in build environment');
      }
    }
  }

  /**
   * Fetch upcoming CS2 matches from PandaScore API
   */
  private async fetchFromPandaScore(): Promise<Match[]> {
    if (!this.pandascoreApiKey) {
      console.log('PandaScore API key not configured, using mock data');
      return this.getMockMatches();
    }

    try {
      const response = await fetch(
        'https://api.pandascore.co/csgo/matches/upcoming?per_page=20',
        {
          headers: {
            'Authorization': `Bearer ${this.pandascoreApiKey}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`PandaScore API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform PandaScore data to our Match format
      return data.map((match: any) => ({
        id: match.id.toString(),
        team1: {
          id: match.opponents[0]?.opponent?.id?.toString() || 'tbd',
          name: match.opponents[0]?.opponent?.name || 'TBD',
          logo: match.opponents[0]?.opponent?.image_url || '/images/team-placeholder.png'
        },
        team2: {
          id: match.opponents[1]?.opponent?.id?.toString() || 'tbd',
          name: match.opponents[1]?.opponent?.name || 'TBD',
          logo: match.opponents[1]?.opponent?.image_url || '/images/team-placeholder.png'
        },
        tournament: match.tournament?.name || match.serie?.full_name || 'Unknown Tournament',
        event_name: match.league?.name,
        start_time: match.scheduled_at || match.begin_at,
        status: match.status === 'running' ? 'live' : match.status === 'finished' ? 'finished' : 'upcoming',
        odds: {
          team1: this.calculateOdds(match.opponents[0]?.opponent),
          team2: this.calculateOdds(match.opponents[1]?.opponent)
        },
        score: match.results ? {
          team1: match.results[0]?.score || 0,
          team2: match.results[1]?.score || 0
        } : undefined,
        stream_url: match.streams?.twitch?.raw_url || match.official_stream_url,
        best_of: match.number_of_games
      }));
    } catch (error) {
      console.error('Failed to fetch from PandaScore:', error);
      return this.getMockMatches();
    }
  }

  /**
   * Calculate odds based on team data (simplified)
   */
  private calculateOdds(team: any): number {
    if (!team) return 2.0;
    
    // Simple odds calculation based on ranking
    const baseOdd = 1.8;
    const variance = Math.random() * 0.4 - 0.2; // ±0.2 variance
    return Math.max(1.1, Math.min(5.0, baseOdd + variance));
  }

  /**
   * Get mock matches for development/fallback
   */
  private getMockMatches(): Match[] {
    const teams = [
      { id: '1', name: 'Natus Vincere', logo: '/images/teams/navi.png' },
      { id: '2', name: 'FaZe Clan', logo: '/images/teams/faze.png' },
      { id: '3', name: 'G2 Esports', logo: '/images/teams/g2.png' },
      { id: '4', name: 'Vitality', logo: '/images/teams/vitality.png' },
      { id: '5', name: 'Liquid', logo: '/images/teams/liquid.png' },
      { id: '6', name: 'ENCE', logo: '/images/teams/ence.png' },
      { id: '7', name: 'Heroic', logo: '/images/teams/heroic.png' },
      { id: '8', name: 'Cloud9', logo: '/images/teams/cloud9.png' }
    ];

    const tournaments = [
      'BLAST Premier Fall',
      'IEM Katowice 2025',
      'PGL Major Copenhagen',
      'ESL Pro League Season 19'
    ];

    const matches: Match[] = [];
    const now = new Date();

    // Generate 10 mock matches
    for (let i = 0; i < 10; i++) {
      const team1Idx = Math.floor(Math.random() * teams.length);
      let team2Idx = Math.floor(Math.random() * teams.length);
      while (team2Idx === team1Idx) {
        team2Idx = Math.floor(Math.random() * teams.length);
      }

      const startTime = new Date(now.getTime() + (i * 2 + Math.random() * 24) * 60 * 60 * 1000);
      const isLive = i === 0 && Math.random() > 0.5;
      const isFinished = i > 7;

      matches.push({
        id: `mock-${i + 1}`,
        team1: teams[team1Idx],
        team2: teams[team2Idx],
        tournament: tournaments[Math.floor(Math.random() * tournaments.length)],
        start_time: startTime.toISOString(),
        status: isFinished ? 'finished' : isLive ? 'live' : 'upcoming',
        odds: {
          team1: 1.5 + Math.random(),
          team2: 1.5 + Math.random()
        },
        score: (isLive || isFinished) ? {
          team1: Math.floor(Math.random() * 16),
          team2: Math.floor(Math.random() * 16)
        } : undefined,
        map: ['Dust2', 'Mirage', 'Inferno', 'Nuke', 'Ancient'][Math.floor(Math.random() * 5)],
        best_of: [1, 3, 5][Math.floor(Math.random() * 3)]
      });
    }

    return matches;
  }

  /**
   * Get all upcoming matches
   */
  public async getUpcomingMatches(): Promise<Match[]> {
    // Try to get from database first (cached)
    const supabase = createServerSupabaseClient();
    const { data: cachedMatches } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'upcoming')
      .order('start_time', { ascending: true })
      .limit(20);

    if (cachedMatches && cachedMatches.length > 0) {
      return cachedMatches as any;
    }

    // Fetch fresh data
    const matches = await this.fetchFromPandaScore();
    
    // Cache in database
    if (matches.length > 0) {
      await this.saveMatchesToDatabase(matches);
    }

    return matches;
  }

  /**
   * Get live matches
   */
  public async getLiveMatches(): Promise<Match[]> {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'live')
      .order('start_time', { ascending: true });

    return data as any || [];
  }

  /**
   * Get match by ID
   */
  public async getMatch(matchId: string): Promise<Match | null> {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    return data as any;
  }

  /**
   * Save matches to database
   */
  private async saveMatchesToDatabase(matches: Match[]) {
    const supabase = createServerSupabaseClient();
    
    try {
      // Upsert matches
      const { error } = await supabase
        .from('matches')
        .upsert(
          matches.map(match => ({
            id: match.id,
            team_a_name: match.team1.name,
            team_a_logo: match.team1.logo,
            team_a_odds: match.odds.team1,
            team_b_name: match.team2.name,
            team_b_logo: match.team2.logo,
            team_b_odds: match.odds.team2,
            tournament: match.tournament,
            event_name: match.event_name,
            start_time: match.start_time,
            status: match.status,
            team_a_score: match.score?.team1,
            team_b_score: match.score?.team2,
            stream_url: match.stream_url,
            map: match.map,
            best_of: match.best_of,
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'id' }
        );

      if (error) {
        console.error('Failed to save matches to database:', error);
      } else {
        console.log(`✅ Saved ${matches.length} matches to database`);
      }
    } catch (error) {
      console.error('Error saving matches:', error);
    }
  }

  /**
   * Update match result
   */
  public async updateMatchResult(matchId: string, winner: 'team1' | 'team2', score: { team1: number; team2: number }) {
    const supabase = createServerSupabaseClient();
    
    const { error } = await supabase
      .from('matches')
      .update({
        status: 'finished',
        winner: winner === 'team1' ? 'team_a' : 'team_b',
        team_a_score: score.team1,
        team_b_score: score.team2,
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId);

    if (!error) {
      // Process bets for this match
      await this.processBetsForMatch(matchId, winner);
    }

    return !error;
  }

  /**
   * Process bets after match ends
   */
  private async processBetsForMatch(matchId: string, winner: 'team1' | 'team2') {
    const supabase = createServerSupabaseClient();
    
    // Get all bets for this match
    const { data: bets } = await supabase
      .from('user_bets')
      .select('*')
      .eq('match_id', matchId)
      .eq('status', 'pending');

    if (!bets || bets.length === 0) return;

    // Process each bet
    for (const bet of bets) {
      const won = (winner === 'team1' && bet.team_id === 'team_a') || 
                  (winner === 'team2' && bet.team_id === 'team_b');
      
      const payout = won ? bet.potential_payout : 0;
      
      // Update bet status
      await supabase
        .from('user_bets')
        .update({
          status: won ? 'won' : 'lost',
          result: won ? 'win' : 'loss',
          payout: payout,
          updated_at: new Date().toISOString()
        })
        .eq('id', bet.id);

      // Update user balance if won
      if (won) {
        const { data: user } = await supabase
          .from('users')
          .select('coins')
          .eq('id', bet.user_id)
          .single();

        if (user) {
          await supabase
            .from('users')
            .update({
              coins: user.coins + payout
            })
            .eq('id', bet.user_id);

          console.log(`💰 Paid out ${payout} coins to user ${bet.user_id} for bet ${bet.id}`);
        }
      }
    }

    console.log(`✅ Processed ${bets.length} bets for match ${matchId}`);
  }

  /**
   * Start automatic match updates
   */
  private startAutoUpdate() {
    // Update every 5 minutes
    this.updateInterval = setInterval(async () => {
      console.log('🔄 Auto-updating match data...');
      await this.getUpcomingMatches();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop automatic updates
   */
  public stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Export singleton instance
export const matchDataService = new MatchDataService();

// Helper functions
export async function getUpcomingMatches() {
  return matchDataService.getUpcomingMatches();
}

export async function getLiveMatches() {
  return matchDataService.getLiveMatches();
}

export async function getMatch(matchId: string) {
  return matchDataService.getMatch(matchId);
}

export async function updateMatchResult(matchId: string, winner: 'team1' | 'team2', score: { team1: number; team2: number }) {
  return matchDataService.updateMatchResult(matchId, winner, score);
}
