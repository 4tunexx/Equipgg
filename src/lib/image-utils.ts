/**
 * Centralized utility for generating CS:GO item image URLs
 * This ensures consistency across the entire application
 */

export function getCSGODatabaseImageUrl(itemName: string, itemType: string): string {
  const baseUrl = 'https://www.csgodatabase.com/images';
  
  // Normalize the item type to determine the correct folder
  const typeLower = itemType?.toLowerCase() || '';
  
  let path = 'skins'; // Default for weapons
  
  // Map item types to CSGODatabase folders
  if (typeLower.includes('knife') || typeLower === 'knives' || typeLower === 'knife') {
    path = 'knives';
  } else if (typeLower.includes('glove') || typeLower === 'gloves' || typeLower === 'glove') {
    path = 'gloves';
  } else if (typeLower.includes('agent') || typeLower === 'agents' || typeLower === 'agent') {
    path = 'agents';
  }
  
  // Format the item name for CSGODatabase URL
  // Examples:
  // "AWP | Dragon Lore" -> "AWP_Dragon_Lore"
  // "Butterfly Knife | Autotronic" -> "Butterfly_Knife_Autotronic"
  // "Hand Wraps | Duct Tape" -> "Hand_Wraps_Duct_Tape"
  const formattedName = itemName
    .replace(/\s*\|\s*/g, '_')  // Replace " | " with "_"
    .replace(/\s+/g, '_')        // Replace spaces with underscores
    .replace(/['"]/g, '')        // Remove quotes
    .trim();
  
  return `${baseUrl}/${path}/webp/${formattedName}.webp`;
}

/**
 * Convert database item type to ItemImage component type
 */
export function getItemImageType(itemType: string): 'skins' | 'knives' | 'gloves' | 'agents' {
  const typeLower = itemType?.toLowerCase() || '';
  
  if (typeLower.includes('knife') || typeLower === 'knives' || typeLower === 'knife') {
    return 'knives';
  } else if (typeLower.includes('glove') || typeLower === 'gloves' || typeLower === 'glove') {
    return 'gloves';
  } else if (typeLower.includes('agent') || typeLower === 'agents' || typeLower === 'agent') {
    return 'agents';
  }
  
  return 'skins';
}
