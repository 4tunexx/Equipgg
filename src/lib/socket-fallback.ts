import { toast } from 'sonner';

interface FallbackConfig {
  maxRetries: number;
  retryDelay: number;
  fallbackTimeout: number;
}

const defaultConfig: FallbackConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  fallbackTimeout: 5000
};

export class SocketFallback {
  private config: FallbackConfig;
  private retryCount: number = 0;
  private isConnected: boolean = false;
  private pendingRequests: Map<string, { resolve: Function; reject: Function; timestamp: number }> = new Map();

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  setConnected(connected: boolean) {
    this.isConnected = connected;
    if (connected) {
      this.retryCount = 0;
      this.processPendingRequests();
    }
  }

  async request<T>(
    requestId: string,
    socketRequest: () => Promise<T>,
    fallbackRequest: () => Promise<T>,
    timeout: number = this.config.fallbackTimeout
  ): Promise<T> {
    if (this.isConnected) {
      try {
        return await this.withTimeout(socketRequest(), timeout);
      } catch (error) {
        console.warn(`Socket request failed for ${requestId}, falling back to REST:`, error);
        return await fallbackRequest();
      }
    } else {
      console.log(`Socket disconnected, using REST fallback for ${requestId}`);
      return await fallbackRequest();
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }

  private processPendingRequests() {
    const now = Date.now();
    for (const [requestId, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.config.fallbackTimeout) {
        request.reject(new Error('Request timeout'));
        this.pendingRequests.delete(requestId);
      }
    }
  }

  // Specific fallback methods for different features
  async getBalance(): Promise<any> {
    return this.request(
      'get-balance',
      () => new Promise((resolve) => {
        // This would be replaced with actual socket request
        resolve({ coins: 0, gems: 0, xp: 0, level: 1 });
      }),
      async () => {
        const response = await fetch('/api/user/balance');
        return response.json();
      }
    );
  }

  async getInventory(): Promise<any> {
    return this.request(
      'get-inventory',
      () => new Promise((resolve) => {
        // This would be replaced with actual socket request
        resolve([]);
      }),
      async () => {
        const response = await fetch('/api/inventory');
        return response.json();
      }
    );
  }

  async getLeaderboard(type: string): Promise<any> {
    return this.request(
      `get-leaderboard-${type}`,
      () => new Promise((resolve) => {
        // This would be replaced with actual socket request
        resolve([]);
      }),
      async () => {
        const response = await fetch(`/api/leaderboard/${type}`);
        return response.json();
      }
    );
  }

  async getChatHistory(channel: string): Promise<any> {
    return this.request(
      `get-chat-${channel}`,
      () => new Promise((resolve) => {
        // This would be replaced with actual socket request
        resolve([]);
      }),
      async () => {
        const response = await fetch(`/api/chat/${channel}/history`);
        return response.json();
      }
    );
  }

  async getMatches(): Promise<any> {
    return this.request(
      'get-matches',
      () => new Promise((resolve) => {
        // This would be replaced with actual socket request
        resolve([]);
      }),
      async () => {
        const response = await fetch('/api/matches');
        return response.json();
      }
    );
  }

  async getMissions(): Promise<any> {
    return this.request(
      'get-missions',
      () => new Promise((resolve) => {
        // This would be replaced with actual socket request
        resolve([]);
      }),
      async () => {
        const response = await fetch('/api/missions');
        return response.json();
      }
    );
  }

  // Notification fallbacks
  showNotification(type: 'success' | 'error' | 'info' | 'warning', message: string, details?: any) {
    switch (type) {
      case 'success':
        toast.success(message, { description: details });
        break;
      case 'error':
        toast.error(message, { description: details });
        break;
      case 'info':
        toast.info(message, { description: details });
        break;
      case 'warning':
        toast.warning(message, { description: details });
        break;
    }
  }

  // Connection status management
  onConnectionChange(callback: (connected: boolean) => void) {
    // This would be called when socket connection status changes
    return callback;
  }

  // Retry logic
  async retry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < this.config.maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < this.config.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (i + 1)));
        }
      }
    }
    
    throw lastError!;
  }
}

// Global fallback instance
export const socketFallback = new SocketFallback();

// Utility functions for common fallback scenarios
export async function withSocketFallback<T>(
  socketOperation: () => Promise<T>,
  restOperation: () => Promise<T>,
  requestId: string = 'default'
): Promise<T> {
  return socketFallback.request(requestId, socketOperation, restOperation);
}

export function showFallbackNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
  socketFallback.showNotification(type, message);
}

// Connection status hook
export function useSocketFallback() {
  return {
    isConnected: (socketFallback as any).isConnected,
    request: socketFallback.request.bind(socketFallback),
    retry: socketFallback.retry.bind(socketFallback),
    showNotification: socketFallback.showNotification.bind(socketFallback)
  };
}
