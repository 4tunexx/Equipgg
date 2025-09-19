// Component Props Types
import type { ShopItem } from '/database';

export interface ShopItemCardProps {
  item: ShopItem;
}

export interface ItemImageProps {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}

export interface InventoryCardProps {
  item: ShopItem;
  onSelect?: (item: ShopItem) => void;
  isSelected?: boolean;
}

export interface CrateItemCardProps {
  item: ShopItem;
  onClick?: () => void;
  isSelected?: boolean;
}