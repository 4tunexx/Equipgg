export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export type InventoryItemType = 'Pistol' | 'Rifle' | 'SMG' | 'Heavy' | 'Knife' | 'Gloves' | 'Agent' | 'Operator' | 'Perk' | 'perk' | 'Sticker' | 'Music Kit' | 'Graffiti' | 'Patch' | 'Pin' | 'Other';

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
// CS2 Game Rarity Colors (matching actual game)
export const rarityColors: Record<Rarity, string> = {
  'Common': 'text-[#b0c3d9]',        // Light grayish-blue (Consumer Grade)
  'Uncommon': 'text-[#5e98d9]',      // Light blue (Industrial Grade)
  'Rare': 'text-[#4b69ff]',          // Bright blue (Mil-Spec)
  'Epic': 'text-[#8847ff]',          // Purple (Restricted)
  'Legendary': 'text-[#d32ce6]',     // Pink/Magenta (Classified/Covert)
  'Mythic': 'text-[#ffd700]',        // Gold (Special/Contraband)
};

export const rarityBorders: Record<Rarity, string> = {
  'Common': 'border-[#b0c3d9]',
  'Uncommon': 'border-[#5e98d9]',
  'Rare': 'border-[#4b69ff]',
  'Epic': 'border-[#8847ff]',
  'Legendary': 'border-[#d32ce6]',
  'Mythic': 'border-[#ffd700]',
};

export const rarityGradients: Record<Rarity, string> = {
  'Common': 'from-[#b0c3d9]/20 to-[#b0c3d9]/10',
  'Uncommon': 'from-[#5e98d9]/20 to-[#5e98d9]/10',
  'Rare': 'from-[#4b69ff]/20 to-[#4b69ff]/10',
  'Epic': 'from-[#8847ff]/20 to-[#8847ff]/10',
  'Legendary': 'from-[#d32ce6]/20 to-[#d32ce6]/10',
  'Mythic': 'from-[#ffd700]/20 to-[#ffd700]/10'
};

export const rarityGlow: Record<Rarity, string> = {
  'Common': '',
  'Uncommon': 'shadow-[#5e98d9]/50',
  'Rare': 'shadow-[#4b69ff]/50',
  'Epic': 'shadow-[#8847ff]/50',
  'Legendary': 'shadow-[#d32ce6]/50',
  'Mythic': 'shadow-[#ffd700]/50',
};

export interface EquippedSlotConfig {
  id: string;
  name: string;
}

export const equippedSlotsConfig = {
  perk: { id: 'perk', name: 'Perk' },
  weapon: { id: 'weapon', name: 'Weapon' },
  knife: { id: 'knife', name: 'Knife' },
  gloves: { id: 'gloves', name: 'Gloves' },
  agent: { id: 'agent', name: 'Agent' },
};
