export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export type InventoryItemType = 'Pistol' | 'Rifle' | 'SMG' | 'Heavy' | 'Knife' | 'Gloves' | 'Agent' | 'Sticker' | 'Music Kit' | 'Graffiti' | 'Patch' | 'Pin' | 'Other';

export interface ItemStat {
  origin: string;
  value: number;
  statTrak?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  image: string;
  rarity: Rarity;
  type: InventoryItemType;
  dataAiHint: string;
  stat?: ItemStat;
}

export const rarityColors: Record<Rarity, string> = {
  'Common': 'text-gray-400',
  'Uncommon': 'text-green-400',
  'Rare': 'text-blue-400',
  'Epic': 'text-purple-400',
  'Legendary': 'text-red-400',
  'Mythic': 'text-yellow-400',
};

export const rarityGlow: Record<Rarity, string> = {
  'Common': '',
  'Uncommon': '',
  'Rare': 'glow-rare',
  'Epic': 'glow-epic',
  'Legendary': 'glow-legendary',
  'Mythic': 'glow-mythic',
};

export const equippedSlotsConfig = {
  'Pistol': { slot: 'pistol', label: 'Pistol' },
  'Rifle': { slot: 'rifle', label: 'Rifle' },
  'SMG': { slot: 'smg', label: 'SMG' },
  'Heavy': { slot: 'heavy', label: 'Heavy' },
  'Knife': { slot: 'knife', label: 'Knife' },
  'Gloves': { slot: 'gloves', label: 'Gloves' },
  'Agent': { slot: 'agent', label: 'Agent' },
  'Sticker': { slot: 'sticker', label: 'Sticker' },
  'Music Kit': { slot: 'music', label: 'Music Kit' },
  'Graffiti': { slot: 'graffiti', label: 'Graffiti' },
  'Patch': { slot: 'patch', label: 'Patch' },
  'Pin': { slot: 'pin', label: 'Pin' },
  'Other': { slot: 'other', label: 'Other' },
};
