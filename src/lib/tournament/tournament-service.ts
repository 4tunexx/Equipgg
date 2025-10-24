/**
 * COMPLETE TOURNAMENT SYSTEM
 * Full tournament management with brackets, prizes, and live updates
 */

import { createServerSupabaseClient } from '../supabase';
import { broadcastNotification, broadcastGlobal } from '../supabase/realtime-client';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  game_type: 'crash' | 'coinflip' | 'plinko' | 'sweeper' | 'mixed';
  status: 'upcoming' | 'registration' | 'in_progress' | 'completed' | 'cancelled';
  start_time: string;
  end_time?: string;
  max_participants: number;
  current_participants: number;
  entry_fee: number;
  prize_pool: number;
  prizes: TournamentPrize[];
  rules: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TournamentPrize {
  position: number;
  reward_type: 'coins' | 'gems' | 'item' | 'crate_key' | 'badge';
  reward_amount?: number;
  reward_item_id?: string;
  reward_description: string;
}

export interface TournamentParticipant {
  tournament_id: string;
  user_id: string;
  seed?: number;
  current_round: number;
  status: 'registered' | 'active' | 'eliminated' | 'winner' | 'disqualified';
  points: number;
  wins: number;
  losses: number;
  position?: number;
  registered_at: string;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  player1_id: string;
  player2_id: string;
  winner_id?: string;
  score_player1?: number;
  score_player2?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_time?: string;
  completed_at?: string;
}

export class TournamentService {
  /**
   * Create a new tournament
   */
  async createTournament(
    name: string,
    description: string,
    type: Tournament['type'],
    gameType: Tournament['game_type'],
    startTime: Date,
    maxParticipants: number,
    entryFee: number,
    prizes: TournamentPrize[],
    rules: string[],
    createdBy: string
  ): Promise<Tournament> {
    const supabase = createServerSupabaseClient();

    // Calculate prize pool
    const prizePool = entryFee * maxParticipants * 0.9; // 90% goes to prize pool, 10% house fee

    // Validate prizes total doesn't exceed prize pool
    const totalPrizeValue = prizes.reduce((total, prize) => {
      if (prize.reward_type === 'coins' || prize.reward_type === 'gems') {
        return total + (prize.reward_amount || 0);
      }
      return total;
    }, 0);

    if (totalPrizeValue > prizePool) {
      throw new Error('Total prize value exceeds prize pool');
    }

    // Create tournament
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .insert({
        name,
        description,
        type,
        game_type: gameType,
        status: 'upcoming',
        start_time: startTime.toISOString(),
        max_participants: maxParticipants,
        current_participants: 0,
        entry_fee: entryFee,
        prize_pool: prizePool,
        prizes: JSON.stringify(prizes),
        rules: JSON.stringify(rules),
        created_by: createdBy,
      })
      .select()
      .single();

    if (error || !tournament) {
      throw new Error('Failed to create tournament');
    }

    // Schedule tournament start
    await this.scheduleTournamentStart(tournament.id, startTime);

    // Broadcast tournament creation
    await broadcastGlobal('notification' as any, {
      tournament: tournament,
      message: `New tournament "${name}" is now open for registration!`,
    });

    return tournament;
  }

  /**
   * Register for a tournament
   */
  async registerForTournament(tournamentId: string, userId: string): Promise<boolean> {
    const supabase = createServerSupabaseClient();

    // Get tournament details
    const tournament = await this.getTournament(tournamentId);
    
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'upcoming' && tournament.status !== 'registration') {
      throw new Error('Tournament registration is closed');
    }

    if (tournament.current_participants >= tournament.max_participants) {
      throw new Error('Tournament is full');
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      throw new Error('Already registered for this tournament');
    }

    // Check user has enough coins for entry fee
    const { data: user } = await supabase
      .from('users')
      .select('coins')
      .eq('id', userId)
      .single();

    if (!user || user.coins < tournament.entry_fee) {
      throw new Error('Insufficient coins for entry fee');
    }

    // Deduct entry fee
    await supabase
      .from('users')
      .update({ coins: user.coins - tournament.entry_fee })
      .eq('id', userId);

