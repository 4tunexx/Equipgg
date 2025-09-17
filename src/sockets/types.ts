import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  role?: string;
}

// Base event interfaces
export interface BaseEvent {
  timestamp: string;
  userId: string;
}

// Games events
export interface GameStartEvent extends BaseEvent {
  gameId: string;
  gameType: 'plinko' | 'coinflip' | 'crash' | 'sweeper';
  betAmount: number;
  seed?: string; // For fairness verification
}

export interface GameResultEvent extends BaseEvent {
  gameId: string;
  gameType: 'plinko' | 'coinflip' | 'crash' | 'sweeper';
  result: any;
  winnings: number;
  isWin: boolean;
  fairnessProof?: string;
}

// Betting events
export interface BetPlacedEvent extends BaseEvent {
  matchId: string;
  teamId: string;
  amount: number;
  odds: number;
  potentialPayout: number;
}

export interface BetResultEvent extends BaseEvent {
  betId: string;
  matchId: string;
  won: boolean;
  amount: number;
  winnings: number;
}

export interface OddsUpdateEvent {
  matchId: string;
  team1Odds: number;
  team2Odds: number;
  timestamp: string;
}

// XP & Levels events
export interface XpGainedEvent extends BaseEvent {
  amount: number;
  source: string;
  newLevel?: number;
  leveledUp: boolean;
  levelsGained?: number;
}

export interface MissionProgressEvent extends BaseEvent {
  missionId: string;
  progress: number;
  completed: boolean;
  reward?: any;
}

// Achievements events
export interface AchievementUnlockedEvent extends BaseEvent {
  achievementId: string;
  title: string;
  description: string;
  xpReward: number;
  icon?: string;
}

// Inventory events
export interface CrateOpenedEvent extends BaseEvent {
  crateId: string;
  items: any[];
  totalValue: number;
}

export interface ItemAcquiredEvent extends BaseEvent {
  itemId: string;
  itemName: string;
  rarity: string;
  source: string;
}

// Leaderboards events
export interface LeaderboardUpdateEvent {
  type: 'coins' | 'xp' | 'wins' | 'level' | 'prestige';
  rankings: Array<{
    userId: string;
    username: string;
    value: number;
    rank: number;
  }>;
  timestamp: string;
}

// Chat events
export interface ChatMessageEvent extends BaseEvent {
  channel: string;
  message: string;
  type: 'arena' | 'forum' | 'pvp' | 'coinflip';
}

export interface UserJoinedEvent extends BaseEvent {
  channel: string;
}

export interface UserLeftEvent extends BaseEvent {
  channel: string;
}

// Admin events
export interface AdminBroadcastEvent {
  type: 'odds_override' | 'ban' | 'mute' | 'site_update';
  message: string;
  data?: any;
  timestamp: string;
}

export interface ModerationActionEvent extends BaseEvent {
  targetUserId: string;
  action: 'ban' | 'mute' | 'unban' | 'unmute';
  reason: string;
  duration?: number;
}

// Balance events
export interface BalanceUpdatedEvent extends BaseEvent {
  coins: number;
  gems: number;
  xp: number;
  level: number;
}

// Room management
export interface RoomJoinEvent {
  room: string;
  userId: string;
}

export interface RoomLeaveEvent {
  room: string;
  userId: string;
}
