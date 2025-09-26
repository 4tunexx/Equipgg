import { itemMap, getItemType } from "../config/itemMap";

// Placeholder image for missing items
const PLACEHOLDER_IMAGE = '/assets/placeholder.svg';

// Cache for image availability checks
const imageCache = new Map<string, boolean>();

/**
 * Formats an item name to match CSGODatabase filename conventions
 * @param itemName - The original item name
 * @returns Formatted filename
 */
function formatItemName(itemName: string): string {
  // CSGODatabase uses exact case and keeps hyphens - no lowercase conversion!
  return itemName
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}



/**
 * Gets the best available image URL for an item
 * @param itemName - The name of the item
 * @param itemType - Optional item type override
 * @returns Promise<string> - The image URL or placeholder
 */
export async function getItemImage(itemName: string, itemType?: 'skins' | 'knives' | 'gloves' | 'agents'): Promise<string> {
  if (!itemName) {
    return PLACEHOLDER_IMAGE;
  }

  // Determine item type if not provided
  const type = itemType || getItemType(itemName);
  
  if (type === 'unknown') {
    return PLACEHOLDER_IMAGE;
  }

  // Generate multiple URL candidates
  const candidates = generateImageCandidates(itemName, type);
  
  // Return the first candidate - let the browser handle fallbacks
  return candidates[0] || PLACEHOLDER_IMAGE;
}

/**
 * Generates multiple image URL candidates for an item
 * @param itemName - The name of the item
 * @param itemType - The item type
 * @returns Array of candidate URLs
 */
function generateImageCandidates(itemName: string, itemType: string): string[] {
  const candidates: string[] = [];
  
  // Generate CSGODatabase URLs (most reliable for CS2 items)
  const csgoUrls = generateCSGODatabaseUrls(itemName, itemType);
  candidates.push(...csgoUrls);

  return candidates;
}

/**
 * Generates CSGODatabase URLs for an item (Steam is too restrictive)
 * @param itemName - The name of the item
 * @param itemType - The item type
 * @returns Array of CSGODatabase URLs
 */
function generateCSGODatabaseUrls(itemName: string, itemType: string): string[] {
  const urls: string[] = [];
  
  // CSGODatabase is the most reliable source for CS2 item images
  // Steam blocks external access to their image API
  
  // Try exact mapping first
  const mappedName = (itemMap[itemType as keyof typeof itemMap] as Record<string, string>)?.[itemName];
  if (mappedName) {
    urls.push(`https://www.csgodatabase.com/images/${itemType}/webp/${mappedName}.webp`);
  }

  // Try auto-formatted names
  const formattedName = formatItemName(itemName);
  urls.push(`https://www.csgodatabase.com/images/${itemType}/webp/${formattedName}.webp`);

  // Try alternative formatting patterns (conservative approach - only likely patterns)
  const alternatives = [
    // Remove "|" and clean up (most common pattern)
    itemName.replace(/\s*\|\s*/g, '_').replace(/[^a-zA-Z0-9_-]/g, ''),
    // Keep original case with underscores
    itemName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, ''),
  ];

  for (const alt of alternatives) {
    if (alt && alt !== formattedName) {
      urls.push(`https://www.csgodatabase.com/images/${itemType}/webp/${alt}.webp`);
    }
  }

  return urls;
}

/**
 * Gets the CSGODatabase image URL synchronously (without checking if it exists)
 * This is useful for initial rendering, with fallback handling in the component
 * @param itemName - The name of the item
 * @param itemType - Optional item type override
 * @returns string - The image URL
 */
export function getItemImageSync(itemName: string, itemType?: 'skins' | 'knives' | 'gloves' | 'agents'): string {
  if (!itemName) {
    return PLACEHOLDER_IMAGE;
  }

  // Determine item type if not provided
  const type = itemType || getItemType(itemName);
  
  if (type === 'unknown') {
    return PLACEHOLDER_IMAGE;
  }

  // Generate candidates and return the first one
  const candidates = generateImageCandidates(itemName, type);
  return candidates[0] || PLACEHOLDER_IMAGE;
}

/**
 * Preloads an image and returns a promise that resolves when loaded
 * @param url - The image URL to preload
 * @returns Promise<HTMLImageElement> - The loaded image element
 */
export function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    // Skip on server side
    if (typeof window === 'undefined') {
      reject(new Error('Cannot preload images on server side'));
      return;
    }

    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Batch preloads multiple images
 * @param urls - Array of image URLs to preload
 * @returns Promise<HTMLImageElement[]> - Array of loaded image elements
 */
export async function preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
  const promises = urls.map(url => preloadImage(url).catch(() => null));
  const results = await Promise.all(promises);
  return results.filter((img): img is HTMLImageElement => img !== null);
}

/**
 * Clears the image cache (useful for testing or memory management)
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Gets cache statistics
 * @returns Object with cache stats
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: imageCache.size,
    entries: Array.from(imageCache.keys())
  };
}

