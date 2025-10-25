// Enhanced Bet Result Processing System
// Handles bet payouts and status updates when matches are completed
import { secureDb } from './secure-db';
import { addXpForBetWon } from './xp-leveling-system';
import { trackMissionProgress, setMissionProgress } from './mission-integration';
import { createNotification } from './notification-utils';
import { trackBetWon, trackBetLost } from './activity-tracker';
import { createServerSupabaseClient } from './supabase';

interface BetProcessingResult {
  matchId: string;
  betsProcessed: number;
  payoutTotal: number;
  errors: string[];
}

export async function processBetsForMatch(matchId: string, winner: 'team_a' | 'team_b'): Promise<BetProcessingResult> {
  const result: BetProcessingResult = {
    matchId,
    betsProcessed: 0,
    payoutTotal: 0,
    errors: []
  };

  try {
    console.log(`🎯 Processing bets for match ${matchId} with winner: ${winner}`);

    // Get all active bets for this match
    const activeBets = await secureDb.findMany('user_bets', {
      match_id: matchId,
      status: 'active'
    });

    if (!activeBets || activeBets.length === 0) {
      console.log(`ℹ️ No active bets found for match ${matchId}`);
      return result;
    }

    console.log(`📊 Found ${activeBets.length} active bets to process`);

    for (const bet of activeBets) {
      try {
        const isWinner = bet.team_choice === winner;
        const newStatus = isWinner ? 'won' : 'lost';
        const payoutAmount = isWinner ? Number(bet.potential_payout || 0) : 0;

        // Update bet status
        await secureDb.update('user_bets', { id: bet.id }, {
          status: newStatus,
          settled_at: new Date().toISOString(),
          actual_payout: payoutAmount
        });

        // Process payout for winners
        if (isWinner && payoutAmount > 0) {
          const user = await secureDb.findOne('users', { id: bet.user_id });
          if (user) {
            const currentCoins = Number(user.coins || 0);
            const newBalance = currentCoins + payoutAmount;
            
            await secureDb.update('users', { id: bet.user_id }, { 
              coins: newBalance 
            });

            // Create transaction record
            try {
              await secureDb.create('user_transactions', {
                user_id: bet.user_id,
                type: 'bet_win',
                amount: payoutAmount,
                description: `Betting win: ${payoutAmount} coins`,
                created_at: new Date().toISOString()
              });
            } catch (transactionError) {
              console.warn(`Failed to create transaction record for bet ${bet.id}:`, transactionError);
            }

            // Award XP for winning bet using new system
            try {
              await addXpForBetWon(String(bet.user_id), payoutAmount, Number(bet.odds || 1.5));
              await trackMissionProgress(String(bet.user_id), 'bet_won', 1);
              await trackMissionProgress(String(bet.user_id), 'earn_coins', payoutAmount);

              // Track high odds win mission
              const odds = Number(bet.odds || 1.0);
              if (odds >= 2.0) {
                await trackMissionProgress(String(bet.user_id), 'win_high_odds_bet', 1);
              }

              // Compute current win streak and set absolute progress
              try {
                const supabase = createServerSupabaseClient();
                const { data: recentBets } = await supabase
                  .from('user_bets')
                  .select('status, settled_at')
                  .eq('user_id', bet.user_id)
                  .order('settled_at', { ascending: false })
                  .limit(50);
                let streak = 0;
                for (const b of (recentBets || [])) {
                  if (b.status === 'won') {
                    streak++;
                  } else if (b.status === 'lost') {
                    break;
                  }
                }
                if (streak > 0) {
                  await setMissionProgress(String(bet.user_id), 'win_streak', streak);
                }
              } catch (streakErr) {
                console.warn('Failed computing win streak:', streakErr);
              }
              
              // Create notification for bet win
              await createNotification({
                userId: String(bet.user_id),
                type: 'bet_won',
                title: '🎯 Bet Won!',
                message: `Congratulations! You won ${payoutAmount} coins!`,
                data: {
                  matchId,
                  amount: payoutAmount
                }
              });
            } catch (xpError) {
              console.warn(`Failed to award XP/notification for winning bet ${bet.id}:`, xpError);
            }

            result.payoutTotal += payoutAmount;
            console.log(`💰 Paid out ${payoutAmount} coins to user ${bet.user_id} for winning bet`);
          }
        } else if (!isWinner) {
          // Track lost bet activity and create notification
          try {
            await trackBetLost(String(bet.user_id), matchId, Number(bet.amount || 0));
            await createNotification({
              userId: String(bet.user_id),
              type: 'bet_lost',
              title: '😔 Bet Lost',
              message: 'Better luck next time!',
              data: {
                matchId,
                amount: Number(bet.amount || 0)
              }
            });
          } catch (notifError) {
            console.warn(`Failed to create notification for losing bet ${bet.id}:`, notifError);
          }
        }

        result.betsProcessed++;
        console.log(`✅ Processed bet ${bet.id}: ${newStatus} (${isWinner ? `+${payoutAmount}` : '0'} coins)`);

      } catch (betError) {
        const errorMsg = `Failed to process bet ${bet.id}: ${betError}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Note: Achievement tracking can be added later when system is fully integrated

    console.log(`🎉 Bet processing complete for match ${matchId}: ${result.betsProcessed} bets processed, ${result.payoutTotal} coins paid out`);
    return result;

  } catch (error) {
    const errorMsg = `Fatal error processing bets for match ${matchId}: ${error}`;
    result.errors.push(errorMsg);
    console.error(errorMsg);
    return result;
  }
}

export async function processAllCompletedMatches(): Promise<BetProcessingResult[]> {
  console.log('🔄 Processing bets for all completed matches...');
  
  const results: BetProcessingResult[] = [];

  try {
    // Find all matches that are completed but have unprocessed bets
    const completedMatches = await secureDb.findMany('matches', {
      status: 'finished'
    });

    if (!completedMatches || completedMatches.length === 0) {
      console.log('ℹ️ No completed matches found');
      return results;
    }

    for (const match of completedMatches) {
      try {
        // Check if this match has a winner and unprocessed bets
        if (!match.winner) {
          console.log(`⏭️ Skipping match ${match.id}: no winner determined`);
          continue;
        }

        // Check if there are any active bets for this match
        const activeBets = await secureDb.findMany('user_bets', {
          match_id: match.id,
          status: 'active'
        });

        if (!activeBets || activeBets.length === 0) {
          continue; // No active bets to process
        }

        // Process the bets
        const result = await processBetsForMatch(String(match.id), match.winner as 'team_a' | 'team_b');
        results.push(result);

      } catch (matchError) {
        console.error(`Error processing match ${match.id}:`, matchError);
        results.push({
          matchId: String(match.id),
          betsProcessed: 0,
          payoutTotal: 0,
          errors: [`Failed to process match: ${matchError}`]
        });
      }
    }

    const totalBetsProcessed = results.reduce((sum, r) => sum + r.betsProcessed, 0);
    const totalPayouts = results.reduce((sum, r) => sum + r.payoutTotal, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log(`📈 Batch processing complete: ${totalBetsProcessed} bets processed, ${totalPayouts} coins paid out, ${totalErrors} errors`);
    return results;

  } catch (error) {
    console.error('Fatal error in batch bet processing:', error);
    return results;
  }
}

// Auto-process completed matches every 10 minutes
let betProcessingInterval: NodeJS.Timeout | null = null;

export function startBetResultProcessor() {
  if (betProcessingInterval) {
    console.log('⚠️ Bet result processor already running');
    return;
  }

  console.log('🚀 Starting bet result processor...');
  
  // Run immediately
  processAllCompletedMatches();
  
  // Then run every 10 minutes
  betProcessingInterval = setInterval(processAllCompletedMatches, 10 * 60 * 1000);
  
  console.log('✅ Bet result processor started');
}

export function stopBetResultProcessor() {
  if (betProcessingInterval) {
    clearInterval(betProcessingInterval);
    betProcessingInterval = null;
    console.log('🛑 Bet result processor stopped');
  }
}

// Auto-start on server-side only
if (typeof window === 'undefined') {
  startBetResultProcessor();
}