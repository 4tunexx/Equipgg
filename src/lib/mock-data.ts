// DEPRECATED: Mock data file - no longer used in production
// All components now use real Supabase data instead of mock data
// This file is kept for reference only and should not be imported

// If you're seeing this, please use proper Supabase queries instead:
// - Achievements: fetch from /api/achievements
// - Shop items: fetch from /api/shop/items  
// - Missions: fetch from /api/missions
// - Ranks: fetch from /api/ranks
// - Leaderboards: fetch from /api/leaderboard

console.warn('DEPRECATED: mock-data.ts should not be used. Use real Supabase API endpoints instead.');

// All exports now return empty arrays to prevent accidental usage
export const achievements: any[] = [];
export const shopPerks: any[] = [];
export const allMissions: any[] = [];
export const ranks: any[] = [];
export const upcomingMatchesData: any[] = [];
export const liveMatchesData: any[] = [];
export const finishedMatchesData: any[] = [];
export const shopItems: any[] = [];
export const xpLeaderboardData: any[] = [];
export const shopItemCategories: any[] = [];
export const availableCrates: any[] = [];
export const supportTickets: any[] = [];
export const recentTopics: any[] = [];

// Enums preserved for type compatibility
export enum Rarity {
  COMMON = "common",
  RARE = "rare",
  EPIC = "epic",
  LEGENDARY = "legendary"
}