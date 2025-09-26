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

export interface EquippedSlotConfig {
  id: string;
  name: string;
}

export const equippedSlotsConfig = {
  primary: { id: 'primary', name: 'Primary Weapon' },
  secondary: { id: 'secondary', name: 'Secondary Weapon' },
  knife: { id: 'knife', name: 'Knife' },
  gloves: { id: 'gloves', name: 'Gloves' },
  agent: { id: 'agent', name: 'Agent' },
};
