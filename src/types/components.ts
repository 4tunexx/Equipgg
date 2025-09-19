// Component Props Types
import type { DBShopItem } from '../lib/supabase/queries';

export interface ShopItemCardProps {
  item: DBShopItem;
}

export interface ItemImageProps {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}

export interface InventoryCardProps {
  item: DBShopItem;
  onSelect?: (item: DBShopItem) => void;
  isSelected?: boolean;
}

export interface CrateItemCardProps {
  item: DBShopItem;
  onClick?: () => void;
  isSelected?: boolean;
}