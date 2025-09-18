import { Rarity } from '@/lib/supabase/queries';

// Rarity colors for UI elements
export const rarityColors: Record<Rarity, string> = {
  'Common': 'text-neutral-400',
  'Uncommon': 'text-green-400',
  'Rare': 'text-blue-400',
  'Epic': 'text-purple-400',
  'Legendary': 'text-yellow-400'
};

// Rarity glow effects for UI elements
export const rarityGlow: Record<Rarity, string> = {
  'Common': 'shadow-none',
  'Uncommon': 'shadow-lg shadow-green-500/50',
  'Rare': 'shadow-lg shadow-blue-500/50',
  'Epic': 'shadow-lg shadow-purple-500/50',
  'Legendary': 'shadow-lg shadow-yellow-500/50'
};

// Item types with display names
export const itemTypes = {
  'skin': 'Weapon Skin',
  'knife': 'Knife',
  'gloves': 'Gloves',
  'agent': 'Agent',
  'sticker': 'Sticker',
  'music': 'Music Kit',
  'graffiti': 'Graffiti',
  'pin': 'Pin',
  'case': 'Case',
  'key': 'Key',
  'capsule': 'Capsule',
  'pass': 'Pass',
  'ticket': 'Ticket',
  'package': 'Package',
  'collectible': 'Collectible',
  'other': 'Other'
} as const;

export type ItemType = keyof typeof itemTypes;

// Fallback image paths
export const fallbackImages = {
  item: '/assets/placeholder.svg',
  avatar: '/assets/placeholder-avatar.svg',
  team: '/default-team-logo.svg'
} as const;

// Format currency value
export const formatCoins = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Currency types and symbols
export const currencyTypes = {
  coins: { symbol: '🪙', name: 'Coins' },
  gems: { symbol: '💎', name: 'Gems' }
} as const;

// Game types and their labels
export const gameTypes = {
  crash: 'Crash',
  coinflip: 'Coinflip',
  jackpot: 'Jackpot',
  roulette: 'Roulette'
} as const;