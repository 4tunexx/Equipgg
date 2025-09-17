// Scheduler for automatic match syncing and result processing
import { syncMatchesFromPandaScore, processMatchResults } from './pandascore';

class MatchScheduler {
  private syncInterval: NodeJS.Timeout | null = null;
  private resultInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log('⚠️ Match scheduler is already running');
      return;
    }

    console.log('🚀 Starting match scheduler...');
    this.isRunning = true;

    // Sync matches every 5 minutes
    this.syncInterval = setInterval(async () => {
      try {
        console.log('⏰ Scheduled match sync starting...');
        await syncMatchesFromPandaScore();
      } catch (error) {
        console.error('❌ Scheduled match sync failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Process results every 2 minutes
    this.resultInterval = setInterval(async () => {
      try {
        console.log('⏰ Scheduled result processing starting...');
        await processMatchResults();
      } catch (error) {
        console.error('❌ Scheduled result processing failed:', error);
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Initial sync
    setTimeout(async () => {
      try {
        console.log('🔄 Initial match sync...');
        await syncMatchesFromPandaScore();
        await processMatchResults();
      } catch (error) {
        console.error('❌ Initial sync failed:', error);
      }
    }, 10000); // 10 seconds after startup

    console.log('✅ Match scheduler started successfully');
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Match scheduler is not running');
      return;
    }

    console.log('🛑 Stopping match scheduler...');
    this.isRunning = false;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.resultInterval) {
      clearInterval(this.resultInterval);
      this.resultInterval = null;
    }

    console.log('✅ Match scheduler stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      hasSyncInterval: this.syncInterval !== null,
      hasResultInterval: this.resultInterval !== null
    };
  }
}

// Global scheduler instance
export const matchScheduler = new MatchScheduler();

// Auto-start scheduler when module is imported
if (typeof window === 'undefined') { // Only run on server side
  matchScheduler.start();
}
