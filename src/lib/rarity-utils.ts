import { Rarity, rarityColors } from './types';

/**
 * Get rarity color class from rarity name (case-insensitive)
 * Handles variations like 'common', 'Common', 'COMMON', etc.
 */
export function getRarityColor(rarity: string | null | undefined): string {
  if (!rarity) return 'text-muted-foreground';
  
  // Normalize to proper case for lookup
  const normalizedRarity = rarity.charAt(0).toUpperCase() + rarity.slice(1).toLowerCase();
  
  // Handle edge cases and variations
  const rarityMap: Record<string, Rarity> = {
    'Common': 'Common',
    'Uncommon': 'Uncommon',
    'Rare': 'Rare',
    'Epic': 'Epic',
    'Legendary': 'Legendary',
    'Mythic': 'Mythic',
    // Handle lowercase
    'common': 'Common',
    'uncommon': 'Uncommon',
    'rare': 'Rare',
    'epic': 'Epic',
    'legendary': 'Legendary',
    'mythic': 'Mythic',
  };
  
  const mappedRarity = rarityMap[normalizedRarity] || rarityMap[rarity.toLowerCase()] || 'Common' as Rarity;
  
  return rarityColors[mappedRarity] || rarityColors['Common'];
}

/**
 * Extract item name and rarity from activity description or message
 * Handles patterns like:
 * - "opened a crate and received M4A1-S | Night Terror (Epic)"
 * - "opened a crate and got AK-47 | Redline (Legendary)"
 * - "42une opened a crate and received M4A1-S | Night Terror"
 */
export function parseItemFromText(text: string): { itemName: string | null; rarity: string | null } {
  if (!text) return { itemName: null, rarity: null };
  
  // Pattern 1: "received [item] ([rarity])" - full pattern with rarity
  const pattern1 = /received\s+(.+?)\s+\(([^)]+)\)/i;
  const match1 = text.match(pattern1);
  if (match1) {
    return {
      itemName: match1[1].trim(),
      rarity: match1[2].trim()
    };
  }
  
  // Pattern 2: "got [item] ([rarity])" - full pattern with rarity
  const pattern2 = /got\s+(.+?)\s+\(([^)]+)\)/i;
  const match2 = text.match(pattern2);
  if (match2) {
    return {
      itemName: match2[1].trim(),
      rarity: match2[2].trim()
    };
  }
  
  // Pattern 3: "received [item]" or "got [item]" - extract item name (CS2 format with |)
  // This handles multi-word item names like "M4A1-S | Night Terror"
  const pattern3 = /(?:received|got)\s+([A-Z0-9][^.!?]+?)(?:\s+\(|\s*$)/i;
  const match3 = text.match(pattern3);
  if (match3) {
    const itemName = match3[1].trim();
    // Look for rarity in parentheses anywhere in the text
    const rarityPattern = /\(([^)]+)\)/;
    const rarityMatch = text.match(rarityPattern);
    
    return {
      itemName: itemName,
      rarity: rarityMatch ? rarityMatch[1].trim() : null
    };
  }
  
  // Pattern 4: Look for item names with "|" (CS2 item format) anywhere in text
  const itemPattern = /([A-Z0-9][A-Za-z0-9\s\-|]+)/g;
  const items = text.match(itemPattern);
  if (items && items.length > 0) {
    // Find the longest match that looks like an item (has | or weapon name patterns)
    const weaponPatterns = /(AK-47|AWP|M4A1|M4A4|Karambit|Bayonet|Glock|USP|P250|Five-SeveN|Tec-9|P2000|Deagle|R8|Dual|CZ75|P90|MP9|MP7|MAC-10|MP5|UMP|PP-Bizon|Scar-20|G3SG1|SG|AUG|FAMAS|Galil|M4A1-S|M4A4|AK-47|AWP|SSG|AUG|Scout|Auto|G3SG1|SCAR|M249|Negev|XM1014|Nova|Sawed-Off|MAG-7|M249|Negev)/i;
    
    const validItems = items.filter(item => item.includes('|') || weaponPatterns.test(item));
    if (validItems.length > 0) {
      // Find rarity in parentheses
      const rarityPattern = /\(([^)]+)\)/;
      const rarityMatch = text.match(rarityPattern);
      
      return {
        itemName: validItems[0].trim(),
        rarity: rarityMatch ? rarityMatch[1].trim() : null
      };
    }
  }
  
  return { itemName: null, rarity: null };
}

/**
 * Format item name with rarity color
 * Returns just the color class - component should render the span
 */
export function getItemRarityColorClass(itemName: string, rarity: string | null | undefined): string {
  return getRarityColor(rarity);
}