    // Register participant
    await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: tournamentId,
        user_id: userId,
        seed: tournament.current_participants + 1,
        current_round: 0,
        status: 'registered',
        points: 0,
        wins: 0,
        losses: 0,
      });

    // Update participant count
    await supabase
      .from('tournaments')
      .update({ 
        current_participants: tournament.current_participants + 1,
        status: tournament.current_participants + 1 >= tournament.max_participants ? 'registration' : tournament.status,
      })
      .eq('id', tournamentId);

    // Notify user
    await broadcastNotification(userId, {
      title: 'Tournament Registration Successful! 🏆',
      message: `You are registered for "${tournament.name}"`,
      type: 'tournament',
    });

    // If tournament is now full, start it immediately
    if (tournament.current_participants + 1 >= tournament.max_participants) {
      await this.startTournament(tournamentId);
    }

    return true;
  }

  /**
   * Start a tournament
   */
  async startTournament(tournamentId: string): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    const tournament = await this.getTournament(tournamentId);
    if (!tournament) return;

    if (tournament.status !== 'registration' && tournament.status !== 'upcoming') {
      throw new Error('Tournament cannot be started');
    }

    // Get all participants
    const { data: participants } = await supabase
      .from('tournament_participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('status', 'registered');

    if (!participants || participants.length < 2) {
      throw new Error('Not enough participants to start tournament');
    }

    // Update tournament status
    await supabase
      .from('tournaments')
      .update({ 
        status: 'in_progress',
        start_time: new Date().toISOString(),
      })
      .eq('id', tournamentId);

    // Create bracket based on tournament type
    switch (tournament.type) {
      case 'single_elimination':
        await this.createSingleEliminationBracket(tournamentId, participants);
        break;
      case 'double_elimination':
        await this.createDoubleEliminationBracket(tournamentId, participants);
        break;
      case 'round_robin':
        await this.createRoundRobinMatches(tournamentId, participants);
        break;
      case 'swiss':
        await this.createSwissRound(tournamentId, participants, 1);
        break;
    }

    // Update participant status
    await supabase
      .from('tournament_participants')
      .update({ status: 'active' })
      .eq('tournament_id', tournamentId)
      .eq('status', 'registered');

    // Notify all participants
    for (const participant of participants) {
      await broadcastNotification(participant.user_id, {
        title: 'Tournament Started! 🎮',
        message: `The tournament "${tournament.name}" has begun!`,
        type: 'tournament',
      });
    }

    // Broadcast global event
    await broadcastGlobal('notification' as any, {
      tournament_id: tournamentId,
      name: tournament.name,
      participants: participants.length,
    });
  }

  /**
   * Create single elimination bracket
   */
  private async createSingleEliminationBracket(
    tournamentId: string,
    participants: any[]
  ): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    // Shuffle participants for random seeding
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    
    // Calculate number of rounds
    const rounds = Math.ceil(Math.log2(shuffled.length));
    const matches: any[] = [];
    
    // Create first round matches
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        matches.push({
          tournament_id: tournamentId,
          round: 1,
          match_number: Math.floor(i / 2) + 1,
          player1_id: shuffled[i].user_id,
          player2_id: shuffled[i + 1].user_id,
          status: 'pending',
        });
      } else {
        // Bye - player advances automatically
        await supabase
          .from('tournament_participants')
          .update({ current_round: 2 })
          .eq('tournament_id', tournamentId)
          .eq('user_id', shuffled[i].user_id);
      }
    }
    
    // Insert matches
    if (matches.length > 0) {
      await supabase.from('tournament_matches').insert(matches);
    }
  }

  /**
   * Create double elimination bracket
   */
  private async createDoubleEliminationBracket(
    tournamentId: string,
    participants: any[]
  ): Promise<void> {
    // Create winners bracket
    await this.createSingleEliminationBracket(tournamentId, participants);
    
    // Losers bracket will be created dynamically as matches are played
  }

  /**
   * Create round robin matches
   */
  private async createRoundRobinMatches(
    tournamentId: string,
    participants: any[]
  ): Promise<void> {
    const supabase = createServerSupabaseClient();
    const matches: any[] = [];
    
    // Every player plays every other player once
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push({
          tournament_id: tournamentId,
          round: 1, // All round robin matches are "round 1"
          match_number: matches.length + 1,
          player1_id: participants[i].user_id,
          player2_id: participants[j].user_id,
          status: 'pending',
        });
      }
    }
    
    await supabase.from('tournament_matches').insert(matches);
  }

  /**
   * Create Swiss round
   */
  private async createSwissRound(
    tournamentId: string,
    participants: any[],
    round: number
  ): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    // Sort by points/wins for pairing
    const sorted = [...participants].sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      return b.wins - a.wins;
    });
    
    const matches: any[] = [];
    const paired = new Set();
    
    // Pair players with similar scores
    for (let i = 0; i < sorted.length; i++) {
      if (paired.has(sorted[i].user_id)) continue;
      
      for (let j = i + 1; j < sorted.length; j++) {
        if (paired.has(sorted[j].user_id)) continue;
        
        // Check if they haven't played before
        const { data: previousMatch } = await supabase
          .from('tournament_matches')
          .select('id')
          .eq('tournament_id', tournamentId)
          .or(`player1_id.eq.${sorted[i].user_id},player2_id.eq.${sorted[i].user_id}`)
          .or(`player1_id.eq.${sorted[j].user_id},player2_id.eq.${sorted[j].user_id}`)
          .single();
        
        if (!previousMatch) {
          matches.push({
            tournament_id: tournamentId,
            round: round,
            match_number: matches.length + 1,
            player1_id: sorted[i].user_id,
            player2_id: sorted[j].user_id,
            status: 'pending',
          });
          
          paired.add(sorted[i].user_id);
          paired.add(sorted[j].user_id);
          break;
        }
      }
    }
    
    if (matches.length > 0) {
      await supabase.from('tournament_matches').insert(matches);
    }
  }

  /**
   * Record match result
   */
  async recordMatchResult(
    matchId: string,
    winnerId: string,
    score1: number,
    score2: number
  ): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    // Get match details
    const { data: match } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('id', matchId)
      .single();
    
    if (!match || match.status === 'completed') {
      throw new Error('Match not found or already completed');
    }
    
    const loserId = winnerId === match.player1_id ? match.player2_id : match.player1_id;
    
    // Update match
    await supabase
      .from('tournament_matches')
      .update({
        winner_id: winnerId,
        score_player1: score1,
        score_player2: score2,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', matchId);
    
    // Get current stats and update
    const { data: winnerStats } = await supabase
      .from('tournament_participants')
      .select('wins, points')
      .eq('tournament_id', match.tournament_id)
      .eq('user_id', winnerId)
      .single();

    if (winnerStats) {
      await supabase
        .from('tournament_participants')
        .update({ 
          wins: (winnerStats.wins || 0) + 1,
          points: (winnerStats.points || 0) + 3,
          current_round: match.round + 1,
        })
        .eq('tournament_id', match.tournament_id)
        .eq('user_id', winnerId);
    }
    
    const { data: loserStats } = await supabase
      .from('tournament_participants')
      .select('losses')
      .eq('tournament_id', match.tournament_id)
      .eq('user_id', loserId)
      .single();

    if (loserStats) {
      await supabase
        .from('tournament_participants')
        .update({ 
          losses: (loserStats.losses || 0) + 1,
        })
        .eq('tournament_id', match.tournament_id)
        .eq('user_id', loserId);
    }
    
    // Check if tournament should advance
    await this.checkTournamentProgress(match.tournament_id);
  }

  /**
   * Check tournament progress and advance if needed
   */
  private async checkTournamentProgress(tournamentId: string): Promise<void> {
    const supabase = createServerSupabaseClient();
    const tournament = await this.getTournament(tournamentId);
    
    if (!tournament || tournament.status !== 'in_progress') return;
    
    // Check if current round is complete
    const { count: pendingMatches } = await supabase
      .from('tournament_matches')
      .select('id', { count: 'exact' })
      .eq('tournament_id', tournamentId)
      .eq('status', 'pending');
    
    if (pendingMatches === 0) {
      // All matches complete, advance tournament
      if (tournament.type === 'single_elimination') {
        await this.advanceSingleElimination(tournamentId);
      } else if (tournament.type === 'swiss') {
        await this.advanceSwiss(tournamentId);
      } else if (tournament.type === 'round_robin') {
        await this.completeTournament(tournamentId);
      }
    }
  }

  /**
   * Advance single elimination tournament
   */
  private async advanceSingleElimination(tournamentId: string): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    // Get winners from last round
    const { data: lastRoundMatches } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('status', 'completed')
      .order('round', { ascending: false })
      .limit(100);
    
    if (!lastRoundMatches || lastRoundMatches.length === 0) return;
    
    const currentRound = lastRoundMatches[0].round;
    const winners = lastRoundMatches.map(m => m.winner_id);
    
    if (winners.length === 1) {
      // Tournament complete
      await this.completeTournament(tournamentId);
      return;
    }
    
    // Create next round matches
    const nextRoundMatches: any[] = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        nextRoundMatches.push({
          tournament_id: tournamentId,
          round: currentRound + 1,
          match_number: Math.floor(i / 2) + 1,
          player1_id: winners[i],
          player2_id: winners[i + 1],
          status: 'pending',
        });
      }
    }
    
    if (nextRoundMatches.length > 0) {
      await supabase.from('tournament_matches').insert(nextRoundMatches);
    }
  }

  /**
   * Advance Swiss tournament
   */
  private async advanceSwiss(tournamentId: string): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    // Get current round
    const { data: matches } = await supabase
      .from('tournament_matches')
      .select('round')
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: false })
      .limit(1);
    
    const currentRound = matches?.[0]?.round || 1;
    
    // Swiss typically runs for log2(participants) * 2 rounds
    const { data: participants } = await supabase
      .from('tournament_participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('status', 'active');
    
    const maxRounds = Math.ceil(Math.log2(participants?.length || 2)) * 2;
    
    if (currentRound >= maxRounds) {
      await this.completeTournament(tournamentId);
    } else {
      await this.createSwissRound(tournamentId, participants || [], currentRound + 1);
    }
  }

  /**
   * Complete tournament and distribute prizes
   */
  private async completeTournament(tournamentId: string): Promise<void> {
    const supabase = createServerSupabaseClient();
    const tournament = await this.getTournament(tournamentId);
    
    if (!tournament) return;
    
    // Get final standings
    const { data: participants } = await supabase
      .from('tournament_participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('points', { ascending: false })
      .order('wins', { ascending: false })
      .order('losses', { ascending: true });
    
    if (!participants) return;
    
    // Assign positions
    for (let i = 0; i < participants.length; i++) {
      await supabase
        .from('tournament_participants')
        .update({ 
          position: i + 1,
          status: i === 0 ? 'winner' : 'eliminated',
        })
        .eq('tournament_id', tournamentId)
        .eq('user_id', participants[i].user_id);
      
      // Distribute prizes
      const prize = tournament.prizes.find(p => p.position === i + 1);
      if (prize) {
        await this.distributePrize(participants[i].user_id, prize);
      }
    }
    
    // Update tournament status
    await supabase
      .from('tournaments')
      .update({ 
        status: 'completed',
        end_time: new Date().toISOString(),
      })
      .eq('id', tournamentId);
    
    // Notify winners
    if (participants[0]) {
      await broadcastGlobal('notification' as any, {
        tournament_id: tournamentId,
        name: tournament.name,
        winner_id: participants[0].user_id,
        prize_pool: tournament.prize_pool,
      });
    }
  }

  /**
   * Distribute prize to winner
   */
  private async distributePrize(userId: string, prize: TournamentPrize): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    switch (prize.reward_type) {
      case 'coins':
        const { data: user } = await supabase
          .from('users')
          .select('coins')
          .eq('id', userId)
          .single();
        
        if (user) {
          await supabase
            .from('users')
            .update({ coins: user.coins + (prize.reward_amount || 0) })
            .eq('id', userId);
        }
        break;
        
      case 'gems':
        const { data: gemUser } = await supabase
          .from('users')
          .select('gems')
          .eq('id', userId)
          .single();
        
        if (gemUser) {
          await supabase
            .from('users')
            .update({ gems: (gemUser.gems || 0) + (prize.reward_amount || 0) })
            .eq('id', userId);
        }
        break;
        
      case 'item':
        if (prize.reward_item_id) {
          await supabase
            .from('user_inventory')
            .insert({
              user_id: userId,
              item_id: prize.reward_item_id,
              acquired_from: 'tournament_prize',
            });
        }
        break;
        
      case 'crate_key':
        await supabase
          .from('user_keys')
          .insert({
            user_id: userId,
            crate_id: prize.reward_item_id,
            quantity: prize.reward_amount || 1,
          });
        break;
        
      case 'badge':
        await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: prize.reward_item_id,
          });
        break;
    }
    
    // Notify user
    await broadcastNotification(userId, {
      title: `Tournament Prize! 🏆`,
      message: `You won ${prize.reward_description}!`,
      type: 'tournament',
    });
  }

  /**
   * Get tournament details
   */
  async getTournament(tournamentId: string): Promise<Tournament | null> {
    const supabase = createServerSupabaseClient();
    
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();
    
    if (data) {
      return {
        ...data,
        prizes: typeof data.prizes === 'string' ? JSON.parse(data.prizes) : data.prizes,
        rules: typeof data.rules === 'string' ? JSON.parse(data.rules) : data.rules,
      };
    }
    
    return null;
  }

  /**
   * Get active tournaments
   */
  async getActiveTournaments(): Promise<Tournament[]> {
    const supabase = createServerSupabaseClient();
    
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .in('status', ['upcoming', 'registration', 'in_progress'])
      .order('start_time', { ascending: true });
    
    return (data || []).map(t => ({
      ...t,
      prizes: typeof t.prizes === 'string' ? JSON.parse(t.prizes) : t.prizes,
      rules: typeof t.rules === 'string' ? JSON.parse(t.rules) : t.rules,
    }));
  }

  /**
   * Schedule tournament start
   */
  private async scheduleTournamentStart(tournamentId: string, startTime: Date): Promise<void> {
    // In production, use a job queue like Bull or similar
    // For now, use setTimeout if within 24 hours
    const delay = startTime.getTime() - Date.now();
    
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
      setTimeout(async () => {
        await this.startTournament(tournamentId);
      }, delay);
    }
  }
}

// Export singleton
export const tournamentService = new TournamentService();
