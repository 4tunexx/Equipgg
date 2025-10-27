// Match Status Auto-Updater
// Automatically updates match statuses based on scheduled times
import { secureDb } from './secure-db';

interface MatchForStatusUpdate {
  id: string;
  status: string;
  match_date: string;
  start_time: string;
  scheduled_at?: string;
}

// Process bets for a finished match (simplified version)
async function processMatchBets(matchId: string): Promise<void> {
  try {
    // Get all active bets for this match
    const bets = await secureDb.findMany('user_bets', {
      match_id: matchId,
      status: 'active'
    });

    if (!bets || bets.length === 0) {
      return; // No active bets to process
    }

    // For automatic status changes without a clear winner, mark bets as void/refunded
    for (const bet of bets) {
      try {
        // Update bet status to voided and refund the amount
        await secureDb.update('user_bets', { id: bet.id }, {
          status: 'voided',
          settled_at: new Date().toISOString()
        });

        // Refund the bet amount to the user
        const user = await secureDb.findOne('users', { id: bet.user_id });
        if (user) {
          const currentCoins = Number(user.coins || 0);
          const refundAmount = Number(bet.amount || 0);
          const newBalance = currentCoins + refundAmount;
          await secureDb.update('users', { id: bet.user_id }, { coins: newBalance });
        }

        console.log(`🔄 Voided and refunded bet ${bet.id} for match ${matchId}`);
      } catch (error) {
        console.error(`Failed to process bet ${bet.id}:`, error);
      }
    }
  } catch (error) {
    console.error(`Failed to process bets for match ${matchId}:`, error);
  }
}

export async function updateMatchStatuses(): Promise<{ updated: number; errors: string[] }> {
  const now = new Date();
  const errors: string[] = [];
  let updated = 0;

  try {
    // Get all matches that might need status updates
    const matches = await secureDb.findMany('matches', {}) as MatchForStatusUpdate[];

    for (const match of matches) {
      try {
        const currentStatus = match.status;
        let newStatus = currentStatus;
        
        // Calculate scheduled time
        let scheduledTime: Date;
        if (match.scheduled_at) {
          scheduledTime = new Date(match.scheduled_at);
        } else if (match.match_date && match.start_time) {
          scheduledTime = new Date(`${match.match_date}T${match.start_time}`);
        } else if (match.match_date) {
          scheduledTime = new Date(match.match_date);
        } else {
          continue; // Skip matches without proper timing
        }

        // Skip invalid dates
        if (isNaN(scheduledTime.getTime())) {
          continue;
        }

        const timeDiff = scheduledTime.getTime() - now.getTime();
        const minutesDiff = timeDiff / (1000 * 60);

        // Status update logic
        if (currentStatus === 'upcoming') {
          // If match should have started (within 15 minutes of start time)
          if (minutesDiff <= 15 && minutesDiff >= -120) { // Started up to 2 hours ago
            newStatus = 'live';
          }
        } else if (currentStatus === 'live') {
          // If match has been running for more than 3 hours, mark as finished
          if (minutesDiff < -180) { // 3 hours after start
            newStatus = 'finished';
          }
        }

        // Update status if it changed
        if (newStatus !== currentStatus) {
          await secureDb.update('matches', { id: match.id }, { 
            status: newStatus,
            updated_at: now.toISOString()
          });
          updated++;
          console.log(`✅ Updated match ${match.id} status: ${currentStatus} → ${newStatus}`);

          // If match just finished, process any remaining active bets
          if (newStatus === 'finished' && currentStatus === 'live') {
            try {
              await processMatchBets(match.id);
            } catch (error) {
              console.error(`Failed to process bets for finished match ${match.id}:`, error);
            }
          }
        }

      } catch (error) {
        const errorMsg = `Failed to update match ${match.id}: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log(`🔄 Match status update complete: ${updated} matches updated, ${errors.length} errors`);
    return { updated, errors };

  } catch (error) {
    const errorMsg = `Fatal error in match status updater: ${error}`;
    errors.push(errorMsg);
    console.error(errorMsg);
    return { updated, errors };
  }
}

// Auto-update every 5 minutes
let statusUpdateInterval: NodeJS.Timeout | null = null;

export function startMatchStatusUpdater() {
  if (statusUpdateInterval) {
    console.log('⚠️ Match status updater already running');
    return;
  }

  console.log('🚀 Starting match status updater...');
  
  // Run immediately
  updateMatchStatuses();
  
  // Then run every 5 minutes
  statusUpdateInterval = setInterval(updateMatchStatuses, 5 * 60 * 1000);
  
  console.log('✅ Match status updater started');
}

export function stopMatchStatusUpdater() {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
    console.log('🛑 Match status updater stopped');
  }
}

// Auto-start on server-side only, but only when Supabase service credentials
// are available. During Next.js build/collect-phase environment variables
// may be absent which causes secureDb to attempt to create an admin client —
// guard against that here.
if (typeof window === 'undefined') {
  const hasSupabaseUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (hasSupabaseUrl && hasServiceRole) {
    startMatchStatusUpdater();
  } else {
    // Avoid starting background jobs during build or when envs are missing
    // eslint-disable-next-line no-console
    console.warn('Match status updater not started: missing Supabase env vars or running in build environment');
  }
}